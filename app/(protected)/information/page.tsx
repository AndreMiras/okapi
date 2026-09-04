import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { myKids } from "@/lib/mykids/client";
import { safeUrl, selection } from "@/lib/mykids/selectors";

export default async function InformationPage({
  searchParams,
}: PageProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const p = await searchParams;
  const { course } = selection(
    session,
    typeof p.student === "string" ? p.student : undefined,
  );
  const items =
    course?.schoolId && course.courseId && course.groupId
      ? await myKids
          .information(
            session.authToken,
            course.schoolId,
            course.courseId,
            course.groupId,
          )
          .catch(() => [])
      : [];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-[#173f43]">
        Useful information
      </h1>
      {items.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">
          No information available.
        </div>
      ) : (
        items.map((item, i) => {
          const url = safeUrl(item.urlPdf);
          return (
            <article className="card p-6" key={i}>
              <h2 className="font-semibold">{item.title || "Information"}</h2>
              {item.description && (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              )}
              {url && (
                <a
                  className="mt-4 inline-block text-sm text-[#c16b48] underline"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open PDF
                </a>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
