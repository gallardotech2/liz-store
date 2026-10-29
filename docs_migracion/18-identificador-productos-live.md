# Bitácora 18 — Identificador permanente de productos en Modo Estudio de Live

Fecha: 2026-10-28
Estado: Implementado en código — SQL Fix 0024 ejecutado en Supabase (2026-10-28)
Módulo: Admin / Modo Live / Catálogo Live

## Objetivo

Agregar un identificador numérico manual e independiente por producto, visible y
editable únicamente dentro del Modo Live, en dos lugares:

1. **Administrar catálogo** (`/admin/lives/[id]/editar`).
2. **Abrir estudio → Productos → Disponibles** (`/admin/lives/[id]/studio`).

Además, el buscador del Estudio permite encontrar un producto por su nombre o
por su identificador exacto. No se implementó producto destacado, «Mostrar
ahora» ni ninguna otra función futura.

## Investigación previa

- `products.id` es la clave interna y no sirve como código visible.
- `products.sku` es un texto único, pero se genera automáticamente y se edita
  desde el formulario normal de productos. Reutilizarlo habría expuesto la
  edición fuera del Modo Live y habría mezclado dos conceptos distintos.
- `products.slug` es público y depende del nombre.
- Por eso se agregó un campo nuevo en `products`: `live_code`. Es la única
  fuente de verdad y no se duplica en `live_products`, localStorage ni estado
  del navegador.

## Formato y persistencia

- Columna `public.products.live_code TEXT`, nullable.
- Formato permitido: 2 dígitos (`01`–`99`) o 3 dígitos (`100`–`999`).
- Se guarda como texto para conservar los ceros iniciales.
- Ningún producto recibe un código por defecto: los productos nuevos y los
  existentes quedan en `NULL` hasta que el administrador escriba uno.
- Índice único parcial `uniq_products_live_code` para impedir duplicados.
- Restricción `products_live_code_format_check` para validar el formato también
  en la base de datos.

## SQL — Fix 0024 (EJECUTADO)

El SQL fue ejecutado manualmente en Supabase Dashboard > SQL Editor el
2026-10-28. Se registró en `supabase/sql/migraciones.sql` y `esquema.sql` ya
refleja la columna, el CHECK y el índice único parcial. `ejecucion.sql` quedó
vacío con estado EJECUTADO.

Riesgo sobre datos existentes: ninguno. La columna se agregó vacía (`NULL`) y no
se rellenó ni se reasignó ningún producto. El índice único parcial no afecta a
las filas sin código.

## Administración

- `app/admin/lives/[id]/editar/page.tsx`: muestra el código actual como badge y
  agrega el formulario por producto dentro del catálogo del Modo Live.
- `app/admin/lives/[id]/studio/page.tsx`: carga los códigos en una consulta
  separada (degradación elegante si falta la columna), muestra el badge
  `Código XX` en cada tarjeta, permite editar el identificador desde la lista de
  **Productos** y busca por nombre o por identificador exacto. La búsqueda por
  código no usa coincidencias parciales: `14` no coincide con `114`.
- `components/admin/LiveProductCodeForm.tsx`: input de texto (no `number`, para
  no perder el cero inicial), guardado explícito, mensajes de éxito/error y
  opción de dejar vacío para quitar el identificador (con confirmación).
- `app/admin/lives/actions.ts`: `updateProductLiveCode` valida administrador,
  formato, pertenencia al catálogo Live y duplicados antes de actualizar. Un
  valor vacío guarda `NULL` y omite la comprobación de duplicados.
- `lib/live-code.ts`: validación compartida entre cliente y servidor
  (`validateLiveCode` para exigir código y `parseLiveCodeInput` para permitir
  vacío).
- `types/database.ts`: `live_code` agregado a `ProductsTable`.
- No se agregaron controles en la tienda pública, catálogo normal, fichas de
  producto ni otros paneles administrativos.

## Verificación realizada

- `npx tsc --noEmit` → 0 errores.
- `npm test` → 21 pruebas aprobadas, incluidas las de formato, ceros iniciales,
  crecimiento a 3 dígitos y vaciado del identificador.
- `npm run build` → compila correctamente. Se mantiene el aviso preexistente
  `Failed to load dynamic font for ✦`.
- Prueba del SQL en PostgreSQL 16 desechable (contenedor Docker):
  - alta de `01`, `23`, `99`, `100`, `999`;
  - rechazo de duplicado `01` por INSERT y por UPDATE;
  - rechazo de `1`, `001`, `1234` y `AB` por formato;
  - conservación de `01` y de productos sin código (`NULL`);
  - actualización de `23` a `40` sin afectar otros datos.
- `npm run lint` conserva errores preexistentes del proyecto (`no-explicit-any`,
  `set-state-in-effect`, etc.). Los archivos nuevos no agregan errores; el
  update de `products` usa el mismo `(supabase as any)` que el resto del
  módulo por una limitación de tipos existente.

## Limitaciones pendientes

- El SQL Fix 0024 ya está aplicado. Falta la verificación funcional en vivo
  contra Supabase (asignar `01`, intentar duplicarlo, quitarlo y buscar por
  código en el Estudio).
- El Estudio actualiza los identificadores al guardar y cada 30 segundos
  mientras la pestaña está visible; no hay sincronización en tiempo real entre
  pestañas.
- El identificador no se muestra en la tienda pública ni en el nombre,
  descripción o texto comercial del producto.
- Si en el futuro se superan 999 productos, se podrá ampliar el formato a más
  dígitos con una nueva migración; los códigos existentes se conservan porque
  son texto y no se reasignan automáticamente.
