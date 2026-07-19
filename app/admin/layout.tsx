import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminShell } from "@/components/admin/AdminShell"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Admin | Liz Store",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if ((profile as unknown as { role?: string })?.role !== "admin") {
    redirect("/auth/login")
  }

  const userName =
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "Admin"
  const userEmail = user.email ?? ""

  return (
    <AdminShell userName={userName} userEmail={userEmail}>
      {children}
    </AdminShell>
  )
}
