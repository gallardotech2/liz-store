import type { Metadata, Viewport } from "next"
import { Playfair_Display, Inter, Great_Vibes, Cinzel } from "next/font/google"
import "./globals.css"

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
})

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: "#B76E79",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    template: "%s | Liz Store",
    default: "Liz Store — Bisutería y Accesorios Elegantes",
  },
  description: "Tienda boliviana de bisutería y accesorios elegantes. Moneda: Bolivianos (Bs). Pago seguro con Escudo Pago.",
  keywords: ["bisutería", "accesorios", "joyería", "Bolivia", "Escudo Pago", "Liz Store"],
  openGraph: {
    type: "website",
    locale: "es_BO",
    siteName: "Liz Store",
    title: "Liz Store — Bisutería y Accesorios Elegantes",
    description: "Tienda boliviana de bisutería y accesorios elegantes. Pago seguro con Escudo Pago.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${inter.variable} ${greatVibes.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FDF8F6] text-[#4A4A4A] font-sans overflow-x-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
