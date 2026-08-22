"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function validateEmail(value: string): string | null {
    if (!value.trim()) return "Ingresa tu correo electrónico"
    if (!EMAIL_RE.test(value)) return "Ingresa un correo electrónico válido"
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const emErr = validateEmail(email)
    setEmailError(emErr)
    if (emErr) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const origin = window.location.origin

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/update-password`,
      })

      if (error) {
        setError(error.message || "Error al enviar el correo de recuperación")
        return
      }

      setSent(true)
    } catch {
      setError("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center px-5 py-12 sm:py-15">
        <div className="bg-white rounded-[24px] p-7 sm:p-10 w-full max-w-[440px] shadow-[0_10px_40px_rgba(255,142,159,0.15)] text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(37,211,102,0.1)] flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h1 className="text-[26px] sm:text-[28px] font-serif mb-3 text-[#2D2D2D]">
            Correo enviado
          </h1>
          <p className="text-[#6B6B6B] text-[15px] mb-7 leading-relaxed">
            Revisa tu bandeja de entrada y haz clic en el enlace para
            restablecer tu contraseña. El enlace expirará en 24 horas.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white text-sm font-semibold no-underline hover:-translate-y-0.5 transition-all duration-300 shadow-[0_4px_15px_rgba(255,142,159,0.3)]"
          >
            Volver al login
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-5 py-12 sm:py-15">
      <div className="bg-white rounded-[24px] p-7 sm:p-10 w-full max-w-[440px] shadow-[0_10px_40px_rgba(255,142,159,0.15)]">
        <h1 className="text-center text-[26px] sm:text-[28px] font-serif mb-2 text-[#2D2D2D]">
          Recuperar contraseña
        </h1>
        <p className="text-center text-[#6B6B6B] mb-7 sm:mb-7.5 text-[15px]">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label htmlFor="email" className="block text-[14px] font-semibold text-[#2D2D2D] mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError(validateEmail(e.target.value))
              }}
              onBlur={() => setEmailError(validateEmail(email))}
              required
              autoComplete="email"
              inputMode="email"
              placeholder="tu@correo.com"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
              className={`w-full px-4 py-3 border rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,142,159,0.1)] ${
                emailError
                  ? "border-[#E74C3C] focus:border-[#E74C3C]"
                  : "border-[#DDD] focus:border-primary"
              }`}
            />
            {emailError && (
              <p id="email-error" className="mt-1.5 text-[13px] text-[#E74C3C]">
                {emailError}
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-[8px] bg-[#FFF0F0] border border-[#FFD0D0] text-[#E74C3C] text-[13px]"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white text-sm font-semibold border-none cursor-pointer hover:-translate-y-0.5 transition-all duration-300 shadow-[0_4px_15px_rgba(255,142,159,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            )}
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>
        </form>

        <p className="text-center mt-6 text-[14px] text-[#6B6B6B]">
          ¿Recuerdas tu contraseña?{" "}
          <Link href="/auth/login" className="text-primary font-semibold no-underline hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </section>
  )
}
