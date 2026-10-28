"use client"

import { useState, useTransition, type FormEvent } from "react"
import { updateHotProductPromo } from "@/app/admin/lives/actions"

function formatPrice(value: number) {
  return `Bs. ${Number(value).toFixed(2)}`
}

export function HotPromoForm({
  liveSessionId,
  productId,
  productName,
  normalPrice,
  initialPromo,
  onSaved,
}: {
  liveSessionId: number
  productId: number
  productName: string
  normalPrice: number
  initialPromo: number | null
  onSaved?: () => void
}) {
  const [value, setValue] = useState(
    initialPromo !== null ? String(initialPromo) : "",
  )
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const maxPromo = Math.max(0, Number(normalPrice) - 0.01).toFixed(2)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending) return
    setError(null)
    setSaved(false)

    const raw = value.trim()
    const promo = raw === "" ? null : Number(raw)

    if (promo !== null) {
      if (!Number.isFinite(promo) || promo < 0) {
        setError("El precio del Modo Live debe ser un número mayor o igual a 0.")
        return
      }
      if (promo >= Number(normalPrice)) {
        setError(
          `El precio del Modo Live (${formatPrice(promo)}) debe ser menor al precio normal ` +
            `(${formatPrice(normalPrice)}) de ${productName}.`,
        )
        return
      }
    }

    const formData = new FormData()
    formData.set("promo_price", raw)

    startTransition(async () => {
      const result = await updateHotProductPromo(
        liveSessionId,
        productId,
        formData,
      )
      if (result.error) {
        setError(result.error)
        return
      }
      setSaved(true)
      onSaved?.()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="number"
          name="promo_price"
          min={0}
          max={maxPromo}
          step="0.01"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
            setSaved(false)
          }}
          placeholder="Precio del Modo Live"
          aria-label="Precio del Modo Live"
          className="w-28 px-2.5 py-1.5 rounded-lg bg-[#1A1D24] border border-white/12 text-white text-xs outline-none focus:border-primary transition-colors"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary text-[11px] font-semibold hover:bg-primary/25 transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>
      {error && (
        <p className="text-[10px] text-[#FF8A80]" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-[10px] text-[#7DDEA0]" role="status">
          Precio del Modo Live guardado
        </p>
      )}
    </form>
  )
}
