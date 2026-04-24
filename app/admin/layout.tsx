import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import AdminShell from "./_AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin")
    redirect("/dashboard");

  const adminName = session.user.name ?? session.user.email;

  return <AdminShell adminName={adminName}>{children}</AdminShell>;
}
