"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

type PickupPointRow = {
  id: number
  name: string
  address: string
  schedule: string
  google_maps_url: string
  is_active: boolean
  order: number
}

export default function AdminPickupPointsPage() {
  const [points, setPoints] = useState<PickupPointRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formSchedule, setFormSchedule] = useState("")
  const [formMapsUrl, setFormMapsUrl] = useState("")

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from("pickup_points")
      .select("*")
      .order("order", { ascending: true })
    if (data) setPoints(data as unknown as PickupPointRow[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setFormName("")
    setFormAddress("")
    setFormSchedule("")
    setFormMapsUrl("")
    setEditingId(null)
    setShowForm(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    if (editingId) {
      await (supabase as any).from("pickup_points").update({
        name: formName,
        address: formAddress,
        schedule: formSchedule,
        google_maps_url: formMapsUrl,
      }).eq("id", editingId)
    } else {
      const maxOrder = points.reduce((max, p) => Math.max(max, p.order), 0)
      await (supabase as any).from("pickup_points").insert({
        name: formName,
        address: formAddress,
        schedule: formSchedule,
        google_maps_url: formMapsUrl,
        order: maxOrder + 1,
      })
    }
    resetForm()
    load()
  }

  async function toggleActive(point: PickupPointRow) {
    const supabase = createClient()
    await (supabase as any).from("pickup_points").update({ is_active: !point.is_active }).eq("id", point.id)
    load()
  }

  async function handleDelete(point: PickupPointRow) {
    if (!confirm(`¿Eliminar "${point.name}"?`)) return
    const supabase = createClient()
    await (supabase as any).from("pickup_points").delete().eq("id", point.id)
    load()
  }

  function editPoint(point: PickupPointRow) {
    setEditingId(point.id)
    setFormName(point.name)
    setFormAddress(point.address)
    setFormSchedule(point.schedule)
    setFormMapsUrl(point.google_maps_url)
    setShowForm(true)
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white m-0">Puntos de entrega</h1>
          <p className="text-sm text-[#9CA3B8] m-0 mt-1">Gestiona los puntos de entrega que ven los clientes en el checkout</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold border-none cursor-pointer hover:brightness-110 transition-all"
        >
          + Nuevo punto
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1E1E2E] rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{editingId ? "Editar punto" : "Nuevo punto de recogida"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[13px] text-[#9CA3B8] mb-1">Nombre del punto</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="Ej: Sucursal Central"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#9CA3B8] mb-1">Dirección</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  required
                  placeholder="Ej: Av. Principal #123, Zona Centro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#9CA3B8] mb-1">Horario de atención</label>
                <input
                  type="text"
                  value={formSchedule}
                  onChange={(e) => setFormSchedule(e.target.value)}
                  required
                  placeholder="Ej: Lun-Sáb 10:00 - 20:00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#9CA3B8] mb-1">URL de Google Maps</label>
                <input
                  type="text"
                  value={formMapsUrl}
                  onChange={(e) => setFormMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-transparent border border-white/10 text-white text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold border-none cursor-pointer hover:brightness-110 transition-all"
                >
                  {editingId ? "Guardar" : "Crear punto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {points.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#9CA3B8]">No hay puntos de recogida. Crea el primero.</p>
          </div>
        )}
        {points.map((point) => (
          <div
            key={point.id}
            className="bg-[#1E1E2E] rounded-2xl border border-white/10 overflow-hidden"
          >
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
                  📍
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{point.name}</span>
                  </div>
                  <p className="text-[13px] text-[#9CA3B8] m-0 mt-0.5 truncate">{point.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap max-sm:gap-1">
                <button
                  onClick={() => toggleActive(point)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border-none cursor-pointer transition-all ${
                    point.is_active
                      ? "bg-[rgba(39,174,96,0.15)] text-[#27AE60] hover:bg-[rgba(39,174,96,0.25)]"
                      : "bg-[rgba(231,76,60,0.15)] text-[#E74C3C] hover:bg-[rgba(231,76,60,0.25)]"
                  }`}
                >
                  {point.is_active ? "Activo" : "Inactivo"}
                </button>
                <button
                  onClick={() => editPoint(point)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-[#9CA3B8] text-[12px] font-semibold border-none cursor-pointer hover:bg-white/10 transition-all"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(point)}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(231,76,60,0.15)] text-[#E74C3C] text-[12px] font-semibold border-none cursor-pointer hover:bg-[rgba(231,76,60,0.25)] transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
