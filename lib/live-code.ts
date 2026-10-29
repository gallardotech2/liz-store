export const LIVE_CODE_MIN_DIGITS = 2
export const LIVE_CODE_MAX_DIGITS = 3

const DIGITS_ONLY = /^\d+$/
const LIVE_CODE_PATTERN = /^(?:\d{2}|[1-9]\d{2})$/

export interface LiveCodeValidation {
  code: string
  error: string | null
}

export function normalizeLiveCode(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function validateLiveCode(value: unknown): LiveCodeValidation {
  const code = normalizeLiveCode(value)

  if (!code) {
    return { code, error: "Escribe un identificador para el producto." }
  }
  if (!DIGITS_ONLY.test(code)) {
    return { code, error: "El identificador solo puede contener números." }
  }
  if (code.length < LIVE_CODE_MIN_DIGITS) {
    return {
      code,
      error: "El identificador debe tener al menos 2 dígitos (por ejemplo, 01).",
    }
  }
  if (code.length > LIVE_CODE_MAX_DIGITS) {
    return {
      code,
      error: "El identificador admite hasta 3 dígitos (por ejemplo, 100).",
    }
  }
  if (!LIVE_CODE_PATTERN.test(code)) {
    return {
      code,
      error: "Los identificadores de 3 dígitos deben estar entre 100 y 999.",
    }
  }

  return { code, error: null }
}

export interface LiveCodeInput {
  code: string | null
  error: string | null
}

export function parseLiveCodeInput(value: unknown): LiveCodeInput {
  const raw = normalizeLiveCode(value)
  if (!raw) return { code: null, error: null }

  const validation = validateLiveCode(raw)
  return { code: validation.code, error: validation.error }
}
