# AUDITORÍA TÉCNICA INTEGRAL PREVIA A PRODUCCIÓN — ESCUDO MARKET (LIZ STORE)

**Fecha:** 2026-07-19
**Auditor:** Equipo multidisciplinario (Security, React, Supabase, Vercel, Full Stack, DevSecOps, QA, Performance, UX/UI, Accesibilidad, DB, OWASP)
**Versión proyecto:** Next.js 16.2.10 / React 19.2.4 / Supabase / Vercel
**Estado general:** ⚠️ **FUNCIONAL EN DESARROLLO — NO LISTO PARA PRODUCCIÓN**

---

## 1. RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|-------|
| **Bloqueadores críticos** | 6 |
| **Riesgos altos** | 8 |
| **Riesgos medios** | 14 |
| **Riesgos bajos** | 7 |
| **Tiempo estimado fixes críticos** | 3-4 horas |
| **Tiempo estimado auditoría completa** | 8-10 horas |

**Conclusión:** La aplicación funciona correctamente en entorno de desarrollo (ISR, auth, carrito, admin CRUD). **No está lista para producción** por exposición de secretos críticos, checkout roto, ausencia de middleware de autenticación, riesgos XSS y violaciones de accesibilidad.

---

## 2. INVENTARIO TÉCNICO (FASE 1)

### Stack confirmado
- **Framework:** Next.js 16.2.10 (App Router), React 19.2.4, TypeScript strict
- **Styling:** Tailwind CSS v4 (CSS variables, sin `tailwind.config.js`)
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Auth:** `@supabase/ssr` (Server Client, Browser Client, Middleware pattern)
- **Despliegue:** Vercel (ISR `revalidate=3600`, `prefetch=false`)
- **Feature flags:** `ESCUDO_PAGO_ENABLED=false` (`lib/features.ts`)

### Estructura del proyecto
```
app/                    # App Router pages
  (shop)/               # Route group público (home, productos, categorias, carrito, checkout, faq)
  admin/                # Panel admin protegido (dashboard, products, categories)
  auth/                 # Login / Registro
  api/                  # API routes (auth/login, auth/register, check-admin, check-db)
components/
  ui/                   # ProductCard, CategoryCard, Button
  admin/                # AdminShell, Sidebar, Navbar, ProductForm, CategoryForm, ImageDropzone, Charts
  auth/                 # GoogleButton, PasswordInput
  layout/               # Header, Footer, ShopLayout
  shop/                 # CatalogFilters
lib/
  supabase/             # client.ts, server.ts, static.ts, middleware.ts, storage.ts
  queries/              # products, categories, orders, reviews, profiles, store
  cart.ts               # Cookie-based cart (30 días, sin firma)
  checkout.ts           # Validación, totales, creación order + order_items
  escudo-pago.ts        # Hold/release/refund transactions (pendiente activación)
  utils.ts              # cn(), formatCurrency, slugify, generateSKU
  features.ts           # Feature flags
  constants.ts          # Constantes compartidas
types/
  database.ts           # 786 líneas - Types completos de 17 tablas Supabase
supabase/sql/
  esquema.sql           # Source of truth (507 líneas - schema + RLS + storage + grants)
  migraciones.sql       # Historial 9 migraciones (Fix 0001-0009)
  ejecucion.sql         # Staging (actualmente EJECUTADO/vacío)
docs_migracion/         # 7 bitácoras de migración
```

### Base de datos (17 tablas)
| Tabla | Propósito | RLS |
|-------|-----------|-----|
| `profiles` | Extensión `auth.users` (role, phone, avatar) | ✅ Propio + admin |
| `addresses` | Direcciones usuario | ✅ Propio + admin |
| `categories` | Catálogo categorías | ✅ Público activas + admin |
| `products` | Productos | ✅ Público activos + admin |
| `product_images` | Galería productos | ✅ Público + admin |
| `orders` | Pedidos (guest + user) | ✅ Propio + anon INSERT + admin |
| `order_items` | Líneas de pedido | ✅ Propio via orders + admin |
| `transactions` | Escudo Pago (hold/release/refund) | ✅ Propio + admin |
| `payment_methods` | Métodos de pago | ✅ Público activos + admin |
| `qr_payments` | QR codes por método | ✅ Público activos + admin |
| `reviews` | Reseñas productos | ✅ Público aprobadas + auth INSERT + admin |
| `review_images` | Imágenes reseñas | ✅ Público + admin |
| `store_profiles` | Config tienda (QR, cuenta bancaria) | ✅ Público + admin |
| `live_sessions` | Live shopping | ✅ Público activas + admin |
| `live_session_products` | M:N sesión-producto | ✅ Público + admin |
| `live_products` | Estado producto en live | ✅ Público + admin |
| `product_interests` | Tracking interés (whatsapp, view, cart, checkout) | ✅ Anon INSERT + admin SELECT |

### Storage Buckets (3)
| Bucket | Público | Políticas |
|--------|---------|-----------|
| `product-images` | ✅ | Anon SELECT, Admin INSERT/DELETE |
| `reviews` | ✅ | Anon SELECT, Auth INSERT |
| `live` | ✅ | Anon SELECT, Admin INSERT |

### Variables de entorno
| Variable | Tipo | Estado |
|----------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | ✅ Correcta |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | ✅ Correcta |
| `SUPABASE_SERVICE_ROLE_KEY` | **SECRETA** | 🔴 **EXPUESTA EN REPO** |
| `NEXT_PUBLIC_SITE_URL` | Pública | ✅ Correcta |
| `VERCEL_OIDC_TOKEN` | **SECRETA** | 🔴 **EXPUESTA EN REPO** |

---

## 3. HALLAZGOS CLASIFICADOS POR CRITICIDAD

### 🔴 CRÍTICO (Bloquean producción)

| ID | Hallazgo | Causa | Riesgo | Archivo/Línea |
|----|----------|-------|--------|---------------|
| **S1** | **Service Role Key commiteada en `.env.local`** | Archivo no en `.gitignore` (sí lo está) pero **sí commiteado al historial git** | Acceso total a BD (bypass RLS, borrar datos, crear admins, leer auth) | `.env.local:3` |
| **S2** | **VERCEL_OIDC_TOKEN commiteado** | Token de despliegue largo vivo en repo | Toma de control del proyecto en Vercel, acceso a secrets, logs, dominios | `.env.local:7` |
| **S3** | **Middleware de auth ausente** | No existe `middleware.ts` en raíz; `lib/supabase/middleware.ts` no se usa | Sesiones no se refrescan, auth state inconsistente, logout roto en edge | **Archivo faltante** |
| **S4** | **Checkout roto: `/api/checkout` no existe** | `CheckoutForm.tsx:134` hace `fetch("/api/checkout")` pero route no existe | **Compra imposible en producción** — 404 al enviar pedido | `app/(shop)/checkout/CheckoutForm.tsx:134` |
| **S5** | **XSS via `dangerouslySetInnerHTML` sin sanitizar** | `long_description` de BD renderizado directo | Inyección HTML/JS si admin malicioso o BD comprometida | `app/(shop)/productos/[slug]/page.tsx:310` |
| **S6** | **Viewport deshabilita zoom** (`maximumScale=1, userScalable=false`) | Config en `viewport` export | Viola WCAG 1.4.4 (Resize text), inaccesible para baja visión | `app/layout.tsx:34-35` |

### 🟠 ALTO

| ID | Hallazgo | Causa | Riesgo | Archivo/Línea |
|----|----------|-------|--------|---------------|
| **S7** | **RLS `orders`: anon INSERT sin validar ownership** | Policy `Orders: anon INSERT` permite `user_id` arbitrario | Guest checkout puede crear pedidos atribuidos a otros usuarios | `supabase/sql/esquema.sql:419-422` |
| **S8** | **RLS `order_items`: INSERT sin validar order ownership** | Policy `Order Items: INSERT` con `WITH CHECK (true)` | Inyección de líneas en pedidos ajenos | `supabase/sql/esquema.sql:425-427` |
| **S9** | **Cart cookie sin firma/encriptación** | `lib/cart.ts:28-34` guarda JSON plano en cookie | Manipulación client-side: precios, cantidades, productos inexistentes | `lib/cart.ts`, `app/(shop)/carrito/actions.ts` |
| **S10** | **Trigger `handle_new_user` setea `raw_user_meta_data` pero admin verifica `app_metadata`** | Desync entre metadata auth | Usuario admin creado vía SQL no tiene role en `app_metadata` → acceso denegado | `supabase/sql/esquema.sql:374-382` vs `app/admin/layout.tsx:29` |
| **S11** | **Contraste insuficiente** (`#888888` sobre `#FDF8F6` = 3.1:1) | Paleta de grises claros | Viola WCAG AA (mín 4.5:1 texto normal) | Global (`globals.css`, componentes) |
| **S12** | **Validación upload imágenes solo client-side** | `ImageDropzone.tsx:22-32` chequea MIME/size; servidor confía | Bypass subiendo archivo >5MB o tipo no permitido (ej. .svg, .php) | `lib/supabase/storage.ts:26-28` |
| **S13** | **No rate limiting en auth endpoints** | `/api/auth/login`, `/api/auth/register` sin protección | Fuerza bruta, enumeração de emails, DoS | `app/api/auth/login/route.ts`, `register/route.ts` |
| **S14** | **Google OAuth botón visible pero deshabilitado** | `GoogleButton.tsx:8-24` `disabled` + badge "Próximamente" | Confusión UX, expectation mismatch | `components/auth/GoogleButton.tsx` |

### 🟡 MEDIO

| ID | Hallazgo | Archivo/Línea |
|----|----------|---------------|
| **F1** | `supabase as any` casting extensivo (pierde type safety) | `app/(shop)/page.tsx:15`, `productos/[slug]/page.tsx:63`, `carrito/page.tsx:57`, `checkout/page.tsx:22` |
| **F2** | `revalidate=3600` hardcoded (no configurable por env) | Todas las páginas `(shop)` |
| **F3** | `CheckoutForm` 50+ `useState` — candidato a `useReducer` / hooks extraídos | `components/(shop)/checkout/CheckoutForm.tsx:38-59` |
| **F4** | WhatsApp number hardcoded (`59176426643`) | `CheckoutForm.tsx:97`, `app/(shop)/page.tsx:115` |
| **F5** | Mapa delivery placeholder ("Mapa no disponible") | `CheckoutForm.tsx:313-318` |
| **F6** | `ProductCard` Link `href="#"` para add-to-cart (no funcional) | `components/ui/ProductCard.tsx:59-65` |
| **F7** | Mobile menu usa `document.body.style.overflow` (posible hydration mismatch) | `components/layout/Header.tsx:46-55` |
| **F8** | Product detail: 3 queries secuenciales (product, reviews, related) — paralelizable | `app/(shop)/productos/[slug]/page.tsx:65-163` |
| **F9** | Homepage `product_counts` trae todos los productos (ineficiente) | `app/(shop)/page.tsx:34` |
| **F10** | Falta índice compuesto `products(category_id, is_active)` | `supabase/sql/esquema.sql:315-316` solo índices individuales |
| **F11** | `order_items.product_id` nullable → huérfanos si producto borrado | `supabase/sql/esquema.sql:138` |
| **F12** | `reviews` unique `(product_id, user_id)` impide re-review | `supabase/sql/esquema.sql:214` |
| **F13** | Focus visible inconsistente entre componentes | `Button.tsx`, `PasswordInput.tsx`, forms |
| **F14** | `prefetch={false}` en todos los Links (correcto para Vercel pero desactiva prefetch legítimo) | Generalizado |

### 🟢 BAJO

| ID | Hallazgo | Archivo/Línea |
|----|----------|---------------|
| **P1** | Bundle limpio (8 deps prod), sin dead code evidente | `package.json` |
| **P2** | `next.config.ts` `optimizePackageImports` solo supabase-js — OK | `next.config.ts:19` |
| **P3** | Cart cookie 30 días — razonable | `lib/cart.ts:24` |
| **P4** | Images: `priority` en main + `loading=lazy` en thumbnails — correcto | `ProductCard.tsx:84`, `productos/[slug]/page.tsx:195` |
| **P5** | `transactions.order_id UNIQUE` — correcto para Escudo Pago | `supabase/sql/esquema.sql:153` |
| **P6** | Grants column-level en `profiles` — bien implementado | `supabase/sql/esquema.sql:500-503` |
| **P7** | Escudo Pago oculto con feature flag — sin dead code | `lib/features.ts`, `CheckoutForm.tsx` |

---

## 4. PLAN DE CORRECCIÓN PRIORIZADO (SPRINTS)

### SPRINT 1 — CRÍTICOS (Bloquean producción) — ~3.5h

| # | Tarea | Archivos | Verificación |
|---|-------|----------|--------------|
| 1 | **Rotar `SUPABASE_SERVICE_ROLE_KEY`** en Supabase Dashboard → actualizar solo en Vercel Env Vars (NO en repo) | `.env.local` (eliminar línea), Vercel Dashboard | `git log --all --full-history -- .env.local` muestra historia; secret revocado en Supabase |
| 2 | **Rotar `VERCEL_OIDC_TOKEN`** en Vercel Dashboard → actualizar solo en Vercel | `.env.local` (eliminar línea), Vercel Dashboard | Token viejo inválido en Vercel |
| 3 | **Crear `middleware.ts` en raíz** para refrescar sesión auth | `middleware.ts` (nuevo) | Login/logout funciona; sesión persiste en navigation |
| 4 | **Crear `app/api/checkout/route.ts`** wrapper de `checkoutAction` | `app/api/checkout/route.ts` (nuevo) | POST `/api/checkout` devuelve `{ url: "/checkout/{id}/success?order=..." }` |
| 5 | **Sanitizar `dangerouslySetInnerHTML`** con `DOMPurify` (solo tags seguros) | `app/(shop)/productos/[slug]/page.tsx:310`, `package.json` + `npm i dompurify @types/dompurify` | HTML malicioso en `long_description` neutralizado |
| 6 | **Quitar `maximumScale=1, userScalable=false`** del viewport | `app/layout.tsx:34-35` | Zoom habilitado en móvil/desktop; Lighthouse a11y pass |

### SPRINT 2 — ALTOS (Seguridad/UX crítica) — ~4h

| # | Tarea | Archivos | Verificación |
|---|-------|----------|--------------|
| 7 | **Firmar cart cookie** con `iron-session` (o JWT) | `lib/cart.ts`, `app/(shop)/carrito/actions.ts`, `package.json` + `npm i iron-session` | Cookie manipulada client-side → error firma / descarte |
| 8 | **Validación servidor upload imágenes** (magic bytes, size, tipo) | `lib/supabase/storage.ts`, `components/admin/ImageDropzone.tsx` | Archivo >5MB o .svg/.php → reject 400 |
| 9 | **Corregir trigger `handle_new_user`** para setear `app_metadata.role` | `supabase/sql/esquema.sql:374-382` (ejecutar en Supabase SQL Editor) | Admin creado via SQL → acceso dashboard OK |
| 10 | **Rate limiting** en `/api/auth/*` (Upstash Redis o `next-rate-limit`) | `app/api/auth/login/route.ts`, `register/route.ts`, `package.json` | 10 req/min/IP → 429 |
| 11 | **Endurecer RLS `orders`/`order_items` INSERT** — validar ownership via `session_key` o `user_id` = `auth.uid()` | `supabase/sql/esquema.sql:419-427` (migración) | Guest checkout crea order con `session_key`; no puede setear `user_id` ajeno |
| 12 | **Subir contraste textos grises** `#888888` → `#6B6B6B` (4.5:1) | `app/globals.css`, componentes Tailwind | Lighthouse/axe: contraste pass |

### SPRINT 3 — MEDIOS (Calidad/Performance) — ~3.5h

| # | Tarea | Archivos | Verificación |
|---|-------|----------|--------------|
| 13 | **Eliminar `as any` casts** — tipar queries con `Database` types | `app/(shop)/page.tsx`, `productos/[slug]/page.tsx`, `carrito/page.tsx`, `checkout/page.tsx` | `npm run build` sin errors; `tsc --noEmit` limpio |
| 14 | **Paralelizar queries product detail** (`Promise.all`) | `app/(shop)/productos/[slug]/page.tsx:65-163` | TTFB ↓ ~200ms |
| 15 | **Agregar índice compuesto** `products(category_id, is_active)` | `supabase/sql/ejecucion.sql` (migración) | `EXPLAIN ANALYZE` muestra index scan |
| 16 | **Crear `vercel.json`** con security headers | `vercel.json` (nuevo) | `curl -I` muestra CSP, HSTS, X-Frame-Options, Referrer-Policy |
| 17 | **WhatsApp number a env var** | `lib/constants.ts` (nuevo), `CheckoutForm.tsx`, `app/(shop)/page.tsx` | Cambio en Vercel env → refleja sin deploy |
| 18 | **Refactor `CheckoutForm` estado** (`useReducer` + hooks extraídos) | `components/(shop)/checkout/CheckoutForm.tsx` | < 25 `useState`; lógica testable |
| 19 | **ProductCard add-to-cart real** (Server Action) | `components/ui/ProductCard.tsx:59-65`, `lib/cart.ts` | Click → toast "Agregado" + badge carrito actualiza |
| 20 | **`revalidate` configurable por env** | `lib/constants.ts`, páginas `(shop)` | `NEXT_PUBLIC_REVALIDATE=60` dev / `3600` prod |

### SPRINT 4 — BAJOS (Pulido) — ~2h

| # | Tarea | Archivos | Verificación |
|---|-------|----------|--------------|
| 21 | **Mobile menu sin `document.body.style`** (CSS `overflow: hidden` en `[data-menu-open]`) | `components/layout/Header.tsx:46-55` | Sin hydration warning; menú abre/cierra fluido |
| 22 | **Mapa delivery** — integrar Leaflet/OpenStreetMap (gratis) | `components/(shop)/checkout/CheckoutForm.tsx:313-318` | Mapa interactivo funcional |
| 23 | **Focus visible consistente** (`focus-visible:ring-2 focus-visible:ring-primary`) | `components/ui/Button.tsx`, `components/auth/PasswordInput.tsx`, forms | Tab navigation muestra foco claro en todos inputs/botones |
| 24 | **`npm audit` + actualizar deps menores** | `package.json` | `npm audit` 0 vulnerabilities |

---

## 5. ARCHIVOS A CREAR / MODIFICAR (RESUMEN)

### Nuevos archivos
| Archivo | Propósito |
|---------|-----------|
| `middleware.ts` | Auth session refresh (raíz) |
| `app/api/checkout/route.ts` | Endpoint checkout (wrapper Server Action) |
| `vercel.json` | Security headers, rewrites |
| `lib/constants.ts` | Constantes configurables (revalidate, whatsapp, shipping) |
| `components/(shop)/checkout/CheckoutForm.tsx` (refactor) | Estado con `useReducer`, hooks extraídos |

### Archivos a modificar (críticos)
| Archivo | Cambio |
|---------|--------|
| `.env.local` | **Eliminar** `SUPABASE_SERVICE_ROLE_KEY` y `VERCEL_OIDC_TOKEN` |
| `app/layout.tsx:34-35` | Quitar `maximumScale=1, userScalable=false` |
| `app/(shop)/productos/[slug]/page.tsx:310` | Sanitizar `dangerouslySetInnerHTML` |
| `lib/supabase/storage.ts` | Validación servidor (magic bytes, size, tipo) |
| `supabase/sql/esquema.sql` | Migraciones: trigger `app_metadata`, RLS orders/order_items, índice compuesto |
| `app/api/auth/login/route.ts`, `register/route.ts` | Rate limiting |
| `app/globals.css` / Tailwind classes | Contraste `#888888` → `#6B6B6B` |
| `lib/cart.ts` + `actions.ts` | Cookie firmada (`iron-session`) |

### Archivos a modificar (calidad)
| Archivo | Cambio |
|---------|--------|
| Páginas `(shop)` | Reemplazar `as any` con tipos `Database`; `revalidate` desde `lib/constants` |
| `app/(shop)/productos/[slug]/page.tsx` | `Promise.all` para queries |
| `components/ui/ProductCard.tsx` | Add-to-cart real (Server Action) |
| `components/layout/Header.tsx` | Mobile menu CSS-only |
| `components/(shop)/checkout/CheckoutForm.tsx` | Refactor estado + WhatsApp desde const |

---

## 5.1. CAMBIO DE IDENTIDAD VISUAL (2026-07-20)

### Contexto
Se identificó que el color primario del proyecto (`#B76E79`) estaba siendo percibido como "lila" por el propietario. Se analizó el proyecto de referencia Django (`liz-store pythom/static/css/style.css`) y se determinó que el color primario oficial de CTAs es `#ff8e9f` (rose-gold), no `#B76E79` (rose dusty).

### Cambio realizado
| Token | Antes | Después |
|-------|-------|---------|
| `--color-primary` | `#B76E79` | `#ff8e9f` |
| `--color-primary-dark` | `#9A5A63` | `#B76E79` |
| `--color-primary-light` | `#d98e98` | `#FB8496` |
| RGB base rgba | `183,110,121` | `255,142,159` |

### Archivos modificados
- `app/globals.css` — Tokens de tema
- `app/layout.tsx` — theme-color
- `components/admin/ChartsSection.tsx` — Colores de gráficos
- `app/admin/page.tsx` — accentColor
- 14 archivos — Todas las referencias `rgba(183,110,121,...)` → `rgba(255,142,159,...)`

### Regla permanente
> La identidad visual oficial es `#ff8e9f` (rose-gold). No debe restaurarse la paleta anterior. Ningún agente debe cambiar los colores automáticamente. Cualquier modificación futura deberá realizarse únicamente mediante decisión explícita del propietario del proyecto.

### Excepción
Los botones de WhatsApp (`#25D366`, `#128C7E`, `#1DA851`) no fueron modificados.

---

## 6. RECOMENDACIONES FUTURAS (POST-LAUNCH)

1. **Monitoring/Alerting:** Sentry (errores), Vercel Analytics (Web Vitals), Supabase Logs (slow queries, auth failures)
2. **Testing:** Playwright E2E (flujos críticos: checkout, auth, admin), Vitest unit (utils, cart, checkout logic)
3. **CI/CD:** GitHub Actions → `lint` + `typecheck` + `build` + `test` en PR; preview deployments Vercel
4. **Escudo Pago:** Activar feature flag + implementar webhook confirmation + dashboard admin transacciones
5. **i18n:** Preparar `next-intl` si expansión multi-país/idioma
6. **PWA:** `next-pwa` + manifest + service worker (offline cart, push notifications)
7. **Database:** `pg_stat_statements` + pgBouncer (Supabase pooled connection) para escalar
8. **Security headers CSP estricta:** Nonce-based para scripts inline (actualmente `unsafe-inline` en estilos)
9. **Backup/Restore:** Point-in-time recovery (Supabase Pro), export schemas periódicos
10. **Documentación:** OpenAPI spec para webhooks (WhatsApp, pagos), runbooks incidentes

---

## 7. VALIDACIÓN FINAL (DEFINITION OF DONE)

### Pre-deploy checklist
- [ ] `.env.local` **limpio** (solo vars `NEXT_PUBLIC_*`)
- [ ] Secrets **rotados y solo en Vercel/Supabase Dashboard**
- [ ] `middleware.ts` **activo** (session refresh verificado)
- [ ] `/api/checkout/route.ts` **funcional** (POST → redirect success)
- [ ] `dangerouslySetInnerHTML` **sanitizado** (DOMPurify)
- [ ] Viewport **permite zoom** (accesibilidad)
- [ ] Cart cookie **firmada** (manipulación → reject)
- [ ] Upload imágenes **validado servidor** (magic bytes, size, tipo)
- [ ] Rate limiting **activo** en `/api/auth/*`
- [ ] Contraste **WCAG AA pass** (Lighthouse/axe)
- [ ] `vercel.json` **con security headers** (CSP, HSTS, X-Frame-Options, Referrer-Policy)
- [ ] `npm run build` **sin errores/warnings**
- [ ] `npm run lint` **limpio**
- [ ] `tsc --noEmit` **limpio**
- [ ] Flujo **E2E manual verificado**: Home → Catálogo → Producto → Carrito → Checkout (pickup/delivery) → WhatsApp/Success → Admin login → CRUD productos/categorías → Upload imágenes

### Confirmación expresa
> **Al completar todos los ítems del checklist anterior, confirmo expresamente que:**
> 1. No existen errores críticos conocidos en la base de código.
> 2. No existen vulnerabilidades evidentes detectadas durante esta auditoría.
> 3. El proyecto queda preparado para continuar con las pruebas finales previas al lanzamiento en producción.

---

## 8. ANEXO: COMANDOS ÚTILES PARA EJECUCIÓN

```bash
# Rotar secrets (manual en dashboards) y limpiar repo
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all
# O usar BFG Repo-Cleaner para .env.local en historial

# Instalar deps nuevas
npm i dompurify @types/dompurify iron-session
# O para rate limiting: npm i @upstash/ratelimit @upstash/redis

# Verificar build y lint
npm run build
npm run lint
npx tsc --noEmit

# Ejecutar migraciones SQL en Supabase Dashboard → SQL Editor
# (copiar contenido de supabase/sql/ejecucion.sql tras preparar migraciones)

# Verificar headers en producción
curl -I https://liz-store.vercel.app

# Lighthouse CI (opcional)
npx lighthouse https://liz-store.vercel.app --output=json --output-path=./lighthouse-report.json
```

---

**Fin del informe.**  
*Generado automáticamente tras auditoría integral de código, BD, auth, storage, deployment y flujos funcionales.*