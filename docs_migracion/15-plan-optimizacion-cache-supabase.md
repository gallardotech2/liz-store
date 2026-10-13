# 15 — Plan de optimización de caché y consultas a Supabase

**Estado general:** COMPLETADO (Fases 1 y 2) — pendiente deploy y medición opcional
**Prioridad:** alta (reduce consumo del free tier de Supabase)
**Fecha inicio:** 2026-07-20
**Regla dura:** NO tocar cookies ni el flujo del carrito (`liz_cart`, `lib/cart.ts`, `carrito/actions.ts`). Cualquier cambio que toque cookies se documenta aquí y NO se aplica sin decisión explícita del propietario.

---

## Hallazgos (medidos en vivo sobre lizstore.site)

| Recurso | Cache-Control real | Veredicto |
|---|---|---|
| CSS `/_next/static/...css` | `public, max-age=31536000, immutable` | OK (cacheado en Vercel) |
| Imagen Supabase Storage | `no-cache` | A mejorar (cacheControl en upload) |

- **Todas las páginas públicas son dinámicas (SSR por request)** pese a `export const revalidate = 3600`.
  - Causa: `app/(shop)/layout.tsx` y `components/layout/ShopLayout.tsx` usan `cookies()` (cart count), lo que vuelve dinámica toda la ruta y anula el ISR.
  - Evidencia: `.next/prerender-manifest.json` solo tiene `/_global-error`, `/_not-found`, `/favicon.ico`.
- Shell: 3 queries por cada visita (`categories`, `store_profiles`, `social_links`).
- Home: 6 queries en `Promise.all`, incluye `store_profiles` que **no se usa** (`_storeProfileResult`).

---

## Evaluación de riesgo por cambio

| Cambio | ¿Rompe algo? | Mitigación |
|---|---|---|
| `cacheControl` en upload | No. Solo imágenes nuevas. | — |
| Quitar query `_storeProfileResult` del home | No. Prefijada `_`, sin referencias. | — |
| Borrar `lib/queries/store.ts` | No. 0 imports. | — |
| Polling studio 5s→30s | Cambio de comportamiento (admin ve métricas cada 30s). | Pausa en pestaña oculta (`document.hidden`). |
| `unstable_cache` en shell | Posible dato obsoleto si no se invalida. | `revalidateTag` en actions + RLS anon (ya usado hoy). |
| `ShopLayout` sin `createClient` | No. Solo se usaba para 2 queries. | — |
| Server action en social-links | Cambia el guardado del admin (antes cliente). | `requireAdmin` + misma tabla/RLS + `revalidateTag`. |

---

## Fase 1 — Cambios seguros

- [x] **1.1** `lib/supabase/storage.ts` — añadir `cacheControl: "31536000"` al `.upload()`.
- [x] **1.2** `app/(shop)/page.tsx` — eliminar `_storeProfileResult` y su query a `store_profiles` (6→5 queries).
- [x] **1.3** Borrar `lib/queries/store.ts` (código muerto) + quitar su re-export en `lib/queries/index.ts`.
- [x] **1.4** `app/admin/lives/[id]/studio/page.tsx` — polling 5s→30s + no consultar si `document.hidden`.

## Fase 2 — Cachear el shell con `unstable_cache`

> Las funciones cacheadas NO reciben el cliente Supabase (no serializable). Crean su propio `createStaticClient()` interno (anon, sin cookies). Se conservan las versiones actuales que reciben cliente para el admin/checkout.
> Nota Next 16.3.8: `revalidateTag(tag)` exige 2º argumento; para Server Actions se usa `updateTag(tag)`.

- [x] **2.1** `lib/queries/store-profile.ts` — `getOrderWhatsAppNumberCached` (tag `store-profile`, revalidate 3600 → **60**, ver Fix 0001).
- [x] **2.2** `lib/queries/social-links.ts` — `getWhatsappGroupLinkCached` (tag `social-links`, revalidate 3600 → **60**, ver Fix 0001).
- [x] **2.3** `lib/queries/categories.ts` — `getShopCategoriesMenu` cacheado (tag `categories`, revalidate 3600 → **60**, ver Fix 0001).
- [x] **2.4** `components/layout/ShopLayout.tsx` — usar los 3 helpers cacheados; quitar `createClient()`.
- [x] **2.5** `app/(shop)/layout.tsx` — usar `getShopCategoriesMenu()`.
- [x] **2.6** `updateTag` en `app/admin/store/actions.ts` (`store-profile`) y `app/admin/categories/actions.ts` (`categories`).
- [x] **2.7** `app/admin/social-links/actions.ts` (nueva server action) + `updateTag("social-links")`; actualizado `app/admin/social-links/page.tsx`.

## Verificación

- [x] `npx tsc --noEmit` limpio
- [x] `npm run build` OK
- [ ] (Opcional) medir HTML de home tras deploy: confirmar queries del shell ya cacheadas

---

## Fix 0001 — Invalidación de caché del shell (2026-10-12)

**Síntoma:** tras guardar el link del grupo de WhatsApp en el admin, el botón del footer seguía abriendo el fallback `https://wa.me/<número>` en vez de `chat.whatsapp.com/...`.

**Causa raíz:**
1. `getWhatsappGroupLinkCached` cacheó `""` con `revalidate: 3600` **antes** de que existiera la URL en la BD.
2. Al guardar, `saveSocialLink` llamó `updateTag("social-links")`, pero **la invalidación por tag no es fiable en `next dev`**: el `cache-tags-manifest` que mapea tag→entrada se genera en `next build`, no en dev; y el `tagsManifest` vive en memoria del proceso.
3. `FileSystemCache.memoryCache` seguía sirviendo `""` aunque se borrara el archivo en disco → el footer quedaba en fallback hasta 1h (fin del `revalidate`).

**Hallazgo clave en el código de Next 16.3.8:** `updateTag` y `revalidatePath` usan **el mismo mecanismo** (`revalidate()` → `pendingRevalidatedTags` → `tagsManifest` en memoria). Por eso en dev ninguno de los dos purga de forma fiable; el único auto-saneamiento garantizado es el `revalidate` por tiempo (`unstable_cache` re-ejecuta en background cuando `isStale`).

**Alcance:** mismo patrón en las 3 helpers (`social-links`, `store-profile`, `categories`) — todas podían quedar stale en dev.

**Solución aplicada:**
- Red de seguridad: `revalidate` 3600 → **60s** en las 3 helpers. Peor caso en dev: 1 min de dato viejo. Sigue reduciendo ~98% las queries del shell a Supabase.
- Invalidación explícita (instantánea en prod): `updateTag(tag)` + `revalidatePath("/", "layout")` en las 3 actions. Se usa el path raíz con tipo `layout` porque el footer/nav se renderizan en el layout y aparecen en todas las páginas shop (los route groups como `/(shop)` no son URLs válidas para `revalidatePath`).

**Verificado:** reinicio del dev server → footer mostró `chat.whatsapp.com/H453JHnfHOh1alA1Q04rBK` y se reescribió el entry de caché con la URL correcta. `npx tsc --noEmit` limpio.

**Nota pendiente:** validar en Vercel que `updateTag` pura el Data Cache al guardar en el admin (en dev requiere reiniciar el server; el `revalidate` de 60s cubre el peor caso).

---

## Fuera de alcance (NO hacer sin OK del propietario)

- **Fase 3 (descartada):** recuperar ISR real sacando `cookies()` del layout. Implica tocar cookies/carrito → rompe auth si se hace mal. NO tocar.
