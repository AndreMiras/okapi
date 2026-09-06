import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { POST } from "@/app/api/auth/login/route";
import { COOKIE, decodeSession } from "@/lib/auth/session";

const secret = "test-session-secret-with-at-least-32-characters";
const apiUrl = "https://mykids.test/api/";

function loginRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function expectCookieSecurity(response: Response, secure: boolean) {
  const setCookie = response.headers.get("set-cookie");

  expect(setCookie).toMatch(/(?:^|;\s*)HttpOnly(?:;|$)/i);
  expect(setCookie).toMatch(/(?:^|;\s*)SameSite=Lax(?:;|$)/i);
  if (secure) {
    expect(setCookie).toMatch(/(?:^|;\s*)Secure(?:;|$)/i);
  } else {
    expect(setCookie).not.toMatch(/(?:^|;\s*)Secure(?:;|$)/i);
  }
}

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", secret);
  vi.stubEnv("MYKIDS_API_BASE_URL", apiUrl);
  vi.stubEnv("NODE_ENV", "test");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("camelCase success", () => {
  test("forwards normalized credentials and creates a secure session", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        authToken: "synthetic-token",
        username: "alice",
        dashboard: [
          {
            studentId: "student-one",
            name: "Student One",
            courseList: [{ groupId: "group-one", groupName: "Group One" }],
          },
        ],
      }),
    );

    const response = await POST(
      loginRequest({
        username: "  alice  ",
        password: "synthetic-password",
        locale: "en-GB-longer",
      }),
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://mykids.test/api/MyKids/Login/");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      Username: "alice",
      PasswordHash: "synthetic-password",
      Locale: "en-GB-long",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });

    const cookieValue = response.cookies.get(COOKIE)?.value;
    expect(cookieValue).toBeTruthy();
    expect(cookieValue).not.toContain("synthetic-password");
    expect(cookieValue).not.toContain("synthetic-token");
    expect(decodeSession(cookieValue!, secret)).toMatchObject({
      authToken: "synthetic-token",
      username: "alice",
      dashboard: [
        {
          studentId: "student-one",
          name: "Student One",
        },
      ],
    });
    expectCookieSecurity(response, false);
  });
});

describe("PascalCase normalization", () => {
  test("normalizes representative dashboard fields and uses Secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        AuthToken: "pascal-token",
        Dashboard: [
          {
            StudentId: "student-two",
            Name: "Student Two",
            CourseList: [
              {
                GroupId: "group-two",
                GroupName: "Group Two",
              },
            ],
          },
        ],
      }),
    );

    const response = await POST(
      loginRequest({
        username: "bob",
        password: "synthetic-password",
        locale: "en",
      }),
    );

    expect(response.status).toBe(200);
    const cookieValue = response.cookies.get(COOKIE)?.value;
    expect(cookieValue).toBeTruthy();
    expect(decodeSession(cookieValue!, secret)).toMatchObject({
      authToken: "pascal-token",
      dashboard: [
        {
          studentId: "student-two",
          name: "Student Two",
          courseList: [
            {
              groupId: "group-two",
              groupName: "Group Two",
            },
          ],
        },
      ],
    });
    expectCookieSecurity(response, true);
  });
});

describe("upstream unauthorized", () => {
  test("returns a safe credentials error without a session cookie", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 }),
    );

    const response = await POST(
      loginRequest({
        username: "alice",
        password: "synthetic-password",
        locale: "en",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Incorrect username or password",
    });
    expect(response.cookies.get(COOKIE)).toBeUndefined();
  });
});

describe("generic upstream failure", () => {
  test.each([
    ["HTTP 503", () => Promise.resolve(new Response(null, { status: 503 }))],
    [
      "AbortError rejection",
      () => Promise.reject(new DOMException("aborted", "AbortError")),
    ],
  ])("maps %s to a safe service error", async (_name, fetchResult) => {
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchResult);

    const response = await POST(
      loginRequest({
        username: "alice",
        password: "synthetic-password",
        locale: "en",
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Unable to sign in right now",
    });
    expect(response.cookies.get(COOKIE)).toBeUndefined();
  });
});
