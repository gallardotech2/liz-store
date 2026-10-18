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

