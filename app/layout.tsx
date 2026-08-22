import type { Metadata, Viewport } from "next"
import { Playfair_Display, Inter, Great_Vibes, Cinzel } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { CookieConsent } from "@/components/ui/CookieConsent"
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
  themeColor: "#ff8e9f",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    template: "%s | Liz Store",
    default: "Liz Store — Bisutería y Accesorios Elegantes",
  },
  description: "Tienda boliviana de bisutería y accesorios elegantes. Moneda: Bolivianos (Bs). Pago seguro y confiable.",
  keywords: ["bisutería", "accesorios", "joyería", "Bolivia", "Liz Store"],
  openGraph: {
    type: "website",
    locale: "es_BO",
    siteName: "Liz Store",
    title: "Liz Store — Bisutería y Accesorios Elegantes",
    description: "Tienda boliviana de bisutería y accesorios elegantes. Pago seguro y confiable.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Liz Store — Bisutería y Accesorios Elegantes",
      },
    ],
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
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  )
}
