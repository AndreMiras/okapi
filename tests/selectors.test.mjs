import assert from "node:assert/strict";
import test from "node:test";

import { safeUrl, selection, students } from "../lib/mykids/selectors.ts";

test("students returns an empty list for absent or malformed dashboards", () => {
  assert.deepEqual(students({ authToken: "token" }), []);
  assert.deepEqual(students({ authToken: "token", dashboard: {} }), []);
});

test("students filters entries without a student ID", () => {
  const student = { studentId: "one", name: "One" };

  assert.deepEqual(
    students({ authToken: "token", dashboard: [null, {}, student] }),
    [student],
  );
});

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

test("selection uses explicitly requested student and group IDs", () => {
  const result = selection(
    {
      authToken: "token",
      dashboard: [
        { studentId: "one", name: "One", courseList: [] },
        {
          studentId: "two",
          name: "Two",
          courseList: [{ groupId: "first" }, { groupId: "requested" }],
        },
      ],
    },
    "two",
    "requested",
  );

  assert.equal(result.student?.studentId, "two");
  assert.equal(result.course?.groupId, "requested");
});

test("selection returns no course when the student has no course list", () => {
  const result = selection({
    authToken: "token",
    dashboard: [{ studentId: "one", name: "One" }],
  });

  assert.equal(result.student?.studentId, "one");
  assert.equal(result.course, undefined);
});

test("safeUrl permits HTTPS documents only", () => {
  assert.equal(
    safeUrl("https://example.com/report.pdf"),
    "https://example.com/report.pdf",
  );
  assert.equal(safeUrl("javascript:alert(1)"), null);
});

test("safeUrl rejects absent and malformed URLs", () => {
  assert.equal(safeUrl(), null);
  assert.equal(safeUrl("not a URL"), null);
});
