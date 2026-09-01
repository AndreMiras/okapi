import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { students } from "@/lib/mykids/selectors";
import { AppShell } from "@/components/layout/app-shell";
export default async function ProtectedLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <AppShell students={students(session)}>{children}</AppShell>;
}
