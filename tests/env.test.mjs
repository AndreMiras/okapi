import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { getEnv } from "../lib/env.ts";

const originalSessionSecret = process.env.SESSION_SECRET;
const originalApiBaseUrl = process.env.MYKIDS_API_BASE_URL;

afterEach(() => {
  if (originalSessionSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = originalSessionSecret;

  if (originalApiBaseUrl === undefined) delete process.env.MYKIDS_API_BASE_URL;
  else process.env.MYKIDS_API_BASE_URL = originalApiBaseUrl;
});

test("getEnv rejects a missing session secret", () => {
  delete process.env.SESSION_SECRET;

  assert.throws(
    () => getEnv(),
    new Error("SESSION_SECRET must contain at least 32 characters"),
  );
});

test("getEnv rejects a short session secret", () => {
  process.env.SESSION_SECRET = "s".repeat(31);

  assert.throws(
    () => getEnv(),
    new Error("SESSION_SECRET must contain at least 32 characters"),
  );
});

test("getEnv returns the secret and default API URL", () => {
  process.env.SESSION_SECRET = "s".repeat(32);
  delete process.env.MYKIDS_API_BASE_URL;

  assert.deepEqual(getEnv(), {
    apiUrl: "https://api.kidsandus.es/api/",
    secret: "s".repeat(32),
  });
});

test("getEnv retains a configured API URL trailing slash", () => {
  process.env.SESSION_SECRET = "s".repeat(32);
  process.env.MYKIDS_API_BASE_URL = "https://example.com/api/";

  assert.equal(getEnv().apiUrl, "https://example.com/api/");
});

test("getEnv appends a trailing slash to a configured API URL", () => {
  process.env.SESSION_SECRET = "s".repeat(32);
  process.env.MYKIDS_API_BASE_URL = "https://example.com/api";

  assert.equal(getEnv().apiUrl, "https://example.com/api/");
});
