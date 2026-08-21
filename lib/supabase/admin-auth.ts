import { forbidden } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) forbidden()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if ((profile as unknown as { role?: string })?.role !== "admin") forbidden()
  return user
}
