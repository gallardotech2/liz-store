"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"

export function DeleteButton({
  action,
  label = "Eliminar",
  confirmMessage = "¿Eliminar?",
}: {
  action: () => void
  label?: string
  confirmMessage?: string
}) {
  const { pending } = useFormStatus()
  const [open, setOpen] = useState(false)

  if (open) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-[11px] text-[#ABB2BF] hidden sm:inline">{confirmMessage}</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="text-[#ABB2BF] hover:text-white text-xs bg-transparent border-none cursor-pointer transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="text-[#E74C3C] hover:text-[#c0392b] text-xs bg-transparent border-none cursor-pointer transition-colors font-semibold disabled:opacity-50"
        >
          {pending ? "Eliminando..." : "Confirmar"}
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      disabled={pending}
      className="text-[#E74C3C] hover:text-[#c0392b] text-xs bg-transparent border-none cursor-pointer transition-colors disabled:opacity-50"
    >
      {pending ? "Eliminando..." : label}
    </button>
  )
}
