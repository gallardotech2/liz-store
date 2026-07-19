import Link from "next/link"
import { Button } from "@/components/ui/Button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Registro",
  description: "Crea tu cuenta en Liz Store y comienza a comprar.",
}

export default function RegisterPage() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center px-5 py-15">
      <div className="bg-white rounded-[24px] p-10 w-full max-w-[440px] shadow-[0_10px_40px_rgba(183,110,121,0.15)]">
        <h1 className="text-center text-[28px] font-serif mb-2 text-[#2D2D2D]">
          ✦ Crear cuenta
        </h1>
        <p className="text-center text-[#888888] mb-7.5 text-[15px]">
          Únete a Liz Store y comienza a comprar con seguridad.
        </p>

        <form>
          <div className="mb-5">
            <label
              htmlFor="username"
              className="block text-[14px] font-semibold text-[#2D2D2D] mb-1.5"
            >
              Nombre de usuario *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              placeholder="Elige un nombre de usuario"
              className="w-full px-4 py-3 border border-[#DDD] rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_rgba(183,110,121,0.1)]"
            />
          </div>
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block text-[14px] font-semibold text-[#2D2D2D] mb-1.5"
            >
              Correo electrónico *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="tu@correo.com"
              className="w-full px-4 py-3 border border-[#DDD] rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_rgba(183,110,121,0.1)]"
            />
          </div>
          <div className="mb-5">
            <label
              htmlFor="password"
              className="block text-[14px] font-semibold text-[#2D2D2D] mb-1.5"
            >
              Contraseña *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-3 border border-[#DDD] rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_rgba(183,110,121,0.1)]"
            />
          </div>
          <div className="mb-5">
            <label
              htmlFor="password2"
              className="block text-[14px] font-semibold text-[#2D2D2D] mb-1.5"
            >
              Confirmar contraseña *
            </label>
            <input
              type="password"
              id="password2"
              name="password2"
              required
              placeholder="Repite la contraseña"
              className="w-full px-4 py-3 border border-[#DDD] rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_rgba(183,110,121,0.1)]"
            />
          </div>
          <Button variant="primary" className="w-full justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Crear cuenta
          </Button>
        </form>

        <p className="text-center mt-6 text-[14px] text-[#888888]">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/auth/login"
            className="text-primary font-semibold no-underline hover:underline"
          >
            Ingresa aquí
          </Link>
        </p>
      </div>
    </section>
  )
}
