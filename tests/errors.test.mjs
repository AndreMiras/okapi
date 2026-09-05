import assert from "node:assert/strict";
import test from "node:test";

import { ApiError } from "../lib/mykids/errors.ts";

test("ApiError uses safe defaults", () => {
  const error = new ApiError("Request failed");

  assert.equal(error.name, "ApiError");
  assert.equal(error.message, "Request failed");
  assert.equal(error.status, 500);
  assert.equal(error.code, "API_ERROR");
  assert.ok(error instanceof Error);
});

test("ApiError retains custom status and code values", () => {
  const error = new ApiError("Unauthorized", 401, "UNAUTHORIZED");

  assert.equal(error.status, 401);
  assert.equal(error.code, "UNAUTHORIZED");
});
