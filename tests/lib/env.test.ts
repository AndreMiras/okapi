import { expect, test, vi } from "vitest";

import { getEnv } from "@/lib/env";

test("getEnv rejects a missing session secret", () => {
  vi.stubEnv("SESSION_SECRET", undefined);

  expect(() => getEnv()).toThrow(
    "SESSION_SECRET must contain at least 32 characters",
  );
});

test("getEnv rejects a short session secret", () => {
  vi.stubEnv("SESSION_SECRET", "s".repeat(31));

  expect(() => getEnv()).toThrow(
    "SESSION_SECRET must contain at least 32 characters",
  );
});

test("getEnv returns the secret and default API URL", () => {
  vi.stubEnv("SESSION_SECRET", "s".repeat(32));
  vi.stubEnv("MYKIDS_API_BASE_URL", undefined);

  expect(getEnv()).toEqual({
    apiUrl: "https://api.kidsandus.es/api/",
    secret: "s".repeat(32),
  });
});

test("getEnv retains a configured API URL trailing slash", () => {
  vi.stubEnv("SESSION_SECRET", "s".repeat(32));
  vi.stubEnv("MYKIDS_API_BASE_URL", "https://example.com/api/");

  expect(getEnv().apiUrl).toBe("https://example.com/api/");
});

test("getEnv appends a trailing slash to a configured API URL", () => {
  vi.stubEnv("SESSION_SECRET", "s".repeat(32));
  vi.stubEnv("MYKIDS_API_BASE_URL", "https://example.com/api");

  expect(getEnv().apiUrl).toBe("https://example.com/api/");
});
