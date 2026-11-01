# Bitácora 15 — Modo Hot (Fase 1)

Fecha: 2026-10-26
Estado: EJECUTADO (2026-10-26)
Módulo: Admin / Campañas Hot / Home / Catálogo / Ficha de producto / Layout global

## Objetivo

Implementar una campaña global **Modo Hot**: el admin activa una campaña con
duración, productos y precios Hot; la tienda pública cambia temporalmente a una
experiencia Hot con cuenta regresiva, producto en pantalla, secciones de productos
mostrados/disponibles y CTA de WhatsApp. Al terminar el tiempo, la tienda vuelve
automáticamente a su estado normal.

Esta fase **no** modifica carrito, checkout, cookies, imágenes ni identidad visual.

## Reglas de negocio

- Solo puede existir **una campaña activa** a la vez (`status='live'`).
- Una campaña está activa si `status='live'` y `ends_at` es nulo o futuro.
- Pausar suspende Modo Hot; reanudar conserva `started_at` y recalcula `ends_at`
  desde el inicio original.
- Una campaña pausada que ya venció no se puede reanudar: debe finalizarse y
  crearse una nueva.
- `current_product_id` define el producto en pantalla; al mostrarlo se marca
  `shown_at` la primera vez.
- Precio normal = `discount_price ?? price`.
- El precio Hot (`promo_price`) solo aplica si es menor al precio normal.
- El precio Hot nunca modifica `products.price`.
- El catálogo público solo muestra productos Hot con stock > 0 y estado
  `available` o `requested`.
- No se usa Realtime ni polling público: la tienda se refresca al vencer el
  contador y al volver a la pestaña (`focus`/`visibilitychange`).

## SQL — Fix 0021 (EJECUTADO 2026-10-26)

Registrado en `supabase/sql/migraciones.sql` y reflejado en
`supabase/sql/esquema.sql`.

### Columnas

`live_sessions`:
- `ends_at TIMESTAMPTZ`
- `duration_hours INTEGER` (check > 0)
- `ended_reason TEXT` (check `manual` | `expired`)
- check `ends_at > started_at`

`live_products`:
- `promo_price NUMERIC` (check >= 0)
- `shown_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ` (necesario para el trigger `trg_update_updated_at`
  que ya existía en el esquema pero apuntaba a una columna inexistente)

### Índices y constraints

- Backfill de `live_products` desde `live_session_products` con deduplicación.
- `UNIQUE (session_id, product_id)` en `live_products`.
- Índice parcial `idx_live_sessions_active`.
- Índice único parcial `uniq_live_session_active ((true)) WHERE status='live'`
  para garantizar una sola campaña activa.

### RLS

- Política pública de lectura de `live_sessions` activas:
  `status='live' AND (ends_at IS NULL OR ends_at > now())`.
- Las políticas admin existentes se mantienen.

### RPCs (`SECURITY DEFINER`)

Todas validan `app_metadata.role='admin'` con `is_hot_admin()`, usan
`search_path = public, pg_temp`, revocan `PUBLIC`/`anon` y otorgan `authenticated`:

- `activate_hot_session(p_session_id, p_duration_hours DEFAULT NULL)`
- `set_hot_current_product(p_session_id, p_product_id)`
- `add_hot_product(p_session_id, p_product_id, p_order DEFAULT 0, p_promo_price DEFAULT NULL)`
- `update_hot_product_promo(p_session_id, p_product_id, p_promo_price)`
- `remove_hot_product(p_session_id, p_product_id)`

`is_hot_admin()` es interna (`SECURITY INVOKER`, `search_path = ''`), valida
`auth.jwt() -> 'app_metadata' ->> 'role'` y no se otorga a `PUBLIC`, `anon` ni
`authenticated`. Los RPCs `SECURITY DEFINER` la invocan como owner.

## Admin

- `app/admin/lives/actions.ts`: Server Actions para crear/editar/eliminar campaña,
  agregar/quitar producto, editar precio Hot, mostrar producto, cambiar estado y
  activar/pausar/reanudar/finalizar. Las mutaciones Hot revalidan
  `revalidatePath("/", "layout")` y las rutas admin.
- `app/admin/lives/nuevo/page.tsx`: creación con título, tienda y duración.
- `app/admin/lives/page.tsx`: listado con productos, mostrados, inicio, término,
  estado “Vencida” y acciones rápidas.
- `app/admin/lives/[id]/editar/page.tsx`: datos de campaña, panel de control,
  productos, precio Hot, mostrar/quitar de pantalla y eliminar.
- `app/admin/lives/[id]/studio/page.tsx`: panel de campaña en vivo. Usa Server
  Actions, cuenta regresiva, refresco cada 10 s pausado cuando la pestaña no está
  visible, y ya no reinicia una campaña finalizada a `not_started`.
- `types/database.ts`: columnas nuevas, `StoreProfilesTable` corregido a snake_case
  (`reviews_count`, `customers_served`, etc.) y firmas de las RPCs Hot.

## Público

- `lib/hot.ts`: tipos, mapeo, reglas de precio, secciones (current/shown/rest/
  topDiscounts), countdown y helpers de expiración.
- `lib/live.ts`: `getActiveHotCampaign()` cacheado por request.
- `components/layout/ShopLayout.tsx`: obtiene la campaña una vez y la comparte con
  Header/Footer/BottomNav; renderiza `HotModeSync`.
- `components/layout/Header.tsx`: banner “MODO HOT” + cuenta regresiva.
- `components/layout/Footer.tsx` y `BottomNav.tsx`: indicador Hot.
- `components/layout/HotCountdown.tsx`: contador cliente seguro para hidratación.
- `components/shop/HotModeSync.tsx`: refresco al vencer y al enfocar la pestaña.
- `components/ui/ProductCard.tsx`: `promoPrice` opcional, badge Hot y precio Hot
  con precio normal tachado.
- `components/shop/HotProductGrid.tsx`, `HotBanner.tsx`, `HotHome.tsx`.
- Home: reemplaza hero/destacados/novedades por la experiencia Hot cuando hay
  campaña; mantiene categorías, testimonios, beneficios y escudo.
- Catálogo, categoría, destacados, novedades y ofertas: banner Hot + precios Hot.
  Ofertas agrega una sección con los mayores descuentos Hot y conserva las ofertas
  regulares.
- Ficha de producto: precio Hot + CTA de WhatsApp + cuenta regresiva. Se mantiene
  el bloque normal de carrito al precio regular, separado y etiquetado.
- `getActiveHotCampaign()` usa `await connection()` para forzar render por request;
  así `productos/[slug]` y `categorias/[slug]` no quedan servidas desde una página
  SSG con ISR cuando se activa una campaña.

## Verificación

- `npx tsc --noEmit` → 0 errores.
- `npm run build` → compila OK; las 49 rutas se generan y todas las rutas de
  tienda quedan dinámicas (ƒ). Aparece el aviso preexistente
  `Failed to load dynamic font for ✦` durante la generación estática.
- SQL probado en contenedor Docker `postgres:16` desechable (eliminado después):
  sintaxis válida, idempotente al reejecutar, backfill/deduplicación, RLS,
  restricciones, una sola campaña activa, cierre de campaña vencida, pausa/
  reanudación, producto actual, precio Hot, quitar producto y rechazo a usuarios
  no admin.
- `npm run lint` sigue reportando la deuda histórica del proyecto
  (`no-explicit-any`, `<img>`, etc.). En los archivos Hot se corrigieron los
  errores nuevos de pureza y `set-state-in-effect`; quedan `no-explicit-any` en
  el patrón admin existente.
- Smoke test público posterior a la ejecución SQL (2026-10-26): `/`, `/productos`,
  `/ofertas` y una ficha real de producto responden HTTP 200 con `next start`.

## Cierre de la migración

1. [x] `supabase/sql/ejecucion.sql` ejecutado en Supabase (2026-10-26).
2. [x] `ejecucion.sql` marcado como `EJECUTADO` y vaciado.
3. [x] Fix 0021 registrado en `supabase/sql/migraciones.sql`.
4. [x] Columnas, índices, políticas y RPCs reflejados en `supabase/sql/esquema.sql`.
5. [ ] Smoke test manual del flujo completo (crear campaña, activar, pausar,
   reanudar, vencer y finalizar) contra la base real.

## Deuda Fase 2

- Validar el precio Hot en servidor al crear la solicitud de WhatsApp. Hoy
  `/api/whatsapp-request/create` recibe `productPrice` del cliente y solo guarda
  el lead.
- Revisar integridad de precios en carrito/checkout (fuera de alcance de Fase 1).

## Continuación

La Fase 2 de esta funcionalidad (rebranding a Modo Live, precio Live persistente
y carga masiva) se documenta en `docs_migracion/16-modo-live.md`.
