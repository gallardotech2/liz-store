"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true)
      }
    })
  }, [])

  function validatePassword(value: string): string | null {
    if (!value) return "Ingresa tu nueva contraseña"
    if (!PASSWORD_RE.test(value))
      return "Mínimo 8 caracteres, una mayúscula, una minúscula y un número"
    return null
  }

  function validateConfirm(value: string): string | null {
    if (!value) return "Confirma tu contraseña"
    if (value !== password) return "Las contraseñas no coinciden"
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const pwErr = validatePassword(password)
    const cfErr = validateConfirm(confirmPassword)
    setPasswordError(pwErr)
    setConfirmPasswordError(cfErr)
    if (pwErr || cfErr) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message || "Error al actualizar la contraseña")
        return
      }

      setSuccess(true)
    } catch {
      setError("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center px-5 py-12 sm:py-15">
        <div className="bg-white rounded-[24px] p-7 sm:p-10 w-full max-w-[440px] shadow-[0_10px_40px_rgba(255,142,159,0.15)] text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(37,211,102,0.1)] flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="text-[26px] sm:text-[28px] font-serif mb-3 text-[#2D2D2D]">
            Contraseña actualizada
          </h1>
          <p className="text-[#6B6B6B] text-[15px] mb-7 leading-relaxed">
            Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white text-sm font-semibold no-underline hover:-translate-y-0.5 transition-all duration-300 shadow-[0_4px_15px_rgba(255,142,159,0.3)]"
          >
            Iniciar sesión
          </Link>
        </div>
      </section>
    )
  }

  if (!ready) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center px-5 py-12 sm:py-15">
        <div className="bg-white rounded-[24px] p-7 sm:p-10 w-full max-w-[440px] shadow-[0_10px_40px_rgba(255,142,159,0.15)] text-center">
          <svg className="animate-spin mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff8e9f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-[#6B6B6B] text-[15px]">Verificando enlace...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-5 py-12 sm:py-15">
      <div className="bg-white rounded-[24px] p-7 sm:p-10 w-full max-w-[440px] shadow-[0_10px_40px_rgba(255,142,159,0.15)]">
        <h1 className="text-center text-[26px] sm:text-[28px] font-serif mb-2 text-[#2D2D2D]">
          Nueva contraseña
        </h1>
        <p className="text-center text-[#6B6B6B] mb-7 sm:mb-7.5 text-[15px]">
          Ingresa tu nueva contraseña para completar el proceso.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label htmlFor="password" className="block text-[14px] font-semibold text-[#2D2D2D] mb-1.5">
              Nueva contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (passwordError) setPasswordError(validatePassword(e.target.value))
              }}
              onBlur={() => setPasswordError(validatePassword(password))}
              required
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "password-error" : undefined}
              className={`w-full px-4 py-3 border rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,142,159,0.1)] ${
                passwordError
                  ? "border-[#E74C3C] focus:border-[#E74C3C]"
                  : "border-[#DDD] focus:border-primary"
              }`}
            />
            {passwordError && (
              <p id="password-error" className="mt-1.5 text-[13px] text-[#E74C3C]">
                {passwordError}
              </p>
            )}
          </div>

          <div className="mb-5">
            <label htmlFor="confirmPassword" className="block text-[14px] font-semibold text-[#2D2D2D] mb-1.5">
              Confirmar contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (confirmPasswordError) setConfirmPasswordError(validateConfirm(e.target.value))
              }}
              onBlur={() => setConfirmPasswordError(validateConfirm(confirmPassword))}
              required
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              aria-invalid={!!confirmPasswordError}
              aria-describedby={confirmPasswordError ? "confirm-error" : undefined}
              className={`w-full px-4 py-3 border rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,142,159,0.1)] ${
                confirmPasswordError
                  ? "border-[#E74C3C] focus:border-[#E74C3C]"
                  : "border-[#DDD] focus:border-primary"
              }`}
            />
            {confirmPasswordError && (
              <p id="confirm-error" className="mt-1.5 text-[13px] text-[#E74C3C]">
                {confirmPasswordError}
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </section>
  )
}
