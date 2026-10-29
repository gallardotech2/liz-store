"use client"

import { useState, useTransition, type FormEvent } from "react"
import { updateProductLiveCode } from "@/app/admin/lives/actions"
import { parseLiveCodeInput } from "@/lib/live-code"

export function LiveProductCodeForm({
  liveSessionId,
  productId,
  productName,
  initialCode,
  disabled = false,
  onSaved,
}: {
  liveSessionId: number
  productId: number
  productName: string
  initialCode: string | null
  disabled?: boolean
  onSaved?: (code: string | null) => void
}) {
  const [value, setValue] = useState(initialCode ?? "")
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending || disabled) return

    setError(null)
    setFeedback(null)

    const input = parseLiveCodeInput(value)
    if (input.error) {
      setError(input.error)
      return
    }

    if (input.code === null && (initialCode ?? "") !== "") {
      if (!window.confirm("¿Quitar el identificador de este producto?")) {
        return
      }
    }

    const formData = new FormData()
    formData.set("live_code", input.code ?? "")

    startTransition(async () => {
      const result = await updateProductLiveCode(
        liveSessionId,
        productId,
        formData,
      )
      if (result.error) {
        setError(result.error)
        return
      }

      const savedCode = result.code ?? null
      setValue(savedCode ?? "")
      setFeedback(
        savedCode
          ? `Identificador ${savedCode} guardado.`
          : "Identificador quitado.",
      )
      onSaved?.(savedCode)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={`live-code-${productId}`}
          className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9CA3B8]"
        >
          Identificador
        </label>
        <input
          id={`live-code-${productId}`}
          name="live_code"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
            setFeedback(null)
          }}
          placeholder="Ej. 01"
          aria-label={`Identificador de ${productName}`}
          disabled={disabled}
          className="w-20 rounded-lg border border-white/12 bg-[#1A1D24] px-2.5 py-1.5 text-center font-mono text-sm tracking-[2px] text-white outline-none transition-colors placeholder:font-sans placeholder:tracking-normal placeholder:text-[#6B7280] focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || disabled}
          className="rounded-lg border-none bg-primary/15 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>
      <p className="text-[10px] text-[#6B7280]">
        2 dígitos (01–99); al superar 99 productos se admiten 3 dígitos
        (100–999). Deja vacío para quitar el identificador.
      </p>
      {error && (
        <p className="text-[10px] text-[#FF8A80]" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <p className="text-[10px] text-[#7DDEA0]" role="status">
          {feedback}
        </p>
      )}
    </form>
  )
}
