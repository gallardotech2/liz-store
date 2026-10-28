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
    return "El servidor no pudo completar la operación y no devolvió el detalle en producción. Inténtalo de nuevo. Si el problema continúa, revisa los logs del servidor con el código de referencia."
  }

  if (lower.includes("body") && (lower.includes("limit") || lower.includes("exceed"))) {
    return "La imagen supera el límite de subida del servidor. Reduce el tamaño de la foto e inténtalo de nuevo."
  }

  if (
    lower.includes("forbidden") ||
    lower.includes("unauthorized") ||
    lower.includes("not authorized") ||
    lower.includes("row-level security") ||
    lower.includes("permission denied")
  ) {
    return "Tu sesión no tiene permisos para realizar esta operación. Vuelve a iniciar sesión como administrador e inténtalo de nuevo."
  }

  if (message) return message

  return "Hubo un error al procesar la solicitud. Vuelve a intentarlo. Si el problema continúa, revisa el código de referencia en los logs del servidor."
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
