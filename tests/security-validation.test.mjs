import assert from "node:assert/strict"
import test from "node:test"

import {
  isHoneypot,
  parseCartItems,
  parseContact,
  repriceCart,
} from "../lib/whatsapp/validation.ts"

const product = {
  id: 7,
  name: "Blusa",
  price: "150.00",
  discount_price: "120.00",
  stock: 5,
  product_images: [
    { image: "https://x/secundaria.jpg", is_main: false },
    { image: "https://x/principal.jpg", is_main: true },
  ],
}

test("parsea items válidos y normaliza ids numéricos", () => {
  const result = parseCartItems([
    { id: "7", quantity: "2", price: 120 },
    { id: 8, quantity: 1 },
  ])

  assert.equal(result.ok, true)
  assert.deepEqual(result.data, [
    { id: 7, quantity: 2, clientPrice: 120 },
    { id: 8, quantity: 1, clientPrice: undefined },
  ])
})

test("rechaza carrito vacío, duplicado, cantidad inválida y exceso de items", () => {
  assert.equal(parseCartItems([]).code, "EMPTY_CART")
  assert.equal(parseCartItems([{ id: 1, quantity: 1 }, { id: 1, quantity: 2 }]).code, "DUPLICATE_ITEM")
  assert.equal(parseCartItems([{ id: 1, quantity: 0 }]).code, "INVALID_QUANTITY")
  assert.equal(parseCartItems([{ id: 1, quantity: 1.5 }]).code, "INVALID_QUANTITY")
  assert.equal(parseCartItems([{ id: "abc", quantity: 1 }]).code, "INVALID_ITEM")
  assert.equal(parseCartItems(Array.from({ length: 21 }, (_, i) => ({ id: i + 1, quantity: 1 }))).code, "TOO_MANY_ITEMS")
})

test("parsea contacto y normaliza el teléfono", () => {
  const result = parseContact({
    name: "  Ana Pérez  ",
    phone: "+591 712-34567",
    deliveryMethod: "pickup",
    addressText: "Punto 1",
    reference: "",
    notes: "Talla M",
    paymentMethod: "qr",
  })

  assert.equal(result.ok, true)
  assert.equal(result.data.name, "Ana Pérez")
  assert.equal(result.data.phone, "59171234567")
  assert.equal(result.data.deliveryMethod, "pickup")
})

test("rechaza contacto inválido", () => {
  assert.equal(parseContact({ name: "A", phone: "71234567", deliveryMethod: "pickup" }).code, "INVALID_NAME")
  assert.equal(parseContact({ name: "Ana", phone: "abc", deliveryMethod: "pickup" }).code, "INVALID_PHONE")
  assert.equal(parseContact({ name: "Ana", phone: "123", deliveryMethod: "pickup" }).code, "INVALID_PHONE")
  assert.equal(parseContact({ name: "Ana", phone: "71234567", deliveryMethod: "drone" }).code, "INVALID_DELIVERY")
})

test("recalcula precios con la base de datos e ignora los del cliente", () => {
  const result = repriceCart([{ id: 7, quantity: 2, clientPrice: 120 }], [product])

  assert.equal(result.ok, true)
  assert.deepEqual(result.data, {
    items: [
      {
        id: 7,
        name: "Blusa",
        price: 120,
        quantity: 2,
        image: "https://x/principal.jpg",
        subtotal: 240,
      },
    ],
    subtotal: 240,
    total: 240,
  })
})

test("detecta cambio de precio, stock insuficiente y producto no disponible", () => {
  assert.equal(repriceCart([{ id: 7, quantity: 1, clientPrice: 150 }], [product]).code, "PRICE_CHANGED")
  assert.equal(repriceCart([{ id: 7, quantity: 6 }], [product]).code, "OUT_OF_STOCK")
  assert.equal(repriceCart([{ id: 99, quantity: 1 }], [product]).code, "PRODUCT_UNAVAILABLE")
})

test("redondea subtotales a dos decimales", () => {
  const result = repriceCart(
    [{ id: 7, quantity: 3 }],
    [{ ...product, price: "33.333", discount_price: null }],
  )

  assert.equal(result.ok, true)
  assert.equal(result.data.items[0].price, 33.33)
  assert.equal(result.data.subtotal, 99.99)
})

test("detecta el honeypot", () => {
  assert.equal(isHoneypot({ website: "" }), false)
  assert.equal(isHoneypot({ website: "https://spam" }), true)
  assert.equal(isHoneypot(null), false)
})
