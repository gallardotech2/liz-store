"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "liz_cookie_consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY)
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setVisible(false)
  }

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, "rejected")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)] border border-[rgba(255,142,159,0.15)] p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-[#2D2D2D] font-semibold text-[15px] mb-1.5">
              Cookies en Liz Store
            </h3>
            <p className="text-[#6B6B6B] text-[13px] leading-relaxed">
              Utilizamos cookies esenciales para el funcionamiento de la tienda
              (sesión de usuario y carrito de compras). También podemos usar
              cookies analíticas para mejorar tu experiencia.{" "}
              <a
                href="/privacidad"
                className="text-primary hover:text-primary-dark underline"
              >
                Ver Política de Privacidad
              </a>
              <span className="block mt-1 text-[11px] text-[#999]">
                Última actualización: 21 de agosto de 2026
              </span>
            </p>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <button
              onClick={reject}
              className="px-5 py-2.5 rounded-full border border-[rgba(0,0,0,0.15)] bg-transparent text-[#4A4A4A] text-[13px] font-semibold cursor-pointer hover:bg-[rgba(0,0,0,0.04)] transition-colors"
            >
              Rechazar
            </button>
            <button
              onClick={accept}
              className="px-5 py-2.5 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white text-[13px] font-semibold border-none cursor-pointer hover:-translate-y-0.5 transition-all duration-300 shadow-[0_2px_8px_rgba(255,142,159,0.3)]"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
