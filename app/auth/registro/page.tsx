"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { GoogleButton } from "@/components/auth/GoogleButton"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")

  const [nombreError, setNombreError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [password2Error, setPassword2Error] = useState<string | null>(null)

  function validateNombre(v: string): string | null {
    if (!v.trim()) return "Ingresa un nombre de usuario"
    if (v.trim().length < 3) return "Debe tener al menos 3 caracteres"
    return null
  }
  function validateEmail(v: string): string | null {
    if (!v.trim()) return "Ingresa tu correo electrónico"
    if (!EMAIL_RE.test(v)) return "Ingresa un correo electrónico válido"
    return null
  }
  function validatePassword(v: string): string | null {
    if (!v) return "Ingresa una contraseña"
    if (v.length < 8) return "Mínimo 8 caracteres"
    return null
  }
  function validatePassword2(v: string, pw: string): string | null {
    if (!v) return "Repite la contraseña"
    if (v !== pw) return "Las contraseñas no coinciden"
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const nErr = validateNombre(nombre)
    const eErr = validateEmail(email)
    const pErr = validatePassword(password)
    const p2Err = validatePassword2(password2, password)
    setNombreError(nErr)
    setEmailError(eErr)
    setPasswordError(pErr)
    setPassword2Error(p2Err)
    if (nErr || eErr || pErr || p2Err) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta")
        return
      }

      if (data.needsConfirmation) {
        setSuccess(
          "¡Cuenta creada! Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.",
        )
      } else {
        router.push("/")
      }
    } catch {
      setError("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    "w-full px-4 py-3 border rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:outline-none focus:shadow-[0_0_0_3px_rgba(183,110,121,0.1)]"

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-5 py-12 sm:py-15">
      <div className="bg-white rounded-[24px] p-7 sm:p-10 w-full max-w-[440px] shadow-[0_10px_40px_rgba(183,110,121,0.15)]">
        <h1 className="text-center text-[26px] sm:text-[28px] font-serif mb-2 text-[#2D2D2D]">
          ✦ Crear cuenta
        </h1>
        <p className="text-center text-[#888888] mb-7 sm:mb-7.5 text-[15px]">
          Únete a Liz Store y comienza a comprar con seguridad.
        </p>

        <GoogleButton />

        <div className="flex items-center gap-3 my-6" role="separator" aria-label="o">
          <span className="h-px flex-1 bg-[#EEE]" />
          <span className="text-[13px] text-[#AAAAAA]">o</span>
          <span className="h-px flex-1 bg-[#EEE]" />
        </div>

        {success ? (
          <div
            role="status"
            className="p-4 rounded-[8px] bg-[#EAF7EE] border border-[#BEE5C8] text-[#2E7D46] text-[14px] text-center"
          >
            {success}
            <div className="mt-4">
              <Link href="/auth/login" className="text-primary font-semibold no-underline hover:underline">
                Ir a iniciar sesión
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5">
              <label htmlFor="username" className="block text-[14px] font-semibold text-[#2D2D2D] mb-1.5">
                Nombre de usuario *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value)
                  if (nombreError) setNombreError(validateNombre(e.target.value))
                }}
                onBlur={() => setNombreError(validateNombre(nombre))}
                required
                autoComplete="username"
                placeholder="Elige un nombre de usuario"
                aria-invalid={!!nombreError}
                aria-describedby={nombreError ? "username-error" : undefined}
                className={`${inputBase} ${nombreError ? "border-[#E74C3C] focus:border-[#E74C3C]" : "border-[#DDD] focus:border-primary"}`}
              />
              {nombreError && (
                <p id="username-error" className="mt-1.5 text-[13px] text-[#E74C3C]">{nombreError}</p>
              )}
            </div>

            <div className="mb-5">
              <label htmlFor="email" className="block text-[14px] font-semibold text-[#2D2D2D] mb-1.5">
                Correo electrónico *
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
                className={`${inputBase} ${emailError ? "border-[#E74C3C] focus:border-[#E74C3C]" : "border-[#DDD] focus:border-primary"}`}
              />
              {emailError && (
                <p id="email-error" className="mt-1.5 text-[13px] text-[#E74C3C]">{emailError}</p>
              )}
            </div>

            <PasswordInput
              id="password"
              name="password"
              label="Contraseña *"
              value={password}
              onChange={(v) => {
                setPassword(v)
                if (passwordError) setPasswordError(validatePassword(v))
                if (password2Error) setPassword2Error(validatePassword2(password2, v))
              }}
              onBlur={() => setPasswordError(validatePassword(password))}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              error={passwordError}
            />

            <PasswordInput
              id="password2"
              name="password2"
              label="Confirmar contraseña *"
              value={password2}
              onChange={(v) => {
                setPassword2(v)
                if (password2Error) setPassword2Error(validatePassword2(v, password))
              }}
              onBlur={() => setPassword2Error(validatePassword2(password2, password))}
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              error={password2Error}
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              )}
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>
        )}

        <p className="text-center mt-6 text-[14px] text-[#888888]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-primary font-semibold no-underline hover:underline">
            Ingresa aquí
          </Link>
        </p>
      </div>
    </section>
  )
}
