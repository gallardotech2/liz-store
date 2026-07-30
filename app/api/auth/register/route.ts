import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ERROR_TRANSLATIONS: Record<string, string> = {
  "rate limit": "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
  "rate_limit": "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
  "already registered": "Este correo ya está registrado. Inicia sesión o usa otro correo.",
  "User already registered": "Este correo ya está registrado. Inicia sesión o usa otro correo.",
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
    const { allowed } = checkRateLimit(`register:${clientIp}`)

    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera un minuto e intenta de nuevo." },
        { status: 429 },
      )
    }

    const { nombre, email, password } = await request.json()

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Completa todos los campos" },
        { status: 400 },
      )
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Ingresa un correo electrónico válido" },
        { status: 400 },
      )
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
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
        data: { nombre, role: "customer" },
      },
    })

    if (error) {
      return NextResponse.json({ error: translateError(error.message) }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Error al crear el usuario" },
        { status: 500 },
      )
    }

    let session = data.session

    if (!session) {
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } },
      )

      const { error: confirmError } =
        await adminSupabase.auth.admin.updateUserById(data.user.id, {
          email_confirm: true,
        })

      if (!confirmError) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInData?.session) {
          session = signInData.session
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    })
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    )
  }
}
