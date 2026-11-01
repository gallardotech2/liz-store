import assert from "node:assert/strict"
import test from "node:test"

process.env.CART_HMAC_SECRET = "test-secret-with-more-than-32-characters-123456"

const cartModule = await import("../lib/cart.ts")
const { parseCart, signCartData, calculateCartTotal } = cartModule

const cart = {
  "1": { id: "1", name: "Blusa", price: 150, quantity: 2, image: "https://x/1.jpg", slug: "blusa" },
  "2": { id: "2", name: "Falda", price: 200, quantity: 1, image: "", slug: "falda" },
}

test("firma y verifica el carrito con HMAC", () => {
  const signed = signCartData(cart)
  assert.match(signed, /^v1\.[A-Za-z0-9_-]+\.[0-9a-f]{64}$/)
  assert.deepEqual(parseCart(signed), cart)
})

test("rechaza un payload manipulado", () => {
  const signed = signCartData(cart)
  const parts = signed.split(".")
  const tamperedPayload = Buffer.from(
    JSON.stringify({ ...cart, "1": { ...cart["1"], price: 1 } }),
  ).toString("base64url")

  assert.deepEqual(parseCart(`${parts[0]}.${tamperedPayload}.${parts[2]}`), {})
})

test("rechaza una firma inválida", () => {
  const signed = signCartData(cart)
  const parts = signed.split(".")
  assert.deepEqual(parseCart(`${parts[0]}.${parts[1]}.${"0".repeat(64)}`), {})
})

test("rechaza formatos legacy sin firma", () => {
  assert.deepEqual(parseCart(JSON.stringify(cart)), {})
  assert.deepEqual(parseCart(`v1.${Buffer.from(JSON.stringify(cart)).toString("base64url")}`), {})
  assert.deepEqual(parseCart(`${JSON.stringify(cart)}|abc`), {})
})

test("sin secreto no se puede firmar y no se acepta nada", () => {
  const original = process.env.CART_HMAC_SECRET
  const signed = signCartData(cart)
  delete process.env.CART_HMAC_SECRET

  try {
    assert.throws(() => signCartData(cart), /CART_HMAC_SECRET/)
    assert.deepEqual(parseCart(signed), {})
  } finally {
    if (original === undefined) delete process.env.CART_HMAC_SECRET
    else process.env.CART_HMAC_SECRET = original
  }
})

test("sanea cantidades y precios inválidos dentro de la cookie", () => {
  const evil = {
    "1": { id: "1", name: "Ok", price: 10, quantity: 2, image: "", slug: "ok" },
    "2": { id: "2", name: "Mala cantidad", price: 10, quantity: 0, image: "", slug: "x" },
    "3": { id: "3", name: "Precio malo", price: "gratis", quantity: 1, image: "", slug: "y" },
    "4": { id: "4", name: "Cantidad decimal", price: 10, quantity: 1.5, image: "", slug: "z" },
  }

  assert.deepEqual(parseCart(signCartData(evil)), {
    "1": evil["1"],
  })
})

test("calcula subtotal, envío y total del carrito", () => {
  const summary = calculateCartTotal(cart)
  assert.equal(summary.subtotal, 500)
  assert.equal(summary.shipping, 89)
  assert.equal(summary.total, 589)
  assert.equal(summary.itemCount, 3)
  assert.equal(summary.freeShippingRemaining, 99)
})
