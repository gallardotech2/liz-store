"use client"

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

  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault()
        }
      }}
      disabled={pending}
      className="text-[#E74C3C] hover:text-[#c0392b] text-xs bg-transparent border-none cursor-pointer transition-colors disabled:opacity-50"
    >
      {pending ? "Eliminando..." : label}
    </button>
  )
}
