# Bitácora 16 — Modo Live (Fase 2)

Fecha: 2026-10-26
Estado: EJECUTADO (2026-10-26)
Módulo: Admin / Sesiones Live / Precio Live / Studio / Home / Catálogo / Ficha de producto / Layout global

## Objetivo

Convertir la experiencia "Modo Hot" en **Modo Live** con una identidad cercana a
TikTok Live, manteniendo la paleta oficial de Liz Store. La fase incorpora:

- Precio Live persistente por producto (`products.live_price`).
- Carga masiva de productos a una sesión con búsqueda y filtro por categoría.
- Studio utilizable desde móvil, con acciones rápidas y búsqueda de productos.
- Página pública compacta: producto actual + catálogo Live + CTA de WhatsApp.
- Etiquetas visibles "Live" en admin, header, footer, catálogo y ficha.

No se modifican carrito, checkout, cookies, carga de imágenes ni la identidad
visual global.

## Reglas de negocio

- El precio normal de un producto es `discount_price ?? price`.
- Un precio Live es válido solo si `0 <= live_price < precio normal`.
- `products.live_price` guarda el último precio Live confirmado del producto y
  se reutiliza al volver a agregarlo a una sesión.
- Al agregar un producto con precio explícito, se actualizan tanto
  `live_products.promo_price` como `products.live_price`.
- Al agregar sin precio explícito, se usa `products.live_price` si sigue siendo
  válido; si no, el producto queda sin precio Live en esa sesión.
- Editar el precio desde la sesión también actualiza `products.live_price`.
  Borrar el precio de la sesión limpia `products.live_price`.
- La carga masiva no cambia precios: reutiliza el precio persistente.
- Solo existe una sesión activa a la vez (regla de Fix 0021).
- La home pública muestra únicamente la experiencia Live cuando hay sesión
  activa; no se renderizan héroes, destacados, testimonios ni bloques largos.

## SQL — Fix 0022 (EJECUTADO 2026-10-26)

Archivo: `supabase/sql/ejecucion.sql`.

Ejecutado por el propietario en Supabase Dashboard > SQL Editor el
2026-10-26. Registrado en `supabase/sql/migraciones.sql` y reflejado en
`supabase/sql/esquema.sql`.

Contenido:

- `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS live_price NUMERIC(10,2)`.
- Constraint `products_live_price_check`: `live_price IS NULL OR live_price >= 0`.
  La comparación contra el precio normal se valida en las RPCs y en el admin
  porque `price`/`discount_price` pueden cambiar después.
- `add_hot_product(...)`: conserva la firma existente; ahora persiste el precio
  explícito en `products.live_price` y reutiliza el persistente cuando no se
  envía precio.
- `update_hot_product_promo(...)`: persiste o limpia `products.live_price`.
- `add_hot_products(p_session_id, p_product_ids INTEGER[])`: inserta varios
  productos en una sola operación, con `ON CONFLICT DO NOTHING`, orden
  consecutivo y retorno de la cantidad insertada.
- `REVOKE`/`GRANT` para `authenticated` y `NOTIFY pgrst, 'reload schema'`.

## Admin

- `app/admin/lives/actions.ts`: nueva Server Action
  `addProductsToLiveSession()`; mensajes visibles migrados a "Live".
- `components/admin/LiveProductPicker.tsx`: selector masivo con búsqueda,
  filtro por categoría, "seleccionar visibles", chips de seleccionados,
  precio Live persistente, descuento y bloqueo de productos ya agregados.
- `app/admin/lives/[id]/editar/page.tsx`: consulta `live_price`, categorías y
  tiendas; integra el picker; conserva la edición de sesión, control de estado
  y acciones de producto.
- `components/admin/HotPromoForm.tsx`: "Precio Live" y feedback de guardado.
- `app/admin/lives/page.tsx`: listado en tarjetas, banner de sesión activa,
  accesos a Studio/editar y estado "Vencida".
- `app/admin/lives/nuevo/page.tsx`: creación de sesión Live.
- `components/admin/AdminSidebar.tsx`: "Modo Live" y "Sesiones Live".
- `components/admin/Icons.tsx`: `BroadcastIcon` reemplazado por un ícono de
  transmisión real.
- `app/admin/lives/[id]/studio/page.tsx`: acciones rápidas en móvil, búsqueda
  de productos, tarjetas responsive, porcentaje de descuento y etiquetas Live.
- `components/admin/AddHotProductForm.tsx`: eliminado por quedar reemplazado
  por el selector masivo.

## Público

- `components/shop/HotHome.tsx`: experiencia compacta con cabecera Live,
  producto en pantalla, precio/ahorro, CTA de WhatsApp y catálogo Live.
- `components/shop/LiveProductCard.tsx` y `LiveProductGrid.tsx`: tarjetas y
  grilla enfocadas en precio Live y pedido por WhatsApp.
- `components/shop/HotBanner.tsx`: banner compacto reutilizado en catálogo,
  categorías, destacados, novedades y ofertas.
- `components/ui/LiveBadge.tsx` y `components/ui/TikTokIcon.tsx`: identidad Live
  compartida (variantes solid/soft/inverse).
- `components/layout/Header.tsx`: barra Live con badge TikTok y cuenta regresiva.
- `components/layout/Footer.tsx` y `BottomNav.tsx`: enlaces/indicador Live.
- `components/shop/WhatsAppOrderButton.tsx`: modo `compact` y etiqueta
  configurable.
- `components/ui/ProductCard.tsx`: badge "Live" y precio promocional.
- `app/(shop)/page.tsx`: retorno temprano a `HotHome` cuando hay sesión activa.
- `app/(shop)/ofertas/page.tsx` y `app/(shop)/productos/[slug]/page.tsx`:
  textos y bloques de precio Live, con ícono TikTok en la ficha.

## Verificación

- `npx tsc --noEmit` → 0 errores.
- `npm run build` → compila correctamente; 49 rutas generadas. Se mantiene el
  aviso preexistente `Failed to load dynamic font for ✦`.
- Smoke test con `next start`: `/`, `/productos` y `/ofertas` responden HTTP 200.
- Ejecución verificada contra Supabase: `products.live_price` responde por
  PostgREST (2026-10-26).
- SQL Fix 0022 probado en un contenedor PostgreSQL 16 desechable con un esquema
  mínimo: columna/constraint, precio persistente, precio explícito, precio
  inválido ignorado, carga masiva idempotente, limpieza de precio y validación
  de rango.
- ESLint conserva la deuda histórica de `no-explicit-any` y `<img>` en el
  patrón admin existente; no se agregaron errores nuevos.

## Cierre de la migración

1. [x] Ejecutar `supabase/sql/ejecucion.sql` en Supabase.
2. [x] Marcar `ejecucion.sql` como `EJECUTADO` y vaciarlo.
3. [x] Registrar Fix 0022 en `supabase/sql/migraciones.sql`.
4. [x] Reflejar `live_price` y las RPCs en `supabase/sql/esquema.sql`.
5. [ ] Smoke test manual del admin contra la base real: agregar varios
   productos, editar precio Live, recargar y comprobar persistencia.
6. [ ] Crear/activar una sesión Live y revisar la home pública en móvil.

## Deuda conocida

- Validar el precio Live en el servidor al crear la solicitud de WhatsApp
  (el endpoint actual sigue recibiendo el precio desde el cliente).
- Revisar si conviene exponer `products.live_price` en la ficha cuando no hay
  sesión activa; hoy solo se usa dentro de sesiones.
