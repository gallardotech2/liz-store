"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { startLiveMode } from "@/app/admin/lives/actions"
import { dateTimeLocalToIso, toDateTimeLocalValue } from "@/lib/datetime"

export function LiveModeStartForm({
  sessionId,
  productCount,
  className,
}: {
  sessionId: number
  productCount: number
  className?: string
}) {
  const router = useRouter()
  const [endsAt, setEndsAt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending) return

    const iso = dateTimeLocalToIso(endsAt)
    if (endsAt && !iso) {
      setError("La fecha de finalización no es válida.")
      return
    }
    if (iso && new Date(iso).getTime() <= Date.now()) {
      setError("La finalización debe ser una fecha futura.")
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        await startLiveMode(sessionId, iso)
        router.refresh()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo iniciar el Modo Live.",
        )
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={className ?? "flex flex-col gap-3"}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-[#9CA3B8]">
            Finalización programada (opcional)
          </span>
          <input
            type="datetime-local"
            value={endsAt}
            ref={(element) => {
              if (element) {
                element.min = toDateTimeLocalValue(new Date().toISOString())
              }
            }}
            onChange={(event) => {
              setEndsAt(event.target.value)
              setError(null)
            }}
            className="w-full rounded-xl border border-white/12 bg-[#2A2D35] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-primary"
          />
        </label>
        <button
          type="submit"
          disabled={isPending || productCount === 0}
          className="self-end rounded-xl border-none bg-[#27AE60] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#27AE60]/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Iniciando..." : "Iniciar Modo Live"}
        </button>
      </div>
      <p className="text-[11px] text-[#9CA3B8]">
        {productCount === 0
          ? "Agrega al menos un producto antes de iniciar."
          : "Déjala vacía para un Live sin límite de tiempo."}
      </p>
      {error && (
        <p className="text-[11px] text-[#FF8A80]" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
