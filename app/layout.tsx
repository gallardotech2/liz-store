import type { Metadata, Viewport } from "next"
import { Playfair_Display, Inter, Great_Vibes, Cinzel } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { CookieConsent } from "@/components/ui/CookieConsent"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://lizstore.site"),
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
  },
  robots: {
    index: true,
    follow: true,
  },
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme')||'system';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='dark'||(t==='system'&&m);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${inter.variable} ${greatVibes.variable} ${cinzel.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-[#FDF8F6] dark:bg-page text-[#4A4A4A] dark:text-ink font-sans overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  )
}
