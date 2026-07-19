import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Registro",
  description: "Crea tu cuenta en Liz Store y comienza a comprar.",
}

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
