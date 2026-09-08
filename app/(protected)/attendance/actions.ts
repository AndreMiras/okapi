"use server";

import { refresh } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { myKids } from "@/lib/mykids/client";
import { ApiError } from "@/lib/mykids/errors";
import { exactSelection } from "@/lib/mykids/selectors";

export type RegisterAbsenceState = {
  status: "idle" | "error" | "success";
  message: string;
};

function error(message: string): RegisterAbsenceState {
  return { status: "error", message };
}

function boundedString(value: unknown, maximumLength: number) {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= maximumLength
    ? value
    : null;
}

export async function registerAbsence(
  studentIdValue: string,
  groupIdValue: string,
  _previousState: RegisterAbsenceState,
  formData: FormData,
): Promise<RegisterAbsenceState> {
  const session = await getSession();
  if (!session) return error("Your session has expired. Sign in again.");

  if (
    typeof session.forceLogout !== "boolean" ||
    typeof session.termsPending !== "boolean" ||
    typeof session.schoolUser !== "boolean"
  ) {
    return error("Sign out and back in to enable absence registration.");
  }
  if (session.forceLogout || session.termsPending || session.schoolUser) {
    return error("Absence registration is not available for this session.");
  }

  const studentId = boundedString(studentIdValue, 200);
  const groupId = boundedString(groupIdValue, 200);
  const followUpId = boundedString(formData.get("followUpId"), 200);
  const reason = boundedString(formData.get("reason"), 500);
  if (!studentId || !groupId || !followUpId || !reason) {
    return error("Choose a class and reason.");
  }

  const picked = exactSelection(session, studentId, groupId);
  if (!picked?.student.studentId || !picked.course.groupId) {
    return error("The selected student or class is not valid.");
  }

  try {
    const attendance = await myKids.absences(
      session.authToken,
      picked.student.studentId,
      picked.course.groupId,
    );
    const eligible = attendance.dates.dates.find(
      (item) => item.followUpId === followUpId,
    );
    const allowedReason = attendance.dates.concepts.find(
      (item) => item === reason,
    );
    if (!eligible?.followUpId || !allowedReason) {
      return error("That option is no longer available. Review and try again.");
    }

    await myKids.registerAbsence(session.authToken, {
      followUpId: eligible.followUpId,
      reason: allowedReason,
      studentId: picked.student.studentId,
    });
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) {
      return error("Your session has expired. Sign in again.");
    }
    return error("Unable to register the absence right now. Try again.");
  }
  refresh();
  return { status: "success", message: "Absence registered." };
}
