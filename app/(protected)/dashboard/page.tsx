import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { selection } from "@/lib/mykids/selectors";
export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const params = await searchParams;
  const { student, course } = selection(
    session,
    typeof params.student === "string" ? params.student : undefined,
    typeof params.group === "string" ? params.group : undefined,
  );
  return (
    <div className="space-y-6">
      <section className="card p-6">
        <p className="eyebrow text-[#c16b48]">STUDENT OVERVIEW</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#173f43]">
          {student?.name || "Student"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {course?.courseName || "Current Course"}{" "}
          {course?.groupName ? `• ${course.groupName}` : ""}
        </p>
      </section>
      <section className="card p-6">
        <h2 className="text-xl font-semibold text-[#173f43]">
          Upcoming Events
        </h2>
        <div className="mt-4 divide-y divide-slate-100">
          {(student?.eventsList || []).length === 0 ? (
            <p className="text-sm text-slate-500">
              No scheduled events right now.
            </p>
          ) : (
            (student?.eventsList || []).map((event, index) => (
              <div key={index} className="py-3">
                <p className="font-medium text-slate-800">
                  {event.title || "Event"}
                </p>
                <p className="text-xs text-slate-500">
                  {event.date || ""} {event.time ? `at ${event.time}` : ""}{" "}
                  {event.place ? `• ${event.place}` : ""}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
