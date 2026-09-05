import { expect, test } from "vitest";

import { ApiError } from "@/lib/mykids/errors";

test("ApiError uses safe defaults", () => {
  const error = new ApiError("Request failed");

  expect(error).toBeInstanceOf(Error);
  expect(error).toMatchObject({
    name: "ApiError",
    message: "Request failed",
    status: 500,
    code: "API_ERROR",
  });
});

test("ApiError retains custom status and code values", () => {
  const error = new ApiError("Unauthorized", 401, "UNAUTHORIZED");

  expect(error).toMatchObject({
    status: 401,
    code: "UNAUTHORIZED",
  });
});
