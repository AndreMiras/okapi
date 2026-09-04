import type { Course, LoginPayload, Student } from "./types";

export function students(session: LoginPayload): Student[] {
  return Array.isArray(session.dashboard)
    ? session.dashboard.filter((item) => item && item.studentId)
    : [];
}
export function selection(
  session: LoginPayload,
  studentId?: string,
  groupId?: string,
) {
  const student =
    students(session).find((item) => item.studentId === studentId) ||
    students(session)[0];
  const courses = student?.courseList || [];
  const course = courses.find((item) => item.groupId === groupId) || courses[0];
  return { student, course: course as Course | undefined };
}
export function safeUrl(value?: string) {
  try {
    const url = new URL(value || "");
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
