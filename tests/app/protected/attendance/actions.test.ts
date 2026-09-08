import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  registerAbsence,
  type RegisterAbsenceState,
} from "@/app/(protected)/attendance/actions";
import { encodeSession } from "@/lib/auth/session";
import type { LoginPayload } from "@/lib/mykids/types";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

const secret = "test-session-secret-with-at-least-32-characters";
const initialState: RegisterAbsenceState = { status: "idle", message: "" };
const eligibleAttendance = {
  Absences: [],
  Dates: {
    Dates: [{ Date: "2026-09-09", FollowUpId: "follow-up-one" }],
    Concepts: ["Illness", "Appointment"],
  },
};

function session(overrides: Partial<LoginPayload> = {}): LoginPayload {
  return {
    authToken: "server-token",
    forceLogout: false,
    termsPending: false,
    schoolUser: false,
    dashboard: [
      {
        studentId: "student-one",
        name: "Student One",
        courseList: [{ groupId: "group-one" }],
      },
      {
        studentId: "student-two",
        name: "Student Two",
        courseList: [{ groupId: "group-two" }],
      },
    ],
    ...overrides,
  };
}

function setSession(payload: LoginPayload | null | "malformed") {
  const value =
    payload === "malformed"
      ? "not-a-valid-cookie"
      : payload
        ? encodeSession(payload, secret)
        : undefined;
  vi.mocked(cookies).mockResolvedValue({
    get: () => (value ? { value } : undefined),
  } as never);
}

function form(
  followUpId: FormDataEntryValue | null = "follow-up-one",
  reason: FormDataEntryValue | null = "Illness",
) {
  const data = new FormData();
  if (followUpId !== null) data.set("followUpId", followUpId);
  if (reason !== null) data.set("reason", reason);
  return data;
}

function invoke(
  studentId = "student-one",
  groupId = "group-one",
  data = form(),
) {
  return registerAbsence(studentId, groupId, initialState, data);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SESSION_SECRET", secret);
  vi.stubEnv("MYKIDS_API_BASE_URL", "https://mykids.test/api/");
  setSession(session());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("authentication and account gates", () => {
  test.each([
    ["anonymous", null],
    ["tampered cookie", "malformed"],
  ] as const)(
    "rejects an %s request before upstream calls",
    async (_name, value) => {
      setSession(value);
      const fetchMock = vi.spyOn(globalThis, "fetch");

      await expect(invoke()).resolves.toEqual({
        status: "error",
        message: "Your session has expired. Sign in again.",
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
    },
  );

  test("asks a legacy session to sign in again", async () => {
    setSession(session({ forceLogout: undefined }));
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(invoke()).resolves.toEqual({
      status: "error",
      message: "Sign out and back in to enable absence registration.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  test.each([null, 0, ""])(
    "rejects malformed falsey account flag %p",
    async (flag) => {
      setSession(
        session({
          forceLogout: flag as unknown as LoginPayload["forceLogout"],
        }),
      );
      const fetchMock = vi.spyOn(globalThis, "fetch");

      await expect(invoke()).resolves.toEqual({
        status: "error",
        message: "Sign out and back in to enable absence registration.",
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
    },
  );

  test.each([
    ["forced logout", { forceLogout: true }],
    ["terms pending", { termsPending: true }],
    ["school account", { schoolUser: true }],
  ])("rejects %s before upstream calls", async (_name, flags) => {
    setSession(session(flags));
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(invoke()).resolves.toEqual({
      status: "error",
      message: "Absence registration is not available for this session.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("input and ownership validation", () => {
  test.each([
    ["empty student", "", "group-one", form()],
    ["oversized student", "s".repeat(201), "group-one", form()],
    ["empty group", "student-one", "", form()],
    ["oversized group", "student-one", "g".repeat(201), form()],
    ["missing follow-up", "student-one", "group-one", form(null)],
    ["oversized follow-up", "student-one", "group-one", form("f".repeat(201))],
    ["missing reason", "student-one", "group-one", form("follow-up-one", null)],
    [
      "oversized reason",
      "student-one",
      "group-one",
      form("follow-up-one", "r".repeat(501)),
    ],
    ["file follow-up", "student-one", "group-one", form(new File([], "x"))],
  ])(
    "rejects %s before upstream calls",
    async (_name, studentId, groupId, data) => {
      const fetchMock = vi.spyOn(globalThis, "fetch");

      await expect(invoke(studentId, groupId, data)).resolves.toMatchObject({
        status: "error",
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
    },
  );

  test.each([
    ["invalid student", "missing", "group-one"],
    ["invalid group", "student-one", "missing"],
    ["another student's group", "student-one", "group-two"],
  ])("rejects %s without fallback", async (_name, studentId, groupId) => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(invoke(studentId, groupId)).resolves.toEqual({
      status: "error",
      message: "The selected student or class is not valid.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("fresh eligibility", () => {
  test.each([
    [
      "missing follow-up",
      { Dates: { Dates: [], Concepts: ["Illness"] } },
      form(),
    ],
    [
      "follow-up without ID",
      { Dates: { Dates: [{ Date: "2026-09-09" }], Concepts: ["Illness"] } },
      form(),
    ],
    [
      "different follow-up",
      {
        Dates: {
          Dates: [{ Date: "2026-09-09", FollowUpId: "another-context" }],
          Concepts: ["Illness"],
        },
      },
      form(),
    ],
    [
      "unsupported reason",
      {
        Dates: {
          Dates: [{ Date: "2026-09-09", FollowUpId: "follow-up-one" }],
          Concepts: ["Appointment"],
        },
      },
      form(),
    ],
    [
      "case-modified reason",
      eligibleAttendance,
      form("follow-up-one", "illness"),
    ],
  ])("rejects %s without POST", async (_name, attendance, data) => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json(attendance));

    await expect(invoke("student-one", "group-one", data)).resolves.toEqual({
      status: "error",
      message: "That option is no longer available. Review and try again.",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("mutation", () => {
  test.each([200, 204])(
    "registers after a fresh GET and accepts %s",
    async (status) => {
      const fetchMock = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(Response.json(eligibleAttendance))
        .mockResolvedValueOnce(new Response(null, { status }));

      await expect(invoke()).resolves.toEqual({
        status: "success",
        message: "Absence registered.",
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      const [getUrl, getInit] = fetchMock.mock.calls[0];
      const [postUrl, postInit] = fetchMock.mock.calls[1];
      expect(String(getUrl)).toBe(
        "https://mykids.test/api/MyKids/GetMyKidsAbsences/student-one/group-one",
      );
      expect(getInit?.headers).toMatchObject({ authToken: "server-token" });
      expect(String(postUrl)).toBe(
        "https://mykids.test/api/MyKids/RegisterAbsence",
      );
      expect(postInit?.headers).toMatchObject({ authToken: "server-token" });
      expect(JSON.parse(String(postInit?.body))).toEqual({
        FollowUpId: "follow-up-one",
        Reason: "Illness",
        StudentId: "student-one",
      });
      expect(refresh).toHaveBeenCalledOnce();
    },
  );

  test.each([
    [
      "GET 401",
      [new Response(null, { status: 401 })],
      "Your session has expired. Sign in again.",
    ],
    [
      "POST 401",
      [Response.json(eligibleAttendance), new Response(null, { status: 401 })],
      "Your session has expired. Sign in again.",
    ],
    [
      "GET failure",
      [new Response(null, { status: 503 })],
      "Unable to register the absence right now. Try again.",
    ],
    [
      "POST failure",
      [Response.json(eligibleAttendance), new Response(null, { status: 503 })],
      "Unable to register the absence right now. Try again.",
    ],
  ])("maps %s without refreshing", async (_name, responses, message) => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    for (const response of responses) {
      fetchMock.mockResolvedValueOnce(response);
    }

    await expect(invoke()).resolves.toEqual({ status: "error", message });
    expect(refresh).not.toHaveBeenCalled();
  });

  test("does not report a completed write as a retryable upstream failure", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(eligibleAttendance))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.mocked(refresh).mockImplementationOnce(() => {
      throw new Error("synthetic refresh failure");
    });

    await expect(invoke()).rejects.toThrow("synthetic refresh failure");
  });
});
