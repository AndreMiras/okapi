import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { myKids } from "@/lib/mykids/client";
import { ApiError } from "@/lib/mykids/errors";
import type { RegisterAbsenceInput } from "@/lib/mykids/types";

const apiUrl = "https://mykids.test/api/";

beforeEach(() => {
  vi.stubEnv("MYKIDS_API_BASE_URL", apiUrl);
  vi.stubEnv(
    "SESSION_SECRET",
    "test-session-secret-with-at-least-32-characters",
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("absences", () => {
  test("normalizes PascalCase containers and item fields", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        Absences: [
          {
            Date: "2026-09-08",
            Title: "Synthetic absence",
            Reason: "Synthetic reason",
          },
          null,
        ],
        Dates: {
          Dates: [
            { Date: "2026-09-09", FollowUpId: "follow-up-one" },
            "malformed",
          ],
          Concepts: ["Illness", 42, null, "Appointment"],
        },
      }),
    );

    await expect(
      myKids.absences("server-token", "student/one", "group one"),
    ).resolves.toEqual({
      absences: [
        {
          date: "2026-09-08",
          title: "Synthetic absence",
          reason: "Synthetic reason",
        },
        { date: undefined, title: undefined, reason: undefined },
      ],
      dates: {
        dates: [
          { date: "2026-09-09", followUpId: "follow-up-one" },
          { date: undefined, followUpId: undefined },
        ],
        concepts: ["Illness", "Appointment"],
      },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://mykids.test/api/MyKids/GetMyKidsAbsences/student%2Fone/group%20one",
    );
    expect(init).toMatchObject({ cache: "no-store" });
    expect(init?.headers).toEqual({
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      authToken: "server-token",
    });
  });

  test("normalizes camelCase containers and item fields", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        absences: [{ date: "2026-09-08", title: "Absence", reason: "Reason" }],
        dates: {
          dates: [{ date: "2026-09-09", followUpId: "follow-up-one" }],
          concepts: ["Reason"],
        },
      }),
    );

    await expect(myKids.absences("token", "student", "group")).resolves.toEqual(
      {
        absences: [{ date: "2026-09-08", title: "Absence", reason: "Reason" }],
        dates: {
          dates: [{ date: "2026-09-09", followUpId: "follow-up-one" }],
          concepts: ["Reason"],
        },
      },
    );
  });

  test.each([
    ["malformed root", "not-an-object"],
    ["null containers", { Absences: null, Dates: null }],
    ["omitted containers", {}],
    [
      "malformed containers",
      { Absences: 1, Dates: { Dates: false, Concepts: {} } },
    ],
  ])("uses stable empty arrays for %s", async (_name, payload) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(payload));

    await expect(myKids.absences("token", "student", "group")).resolves.toEqual(
      {
        absences: [],
        dates: { dates: [], concepts: [] },
      },
    );
  });
});

describe("registerAbsence", () => {
  test.each([200, 204])("accepts an empty %s response", async (status) => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status }));
    const input = {
      followUpId: "follow-up-one",
      reason: "Illness",
      studentId: "student-one",
      groupId: "must-not-be-forwarded",
      browserValue: "must-not-be-forwarded",
    } as RegisterAbsenceInput & Record<string, string>;

    await expect(
      myKids.registerAbsence("server-token", input),
    ).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://mykids.test/api/MyKids/RegisterAbsence");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      authToken: "server-token",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      FollowUpId: "follow-up-one",
      Reason: "Illness",
      StudentId: "student-one",
    });
  });
});

describe("safe upstream errors", () => {
  test.each([
    [
      "unauthorized",
      () => Promise.resolve(new Response(null, { status: 401 })),
      { message: "Session expired", status: 401, code: "UNAUTHORIZED" },
    ],
    [
      "non-OK response",
      () => Promise.resolve(new Response(null, { status: 503 })),
      { message: "The service is temporarily unavailable", status: 503 },
    ],
    [
      "timeout",
      () => Promise.reject(new DOMException("aborted", "AbortError")),
      {
        message: "The service took too long to respond",
        status: 503,
        code: "UPSTREAM_UNAVAILABLE",
      },
    ],
    [
      "network failure",
      () => Promise.reject(new TypeError("private network details")),
      {
        message: "Unable to reach the service",
        status: 503,
        code: "UPSTREAM_UNAVAILABLE",
      },
    ],
    [
      "malformed JSON",
      () =>
        Promise.resolve(
          new Response("{", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      {
        message: "Invalid service response",
        status: 502,
        code: "MALFORMED_RESPONSE",
      },
    ],
  ])("maps %s to ApiError", async (_name, fetchResult, expected) => {
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchResult);

    const result = myKids.absences("token", "student", "group");

    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject(expected);
  });
});
