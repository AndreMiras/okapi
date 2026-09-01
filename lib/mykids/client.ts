import "server-only";
import { getEnv } from "@/lib/env";
import { ApiError } from "./errors";
import type {
  Absences,
  Course,
  Event,
  Information,
  LoginPayload,
  Report,
  School,
} from "./types";

async function request<T>(
  path: string,
  token?: string,
  init?: RequestInit,
): Promise<T> {
  const { apiUrl } = getEnv();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(new URL(path, apiUrl), {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        authToken: token ?? "",
      },
    });
    if (response.status === 401) {
      throw new ApiError("Session expired", 401, "UNAUTHORIZED");
    }
    if (!response.ok) {
      throw new ApiError(
        "The service is temporarily unavailable",
        response.status,
      );
    }
    const data: unknown = await response.json();
    if (data === null || data === undefined) {
      throw new ApiError("Invalid service response", 502, "MALFORMED_RESPONSE");
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof DOMException && error.name === "AbortError"
        ? "The service took too long to respond"
        : "Unable to reach the service",
      503,
      "UPSTREAM_UNAVAILABLE",
    );
  } finally {
    clearTimeout(timer);
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function loginPayload(value: Record<string, unknown>): LoginPayload {
  const dashboard = value.dashboard ?? value.Dashboard;
  return {
    authToken: stringValue(value.authToken ?? value.AuthToken) || "",
    username: stringValue(value.username ?? value.Username),
    dashboard: Array.isArray(dashboard)
      ? dashboard.map((student) => {
          const item = student as Record<string, unknown>;
          const courseList = item.courseList ?? item.CourseList;
          return {
            studentId: stringValue(item.studentId ?? item.StudentId),
            name: stringValue(item.name ?? item.Name),
            url: stringValue(item.url ?? item.Url),
            eventsList: Array.isArray(item.eventsList ?? item.EventsList)
              ? ((item.eventsList ?? item.EventsList) as Event[])
              : undefined,
            courseList: Array.isArray(courseList)
              ? courseList.map((course) => {
                  const item = course as Record<string, unknown>;
                  return {
                    courseId: stringValue(item.courseId ?? item.CourseId),
                    courseName: stringValue(item.courseName ?? item.CourseName),
                    groupId: stringValue(item.groupId ?? item.GroupId),
                    groupName: stringValue(item.groupName ?? item.GroupName),
                    schoolId: stringValue(item.schoolId ?? item.SchoolId),
                    schoolName: stringValue(item.schoolName ?? item.SchoolName),
                    attendance: numberValue(item.attendance ?? item.Attendance),
                    absences: numberValue(item.absences ?? item.Absences),
                    languageText: stringValue(
                      item.languageText ?? item.LanguageText,
                    ),
                  } satisfies Course;
                })
              : undefined,
          };
        })
      : undefined,
  };
}

export const myKids = {
  login: async (username: string, password: string, locale: string) =>
    loginPayload(
      (await request<unknown>("MyKids/Login/", undefined, {
        method: "POST",
        body: JSON.stringify({
          Username: username,
          PasswordHash: password,
          Locale: locale,
        }),
      })) as Record<string, unknown>,
    ),
  logout: (token: string) =>
    request<void>("MyKids/Logout", token, { method: "POST" }),
  calendar: (token: string, student: string, group: string) =>
    request<Event[]>(
      `MyKids/GetCalendar/${encodeURIComponent(student)}/${encodeURIComponent(group)}`,
      token,
    ),
  reports: (token: string, student: string) =>
    request<Report[]>(
      `Student/GetReports/${encodeURIComponent(student)}`,
      token,
    ),
  absences: (token: string, student: string, group: string) =>
    request<Absences>(
      `MyKids/GetMyKidsAbsences/${encodeURIComponent(student)}/${encodeURIComponent(group)}`,
      token,
    ),
  school: (token: string, school: string) =>
    request<School>(
      `MyKids/GetSchoolInfo/${encodeURIComponent(school)}`,
      token,
    ),
  information: (token: string, school: string, course: string, group: string) =>
    request<Information[]>(
      `MyKids/GetInformationOfInterest/${encodeURIComponent(school)}/${encodeURIComponent(course)}/${encodeURIComponent(group)}`,
      token,
    ),
};
