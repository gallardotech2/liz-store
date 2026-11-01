type TurnstileMode = "off" | "log" | "enforce"

export interface TurnstileVerification {
  ok: boolean
  skipped?: boolean
  error?: string
}

function getMode(): TurnstileMode {
  const configured = process.env.TURNSTILE_MODE
  if (configured === "off" || configured === "log" || configured === "enforce") {
    return configured
  }
  return process.env.NODE_ENV === "production" ? "enforce" : "off"
}

function logFailure(reason: string, details?: unknown) {
  console.warn("[turnstile]", reason, details ?? "")
}

export async function verifyTurnstile(
  token: unknown,
  remoteIp: string,
  expectedAction?: string,
): Promise<TurnstileVerification> {
  const mode = getMode()
  if (mode === "off") return { ok: true, skipped: true }

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    const reason = "TURNSTILE_SECRET_KEY no configurado"
    if (mode === "log") {
      logFailure(reason)
      return { ok: true, skipped: true }
    }
    return { ok: false, error: "turnstile_not_configured" }
  }

  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    if (mode === "log") {
      logFailure("token ausente")
      return { ok: true, skipped: true }
    }
    return { ok: false, error: "missing_token" }
  }

  const form = new URLSearchParams({
    secret,
    response: token,
  })
  if (remoteIp && remoteIp !== "unknown") {
    form.set("remoteip", remoteIp)
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(5000),
      },
    )

    const data = (await response.json()) as {
      success?: boolean
      action?: string
      hostname?: string
      "error-codes"?: string[]
    }

    if (!data.success) {
      if (mode === "log") {
        logFailure("verificación fallida", data["error-codes"])
        return { ok: true, skipped: true }
      }
      return { ok: false, error: "invalid_token" }
    }

    if (expectedAction && data.action !== expectedAction) {
      if (mode === "log") {
        logFailure("action inesperada", data.action)
        return { ok: true, skipped: true }
      }
      return { ok: false, error: "invalid_action" }
    }

    const expectedHostname = process.env.TURNSTILE_EXPECTED_HOSTNAME
    if (expectedHostname && data.hostname !== expectedHostname) {
      if (mode === "log") {
        logFailure("hostname inesperado", data.hostname)
        return { ok: true, skipped: true }
      }
      return { ok: false, error: "invalid_hostname" }
    }

    return { ok: true }
  } catch (error) {
    if (mode === "log") {
      logFailure("error de red", error)
      return { ok: true, skipped: true }
    }
    return { ok: false, error: "verification_failed" }
  }
}
