import assert from "node:assert/strict"
import test from "node:test"
import {
  buildProductsWorkbook,
  getExportFilename,
  resolveExportPricing,
} from "../lib/products-export.ts"

function product(overrides = {}) {
  const id = overrides.id ?? 1

  return {
    id,
    name: "Vestido de prueba",
    slug: `vestido-de-prueba-${id}`,
    sku: `SKU-${id}`,
    live_code: "01",
    category_id: 2,
    price: 100,
    discount_price: 80,
    live_price: 70,
    stock: 5,
    short_description: "Descripción corta",
    long_description: "Descripción larga que no debe perderse en la exportación.",
    specifications: { talla: "M", colores: ["Rojo", "Azul"] },
    is_active: true,
    is_featured: false,
    is_new: true,
    is_offer: false,
    rating: 4.5,
    rating_count: 10,
    sales_count: 3,
    meta_description: "Meta descripción",
    meta_keywords: "vestido, prueba",
    created_at: "2026-10-29T12:00:00.000Z",
    updated_at: "2026-10-29T12:00:00.000Z",
    category_name: "Vestidos",
    images: [
      {
        id: 1,
        product_id: id,
        image: "https://example.com/principal.jpg",
        alt_text: "Principal",
        is_main: true,
        order: 0,
        created_at: "2026-10-29T12:00:00.000Z",
      },
      {
        id: 2,
        product_id: id,
        image: "https://example.com/secundaria.jpg",
        alt_text: "Secundaria",
        is_main: false,
        order: 1,
        created_at: "2026-10-29T12:00:00.000Z",
      },
    ],
    ...overrides,
  }
}

test("Precio A usa el descuento público solo cuando es menor al precio de lista", () => {
  const result = resolveExportPricing({
    price: 100,
    discount_price: 80,
    live_price: 70,
  })

  assert.equal(result.listPrice, 100)
  assert.equal(result.publicDiscount, 80)
  assert.equal(result.storePrice, 80)
  assert.equal(result.publicDiscountStatus, "applied")
  assert.equal(result.livePrice, 70)
  assert.equal(result.liveStatus, "configured")
})

test("sin descuento público, Precio A es el precio de lista", () => {
  const result = resolveExportPricing({
    price: 100,
    discount_price: null,
    live_price: null,
  })

  assert.equal(result.storePrice, 100)
  assert.equal(result.publicDiscountStatus, "missing")
  assert.equal(result.livePrice, null)
  assert.equal(result.liveStatus, "missing")
})

test("un descuento público mayor o igual al precio de lista no se aplica", () => {
  const result = resolveExportPricing({
    price: 100,
    discount_price: 120,
    live_price: 90,
  })

  assert.equal(result.storePrice, 100)
  assert.equal(result.publicDiscountStatus, "not_applied")
  assert.equal(result.livePrice, 90)
  assert.equal(result.liveStatus, "configured")
})

test("un Precio B mayor o igual al Precio A no es válido y no se presenta como descuento", () => {
  const result = resolveExportPricing({
    price: 100,
    discount_price: 80,
    live_price: 80,
  })

  assert.equal(result.storePrice, 80)
  assert.equal(result.rawLivePrice, 80)
  assert.equal(result.livePrice, null)
  assert.equal(result.liveStatus, "invalid")
})

test("un Precio B de cero es válido si es menor al Precio A", () => {
  const result = resolveExportPricing({
    price: 100,
    discount_price: null,
    live_price: 0,
  })

  assert.equal(result.storePrice, 100)
  assert.equal(result.livePrice, 0)
  assert.equal(result.liveStatus, "configured")
})

test("el libro incluye todos los productos, precios numéricos y una leyenda", async () => {
  const workbook = buildProductsWorkbook(
    [
      product(),
      product({
        id: 2,
        name: "=2+2",
        price: 50,
        discount_price: null,
        live_price: null,
        specifications: {},
        images: [],
      }),
    ],
    new Date("2026-10-29T12:00:00.000Z"),
  )

  const sheet = workbook.getWorksheet("Productos")
  assert.ok(sheet)
  assert.equal(sheet.rowCount, 3)

  const first = sheet.getRow(2)
  assert.equal(first.getCell("store_price").value, 80)
  assert.equal(first.getCell("list_price").value, 100)
  assert.equal(first.getCell("public_discount").value, 80)
  assert.equal(first.getCell("public_discount_status").value, "Aplicado")
  assert.equal(first.getCell("live_price").value, 70)
  assert.equal(first.getCell("raw_live_price").value, 70)
  assert.equal(first.getCell("live_status").value, "Configurado")
  assert.equal(
    first.getCell("long_description").value,
    "Descripción larga que no debe perderse en la exportación.",
  )
  assert.equal(first.getCell("size").value, "M")
  assert.equal(first.getCell("colors").value, "Rojo, Azul")
  assert.equal(
    first.getCell("main_image").value,
    "https://example.com/principal.jpg",
  )
  assert.equal(
    first.getCell("images").value,
    "https://example.com/principal.jpg\nhttps://example.com/secundaria.jpg",
  )

  const second = sheet.getRow(3)
  assert.equal(second.getCell("store_price").value, 50)
  assert.equal(second.getCell("live_price").value, "No configurado")
  assert.equal(second.getCell("live_status").value, "No configurado")
  assert.equal(second.getCell("name").value, "=2+2")
  assert.equal(typeof second.getCell("name").value, "string")

  const buffer = await workbook.xlsx.writeBuffer()
  assert.ok(buffer.length > 1000)

  const legend = workbook.getWorksheet("Leyenda")
  assert.ok(legend)
  assert.ok(legend.rowCount >= 12)
})

test("el nombre del archivo usa la fecha de Bolivia", () => {
  assert.equal(
    getExportFilename(new Date("2026-10-30T02:30:00.000Z")),
    "Liz_Store_Productos_2026-10-29.xlsx",
  )
})
