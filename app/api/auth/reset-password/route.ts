import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/security/turnstile"
import { isHoneypot } from "@/lib/whatsapp/validation"

export const dynamic = "force-dynamic"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const clientIp = getClientIp(request)
  const rateLimit = await checkRateLimit(`reset-password:${clientIp}`, 3, 60)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un minuto e intenta de nuevo." },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  if (isHoneypot(body)) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  const turnstile = await verifyTurnstile(body.turnstileToken, clientIp, "reset")
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "No pudimos verificar que eres una persona. Recarga e intenta de nuevo." },
      { status: 403 },
    )
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Ingresa un correo electrónico válido" },
      { status: 400 },
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return NextResponse.json(
      { error: "Configuración del servidor incompleta" },
      { status: 503 },
    )
  }

  const siteUrl =
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
      : new URL(request.url).origin
  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = []
  const cookieStore = await cookies()
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options })
        })
      },
    },
  })

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/update-password`,
  })

  const response = error
    ? NextResponse.json(
        { error: "No se pudo enviar el correo. Intenta de nuevo." },
        { status: 502 },
      )
    : NextResponse.json({ success: true })

  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  if (error) {
    console.error("[reset-password]", error.message)
  }

  return response
}
