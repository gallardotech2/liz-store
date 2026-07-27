import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Completa todos los campos" },
        { status: 400 },
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Error de autenticación" },
        { status: 401 },
      )
    }

    const userId = data.user.id

    const result = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (result.error || !result.data) {
      const msg = result.error
        ? "Error al verificar permisos: " + result.error.message
        : "No se encontró el perfil del usuario"
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const profile = result.data as unknown as { role: string; nombre: string }

    return NextResponse.json({
      success: true,
      role: profile.role,
      user: {
        id: userId,
        email: data.user.email,
        nombre: profile.nombre,
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    )
  }
}
