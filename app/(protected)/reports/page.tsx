import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { myKids } from "@/lib/mykids/client";
import { safeUrl, selection } from "@/lib/mykids/selectors";

export default async function ReportsPage({ searchParams }: PageProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const p = await searchParams;
  const { student } = selection(
    session,
    typeof p.student === "string" ? p.student : undefined,
  );
  const reports = student?.studentId
    ? await myKids.reports(session.authToken, student.studentId).catch(() => [])
    : [];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-[#173f43]">Reports</h1>
      {reports.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">
          No reports available.
        </div>
      ) : (
        reports.map((report, i) => (
          <section className="card p-6" key={i}>
            <h2 className="font-semibold">{report.title || "Report"}</h2>
            <div className="mt-3 space-y-2">
              {(report.files || []).map((file, j) => {
                const url = safeUrl(file.url);
                return url ? (
                  <a
                    className="block text-sm text-[#c16b48] underline"
                    target="_blank"
                    rel="noreferrer"
                    href={url}
                    key={j}
                  >
                    {file.name || "Open report"}
                  </a>
                ) : null;
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
