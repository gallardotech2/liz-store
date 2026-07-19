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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return redirect("/auth/login?error=" + encodeURIComponent(error.message))
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      return redirect("/auth/login?error=Error+al+verificar+permisos")
    }

    const role = (profile as unknown as { role?: string })?.role

    if (role !== "admin") {
      return redirect("/auth/login?error=No+tienes+permisos+de+administrador")
    }

    revalidatePath("/", "layout")
    redirect("/admin")
  } catch {
    return redirect("/auth/login?error=Error+inesperado+en+el+servidor")
  }
}
