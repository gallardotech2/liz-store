import assert from "node:assert/strict"
import test from "node:test"
import { parseWhatsAppNumber } from "../lib/whatsapp.ts"

test("extrae el número de enlaces de WhatsApp", () => {
  assert.equal(
    parseWhatsAppNumber("https://wa.me/59171234567"),
    "59171234567",
  )
  assert.equal(
    parseWhatsAppNumber("https://wa.me/59171234567?text=Hola"),
    "59171234567",
  )
  assert.equal(
    parseWhatsAppNumber(
      "https://api.whatsapp.com/send?phone=59171234567&text=Hola",
    ),
    "59171234567",
  )
})

test("normaliza números locales y con separadores", () => {
  assert.equal(parseWhatsAppNumber("https://wa.me/71234567"), "59171234567")
  assert.equal(parseWhatsAppNumber("071234567"), "59171234567")
  assert.equal(parseWhatsAppNumber("+591 712-34567"), "59171234567")
  assert.equal(parseWhatsAppNumber("0059171234567"), "59171234567")
})

test("rechaza configuraciones ausentes o no válidas", () => {
  assert.equal(parseWhatsAppNumber(""), "")
  assert.equal(parseWhatsAppNumber("   "), "")
  assert.equal(parseWhatsAppNumber("https://wa.me/message/ABC"), "")
  assert.equal(parseWhatsAppNumber("https://wa.me/123"), "")
  assert.equal(parseWhatsAppNumber("https://example.com/59171234567"), "")
  assert.equal(parseWhatsAppNumber("https://wa.me/591712345678901234"), "")
})
