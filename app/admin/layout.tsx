import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminShell } from "@/components/admin/AdminShell"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Admin | Liz Store",
  robots: { index: false, follow: false },
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

  if (user.app_metadata?.role !== "admin") {
    redirect("/auth/login")
  }

  const userName =
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "Admin"

  return (
    <AdminShell userName={userName}>
      {children}
    </AdminShell>
  )
}
