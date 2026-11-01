import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  if (user.app_metadata?.role !== "admin") {
    redirect("/auth/login")
  }
  return user
}
