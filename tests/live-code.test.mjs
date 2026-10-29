import assert from "node:assert/strict"
import test from "node:test"
import {
  LIVE_CODE_MAX_DIGITS,
  LIVE_CODE_MIN_DIGITS,
  normalizeLiveCode,
  parseLiveCodeInput,
  validateLiveCode,
} from "../lib/live-code.ts"

test("acepta códigos manuales de dos y tres dígitos", () => {
  for (const code of ["01", "02", "11", "23", "40", "99", "100", "999"]) {
    assert.deepEqual(validateLiveCode(code), { code, error: null })
  }
})

test("conserva los ceros iniciales y recorta espacios", () => {
  assert.equal(normalizeLiveCode("  01  "), "01")
  assert.deepEqual(validateLiveCode(" 01 "), { code: "01", error: null })
  assert.equal(validateLiveCode("01").code, "01")
})

test("rechaza códigos vacíos, no numéricos o fuera de formato", () => {
  for (const code of ["", "   ", "1", "0", "A1", "12a", "-1", "1.5", "0011"]) {
    const result = validateLiveCode(code)
    assert.equal(result.code, normalizeLiveCode(code))
    assert.equal(typeof result.error, "string")
  }
})

test("los códigos de 3 dígitos no pueden empezar con cero", () => {
  for (const code of ["001", "023", "099"]) {
    assert.equal(typeof validateLiveCode(code).error, "string")
  }
  assert.equal(validateLiveCode("100").error, null)
})

test("el formato inicial permite crecer sin reasignar códigos", () => {
  assert.equal(LIVE_CODE_MIN_DIGITS, 2)
  assert.equal(LIVE_CODE_MAX_DIGITS, 3)
  assert.equal(validateLiveCode("99").error, null)
  assert.equal(validateLiveCode("100").error, null)
  assert.equal(validateLiveCode("999").error, null)
})

test("parseLiveCodeInput permite vacío para quitar el identificador", () => {
  assert.deepEqual(parseLiveCodeInput(""), { code: null, error: null })
  assert.deepEqual(parseLiveCodeInput("   "), { code: null, error: null })
  assert.deepEqual(parseLiveCodeInput(null), { code: null, error: null })
  assert.deepEqual(parseLiveCodeInput(undefined), { code: null, error: null })
})

test("parseLiveCodeInput valida y conserva ceros iniciales", () => {
  assert.deepEqual(parseLiveCodeInput(" 01 "), { code: "01", error: null })
  assert.deepEqual(parseLiveCodeInput("100"), { code: "100", error: null })

  const invalid = parseLiveCodeInput("1")
  assert.equal(invalid.code, "1")
  assert.equal(typeof invalid.error, "string")
})
