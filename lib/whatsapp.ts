const WHATSAPP_HOSTS = new Set(["wa.me", "api.whatsapp.com"])

export function parseWhatsAppNumber(value: string): string {
  const raw = value.trim()
  if (!raw) return ""

  let candidate = raw
  if (/^[a-z][a-z\d+.-]*:/i.test(raw)) {
    let url: URL
    try {
      url = new URL(raw)
    } catch {
      return ""
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, "")
    if (!WHATSAPP_HOSTS.has(host)) return ""
    candidate = url.searchParams.get("phone") ?? url.pathname
  }

  let digits = candidate.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.length === 8) digits = `591${digits}`
  else if (digits.length === 9 && digits.startsWith("0")) {
    digits = `591${digits.slice(1)}`
  }

  return /^\d{10,15}$/.test(digits) ? digits : ""
}
