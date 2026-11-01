const AUTH_ERROR_TRANSLATIONS: Array<{ match: RegExp; message: string }> = [
  {
    match: /invalid login credentials/i,
    message: "Correo o contraseña incorrectos.",
  },
  {
    match: /email not confirmed/i,
    message: "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
  },
  {
    match: /user already registered|already been registered|email already in use/i,
    message: "Ya existe una cuenta con este correo. Inicia sesión.",
  },
  {
    match: /new password should be different/i,
    message: "La nueva contraseña debe ser diferente a la anterior.",
  },
  {
    match: /auth session missing|session missing/i,
    message: "Tu sesión expiró. Solicita un nuevo enlace.",
  },
  {
    match: /for security purposes, you can only request this once every/i,
    message: "Espera unos segundos antes de solicitar otro enlace.",
  },
  {
    match: /rate limit|over_request|over_email_send_rate|too many requests/i,
    message: "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
  },
  {
    match: /signup_disabled/i,
    message: "El registro está deshabilitado temporalmente.",
  },
  {
    match: /invalid email|unable to validate email/i,
    message: "Ingresa un correo electrónico válido.",
  },
  {
    match: /weak password|password.*too short|password should be at least/i,
    message: "La contraseña es muy débil. Usa al menos 8 caracteres.",
  },
  {
    match: /token has expired or is invalid|invalid token|expired/i,
    message: "El enlace expiró o no es válido. Solicita uno nuevo.",
  },
  {
    match: /user not found/i,
    message: "No encontramos una cuenta con ese correo.",
  },
]

export function translateAuthError(
  message: string | null | undefined,
  fallback = "Ocurrió un error. Intenta de nuevo.",
): string {
  if (!message) return fallback
  for (const { match, message: translated } of AUTH_ERROR_TRANSLATIONS) {
    if (match.test(message)) return translated
  }
  return fallback
}
