import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/security/turnstile"
import { isHoneypot } from "@/lib/whatsapp/validation"
import { translateAuthError } from "@/lib/auth-errors"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const rateLimit = await checkRateLimit(`login:${clientIp}`, 5, 60)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera un minuto e intenta de nuevo." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      )
    }

    const body = (await request.json()) as Record<string, unknown>

    if (isHoneypot(body)) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
    }

    const turnstile = await verifyTurnstile(body.turnstileToken, clientIp, "login")
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: "No pudimos verificar que eres una persona. Recarga e intenta de nuevo." },
        { status: 403 },
      )
    }

    const email = typeof body.email === "string" ? body.email : ""
    const password = typeof body.password === "string" ? body.password : ""

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
        { error: translateAuthError(error?.message, "No pudimos iniciar sesión. Intenta de nuevo.") },
        { status: 401 },
      )
    }

    const userId = data.user.id

    const result = await supabase
      .from("profiles")
      .select("nombre")
      .eq("id", userId)
      .single()

    if (result.error || !result.data) {
      const msg = result.error
        ? "Error al verificar permisos: " + result.error.message
        : "No se encontró el perfil del usuario"
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const profile = result.data as unknown as { nombre: string }

    return NextResponse.json({
      success: true,
      role: data.user.app_metadata?.role === "admin" ? "admin" : "customer",
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
