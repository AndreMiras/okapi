import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { myKids } from "@/lib/mykids/client";
import { safeUrl, selection } from "@/lib/mykids/selectors";
import type { School } from "@/lib/mykids/types";

export default async function SchoolPage({ searchParams }: PageProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const p = await searchParams;
  const { course } = selection(
    session,
    typeof p.student === "string" ? p.student : undefined,
  );
  const school: School = course?.schoolId
    ? await myKids.school(session.authToken, course.schoolId).catch(() => ({}))
    : {};
  const web = safeUrl(school.web);
  return (
    <div className="card p-6">
      <p className="eyebrow text-[#c16b48]">YOUR SCHOOL</p>
      <h1 className="mt-2 text-2xl font-semibold text-[#173f43]">
        {school.title || course?.schoolName || "School information"}
      </h1>
      <div className="mt-6 space-y-3 text-sm text-slate-600">
        {school.address?.map((item, i) => (
          <p key={i}>{item}</p>
        ))}
        {school.phone?.map((item, i) => (
          <p key={i}>{item}</p>
        ))}
        {school.email && <p>{school.email}</p>}
        {web && (
          <a
            className="text-[#c16b48] underline"
            href={web}
            target="_blank"
            rel="noreferrer"
          >
            Visit school website
          </a>
        )}
      </div>
    </div>
  );
}
