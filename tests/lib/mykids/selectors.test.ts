import { describe, expect, test } from "vitest";

import {
  exactSelection,
  safeUrl,
  selection,
  students,
} from "@/lib/mykids/selectors";
import type { LoginPayload, Student } from "@/lib/mykids/types";

describe("students", () => {
  test("returns an empty list for absent or malformed dashboards", () => {
    expect(students({ authToken: "token" })).toEqual([]);
    expect(
      students({
        authToken: "token",
        dashboard: {},
      } as unknown as LoginPayload),
    ).toEqual([]);
  });

  test("filters entries without a student ID", () => {
    const student = { studentId: "one", name: "One" };

    expect(
      students({
        authToken: "token",
        dashboard: [null, {}, student] as unknown as Student[],
      }),
    ).toEqual([student]);
  });
});

describe("selection", () => {
  test("rejects an invalid student and falls back safely", () => {
    const result = selection(
      {
        authToken: "token",
        dashboard: [
          { studentId: "one", name: "One", courseList: [{ groupId: "group" }] },
        ],
      },
      "missing",
    );

    expect(result.student?.studentId).toBe("one");
    expect(result.course?.groupId).toBe("group");
  });

  test("uses explicitly requested student and group IDs", () => {
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

    expect(result.student?.studentId).toBe("two");
    expect(result.course?.groupId).toBe("requested");
  });

  test("returns no course when the student has no course list", () => {
    const result = selection({
      authToken: "token",
      dashboard: [{ studentId: "one", name: "One" }],
    });

    expect(result.student?.studentId).toBe("one");
    expect(result.course).toBeUndefined();
  });
});

describe("exactSelection", () => {
  const session: LoginPayload = {
    authToken: "token",
    dashboard: [
      {
        studentId: "one",
        name: "One",
        courseList: [{ groupId: "group-one" }],
      },
      {
        studentId: "two",
        name: "Two",
        courseList: [{ groupId: "group-two" }],
      },
    ],
  };

  test("returns an exact student and course match", () => {
    expect(exactSelection(session, "two", "group-two")).toMatchObject({
      student: { studentId: "two" },
      course: { groupId: "group-two" },
    });
  });

  test.each([
    ["missing student", "missing", "group-one"],
    ["missing group", "one", "missing"],
    ["empty student ID", "", "group-one"],
    ["empty group ID", "one", ""],
    ["another student's group", "one", "group-two"],
  ])("returns null for %s", (_name, studentId, groupId) => {
    expect(exactSelection(session, studentId, groupId)).toBeNull();
  });
});

describe("safeUrl", () => {
  test("permits HTTPS documents only", () => {
    expect(safeUrl("https://example.com/report.pdf")).toBe(
      "https://example.com/report.pdf",
    );
    expect(safeUrl("javascript:alert(1)")).toBeNull();
  });

  test("rejects absent and malformed URLs", () => {
    expect(safeUrl()).toBeNull();
    expect(safeUrl("not a URL")).toBeNull();
  });
});
