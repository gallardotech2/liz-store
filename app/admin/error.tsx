"use client"

import { Button } from "@/components/ui/Button"

function describeError(error: (Error & { digest?: string }) | null | undefined): string {
  const message = error?.message ?? ""
  const lower = message.toLowerCase()

  if (
    lower.includes("minified react error") ||
    lower.includes("server components render") ||
    lower.includes("an error occurred") ||
    lower.includes("server-side exception")
  ) {
    return "El servidor rechazó la operación sin detallar el motivo. Suele deberse a una imagen que supera el límite de subida, un formato no admitido o un fallo al guardar en el almacenamiento. Revisa la imagen e inténtalo de nuevo."
  }

  if (lower.includes("body") && (lower.includes("limit") || lower.includes("exceed"))) {
    return "La imagen supera el límite de subida del servidor. Prueba con una foto más pequeña o con una captura más reducida."
  }

  if (message) return message

  return "Hubo un error al procesar la solicitud. Vuelve a intentarlo. Si estabas subiendo una imagen, prueba con una foto más pequeña o en formato JPG."
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
          {describeError(error)}
        </p>
        {error?.digest && (
          <p className="text-[#6B7280] text-xs m-0 mt-2">Código de referencia: {error.digest}</p>
        )}
      </div>
      <Button type="button" variant="primary" size="sm" onClick={() => reset()}>
        Reintentar
      </Button>
    </div>
  )
}
