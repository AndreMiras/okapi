import test from "node:test";
import assert from "node:assert/strict";
import { selection, safeUrl } from "../lib/mykids/selectors.ts";

test("selection rejects an invalid student and falls back safely", () => {
  const result = selection(
    {
      authToken: "token",
      dashboard: [
        { studentId: "one", name: "One", courseList: [{ groupId: "group" }] },
      ],
    },
    "missing",
  );
  assert.equal(result.student?.studentId, "one");
  assert.equal(result.course?.groupId, "group");
});

test("safeUrl permits HTTPS documents only", () => {
  assert.equal(
    safeUrl("https://example.com/report.pdf"),
    "https://example.com/report.pdf",
  );
  assert.equal(safeUrl("javascript:alert(1)"), null);
});
