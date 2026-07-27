"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

type PaymentMethodRow = {
  id: number
  name: string
  code: string
  description: string
  icon: string
  is_active: boolean
  order: number
  config: Record<string, unknown>
}

type QrPaymentRow = {
  id: number
  payment_method_id: number
  qr_type: string
  qr_image: string | null
  qr_code: string
  account_name: string
  account_number: string
  bank_name: string
  is_active: boolean
}

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethodRow[]>([])
  const [qrPayments, setQrPayments] = useState<QrPaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [expandedMethod, setExpandedMethod] = useState<number | null>(null)
  const [formName, setFormName] = useState("")
  const [formCode, setFormCode] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formIcon, setFormIcon] = useState("")
  const [formQrImage, setFormQrImage] = useState("")
  const [formAccountName, setFormAccountName] = useState("")
  const [formAccountNumber, setFormAccountNumber] = useState("")
  const [formBankName, setFormBankName] = useState("")

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: m } = await (supabase as any)
      .from("payment_methods")
      .select("*")
      .order("order", { ascending: true })
    const { data: q } = await (supabase as any)
      .from("qr_payments")
      .select("*")
    if (m) setMethods(m as unknown as PaymentMethodRow[])
    if (q) setQrPayments(q as unknown as QrPaymentRow[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setFormName("")
    setFormCode("")
    setFormDescription("")
    setFormIcon("")
    setFormQrImage("")
    setFormAccountName("")
    setFormAccountNumber("")
    setFormBankName("")
    setEditingId(null)
    setShowForm(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    if (editingId) {
      await (supabase as any).from("payment_methods").update({ name: formName, description: formDescription, icon: formIcon }).eq("id", editingId)
      const qr = getQrForMethod(editingId)
      if (qr) {
        await (supabase as any).from("qr_payments").update({
          account_name: formAccountName,
          bank_name: formBankName,
          account_number: formAccountNumber,
          qr_image: formQrImage || null,
        }).eq("id", qr.id)
      }
    } else {
      const maxOrder = methods.reduce((max, m) => Math.max(max, m.order), 0)
      const { data: newMethod } = await (supabase as any).from("payment_methods").insert({
        name: formName,
        code: formCode,
        description: formDescription,
        icon: formIcon,
        order: maxOrder + 1,
      }).select().single()
      if (newMethod) {
        await (supabase as any).from("qr_payments").insert({
          payment_method_id: newMethod.id,
          qr_type: formCode === "escudo_pago" ? "escudo" : "direct",
          qr_image: formQrImage || null,
          qr_code: "",
          account_name: formAccountName,
          account_number: formAccountNumber,
          bank_name: formBankName,
        })
      }
    }
    resetForm()
    load()
  }

  async function toggleActive(method: PaymentMethodRow) {
    const supabase = createClient()
    await (supabase as any).from("payment_methods").update({ is_active: !method.is_active }).eq("id", method.id)
    load()
  }

  function editMethod(method: PaymentMethodRow) {
    setEditingId(method.id)
    setFormName(method.name)
    setFormCode(method.code)
    setFormDescription(method.description)
    setFormIcon(method.icon)
    const qr = getQrForMethod(method.id)
    if (qr) {
      setFormAccountName(qr.account_name)
      setFormBankName(qr.bank_name)
      setFormAccountNumber(qr.account_number)
      setFormQrImage(qr.qr_image || "")
    }
    setShowForm(true)
  }

  function getQrForMethod(methodId: number): QrPaymentRow | undefined {
    return qrPayments.find((q) => q.payment_method_id === methodId)
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
          <h1 className="text-xl font-bold text-white m-0">Métodos de pago</h1>
          <p className="text-sm text-[#9CA3B8] m-0 mt-1">Gestiona los métodos de pago disponibles en el checkout</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold border-none cursor-pointer hover:brightness-110 transition-all"
        >
          + Nuevo método
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1E1E2E] rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">{editingId ? "Editar método" : "Nuevo método de pago"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[13px] text-[#9CA3B8] mb-1">Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-[13px] text-[#9CA3B8] mb-1">Código (identificador único)</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    required
                    placeholder="Ej: pago_directo, escudo_pago"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}
              <div>
                <label className="block text-[13px] text-[#9CA3B8] mb-1">Descripción</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#9CA3B8] mb-1">Icono (emoji)</label>
                <input
                  type="text"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="Ej: 💳, 🛡️"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#9CA3B8] mb-1">Imagen QR (URL)</label>
                <input
                  type="text"
                  value={formQrImage}
                  onChange={(e) => setFormQrImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#9CA3B8] mb-1">Nombre del titular</label>
                <input
                  type="text"
                  value={formAccountName}
                  onChange={(e) => setFormAccountName(e.target.value)}
                  placeholder="Liz Store"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-[#9CA3B8] mb-1">Banco</label>
                  <input
                    type="text"
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-[#9CA3B8] mb-1">Número de cuenta</label>
                  <input
                    type="text"
                    value={formAccountNumber}
                    onChange={(e) => setFormAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
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
                  {editingId ? "Guardar" : "Crear método"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {methods.map((method) => {
          const qr = getQrForMethod(method.id)
          return (
            <div
              key={method.id}
              className="bg-[#1E1E2E] rounded-2xl border border-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-2xl">{method.icon || "💳"}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{method.name}</span>
                      <span className="text-[12px] text-[#9CA3B8] font-mono bg-white/5 px-2 py-0.5 rounded">{method.code}</span>
                    </div>
                    {method.description && (
                      <p className="text-[13px] text-[#9CA3B8] m-0 mt-0.5">{method.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(method)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border-none cursor-pointer transition-all ${
                      method.is_active
                        ? "bg-[rgba(39,174,96,0.15)] text-[#27AE60] hover:bg-[rgba(39,174,96,0.25)]"
                        : "bg-[rgba(231,76,60,0.15)] text-[#E74C3C] hover:bg-[rgba(231,76,60,0.25)]"
                    }`}
                  >
                    {method.is_active ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={() => editMethod(method)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-[#9CA3B8] text-[12px] font-semibold border-none cursor-pointer hover:bg-white/10 transition-all"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setExpandedMethod(expandedMethod === method.id ? null : method.id)}
                    className="px-2 py-1.5 rounded-lg bg-white/5 text-[#9CA3B8] border-none cursor-pointer hover:bg-white/10 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${expandedMethod === method.id ? "rotate-180" : ""}`}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
              </div>

              {expandedMethod === method.id && (
                <div className="border-t border-white/10 p-5 bg-[#1A1A2A]">
                  <h4 className="text-sm font-semibold text-white mb-4">Configuración QR</h4>
                  <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1 max-sm:gap-3">
                    <div>
                      <span className="text-[12px] text-[#9CA3B8] block mb-1">Titular</span>
                      <span className="text-sm text-white">{qr?.account_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[12px] text-[#9CA3B8] block mb-1">Banco</span>
                      <span className="text-sm text-white">{qr?.bank_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[12px] text-[#9CA3B8] block mb-1">Cuenta</span>
                      <span className="text-sm text-white">{qr?.account_number || "—"}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-[12px] text-[#9CA3B8] block mb-1">Tipo QR</span>
                    <span className="text-sm text-white capitalize">{qr?.qr_type || "—"}</span>
                  </div>
                  {qr?.qr_image && (
                    <div className="mt-4">
                      <span className="text-[12px] text-[#9CA3B8] block mb-2">Imagen QR</span>
                      <img src={qr.qr_image} alt="QR" className="w-32 h-32 object-contain rounded-xl bg-white/5" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
