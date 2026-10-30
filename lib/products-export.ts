import ExcelJS from "exceljs"
import type { Workbook } from "exceljs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CategoriesTable,
  Database,
  Json,
  ProductImagesTable,
  ProductsTable,
} from "../types/database"

type ProductRow = ProductsTable["Row"]
type ImageRow = ProductImagesTable["Row"]
type CategoryRow = Pick<CategoriesTable["Row"], "id" | "name">

export type LivePriceStatus = "configured" | "missing" | "invalid"
export type PublicDiscountStatus = "applied" | "missing" | "not_applied"

export interface ProductExportPricing {
  listPrice: number | null
  publicDiscount: number | null
  storePrice: number | null
  livePrice: number | null
  rawLivePrice: number | null
  publicDiscountStatus: PublicDiscountStatus
  liveStatus: LivePriceStatus
}

export interface ProductExportProduct extends ProductRow {
  category_name: string
  images: ImageRow[]
}

export const LIVE_STATUS_LABELS: Record<LivePriceStatus, string> = {
  configured: "Configurado",
  missing: "No configurado",
  invalid: "No válido (no menor al Precio A)",
}

export const PUBLIC_DISCOUNT_STATUS_LABELS: Record<PublicDiscountStatus, string> = {
  applied: "Aplicado",
  missing: "No configurado",
  not_applied: "No aplicado (no menor al precio de lista)",
}

const PAGE_SIZE = 100
const CURRENCY_FORMAT = '"Bs. "#,##0.00'
const INTEGER_FORMAT = "#,##0"
const DECIMAL_FORMAT = "0.00"
const DATE_FORMAT = "dd/mm/yyyy hh:mm"

type ExportColumnKind = "text" | "integer" | "decimal" | "currency" | "date"

interface ExportColumn {
  header: string
  key: string
  width: number
  kind: ExportColumnKind
}

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "ID", key: "id", width: 7, kind: "integer" },
  { header: "SKU", key: "sku", width: 15, kind: "text" },
  { header: "Código Live", key: "live_code", width: 12, kind: "text" },
  { header: "Nombre", key: "name", width: 38, kind: "text" },
  { header: "Slug", key: "slug", width: 32, kind: "text" },
  { header: "Categoría", key: "category_name", width: 22, kind: "text" },
  { header: "ID categoría", key: "category_id", width: 11, kind: "integer" },
  {
    header: "Precio de lista / anterior (Bs.)",
    key: "list_price",
    width: 17,
    kind: "currency",
  },
  {
    header: "Descuento público guardado (Bs.)",
    key: "public_discount",
    width: 18,
    kind: "currency",
  },
  {
    header: "Estado descuento público",
    key: "public_discount_status",
    width: 23,
    kind: "text",
  },
  {
    header: "Precio A — Precio de tienda (Bs.)",
    key: "store_price",
    width: 19,
    kind: "currency",
  },
  {
    header: "Precio B — Precio de descuento Modo Live (Bs.)",
    key: "live_price",
    width: 20,
    kind: "currency",
  },
  {
    header: "Precio Live guardado (Bs.)",
    key: "raw_live_price",
    width: 18,
    kind: "currency",
  },
  {
    header: "Estado Precio B",
    key: "live_status",
    width: 24,
    kind: "text",
  },
  { header: "Stock", key: "stock", width: 8, kind: "integer" },
  { header: "Publicado", key: "published", width: 10, kind: "text" },
  { header: "Destacado", key: "featured", width: 10, kind: "text" },
  { header: "Nuevo", key: "new", width: 8, kind: "text" },
  { header: "En oferta", key: "offer", width: 10, kind: "text" },
  {
    header: "Descripción corta",
    key: "short_description",
    width: 45,
    kind: "text",
  },
  {
    header: "Descripción larga",
    key: "long_description",
    width: 65,
    kind: "text",
  },
  { header: "Talla", key: "size", width: 16, kind: "text" },
  { header: "Colores", key: "colors", width: 28, kind: "text" },
  {
    header: "Especificaciones completas (JSON)",
    key: "specifications",
    width: 40,
    kind: "text",
  },
  {
    header: "Imagen principal (URL)",
    key: "main_image",
    width: 50,
    kind: "text",
  },
  {
    header: "Todas las imágenes (URLs)",
    key: "images",
    width: 60,
    kind: "text",
  },
  { header: "Rating", key: "rating", width: 8, kind: "decimal" },
  {
    header: "Cantidad de reseñas",
    key: "rating_count",
    width: 12,
    kind: "integer",
  },
  { header: "Ventas", key: "sales_count", width: 9, kind: "integer" },
  {
    header: "Meta descripción",
    key: "meta_description",
    width: 45,
    kind: "text",
  },
  { header: "Meta keywords", key: "meta_keywords", width: 40, kind: "text" },
  { header: "Creado", key: "created_at", width: 18, kind: "date" },
  { header: "Actualizado", key: "updated_at", width: 18, kind: "date" },
]

const LEGEND_ROWS: Array<[string, string]> = [
  [
    "Precio A — Precio de tienda",
    "Precio efectivo de la tienda pública. Se usa el descuento público solo cuando es menor que el precio de lista; en caso contrario se usa el precio de lista.",
  ],
  [
    "Precio B — Precio de descuento Modo Live",
    "Precio especial persistente de Modo Live (products.live_price). Solo es válido si 0 <= Precio B < Precio A. Si no está configurado se muestra 'No configurado'; si está fuera de rango, 'No válido'.",
  ],
  [
    "Precio de lista / anterior",
    "Campo products.price. Es el precio de referencia y puede mostrarse tachado cuando existe un descuento público válido.",
  ],
  [
    "Descuento público guardado",
    "Campo products.discount_price. Solo se aplica al Precio A cuando es menor que el precio de lista.",
  ],
  [
    "Precio Live guardado",
    "Campo products.live_price tal como está almacenado, incluso si ya no es válido respecto al Precio A actual.",
  ],
  [
    "Estado descuento público",
    "Aplicado: el descuento público es menor que el precio de lista. No configurado: no existe. No aplicado: existe pero no cumple la condición para aplicarse.",
  ],
  [
    "Estado Precio B",
    "Configurado: el Precio Live es válido. No configurado: no existe. No válido: existe pero no es menor que el Precio A.",
  ],
  [
    "Talla y Colores",
    "Se extraen de products.specifications. Las especificaciones completas también se incluyen como JSON.",
  ],
  [
    "Imágenes",
    "La imagen principal y todas las imágenes se exportan como URLs separadas por saltos de línea.",
  ],
]

export function resolveExportPricing(
  product: Pick<ProductRow, "price" | "discount_price" | "live_price">,
): ProductExportPricing {
  const listPrice = toFiniteNumber(product.price)
  const publicDiscount =
    product.discount_price === null
      ? null
      : toFiniteNumber(product.discount_price)
  const hasPublicDiscount =
    listPrice !== null &&
    publicDiscount !== null &&
    listPrice > 0 &&
    publicDiscount < listPrice
  const storePrice = hasPublicDiscount ? publicDiscount : listPrice
  const rawLivePrice =
    product.live_price === null ? null : toFiniteNumber(product.live_price)
  const hasLivePrice =
    rawLivePrice !== null &&
    storePrice !== null &&
    rawLivePrice >= 0 &&
    rawLivePrice < storePrice

  let publicDiscountStatus: PublicDiscountStatus = "missing"
  if (publicDiscount !== null) {
    publicDiscountStatus = hasPublicDiscount ? "applied" : "not_applied"
  }

  let liveStatus: LivePriceStatus = "missing"
  if (rawLivePrice !== null) {
    liveStatus = hasLivePrice ? "configured" : "invalid"
  }

  return {
    listPrice,
    publicDiscount,
    storePrice,
    livePrice: hasLivePrice ? rawLivePrice : null,
    rawLivePrice,
    publicDiscountStatus,
    liveStatus,
  }
}

export async function fetchProductsForExport(
  supabase: SupabaseClient<Database>,
): Promise<ProductExportProduct[]> {
  const [products, categories, images] = await Promise.all([
    fetchAllPages<ProductRow>((from, to) =>
      supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true })
        .range(from, to),
    ),
    fetchAllPages<CategoryRow>((from, to) =>
      supabase
        .from("categories")
        .select("id, name")
        .order("id", { ascending: true })
        .range(from, to),
    ),
    fetchAllPages<ImageRow>((from, to) =>
      supabase
        .from("product_images")
        .select("*")
        .order("product_id", { ascending: true })
        .order("is_main", { ascending: false })
        .order("order", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    ),
  ])

  const categoryMap = new Map(
    categories.map((category) => [category.id, category.name]),
  )
  const imageMap = new Map<number, ImageRow[]>()

  for (const image of images) {
    const productImages = imageMap.get(image.product_id)
    if (productImages) {
      productImages.push(image)
    } else {
      imageMap.set(image.product_id, [image])
    }
  }

  return products.map((product) => ({
    ...product,
    category_name: categoryMap.get(product.category_id) ?? "",
    images: imageMap.get(product.id) ?? [],
  }))
}

export function buildProductsWorkbook(
  products: ProductExportProduct[],
  generatedAt = new Date(),
): Workbook {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Liz Store"
  workbook.lastModifiedBy = "Liz Store"
  workbook.created = generatedAt
  workbook.modified = generatedAt
  workbook.title = "Productos"
  workbook.subject = "Exportación de productos de Liz Store"
  workbook.description =
    "Catálogo completo con precios de tienda y precios de Modo Live."

  const worksheet = workbook.addWorksheet("Productos")
  worksheet.properties.tabColor = { argb: "FFFF8E9F" }
  worksheet.columns = EXPORT_COLUMNS.map(({ header, key, width }) => ({
    header,
    key,
    width,
  }))
  worksheet.views = [
    {
      state: "frozen",
      xSplit: 2,
      ySplit: 1,
      topLeftCell: "C2",
      activeCell: "A2",
    },
  ]
  worksheet.autoFilter = `A1:${columnLetter(EXPORT_COLUMNS.length)}1`

  for (const product of products) {
    const pricing = resolveExportPricing(product)
    const mainImage =
      product.images.find((image) => image.is_main)?.image ??
      product.images[0]?.image ??
      ""

    worksheet.addRow({
      id: product.id,
      sku: product.sku,
      live_code: product.live_code ?? "",
      name: product.name,
      slug: product.slug,
      category_name: product.category_name,
      category_id: product.category_id,
      list_price: pricing.listPrice,
      public_discount: pricing.publicDiscount,
      public_discount_status:
        PUBLIC_DISCOUNT_STATUS_LABELS[pricing.publicDiscountStatus],
      store_price: pricing.storePrice,
      live_price:
        pricing.liveStatus === "configured"
          ? pricing.livePrice
          : pricing.liveStatus === "invalid"
            ? "No válido"
            : "No configurado",
      raw_live_price: pricing.rawLivePrice,
      live_status: LIVE_STATUS_LABELS[pricing.liveStatus],
      stock: product.stock,
      published: yesNo(product.is_active),
      featured: yesNo(product.is_featured),
      new: yesNo(product.is_new),
      offer: yesNo(product.is_offer),
      short_description: product.short_description ?? "",
      long_description: product.long_description ?? "",
      size: readSpecification(product.specifications, "talla"),
      colors: readSpecification(product.specifications, "colores"),
      specifications: serializeSpecifications(product.specifications),
      main_image: mainImage,
      images: product.images.map((image) => image.image).join("\n"),
      rating: toFiniteNumber(product.rating),
      rating_count: toFiniteNumber(product.rating_count),
      sales_count: toFiniteNumber(product.sales_count),
      meta_description: product.meta_description ?? "",
      meta_keywords: product.meta_keywords ?? "",
      created_at: toDateValue(product.created_at),
      updated_at: toDateValue(product.updated_at),
    })
  }

  const header = worksheet.getRow(1)
  header.height = 34
  header.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 }
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFF8E9F" },
  }
  header.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  }

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return

    for (const column of EXPORT_COLUMNS) {
      const cell = row.getCell(column.key)

      if (column.kind === "currency") {
        cell.alignment = { vertical: "top", horizontal: "right" }
        if (typeof cell.value === "number") {
          cell.numFmt = CURRENCY_FORMAT
        }
      } else if (column.kind === "integer") {
        cell.alignment = { vertical: "top", horizontal: "right" }
        if (typeof cell.value === "number") {
          cell.numFmt = INTEGER_FORMAT
        }
      } else if (column.kind === "decimal") {
        cell.alignment = { vertical: "top", horizontal: "right" }
        if (typeof cell.value === "number") {
          cell.numFmt = DECIMAL_FORMAT
        }
      } else if (column.kind === "date") {
        cell.alignment = { vertical: "top", horizontal: "right" }
        if (cell.value instanceof Date) {
          cell.numFmt = DATE_FORMAT
        }
      } else {
        cell.alignment = { vertical: "top", wrapText: true }
      }
    }
  })

  const legend = workbook.addWorksheet("Leyenda")
  legend.properties.tabColor = { argb: "FFD4A5A5" }
  legend.columns = [
    { header: "Campo", key: "field", width: 42 },
    { header: "Descripción", key: "description", width: 105 },
  ]

  for (const [field, description] of LEGEND_ROWS) {
    legend.addRow({ field, description })
  }

  legend.addRow({})
  legend.addRow({
    field: "Exportado",
    description: formatDateTime(generatedAt),
  })
  legend.addRow({
    field: "Total de productos",
    description: String(products.length),
  })

  const legendHeader = legend.getRow(1)
  legendHeader.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 }
  legendHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFB76E79" },
  }
  legendHeader.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  }

  legend.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    row.getCell("field").alignment = { vertical: "top", wrapText: true }
    row.getCell("field").font = { bold: true }
    row.getCell("description").alignment = { vertical: "top", wrapText: true }
  })

  return workbook
}

export function getExportFilename(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? ""

  return `Liz_Store_Productos_${value("year")}-${value("month")}-${value("day")}.xlsx`
}

async function fetchAllPages<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null
    error: { message: string } | null
  }>,
): Promise<T[]> {
  const rows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)

    const page = data ?? []
    rows.push(...page)

    if (page.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return rows
}

function toFiniteNumber(value: unknown): number | null {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function toDateValue(value: string): Date | string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date
}

function yesNo(value: boolean): string {
  return value ? "Sí" : "No"
}

function isJsonObject(value: Json): value is Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readSpecification(specifications: Json, key: string): string {
  if (!isJsonObject(specifications)) return ""

  const capitalizedKey = `${key.charAt(0).toUpperCase()}${key.slice(1)}`
  const value = specifications[key] ?? specifications[capitalizedKey]

  return formatSpecificationValue(value)
}

function formatSpecificationValue(value: Json | undefined): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value.map(formatSpecificationValue).filter(Boolean).join(", ")
  }
  return JSON.stringify(value)
}

function serializeSpecifications(specifications: Json): string {
  if (!isJsonObject(specifications)) return ""
  if (Object.keys(specifications).length === 0) return ""
  return JSON.stringify(specifications)
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

function columnLetter(index: number): string {
  let letter = ""
  let current = index

  while (current > 0) {
    const remainder = (current - 1) % 26
    letter = String.fromCharCode(65 + remainder) + letter
    current = Math.floor((current - 1) / 26)
  }

  return letter
}
