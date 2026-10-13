"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"

interface ProfileFormProps {
  userId: string
  email: string
  nombre: string
  phone: string
}

export function ProfileForm({ userId, nombre, phone }: ProfileFormProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(nombre)
  const [displayPhone, setDisplayPhone] = useState(phone)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch("/api/perfil/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, nombre: displayName.trim(), phone: displayPhone.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al actualizar")
        return
      }

      setDisplayName(displayName.trim())
      setDisplayPhone(displayPhone.trim())
      setMessage("Datos actualizados correctamente")
      setEditing(false)
      router.refresh()
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <div>
        <h2 className="text-lg font-serif text-[#2D2D2D] dark:text-ink-strong mb-6">Datos del usuario</h2>
        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-xl bg-[#FDF8F6] dark:bg-surface border border-[#EEE] dark:border-line">
            <span className="text-[12px] text-[#6B6B6B] dark:text-ink-soft block mb-1">Nombre</span>
            <span className="text-[15px] font-medium text-[#2D2D2D] dark:text-ink-strong">{displayName || "—"}</span>
          </div>
          <div className="p-4 rounded-xl bg-[#FDF8F6] dark:bg-surface border border-[#EEE] dark:border-line">
            <span className="text-[12px] text-[#6B6B6B] dark:text-ink-soft block mb-1">Teléfono</span>
            <span className="text-[15px] font-medium text-[#2D2D2D] dark:text-ink-strong">{displayPhone || "—"}</span>
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={() => setEditing(true)}
        >
          Editar perfil
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-serif text-[#2D2D2D] dark:text-ink-strong">Editar datos</h2>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm text-[#6B6B6B] dark:text-ink-soft bg-transparent border-none cursor-pointer hover:text-[#2D2D2D] dark:hover:text-ink-strong transition-colors"
        >
          Cancelar
        </button>
      </div>

      <div>
        <label htmlFor="nombre" className="block text-[14px] font-semibold text-[#2D2D2D] dark:text-ink-strong mb-1.5">
          Nombre
        </label>
        <input
          type="text"
          id="nombre"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="w-full px-4 py-3 border border-[#DDD] dark:border-line rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,142,159,0.1)]"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-[14px] font-semibold text-[#2D2D2D] dark:text-ink-strong mb-1.5">
          Teléfono
        </label>
        <input
          type="tel"
          id="phone"
          value={displayPhone}
          onChange={(e) => setDisplayPhone(e.target.value)}
          placeholder="Ej: 76426643"
          className="w-full px-4 py-3 border border-[#DDD] dark:border-line rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,142,159,0.1)]"
        />
      </div>

      {error && (
        <div className="p-3 rounded-[8px] bg-[#FFF0F0] dark:bg-[#2A1618] border border-[#FFD0D0] dark:border-[#4A2A2C] text-[#E74C3C] dark:text-[#FF8A80] text-[13px]">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3 rounded-[8px] bg-[#EAF7EE] dark:bg-[#16241A] border border-[#BEE5C8] dark:border-[#274431] text-[#2E7D46] dark:text-[#81C784] text-[13px]">
          {message}
        </div>
      )}

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  )
}
