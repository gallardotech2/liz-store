import assert from "node:assert/strict"
import test from "node:test"
import {
  compressImage,
  imageIsCompressible,
  setFileInput,
} from "../lib/image-compress.ts"

test("solo comprime JPEG, PNG y WEBP", () => {
  assert.equal(imageIsCompressible(new File([], "a.jpg", { type: "image/jpeg" })), true)
  assert.equal(imageIsCompressible(new File([], "a.png", { type: "image/png" })), true)
  assert.equal(imageIsCompressible(new File([], "a.webp", { type: "image/webp" })), true)
  assert.equal(imageIsCompressible(new File([], "a.gif", { type: "image/gif" })), false)
  assert.equal(imageIsCompressible(new File([], "a.txt", { type: "text/plain" })), false)
})

test("setFileInput devuelve false si el navegador no puede preparar el archivo", () => {
  const input = { files: null }
  const result = setFileInput(input, new File(["x"], "x.jpg", { type: "image/jpeg" }))

  assert.equal(result, false)
})

test("setFileInput verifica el archivo que quedó en el input", () => {
  const original = globalThis.DataTransfer
  const file = new File(["abc"], "x.jpg", { type: "image/jpeg" })

  globalThis.DataTransfer = class {
    constructor() {
      this.items = {
        add: (value) => {
          this.files = [value]
        },
      }
      this.files = []
    }
  }

  try {
    const input = { files: null }
    assert.equal(setFileInput(input, file), true)
    assert.equal(input.files[0], file)

    const badInput = {
      set files(value) {
        this._files = [new File(["otro"], "otro.jpg", { type: "image/jpeg" })]
      },
      get files() {
        return this._files
      },
    }
    assert.equal(setFileInput(badInput, file), false)
  } finally {
    if (original === undefined) {
      delete globalThis.DataTransfer
    } else {
      globalThis.DataTransfer = original
    }
  }
})

test("no intenta comprimir formatos que no corresponden", async () => {
  const file = new File(["gif"], "a.gif", { type: "image/gif" })
  const result = await compressImage(file)

  assert.equal(result.compressed, false)
  assert.equal(result.file, file)
})
