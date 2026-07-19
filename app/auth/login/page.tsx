"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { GoogleButton } from "@/components/auth/GoogleButton"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  function validateEmail(value: string): string | null {
    if (!value.trim()) return "Ingresa tu correo electrónico"
    if (!EMAIL_RE.test(value)) return "Ingresa un correo electrónico válido"
    return null
  }

  function validatePassword(value: string): string | null {
    if (!value) return "Ingresa tu contraseña"
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const emErr = validateEmail(email)
    const pwErr = validatePassword(password)
    setEmailError(emErr)
    setPasswordError(pwErr)
    if (emErr || pwErr) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión")
        return
      }

      router.push("/admin")
    } catch {
      setError("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-5 py-12 sm:py-15">
      <div className="bg-white rounded-[24px] p-7 sm:p-10 w-full max-w-[440px] shadow-[0_10px_40px_rgba(183,110,121,0.15)]">
        <h1 className="text-center text-[26px] sm:text-[28px] font-serif mb-2 text-[#2D2D2D]">
          ✦ Bienvenida
        </h1>
        <p className="text-center text-[#888888] mb-7 sm:mb-7.5 text-[15px]">
          Ingresa a tu cuenta Liz Store
        </p>

        <GoogleButton />

        <div className="flex items-center gap-3 my-6" role="separator" aria-label="o">
          <span className="h-px flex-1 bg-[#EEE]" />
          <span className="text-[13px] text-[#AAAAAA]">o</span>
          <span className="h-px flex-1 bg-[#EEE]" />
        </div>

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
              className={`w-full px-4 py-3 border rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:outline-none focus:shadow-[0_0_0_3px_rgba(183,110,121,0.1)] ${
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

          <PasswordInput
            id="password"
            name="password"
            label="Contraseña"
            value={password}
            onChange={(v) => {
              setPassword(v)
              if (passwordError) setPasswordError(validatePassword(v))
            }}
            onBlur={() => setPasswordError(validatePassword(password))}
            autoComplete="current-password"
            error={passwordError}
          />

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-[8px] bg-[#FFF0F0] border border-[#FFD0D0] text-[#E74C3C] text-[13px]"
            >
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
            {loading ? (
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            )}
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <p className="text-center mt-6 text-[14px] text-[#888888]">
          ¿No tienes cuenta?{" "}
          <Link href="/auth/registro" className="text-primary font-semibold no-underline hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </section>
  )
}
