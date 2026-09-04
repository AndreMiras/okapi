import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth/session";
import { students } from "@/lib/mykids/selectors";

export default async function ProtectedLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <AppShell students={students(session)}>{children}</AppShell>;
}
