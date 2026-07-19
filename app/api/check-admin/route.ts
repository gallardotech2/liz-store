import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ error: "session error", details: sessionError.message }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({
        loggedIn: false,
        message: "No hay sesión activa. Primero inicia sesión en /auth/login",
      })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    return NextResponse.json({
      loggedIn: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        metadata: session.user.user_metadata,
      },
      profile: profile ?? null,
      profileError: profileError?.message ?? null,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
