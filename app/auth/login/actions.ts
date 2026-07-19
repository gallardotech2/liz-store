"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
  try {
    const supabase = await createClient()
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return redirect("/auth/login?error=Completa+todos+los+campos")
    }

    console.log("[LOGIN] intento para:", email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[LOGIN ERROR]", error.message)
      return redirect("/auth/login?error=" + encodeURIComponent(error.message))
    }

    console.log("[LOGIN OK] user:", data.user?.id)

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      console.error("[LOGIN PROFILE ERROR]", profileError.message)
      return redirect("/auth/login?error=Error+al+verificar+permisos")
    }

    const role = (profile as unknown as { role?: string })?.role
    console.log("[LOGIN] profile role:", role)

    if (role !== "admin") {
      return redirect("/auth/login?error=No+tienes+permisos+de+admin.+Role:" + role)
    }

    revalidatePath("/", "layout")
    redirect("/admin")
  } catch (e) {
    console.error("[LOGIN UNCAUGHT]", e)
    return redirect("/auth/login?error=Error+inesperado+en+el+servidor")
  }
}
