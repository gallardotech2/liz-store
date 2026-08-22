# Checklist de Producción — Liz Store

## Estado: En progreso
## Última actualización: 2026-08-21 (Páginas legales completadas)

---

## CRÍTICO (obligatorio para lanzar)

- [x] **Sitemap + robots.txt** (30 min)
  - `app/sitemap.ts` — genera URLs dinámicas desde Supabase
  - `app/robots.ts` — bloquea `/admin/`, `/api/`, `/perfil/`, `/checkout/`

- [x] **Páginas legales** (3-4 hrs)
  - `app/(shop)/privacidad/page.tsx` — Política de privacidad (11 secciones, Ley 1646 Bolivia)
  - `app/(shop)/terminos/page.tsx` — Términos y condiciones (7 secciones, cláusulas MVP)
  - Links agregados en Footer (Ayuda)

- [x] **Cookie Consent** (2-3 hrs)
  - `components/ui/CookieConsent.tsx` — banner con aceptar/rechazar
  - Guarda preferencia en `localStorage` (`liz_cookie_consent`)
  - Cookies esenciales (auth + carrito) siempre activas
  - Agregado en `app/layout.tsx`

- [x] **RPC functions faltantes** (15 min)
  - `increment_session_interested` y `increment_session_shown` ejecutados en Supabase Dashboard
  - Fix 0004 registrado en migraciones.sql

- [x] **Fix TypeScript types** (1-2 hrs)
  - 40+ campos camelCase → snake_case en types/database.ts
  - Coincide con schema real de Supabase

- [x] **Analytics** (20 min)
  - `@vercel/analytics` instalado y `<Analytics />` en layout.tsx

- [x] **Error monitoring** (1-2 hrs)
  - `@sentry/nextjs` instalado y configurado
  - `sentry.client.config.ts` + `sentry.server.config.ts` creados
  - `next.config.ts` envuelto con `withSentryConfig()`
  - `app/error.tsx` captura excepciones con Sentry
  - CSP en `vercel.json` actualizado para Sentry
  - **Pendiente:** Agregar `NEXT_PUBLIC_SENTRY_DSN` en `.env.local`

- [x] **404 page** (30 min)
  - `app/not-found.tsx` — diseño de marca, links a home y catálogo

---

## ALTO (debería tener antes de lanzar)

- [x] **Open Graph image** (20 min)
  - `openGraph.images` agregado en metadata de layout.tsx
  - Pendiente: crear imagen `public/og.png` (1200x630px)

- [ ] **JSON-LD** (1-2 hrs)
  - Structured data: Product, Organization, BreadcrumbList, FAQPage
  - Agregar en `<head>` via `next/script`

- [x] **Global error.tsx** (30 min)
  - `app/error.tsx` — error boundary global para el shop

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
