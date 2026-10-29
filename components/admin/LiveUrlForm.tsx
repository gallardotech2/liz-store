"use client"

import { useState, useTransition, type FormEvent } from "react"
import { updateLiveModeUrl } from "@/app/admin/lives/actions"
import {
  LIVE_URL_MAX_LENGTH,
  getLivePlatformLabel,
  getSafeLiveUrl,
  getTikTokHandle,
  parseLiveUrlInput,
} from "@/lib/live-url"

export function LiveUrlForm({
  liveSessionId,
  initialUrl,
  onSaved,
}: {
  liveSessionId: number
  initialUrl: string | null
  onSaved?: (url: string | null) => void
}) {
  const [value, setValue] = useState(initialUrl ?? "")
  const [savedUrl, setSavedUrl] = useState<string | null>(initialUrl)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const previewUrl = getSafeLiveUrl(value)
  const platform = previewUrl ? getLivePlatformLabel(previewUrl) : null
  const platformLabel =
    platform && platform !== "Live" ? platform : "la plataforma"
  const handle = getTikTokHandle(previewUrl)

  function submit(url: string | null) {
    const formData = new FormData()
    formData.set("live_url", url ?? "")

    startTransition(async () => {
      const result = await updateLiveModeUrl(liveSessionId, formData)
      if (result.error) {
        setError(result.error)
        return
      }

      const nextUrl = result.url ?? null
      setSavedUrl(nextUrl)
      setValue(nextUrl ?? "")
      setError(null)
      setFeedback(
        nextUrl ? "URL del Live guardada." : "URL del Live quitada.",
      )
      onSaved?.(nextUrl)
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending) return

    setError(null)
    setFeedback(null)

    const input = parseLiveUrlInput(value)
    if (input.error) {
      setError(input.error)
      return
    }

    if (!input.url && savedUrl) {
      if (!window.confirm("¿Quitar la URL del Live?")) return
    }

    submit(input.url)
  }

  function handleClear() {
    if (isPending || !savedUrl) return
    if (!window.confirm("¿Quitar la URL del Live?")) return

    setError(null)
    setFeedback(null)
    submit(null)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <label
        htmlFor="live-url-input"
        className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9CA3B8]"
      >
        URL de la transmisión
      </label>
      <input
        id="live-url-input"
        name="live_url"
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        maxLength={LIVE_URL_MAX_LENGTH}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setError(null)
          setFeedback(null)
        }}
        placeholder="https://www.tiktok.com/@usuario/live"
        className="w-full rounded-lg border border-white/12 bg-[#1A1D24] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-[#6B7280] focus:border-primary"
      />

      {previewUrl ? (
        <p className="text-[10px] leading-[1.5] text-[#7DDEA0]">
          Se abrirá en {platformLabel}
          {handle ? ` · ${handle}` : ""}. No se reproduce aquí.
        </p>
      ) : value.trim() ? (
        <p className="text-[10px] leading-[1.5] text-[#C9A96E]">
          Debe ser una URL válida que comience con https://.
        </p>
      ) : (
        <p className="text-[10px] leading-[1.5] text-[#6B7280]">
          Solo se usa para el botón «Abrir Live» de la tienda.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg border-none bg-primary/15 px-3 py-2 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar URL"}
        </button>
        {savedUrl && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isPending}
            className="rounded-lg border-none bg-[#E74C3C]/10 px-3 py-2 text-[11px] font-semibold text-[#E74C3C] transition-colors hover:bg-[#E74C3C]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Quitar URL
          </button>
        )}
      </div>

      {error && (
        <p className="text-[10px] leading-[1.5] text-[#FF8A80]" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <p className="text-[10px] leading-[1.5] text-[#7DDEA0]" role="status">
          {feedback}
        </p>
      )}
    </form>
  )
}
