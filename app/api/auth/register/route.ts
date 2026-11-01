import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/security/turnstile"
import { isHoneypot } from "@/lib/whatsapp/validation"

export const dynamic = "force-dynamic"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ERROR_TRANSLATIONS: Record<string, string> = {
  "rate limit": "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
  "rate_limit": "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
  "email not confirmed": "Debes confirmar tu correo antes de iniciar sesión.",
  "Email not confirmed": "Debes confirmar tu correo antes de iniciar sesión.",
  "invalid email": "Ingresa un correo electrónico válido.",
  "Invalid email": "Ingresa un correo electrónico válido.",
  "weak password": "La contraseña es muy débil. Usa al menos 8 caracteres.",
  "Weak password": "La contraseña es muy débil. Usa al menos 8 caracteres.",
  "over_request": "Demasiadas solicitudes. Espera unos minutos.",
  "over_email_send_rate": "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
  "signup_disabled": "El registro está deshabilitado temporalmente.",
}

function translateError(msg: string): string {
  for (const [key, translation] of Object.entries(ERROR_TRANSLATIONS)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) {
      return translation
    }
  }
  return "Error al crear la cuenta. Intenta de nuevo."
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const rateLimit = await checkRateLimit(`register:${clientIp}`, 5, 60)

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

    const turnstile = await verifyTurnstile(body.turnstileToken, clientIp, "register")
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: "No pudimos verificar que eres una persona. Recarga e intenta de nuevo." },
        { status: 403 },
      )
    }

    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Completa todos los campos" },
        { status: 400 },
      )
    }

    if (nombre.length > 100) {
      return NextResponse.json(
        { error: "El nombre es demasiado largo" },
        { status: 400 },
      )
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Ingresa un correo electrónico válido" },
        { status: 400 },
      )
    }

    if (password.length < 8 || password.length > 200) {
      return NextResponse.json(
        { error: "La contraseña debe tener entre 8 y 200 caracteres" },
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
      },
    })

    if (error) {
      const normalized = error.message.toLowerCase()
      if (normalized.includes("already") && normalized.includes("registered")) {
        return NextResponse.json({ success: true, requiresConfirmation: true, user: null })
      }
      return NextResponse.json({ error: translateError(error.message) }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Error al crear el usuario" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      requiresConfirmation: !data.session,
      user: { id: data.user.id, email: data.user.email },
    })
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    )
  }
}
