"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { getStoreProfile, updateStoreWhatsAppNumber } from "@/lib/queries/store-profile"

export default function AdminStorePage() {
  const [profileId, setProfileId] = useState<number | null>(null)
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    const supabase = createClient()
    const profile = await getStoreProfile(supabase as never)
    if (profile) {
      setProfileId(profile.id)
      setWhatsappNumber(profile.whatsapp_number ?? "")
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (profileId === null) return
    setSaving(true)
    setSuccess("")
    setError("")
    const supabase = createClient()
    const { error: err } = await updateStoreWhatsAppNumber(supabase as never, profileId, whatsappNumber.trim())
    if (err) {
      setError("Error al guardar")
    } else {
      setSuccess("Número de WhatsApp actualizado")
    }
    setSaving(false)
  }

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

      {success && (
        <div className="mb-4 text-[13px] text-[#27AE60] bg-[rgba(39,174,96,0.1)] px-4 py-2.5 rounded-xl">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 text-[13px] text-[#E74C3C] bg-[rgba(231,76,60,0.1)] px-4 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-5 max-w-xl">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-[#ABB2BF] font-medium">
            WhatsApp para pedidos
          </label>
          <input
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
        <button
          type="submit"
          disabled={saving}
          className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold border-none cursor-pointer hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  )
}