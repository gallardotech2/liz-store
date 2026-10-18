# Bitácora 16 — Subida de imágenes desde Android (modo móvil)

Fecha: 2026-10-18
Estado: EJECUTADO
Módulo: Admin — productos y categorías (subida de imágenes)

## Problema
En Android (Brave/Chrome, **modo móvil**), subir imágenes desde el admin fallaba con el error genérico `"Hubo un error al procesar la solicitud... prueba con una foto más pequeña o en formato JPG"`. Al activar "Sitio para ordenador" la misma imagen subía bien. Casos reportados:
- Foto de cámara (`img/jpeg`, 12MB): SÍ subía (pasa por compresión → se re-codifica como JPEG limpio).
- Captura de pantalla (128KB): NO subía (≤600KB salta la compresión y conserva el MIME que reporta el picker).

## Causa raíz (diagnóstico)
1. En modo móvil, el selector de Android entrega archivos con MIME vacío o no estándar (`""`, `image/jpg`, `image/x-png`, `image/pjpeg`).
2. El cliente rechazaba con "Formato no soportado" pero **dejaba el archivo pegado en el input** (`ImageDropzone` no lo limpiaba) — al guardar, el archivo rechazado viajaba al servidor.
3. El servidor validaba el MIME declarado y los magic bytes de forma estricta → segundo rechazo → error boundary genérico que ocultaba la causa real.
4. Sin `await` en handlers (promesas flotantes) y submit habilitado durante la compresión → en móvil (CPU lenta) se podía enviar el archivo crudo sin comprimir.

## Solución

### Nuevo: `lib/image-detect.ts`
- `sniffImageType()`: detecta JPEG/PNG/WEBP/GIF por **magic bytes** (primeros 16 bytes).
- `normalizeMime()`: normaliza alias Android (`image/jpg`→`image/jpeg`, `image/x-png`→`image/png`, etc.).
- `isHeicBytes()`: detecta HEIC/HEIF (`ftyp heic/heix/hevc/hevx/mif1/msf1`).
- `resolveImageType(file)`: tipo canónico si el MIME es válido; si no, sniff por contenido; fallback HEIC.

### `lib/image-compress.ts` (reescrito)
- Objetivo de compresión: **≤600KB @1600px** (antes 1.5MB) — punto calidad/espacio.
- `createImageBitmap` con `imageOrientation: "from-image"` (EXIF de fotos Android) y **respaldo con `HTMLImageElement`** si falla (memoria/HEIC).
- Timeout de 10s en `canvas.toBlob` (evita "Comprimiendo…" colgado en Android).
- `forceEncode` para HEIC: intenta convertir a JPEG (Android lo decodifica nativo); si no puede → mensaje guía.
- `MAX_UPLOAD_BYTES = 8MB` (alineado con `bodySizeLimit`); `setFileInput()` devuelve boolean con try/catch.

### `components/admin/ImageDropzone.tsx`
- Validación con tipo normalizado/detectado (acepta JPG/PNG/WEBP/GIF + HEIC con conversión).
- **Limpia el input al rechazar** (nunca se envía un archivo inválido).
- Token de selección (`selectionIdRef`) para evitar condiciones de carrera al comprimir/limpiar.
- Callbacks `onBusyChange` / `onFileStateChange` para deshabilitar el submit y marcar `image_selected`.
- `accept` ampliado: `jpeg,png,webp,gif,heic,heif`.

### `components/admin/ProductForm.tsx` / `CategoryForm.tsx`
- Botón Guardar/Agregar deshabilitado mientras comprime (`pending || busy`).
- Hidden `image_selected` para que el servidor distinga "no seleccionó imagen" de "la imagen se perdió".
- `AddImageForm` con el mismo flujo tolerante (sin validación duplicada obsoleta).

### `lib/supabase/storage.ts`
- **Confía en el contenido, no en el MIME declarado**: detecta el formato por magic bytes y sube con `contentType` y extensión corregidos.
- HEIC → mensaje claro ("exporta la foto como JPG"); contenido desconocido → error explícito.
- `generateFileName(ext)` ahora deriva la extensión del contenido detectado.

### `app/admin/{products,categories}/actions.ts`
- Guard: si `image_selected=1` pero el archivo llega vacío (`size 0`) → error visible (antes se guardaba sin imagen en silencio).

### `app/admin/error.tsx`
- Muestra `error.message` real (admin) en lugar del texto genérico.

### `next.config.ts`
- `bodySizeLimit`: `4mb` → `8mb` (red de seguridad si la compresión falla en algún dispositivo; el flujo normal envía ~600KB).

## Presupuesto de espacio (Supabase free 1GB)
| | Antes | Ahora |
|---|---|---|
| Imagen normal | hasta 1.5MB | ≤600KB |
| 600 fotos (200 productos × 3) | hasta ~900MB | ~360MB (~35%) |
| Nitidez | 1600px | 1600px (idéntica) |

## Sin cambios
- `proxy.ts`, `lib/supabase/middleware.ts` (sesión/cookies/carrito/checkout) — intactos.
- Auth/`requireAdmin`, RLS, `esquema.sql` (cero migraciones de BD).
- Identidad visual, tienda, carrito, checkout, perfil, métodos de pago.

## Verificación
- `npx tsc --noEmit`: 0 errores. `next build`: ✓ compilado (48 páginas).
- ESLint en archivos nuevos/modificados: 0 errores nuevos (solo warning preexistente de `<img>`).
- Pendiente: prueba manual en Android Brave modo móvil (cámara, galería, captura) + regresión PC y modo escritorio.

## Revisión adicional (2ª pasada)
Tres huecos extra corregidos tras revisión:
1. `resolveImageType` ahora **siempre analiza el contenido** (antes confiaba en el MIME declarado si era canónico → un HEIC mal etiquetado como jpeg pasaba sin detección). El contenido manda; el MIME declarado es solo respaldo si no se pueden leer los bytes.
2. Condiciones de carrera de selección: token `selectionIdRef` en `ImageDropzone` **y** en `AddImageForm` — una selección antigua que fallaba tarde ya no puede limpiar la selección nueva del usuario. Guard también tras `resolveImageType` (no solo tras compresión).
3. Guard de archivo vacío (`size 0`) en ambos flujos con mensaje claro.

## Causa raíz definitiva (3ª ronda) — "Failed to fetch"
Tras desplegar la 2ª pasada, el usuario seguía sin poder subir desde Android y ahora veía `"Failed to fetch"` (en inglés) en el error boundary.

**`Failed to fetch` no es un error de nuestro código: es Vercel cortando la petición.** Límite duro de Vercel Functions (documentado, no configurable): **4.5MB máximo por request body**; si se supera devuelve `413 FUNCTION_PAYLOAD_TOO_LARGE` y aborta la conexión → el navegador lanza `TypeError: Failed to fetch`.

Cadena del fallo:
1. En modo móvil el selector entrega el archivo ORIGINAL (frecuentemente 4.5–12MB).
2. Si la compresión en el dispositivo no logra reducirlo (o falla la decodificación), el archivo crudo pasa el chequeo del cliente (`MAX_UPLOAD_BYTES = 8MB` — mayor que el límite real de Vercel).
3. El Server Action intenta enviar el archivo crudo por POST → Vercel corta en 4.5MB → `"Failed to fetch"`.
4. `bodySizeLimit: "8mb"` en `next.config.ts` era inútil: el corte de Vercel (4.5MB) ocurre ANTES de que Next.js pueda imponer su límite.

## Solución definitiva — subida directa navegador → Supabase Storage
Patrón oficial de Vercel para saltarse el límite de 4.5MB: **los bytes de la imagen ya no pasan por Vercel**. Se sube con URL firmada directamente a Supabase Storage y al Server Action solo viaja la URL pública (texto minúsculo).

Flujo nuevo:
1. El cliente comprime (igual que antes, ≤600KB @1600px).
2. Llama al Server Action `requestImageUploadTicket(folder, ext)` → `requireAdmin()` + `createSignedUploadUrl()` con la service role → devuelve `{ path, token, publicUrl }`.
3. El navegador sube a Supabase con `uploadToSignedUrl(path, token, file)` (cliente anon — el token autoriza).
4. El formulario envía solo un hidden `image_url` con la URL pública.
5. El Server Action valida que la URL pertenezca a nuestro bucket (`extractPathFromUrl`) y guarda la fila.

### Archivos
- **Nuevo `lib/supabase/bucket.ts`**: `IMAGE_BUCKET = "product-images"` compartido server/cliente (sin ciclos de import).
- **Nuevo `lib/image-upload.ts`**: `uploadImageDirect(file, folder, contentType)` — pide el ticket y sube a Supabase; mensajes en español.
- **Nuevo `app/admin/storage-actions.ts`**: `requestImageUploadTicket()` (solo admin; whitelist de carpetas `products|categories` y extensiones).
- **`lib/supabase/storage.ts`**: + `createUploadTicket()` (URL firmada + publicUrl), + `resolveSubmittedImageUrl(formData, required)` (valida que la URL sea de nuestro bucket), `extractPathFromUrl` exportada. Eliminado `uploadImage()` (ya nadie recibe archivos por Vercel).
- **`components/admin/ImageDropzone.tsx`**: tras comprimir **sube directo a Supabase**; el input de archivo ya no tiene `name` (los bytes nunca se envían al action); hidden `image_url`; estados "Comprimiendo imagen… / Subiendo imagen… / ✓ Imagen lista". Nuevo prop obligatorio `folder`.
- **`components/admin/ProductForm.tsx`**: `AddImageForm` con el mismo flujo (sube al elegir, botón Agregar deshabilitado hasta que haya URL); `SubmitBtn` muestra "Preparando imagen...".
- **`components/admin/CategoryForm.tsx`**: pasa `folder="categories"`.
- **`app/admin/{products,categories}/actions.ts`**: reciben `image_url` (validada) en lugar del archivo; guards actualizados (`image_selected` sin URL → error claro).
- **`app/admin/error.tsx`**: traduce a **español** los errores en inglés que llegan al boundary (`Failed to fetch` → "No se pudo conectar con el servidor…", página desactualizada, error de servidor, payload demasiado grande).
- **`next.config.ts`**: `bodySizeLimit` vuelve a `4mb` (el límite real es de Vercel; los actions ahora llevan solo texto).
- **`lib/image-compress.ts`**: eliminados `MAX_UPLOAD_BYTES` y `setFileInput` (código muerto tras el cambio de arquitectura).

### Ventajas
- El límite de 4.5MB de Vercel **deja de existir para las imágenes** (ninguna imagen pasa por Vercel).
- Si la compresión falla en un dispositivo, el archivo original sube igual por la vía directa (sin "Failed to fetch").
- El guardado del formulario es más rápido (el POST ya no carga el archivo).
- Errores siempre en español en el panel.

### Consecuencias aceptadas
- La validación por magic bytes en servidor ya no aplica al upload (no ve los bytes); la validación de formato vive en el cliente (panel solo-admin) y la URL se valida contra nuestro bucket.
- Los archivos nuevos van a `products/...` y `categories/...` sin subcarpeta por id (los antiguos conservan su ruta).
- Si el usuario elige una imagen y no guarda, queda un archivo huérfano en Storage (aceptable en panel admin).

## Verificación (3ª ronda)
- `npx tsc --noEmit`: 0 errores. `next build`: ✓ (48 páginas).
- ESLint en archivos tocados: 0 errores nuevos (24 errores `no-explicit-any` preexistentes en actions, idénticos antes/después; warnings `<img>` preexistentes).
- Pendiente: prueba manual en Android Brave modo móvil (cámara, galería, captura) + regresión PC.


