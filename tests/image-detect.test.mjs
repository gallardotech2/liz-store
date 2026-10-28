import assert from "node:assert/strict"
import test from "node:test"
import {
  HEIC_ERROR,
  IMAGE_READ_ERROR,
  SUPPORTED_IMAGE_TYPES,
  checkImageFile,
  normalizeMime,
  sniffImageType,
} from "../lib/image-detect.ts"

const jpeg = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
])
const png = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
])
const webp = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
])
const gif = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00,
])
const heic = Uint8Array.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
])

test("normaliza aliases de MIME de Android", () => {
  assert.equal(normalizeMime("image/jpg"), "image/jpeg")
  assert.equal(normalizeMime("IMAGE/X-PNG"), "image/png")
  assert.equal(normalizeMime("image/pjpeg"), "image/jpeg")
  assert.equal(normalizeMime(""), "")
})

test("detecta formatos por contenido", () => {
  assert.equal(sniffImageType(jpeg), "image/jpeg")
  assert.equal(sniffImageType(png), "image/png")
  assert.equal(sniffImageType(webp), "image/webp")
  assert.equal(sniffImageType(gif), "image/gif")
  assert.equal(sniffImageType(heic), "image/heic")
  assert.equal(sniffImageType(Uint8Array.from([1, 2, 3])), null)
})

test("acepta JPG aunque el picker declare image/jpg y devuelve un File canónico", async () => {
  const input = new File([jpeg], "captura.jpg", { type: "image/jpg" })
  const checked = await checkImageFile(input, 12 * 1024 * 1024)

  assert.equal(checked.ok, true)
  assert.equal(checked.type, "image/jpeg")
  assert.equal(checked.file.type, "image/jpeg")
  assert.equal(checked.file.name, "captura.jpg")
  assert.deepEqual(new Uint8Array(await checked.file.arrayBuffer()), jpeg)
})

test("acepta GIF y conserva el tipo", async () => {
  const input = new File([gif], "animacion.gif", { type: "image/gif" })
  const checked = await checkImageFile(input, 12 * 1024 * 1024)

  assert.equal(checked.ok, true)
  assert.equal(checked.type, "image/gif")
  assert.equal(SUPPORTED_IMAGE_TYPES.includes("image/gif"), true)
})

test("rechaza HEIC con un mensaje comprensible", async () => {
  const input = new File([heic], "foto.heic", { type: "image/heic" })
  const checked = await checkImageFile(input, 12 * 1024 * 1024)

  assert.equal(checked.ok, false)
  assert.equal(checked.error, HEIC_ERROR)
})

test("rechaza contenido desconocido", async () => {
  const input = new File([Uint8Array.from([1, 2, 3, 4])], "archivo.txt", {
    type: "text/plain",
  })
  const checked = await checkImageFile(input, 12 * 1024 * 1024)

  assert.equal(checked.ok, false)
  assert.match(checked.error, /Formato no soportado/)
})

test("convierte un fallo de lectura en un error explícito", async () => {
  const brokenFile = {
    name: "nube.jpg",
    type: "image/jpeg",
    size: 100,
    lastModified: 0,
    arrayBuffer: async () => {
      throw new Error("No se pudo leer")
    },
  }

  await assert.rejects(
    () => checkImageFile(brokenFile, 12 * 1024 * 1024),
    (error) => error.message === IMAGE_READ_ERROR,
  )
})
