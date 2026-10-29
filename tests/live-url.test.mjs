import assert from "node:assert/strict"
import test from "node:test"
import {
  LIVE_URL_MAX_LENGTH,
  getLivePlatformLabel,
  getSafeLiveUrl,
  getTikTokHandle,
  parseLiveUrlInput,
} from "../lib/live-url.ts"

test("acepta URLs https válidas y las normaliza", () => {
  assert.deepEqual(parseLiveUrlInput("https://www.tiktok.com/@lizstore_26/live"), {
    url: "https://www.tiktok.com/@lizstore_26/live",
    error: null,
  })
  assert.deepEqual(
    parseLiveUrlInput("  https://www.youtube.com/watch?v=abc123  "),
    {
      url: "https://www.youtube.com/watch?v=abc123",
      error: null,
    },
  )
  assert.equal(
    parseLiveUrlInput("HTTPS://WWW.TIKTOK.COM/@lizstore_26/live").error,
    null,
  )
})

test("permite vacío para quitar la URL", () => {
  assert.deepEqual(parseLiveUrlInput(""), { url: null, error: null })
  assert.deepEqual(parseLiveUrlInput("   "), { url: null, error: null })
  assert.deepEqual(parseLiveUrlInput(null), { url: null, error: null })
  assert.deepEqual(parseLiveUrlInput(undefined), { url: null, error: null })
})

test("rechaza URLs que no empiezan con https", () => {
  for (const value of [
    "http://www.tiktok.com/@lizstore_26/live",
    "ftp://example.com",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "www.tiktok.com/@lizstore_26/live",
  ]) {
    const result = parseLiveUrlInput(value)
    assert.equal(result.url, null)
    assert.equal(typeof result.error, "string")
  }
})

test("rechaza URLs mal formadas, con espacios o credenciales", () => {
  for (const value of [
    "https://",
    "https://exa mple.com",
    "https://user:password@example.com/live",
  ]) {
    const result = parseLiveUrlInput(value)
    assert.equal(result.url, null)
    assert.equal(typeof result.error, "string")
  }
})

test("rechaza URLs demasiado largas", () => {
  const value = `https://example.com/${"a".repeat(LIVE_URL_MAX_LENGTH)}`
  const result = parseLiveUrlInput(value)
  assert.equal(result.url, null)
  assert.equal(typeof result.error, "string")
})

test("getSafeLiveUrl ignora valores inválidos", () => {
  assert.equal(getSafeLiveUrl("http://example.com"), null)
  assert.equal(getSafeLiveUrl("javascript:alert(1)"), null)
  assert.equal(getSafeLiveUrl(""), null)
  assert.equal(
    getSafeLiveUrl("https://www.tiktok.com/@lizstore_26/live"),
    "https://www.tiktok.com/@lizstore_26/live",
  )
})

test("extrae el handle de TikTok cuando existe", () => {
  assert.equal(
    getTikTokHandle("https://www.tiktok.com/@lizstore_26/live"),
    "@lizstore_26",
  )
  assert.equal(
    getTikTokHandle("https://www.tiktok.com/@liz%20store/live"),
    "@liz store",
  )
  assert.equal(getTikTokHandle("https://vm.tiktok.com/ZMabc123"), null)
  assert.equal(getTikTokHandle("https://www.youtube.com/@lizstore"), null)
  assert.equal(getTikTokHandle("no-es-una-url"), null)
})

test("identifica la plataforma por el host", () => {
  assert.equal(
    getLivePlatformLabel("https://www.tiktok.com/@lizstore_26/live"),
    "TikTok",
  )
  assert.equal(
    getLivePlatformLabel("https://youtu.be/abc123"),
    "YouTube",
  )
  assert.equal(
    getLivePlatformLabel("https://www.instagram.com/lizstore/live"),
    "Instagram",
  )
  assert.equal(
    getLivePlatformLabel("https://www.facebook.com/lizstore/live"),
    "Facebook",
  )
  assert.equal(getLivePlatformLabel("https://example.com/live"), "Live")
  assert.equal(getLivePlatformLabel(null), "Live")
})
