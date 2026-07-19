"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string

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
    <section className="min-h-[80vh] flex items-center justify-center px-5 py-15">
      <div className="bg-white rounded-[24px] p-10 w-full max-w-[440px] shadow-[0_10px_40px_rgba(183,110,121,0.15)]">
        <h1 className="text-center text-[28px] font-serif mb-2 text-[#2D2D2D]">
          ✦ Bienvenida
        </h1>
        <p className="text-center text-[#888888] mb-7.5 text-[15px]">
          Ingresa a tu cuenta Liz Store
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="email" className="block text-[14px] font-semibold text-[#2D2D2D] mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="admin@lizstore.com"
              className="w-full px-4 py-3 border border-[#DDD] rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_rgba(183,110,121,0.1)]"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="password" className="block text-[14px] font-semibold text-[#2D2D2D] mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="Tu contraseña"
              className="w-full px-4 py-3 border border-[#DDD] rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_rgba(183,110,121,0.1)]"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-[8px] bg-[#FFF0F0] border border-[#FFD0D0] text-[#E74C3C] text-[13px]">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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
