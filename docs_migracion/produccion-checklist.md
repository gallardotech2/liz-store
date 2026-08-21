# Checklist de Producción — Liz Store

## Estado: Pendiente
## Fecha de creación: 2026-08-20

---

## CRÍTICO (obligatorio para lanzar)

- [ ] **Sitemap + robots.txt** (30 min)
  - Crear `app/sitemap.ts` con todas las rutas públicas
  - Crear `app/robots.ts` con Allow/Disallow
  - Sin esto Google no indexa el sitio

- [ ] **Páginas legales** (3-4 hrs)
  - Crear `/privacidad` — Política de privacidad (Ley 1646 Bolivia)
  - Crear `/terminos` — Términos y condiciones
  - Agregar links en Footer

- [ ] **Cookie Consent** (2-3 hrs)
  - Banner de consentimiento de cookies
  - Obligatorio: Supabase auth + carrito usan cookies
  - Guardar preferencia en localStorage

- [ ] **RPC functions faltantes** (15 min)
  - Crear `increment_session_interested` en Supabase
  - Crear `increment_session_shown` en Supabase
  - Sin estas funciones, los lives fallan (lib/live.ts las llama)

- [ ] **Fix TypeScript types** (1-2 hrs)
  - 20 de 21 tablas usan camelCase en types/database.ts
  - La DB usa snake_case — falso type safety
  - Regenerar types con `supabase gen types typescript`

- [ ] **Analytics** (20 min)
  - `npm install @vercel/analytics`
  - Agregar `<Analytics />` en `app/layout.tsx`

- [ ] **Error monitoring** (1-2 hrs)
  - Instalar Sentry (`@sentry/nextjs`)
  - Configurar DSN en .env
  - Crear `sentry.client.config.ts`, `sentry.server.config.ts`

- [ ] **404 page** (30 min)
  - Crear `app/not-found.tsx` con diseño de la marca
  - Link a home y catálogo

---

## ALTO (debería tener antes de lanzar)

- [ ] **Open Graph image** (20 min)
  - Agregar `openGraph.images` en `app/layout.tsx`
  - Crear imagen OG (1200x630px) con logo de la marca

- [ ] **JSON-LD** (1-2 hrs)
  - Structured data: Product, Organization, BreadcrumbList, FAQPage
  - Agregar en `<head>` via `next/script`

- [ ] **Global error.tsx** (30 min)
  - Crear `app/error.tsx` para el shop
  - Actualmente solo existe `app/admin/error.tsx`

- [ ] **Email transaccional** (3-4 hrs)
  - Instalar Resend o SendGrid
  - Crear endpoint `/api/send-order-email`
  - Template de confirmación de pedido

- [ ] **Password reset** (1 hr)
  - Crear `/auth/reset-password` page
  - Agregar link "Olvidé mi contraseña" en login page
  - Supabase ya tiene `auth.resetPasswordForEmail()`

- [ ] **Newsletter funcional** (1 hr)
  - Footer tiene form pero es stub (`preventDefault`)
  - Conectar a tabla `newsletter_subscribers` o servicio externo

---

## MEDIO (mejoras importantes)

- [ ] **Canonical URLs** (30 min)
  - Agregar `alternates.canonical` en metadata de páginas principales

- [ ] **Loading states** (1-2 hrs)
  - Crear `loading.tsx` en rutas principales
  - Skeleton screens para productos, carrito, checkout

- [ ] **Domain redirect** (15 min)
  - Agregar redirect www → apex en `vercel.json`

- [ ] **CSP update** (15 min)
  - Cuando agregues analytics/Sentry, actualizar CSP en vercel.json

---

## BAJO (nice to have)

- [ ] **Testing framework** (2-3 hrs)
  - Instalar Vitest + Playwright
  - Tests E2E: add to cart, checkout, auth

- [ ] **WhatsApp number type** (15 min)
  - Agregar `whatsapp_number` a `StoreProfilesTable` en types/database.ts
