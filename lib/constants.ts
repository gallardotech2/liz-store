export const SITE_NAME = "Liz Store"
export const SITE_DESCRIPTION =
  "Tienda boliviana de bisutería y accesorios elegantes"
export const SITE_CURRENCY = "Bs."
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "591XXXXXXXXX"
export const SHIPPING_COST = 15
export const REVALIDATE_TIME = parseInt(process.env.NEXT_PUBLIC_REVALIDATE || "3600", 10)

export const PICKUP_LOCATIONS = [
  { name: "Centro", address: "Calle Bolívar #123" },
  { name: "Zona Sur", address: "Av. Roma #456" },
  { name: "Norte", address: "Av. Busch #789" },
] as const

export const CATEGORY_COLORS: Record<string, string> = {
  collares: "#d4a574",
  anillos: "#c0a080",
  aretes: "#e8c8a0",
  pulseras: "#b8956a",
  relojes: "#8a7050",
  accesorios: "#a08868",
}
