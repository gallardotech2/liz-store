"use client"

import { Button } from "@/components/ui/Button"

function toSpanishMessage(message?: string): string {
  if (!message) {
    return "Vuelve a intentarlo. Si estabas subiendo una imagen, prueba con otra foto."
  }

  const lower = message.toLowerCase()

  if (
    lower.includes("failed to fetch") ||
    lower.includes("load failed") ||
    lower.includes("networkerror") ||
    lower.includes("network error")
  ) {
    return "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."
  }
  if (lower.includes("failed to find server action") || lower.includes("older or newer deployment")) {
    return "La página estaba desactualizada. Recarga la página e inténtalo de nuevo."
  }
  if (
    lower.includes("an error occurred") ||
    lower.includes("server components render") ||
    lower.includes("server-side exception")
  ) {
    return "Hubo un error en el servidor. Vuelve a intentarlo en unos segundos."
  }
  if (lower.includes("payload too large") || lower.includes("function_payload_too_large")) {
    return "La imagen es demasiado grande para enviarla. Vuelve a seleccionarla e inténtalo de nuevo."
  }

  return message
}

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-primary text-2xl">!</span>
      </div>
      <div>
        <h1 className="text-white text-lg font-bold m-0">Hubo un error al procesar la solicitud</h1>
        <p className="text-[#9CA3B8] text-sm m-0 mt-1 max-w-md">
          {toSpanishMessage(error?.message)}
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" onClick={() => reset()}>
        Reintentar
      </Button>
    </div>
  )
}
