"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateHotProductStatus } from "@/app/admin/lives/actions"
import type { LiveProductStatus } from "@/types/database"

export function LiveProductStatusSelect({
  sessionId,
  productId,
  status,
}: {
  sessionId: number
  productId: number
  status: LiveProductStatus
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <span className="inline-flex flex-col gap-0.5">
      <select
        key={status}
        defaultValue={status}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value as LiveProductStatus
          const select = event.currentTarget
          setError(null)
          startTransition(async () => {
            try {
              await updateHotProductStatus(sessionId, productId, next)
              router.refresh()
            } catch (err) {
              select.value = status
              setError(
                err instanceof Error
                  ? err.message
                  : "No se pudo cambiar el estado.",
              )
            }
          })
        }}
        aria-label="Estado comercial"
        className="rounded-lg border border-white/12 bg-[#1A1D24] px-2 py-1 text-[11px] text-white outline-none transition-colors focus:border-primary disabled:opacity-50"
      >
        <option value="available">Disponible</option>
        <option value="requested">Solicitado</option>
        <option value="reserved">Reservado</option>
        <option value="sold">Vendido</option>
      </select>
      {error && (
        <span className="max-w-[180px] text-[9px] text-[#FF8A80]">{error}</span>
      )}
    </span>
  )
}
