import assert from "node:assert/strict"
import test from "node:test"

import { verifyTurnstile } from "../lib/security/turnstile.ts"

test("modo off permite pasar sin token", async () => {
  const original = process.env.TURNSTILE_MODE
  process.env.TURNSTILE_MODE = "off"

  try {
    const result = await verifyTurnstile(undefined, "127.0.0.1", "login")
    assert.equal(result.ok, true)
    assert.equal(result.skipped, true)
  } finally {
    if (original === undefined) delete process.env.TURNSTILE_MODE
    else process.env.TURNSTILE_MODE = original
  }
})

test("modo log permite pasar sin token", async () => {
  const original = process.env.TURNSTILE_MODE
  process.env.TURNSTILE_MODE = "log"

  try {
    const result = await verifyTurnstile("", "127.0.0.1", "login")
    assert.equal(result.ok, true)
    assert.equal(result.skipped, true)
  } finally {
    if (original === undefined) delete process.env.TURNSTILE_MODE
    else process.env.TURNSTILE_MODE = original
  }
})

test("modo enforce sin secreto rechaza", async () => {
  const originalMode = process.env.TURNSTILE_MODE
  const originalSecret = process.env.TURNSTILE_SECRET_KEY
  process.env.TURNSTILE_MODE = "enforce"
  delete process.env.TURNSTILE_SECRET_KEY

  try {
    const result = await verifyTurnstile("token", "127.0.0.1", "login")
    assert.equal(result.ok, false)
    assert.equal(result.error, "turnstile_not_configured")
  } finally {
    if (originalMode === undefined) delete process.env.TURNSTILE_MODE
    else process.env.TURNSTILE_MODE = originalMode
    if (originalSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY
    else process.env.TURNSTILE_SECRET_KEY = originalSecret
  }
})

test("modo enforce exige token", async () => {
  const originalMode = process.env.TURNSTILE_MODE
  const originalSecret = process.env.TURNSTILE_SECRET_KEY
  process.env.TURNSTILE_MODE = "enforce"
  process.env.TURNSTILE_SECRET_KEY = "test-secret"

  try {
    const result = await verifyTurnstile("", "127.0.0.1", "login")
    assert.equal(result.ok, false)
    assert.equal(result.error, "missing_token")
  } finally {
    if (originalMode === undefined) delete process.env.TURNSTILE_MODE
    else process.env.TURNSTILE_MODE = originalMode
    if (originalSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY
    else process.env.TURNSTILE_SECRET_KEY = originalSecret
  }
})
