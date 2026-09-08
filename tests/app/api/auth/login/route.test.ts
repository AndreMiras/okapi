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
        forceLogout: false,
        termsPending: false,
        schoolUser: false,
        errCode: "",
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
    const responseBody = await response.json();
    expect(responseBody).toEqual({ ok: true });
    expect(JSON.stringify(responseBody)).not.toMatch(
      /synthetic-token|synthetic-password|student-one|alice/,
    );

    const cookieValue = response.cookies.get(COOKIE)?.value;
    expect(cookieValue).toBeTruthy();
    expect(cookieValue).not.toContain("synthetic-password");
    expect(cookieValue).not.toContain("synthetic-token");
    expect(decodeSession(cookieValue!, secret)).toMatchObject({
      authToken: "synthetic-token",
      username: "alice",
      forceLogout: false,
      termsPending: false,
      schoolUser: false,
      errCode: "",
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
        ForceLogout: false,
        TermsPending: false,
        SchoolUser: false,
        ERR_CODE: "",
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
      forceLogout: false,
      termsPending: false,
      schoolUser: false,
      errCode: "",
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

describe("account state", () => {
  test("rejects forced logout without creating a session", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        AuthToken: "forced-token",
        ForceLogout: true,
        TermsPending: false,
        SchoolUser: false,
      }),
    );

    const response = await POST(
      loginRequest({
        username: "alice",
        password: "synthetic-password",
        locale: "en",
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "This account cannot start a session right now",
    });
    expect(response.cookies.get(COOKIE)).toBeUndefined();
  });

  test("retains read-only flags and returns only a bounded warning", async () => {
    const warning = `<b>${"w".repeat(600)}</b>`;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        AuthToken: "read-only-token",
        Username: "school-user",
        TermsPending: true,
        SchoolUser: true,
        ForceLogout: false,
        ERR_CODE: warning,
        Dashboard: [{ StudentId: "student-one", Name: "Student One" }],
      }),
    );

    const response = await POST(
      loginRequest({
        username: "school-user",
        password: "synthetic-password",
        locale: "en",
      }),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({ ok: true, warning: "w".repeat(500) });
    expect(JSON.stringify(responseBody)).not.toMatch(
      /read-only-token|synthetic-password|school-user|student-one|Student One/,
    );

    const cookieValue = response.cookies.get(COOKIE)?.value;
    expect(cookieValue).toBeTruthy();
    expect(decodeSession(cookieValue!, secret)).toMatchObject({
      authToken: "read-only-token",
      forceLogout: false,
      termsPending: true,
      schoolUser: true,
      errCode: "w".repeat(500),
    });
  });

  test("keeps missing or malformed flags ineligible instead of coercing them", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        authToken: "legacy-token",
        forceLogout: "false",
        termsPending: null,
      }),
    );

    const response = await POST(
      loginRequest({
        username: "legacy-user",
        password: "synthetic-password",
        locale: "en",
      }),
    );
    const cookieValue = response.cookies.get(COOKIE)?.value;
    const session = decodeSession(cookieValue!, secret);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(session).toMatchObject({ authToken: "legacy-token" });
    expect(session?.forceLogout).toBeUndefined();
    expect(session?.termsPending).toBeUndefined();
    expect(session?.schoolUser).toBeUndefined();
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
