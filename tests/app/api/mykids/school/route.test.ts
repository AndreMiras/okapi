import { cookies } from "next/headers";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { GET } from "@/app/api/mykids/school/route";
import { COOKIE, encodeSession } from "@/lib/auth/session";
import type { LoginPayload } from "@/lib/mykids/types";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const secret = "test-session-secret-with-at-least-32-characters";
const apiUrl = "https://mykids.test/api/";
const cookiesMock = vi.mocked(cookies);
const validSession: LoginPayload = {
  authToken: "synthetic-token",
  dashboard: [
    {
      studentId: "student-one",
      courseList: [
        {
          groupId: "group-one",
          schoolId: "school-one",
        },
      ],
    },
  ],
};

function schoolRequest(search = "") {
  return new Request(`http://localhost/api/mykids/school${search}`);
}

function authenticatedAs(session: LoginPayload) {
  const value = encodeSession(session, secret);
  cookiesMock.mockResolvedValue({
    get: (name: string) => (name === COOKIE ? { name, value } : undefined),
  } as Awaited<ReturnType<typeof cookies>>);
}

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", secret);
  vi.stubEnv("MYKIDS_API_BASE_URL", apiUrl);
  vi.stubEnv("NODE_ENV", "test");
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("anonymous access", () => {
  test("returns the safe authentication response without calling upstream", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("unexpected upstream request"));

    const response = await GET(schoolRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("selected school success", () => {
  test("forwards the session token to the encoded explicitly selected school", async () => {
    authenticatedAs({
      authToken: "synthetic-token",
      dashboard: [
        {
          studentId: "student-default",
          courseList: [
            {
              groupId: "group-default",
              schoolId: "school-default",
            },
          ],
        },
        {
          studentId: "student-selected",
          courseList: [
            {
              groupId: "group-fallback",
              schoolId: "school-fallback",
            },
            {
              groupId: "group-selected",
              schoolId: "school/selected",
            },
          ],
        },
      ],
    });
    const school = {
      title: "Selected School",
      email: "school@example.test",
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json(school));

    const response = await GET(
      schoolRequest("?student=student-selected&group=group-selected"),
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://mykids.test/api/MyKids/GetSchoolInfo/school%2Fselected",
    );
    expect(init?.method).toBeUndefined();
    expect(new Headers(init?.headers).get("authToken")).toBe("synthetic-token");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(school);
  });
});

describe("upstream unauthorized", () => {
  test("returns the shared safe authentication response", async () => {
    authenticatedAs(validSession);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 }),
    );

    const response = await GET(schoolRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required",
    });
  });
});

describe("generic upstream failure", () => {
  test.each([
    ["HTTP 503", () => Promise.resolve(new Response(null, { status: 503 }))],
    [
      "network rejection",
      () => Promise.reject(new Error("synthetic transport failure")),
    ],
  ])("maps %s to the shared safe service response", async (_name, result) => {
    authenticatedAs(validSession);
    vi.spyOn(globalThis, "fetch").mockImplementation(result);

    const response = await GET(schoolRequest());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "The service is temporarily unavailable",
    });
  });
});

describe("validation mismatch characterization", () => {
  test("currently rejects a school-bearing course without a group", async () => {
    // Characterization checkpoint for future operation-specific validation.
    authenticatedAs({
      authToken: "synthetic-token",
      dashboard: [
        {
          studentId: "student-one",
          courseList: [{ schoolId: "school-one" }],
        },
      ],
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("unexpected upstream request"));

    const response = await GET(schoolRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No valid student selection",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("currently requests the undefined path when school is absent", async () => {
    // This records missing validation, not an acceptable school lookup contract.
    authenticatedAs({
      authToken: "synthetic-token",
      dashboard: [
        {
          studentId: "student-one",
          courseList: [{ groupId: "group-one" }],
        },
      ],
    });
    const school = { title: "Synthetic undefined-path response" };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json(school));

    const response = await GET(schoolRequest());

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://mykids.test/api/MyKids/GetSchoolInfo/undefined",
    );
    expect(new Headers(init?.headers).get("authToken")).toBe("synthetic-token");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(school);
  });
});
