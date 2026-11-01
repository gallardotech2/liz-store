import assert from "node:assert/strict"
import test from "node:test"

process.env.NEXT_PUBLIC_SUPABASE_URL = ""
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ""

const { checkRateLimit, getClientIp } = await import("../lib/rate-limit.ts")

test("limita por ventana en memoria y libera al expirar", async () => {
  const key = `test:${Date.now()}:${Math.random()}`

  const first = await checkRateLimit(key, 2, 1)
  const second = await checkRateLimit(key, 2, 1)
  const third = await checkRateLimit(key, 2, 1)

  assert.equal(first.allowed, true)
  assert.equal(second.allowed, true)
  assert.equal(third.allowed, false)
  assert.equal(third.remaining, 0)

  await new Promise((resolve) => setTimeout(resolve, 1100))

  const afterWindow = await checkRateLimit(key, 2, 1)
  assert.equal(afterWindow.allowed, true)
})

test("obtiene la IP desde los encabezados del proxy", () => {
  assert.equal(
    getClientIp(new Request("https://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } })),
    "1.2.3.4",
  )
  assert.equal(
    getClientIp(new Request("https://x", { headers: { "cf-connecting-ip": "9.9.9.9" } })),
    "9.9.9.9",
  )
  assert.equal(getClientIp(new Request("https://x")), "unknown")
})
