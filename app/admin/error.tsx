"use client"

import { Button } from "@/components/ui/Button"

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-primary text-2xl">!</span>
      </div>
      <div>
        <h1 className="text-white text-lg font-bold m-0">Hubo un error al procesar la solicitud</h1>
        <p className="text-[#9CA3B8] text-sm m-0 mt-1 max-w-md">
          Vuelve a intentarlo. Si estabas subiendo una imagen, prueba con una foto más pequeña o en
          formato JPG.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" onClick={() => reset()}>
        Reintentar
      </Button>
    </div>
  )
}