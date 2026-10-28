"use client"

import { useRef, useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { scheduleLiveEnd } from "@/app/admin/lives/actions"
import { dateTimeLocalToIso, toDateTimeLocalValue } from "@/lib/datetime"

export function LiveEndScheduler({
  sessionId,
  endsAt,
  onSaved,
  className,
}: {
  sessionId: number
  endsAt: string | null
  onSaved?: () => void
  className?: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function save(nextValue: string | null) {
    if (isPending) return
    const iso = dateTimeLocalToIso(nextValue ?? "")
    if (nextValue && !iso) {
      setError("La fecha de finalización no es válida.")
      return
    }
    if (iso && new Date(iso).getTime() <= Date.now()) {
      setError("La finalización debe ser una fecha futura.")
      return
    }

    setError(null)
    setSaved(false)

    startTransition(async () => {
      try {
        await scheduleLiveEnd(sessionId, iso)
        setSaved(true)
        if (onSaved) onSaved()
        else router.refresh()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo programar la finalización.",
        )
      }
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = inputRef.current?.value ?? ""
    if (!value) {
      save(null)
      return
    }
    save(value)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={className ?? "flex flex-col gap-2"}
    >
      <label className="block">
        <span className="mb-1 block text-[11px] font-medium text-[#9CA3B8]">
          Finalización programada
        </span>
        <input
          key={endsAt ?? "none"}
          ref={(element) => {
            inputRef.current = element
            if (element) {
              element.min = toDateTimeLocalValue(new Date().toISOString())
            }
          }}
          type="datetime-local"
          defaultValue={toDateTimeLocalValue(endsAt)}
          onChange={() => {
            setError(null)
            setSaved(false)
          }}
          className="w-full rounded-xl border border-white/12 bg-[#1A1D24] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-primary"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg border-none bg-primary/15 px-3 py-2 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/25 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar finalización"}
        </button>
        {endsAt && (
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = ""
              save(null)
            }}
            disabled={isPending}
            className="rounded-lg border-none bg-transparent px-2 py-2 text-[11px] font-semibold text-[#9CA3B8] transition-colors hover:text-white disabled:opacity-50"
          >
            Quitar programación
          </button>
        )}
      </div>
      <p className="text-[10px] text-[#6B7280]">
        La tienda volverá a la normalidad al cumplirse esta fecha.
      </p>
      {error && (
        <p className="text-[10px] text-[#FF8A80]" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-[10px] text-[#7DDEA0]" role="status">
          Finalización actualizada
        </p>
      )}
    </form>
  )
}
