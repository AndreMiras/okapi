"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Student } from "@/lib/mykids/types";
const links = [
  ["Dashboard", "/dashboard"],
  ["Calendar", "/calendar"],
  ["Reports", "/reports"],
  ["Attendance", "/attendance"],
  ["School", "/school"],
  ["Useful information", "/information"],
];
export function AppShell({
  children,
  students,
  selected,
}: {
  children: React.ReactNode;
  students: Student[];
  selected?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#f4f1eb]">
      <header className="border-b border-[#d9ded8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-tight text-[#173f43]"
          >
            my<span className="text-[#c16b48]">kids</span>
          </Link>
          <form
            onChange={(e) => {
              const value = (e.target as unknown as HTMLSelectElement).value;
              if (value)
                router.push(`${pathname}?student=${encodeURIComponent(value)}`);
            }}
          >
            <select
              aria-label="Select student"
              defaultValue={selected || students[0]?.studentId || ""}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {students.map((student) => (
                <option key={student.studentId} value={student.studentId}>
                  {student.name || "Student"}
                </option>
              ))}
            </select>
          </form>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
            }}
            className="text-sm font-medium text-slate-500 hover:text-[#173f43]"
          >
            Log out
          </button>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 lg:flex-row">
        <nav className="flex gap-2 overflow-x-auto lg:w-52 lg:flex-col">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium ${pathname === href ? "bg-[#173f43] text-white" : "text-slate-600 hover:bg-white"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
