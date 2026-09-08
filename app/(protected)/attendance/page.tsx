import { redirect } from "next/navigation";

import { RegisterAbsenceForm } from "@/components/attendance/register-absence-form";
import { getSession } from "@/lib/auth/session";
import { myKids } from "@/lib/mykids/client";
import { selection } from "@/lib/mykids/selectors";
import type { Absences } from "@/lib/mykids/types";

const emptyAbsences: Absences = {
  absences: [],
  dates: { dates: [], concepts: [] },
};

export default async function AttendancePage({ searchParams }: PageProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const p = await searchParams;
  const { student, course } = selection(
    session,
    typeof p.student === "string" ? p.student : undefined,
    typeof p.group === "string" ? p.group : undefined,
  );
  let data = emptyAbsences;
  let attendanceFailed = false;
  if (student?.studentId && course?.groupId) {
    try {
      data = await myKids.absences(
        session.authToken,
        student.studentId,
        course.groupId,
      );
    } catch {
      attendanceFailed = true;
    }
  }

  const completeDates = data.dates.dates.filter(
    (item) => item.date && item.followUpId,
  );
  const reasons = data.dates.concepts.filter((item) => item.length > 0);
  const missingAccountState =
    session.forceLogout === undefined ||
    session.termsPending === undefined ||
    session.schoolUser === undefined;
  const canUseRegistration =
    session.forceLogout === false &&
    session.termsPending === false &&
    session.schoolUser === false &&
    student?.studentId &&
    course?.groupId &&
    !attendanceFailed;

  let registrationMessage = "";
  if (session.schoolUser === true) {
    registrationMessage =
      "Absence registration is unavailable for school accounts.";
  } else if (missingAccountState) {
    registrationMessage =
      "Sign out and back in to enable absence registration.";
  } else if (session.forceLogout === true) {
    registrationMessage =
      "Absence registration is unavailable for this session.";
  } else if (session.termsPending === true) {
    registrationMessage =
      "Accept the current terms in the official app to register absences.";
  } else if (attendanceFailed || !student?.studentId || !course?.groupId) {
    registrationMessage = "Absence registration is temporarily unavailable.";
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h1 className="text-2xl font-semibold text-[#173f43]">Attendance</h1>
        <p className="mt-2 text-sm text-slate-500">
          Attendance details for {student?.name || "this student"}.
        </p>
      </section>
      <section className="card p-6">
        <h2 className="text-xl font-semibold text-[#173f43]">
          Register an absence
        </h2>
        {canUseRegistration ? (
          <RegisterAbsenceForm
            studentName={student.name || "Student"}
            studentId={student.studentId!}
            groupId={course.groupId!}
            dates={completeDates}
            concepts={reasons}
          />
        ) : (
          <p className="mt-3 text-sm text-slate-500">{registrationMessage}</p>
        )}
      </section>
      <section className="card p-6">
        <h2 className="text-xl font-semibold text-[#173f43]">
          Recorded absences
        </h2>
        <div className="mt-4 space-y-3">
          {data.absences.length ? (
            data.absences.map((absence, i) => (
              <div className="rounded-xl border border-slate-100 p-4" key={i}>
                <p className="font-medium">{absence.title || "Absence"}</p>
                <p className="text-sm text-slate-500">
                  {absence.date || "Date unavailable"}
                  {absence.reason ? ` • ${absence.reason}` : ""}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No absences recorded.</p>
          )}
        </div>
      </section>
    </div>
  );
}
