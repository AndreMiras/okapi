import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { myKids } from "@/lib/mykids/client";
import { selection } from "@/lib/mykids/selectors";
import type { Absences } from "@/lib/mykids/types";

export default async function AttendancePage({ searchParams }: PageProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const p = await searchParams;
  const { student, course } = selection(
    session,
    typeof p.student === "string" ? p.student : undefined,
  );
  const data: Absences =
    student?.studentId && course?.groupId
      ? await myKids
          .absences(session.authToken, student.studentId, course.groupId)
          .catch(() => ({}))
      : {};
  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold text-[#173f43]">Attendance</h1>
      <p className="mt-2 text-sm text-slate-500">
        Recorded absences for {student?.name || "this student"}.
      </p>
      <div className="mt-6 space-y-3">
        {(data.absences || []).length ? (
          data.absences?.map((absence, i) => (
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
    </div>
  );
}
