export const LIVE_URL_MAX_LENGTH = 2048

export interface LiveUrlInput {
  url: string | null
  error: string | null
}

function normalizeLiveUrl(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function safeParse(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "")
}

function isTikTokHost(hostname: string): boolean {
  return hostname === "tiktok.com" || hostname.endsWith(".tiktok.com")
}

export function parseLiveUrlInput(value: unknown): LiveUrlInput {
  const raw = normalizeLiveUrl(value)
  if (!raw) return { url: null, error: null }

  if (raw.length > LIVE_URL_MAX_LENGTH) {
    return {
      url: null,
      error: `La URL no puede superar los ${LIVE_URL_MAX_LENGTH} caracteres.`,
    }
  }

  if (/\s/.test(raw)) {
    return { url: null, error: "La URL no puede contener espacios." }
  }

  if (!/^https:\/\//i.test(raw)) {
    return {
      url: null,
      error: "La URL debe comenzar con https://.",
    }
  }

  const parsed = safeParse(raw)
  if (!parsed) {
    return {
      url: null,
      error: "Escribe una URL válida que comience con https://.",
    }
  }

  if (parsed.protocol !== "https:") {
    return {
      url: null,
      error: "Solo se permiten enlaces con https://.",
    }
  }

  if (!parsed.hostname) {
    return {
      url: null,
      error: "La URL debe incluir un dominio válido.",
    }
  }

  if (parsed.username || parsed.password) {
    return {
      url: null,
      error: "La URL no puede incluir usuario ni contraseña.",
    }
  }

  return { url: parsed.href, error: null }
}

export function getSafeLiveUrl(value: unknown): string | null {
  const result = parseLiveUrlInput(value)
  return result.error ? null : result.url
}

export function getLivePlatformLabel(
  value: string | null | undefined,
): string {
  if (!value) return "Live"

  const parsed = safeParse(value)
  if (!parsed) return "Live"

  const hostname = normalizeHost(parsed.hostname)

  if (isTikTokHost(hostname)) return "TikTok"
  if (
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtu.be"
  ) {
    return "YouTube"
  }
  if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) {
    return "Instagram"
  }
  if (hostname === "facebook.com" || hostname.endsWith(".facebook.com")) {
    return "Facebook"
  }
  if (hostname === "twitch.tv" || hostname.endsWith(".twitch.tv")) {
    return "Twitch"
  }
  if (hostname === "vimeo.com" || hostname.endsWith(".vimeo.com")) {
    return "Vimeo"
  }

  return "Live"
}

export function getTikTokHandle(
  value: string | null | undefined,
): string | null {
  if (!value) return null

  const parsed = safeParse(value)
  if (!parsed) return null

  const hostname = normalizeHost(parsed.hostname)
  if (!isTikTokHost(hostname)) return null

  const match = parsed.pathname.match(/^\/@([^/]+)/)
  if (!match?.[1]) return null

  try {
    return `@${decodeURIComponent(match[1])}`
  } catch {
    return `@${match[1]}`
  }
}
