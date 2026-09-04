import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { myKids } from "@/lib/mykids/client";
import { selection } from "@/lib/mykids/selectors";

export default async function CalendarPage({ searchParams }: PageProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const params = await searchParams;
  const { student, course } = selection(
    session,
    typeof params.student === "string" ? params.student : undefined,
    typeof params.group === "string" ? params.group : undefined,
  );
  const events =
    student?.studentId && course?.groupId
      ? await myKids
          .calendar(session.authToken, student.studentId, course.groupId)
          .catch(() => [])
      : [];
  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold text-[#173f43]">Calendar</h1>
      <div className="mt-6 space-y-4">
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">
            No events found for this student.
          </p>
        ) : (
          events.map((event, index) => (
            <article
              key={index}
              className="rounded-xl border border-slate-100 p-4"
            >
              <h2 className="font-medium text-slate-800">
                {event.title || "Event"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {event.date || ""} {event.time ? `• ${event.time}` : ""}{" "}
                {event.place ? `• ${event.place}` : ""}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
