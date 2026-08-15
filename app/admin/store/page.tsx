"use client"

import { useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { createClient } from "@/lib/supabase/client"
import { getStoreProfile } from "@/lib/queries/store-profile"
import { updateStoreWhatsApp } from "./actions"

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold border-none cursor-pointer hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Guardando..." : "Guardar"}
    </button>
  )
}

export default function AdminStorePage() {
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const supabase = createClient()
        const profile = await getStoreProfile(supabase as never)
        if (!cancelled && profile) {
          setWhatsappNumber(profile.whatsapp_number ?? "")
        }
      } catch {
        // Si falla la lectura, el formulario igual se muestra
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#9CA3B8]">Cargando...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Tienda</h1>
        <p className="text-sm text-[#9CA3B8] m-0 mt-1">
          Configura el número de WhatsApp que recibirá los pedidos de la tienda
        </p>
      </div>

      <form action={updateStoreWhatsApp} className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-5 max-w-xl">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="whatsapp_number" className="text-[13px] text-[#ABB2BF] font-medium">
            WhatsApp para pedidos
          </label>
          <input
            id="whatsapp_number"
            name="whatsapp_number"
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="Ej: 59176426643"
            className="px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
          />
          <p className="text-[11px] text-[#6B7280] mt-1">
            Incluye el código de país (ej: 591 para Bolivia). Este número recibe los pedidos desde
            el carrito y el checkout. Se eliminan espacios y guiones automáticamente.
          </p>
        </div>
        <SaveButton />
      </form>
    </div>
  )
}