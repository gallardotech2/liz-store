# Migración 08 — Cambio Global de Identidad Visual

**Fecha:** 2026-07-20
**Estado:** Completado

## Contexto

Se detectó que el color primario del proyecto (`#B76E79`) estaba siendo percibido como "lila" por el propietario. Se analizó el proyecto de referencia Django (`liz-store pythom/static/css/style.css`) y se determinó que el color primario oficial de CTAs es `#ff8e9f` (rose-gold), no `#B76E79` (rose dusty).

## Cambio de paleta

| Token | Antes | Después | Fuente |
|-------|-------|---------|--------|
| `--color-primary` | `#B76E79` | `#ff8e9f` | `--rose-gold` del proyecto de referencia |
| `--color-primary-dark` | `#9A5A63` | `#B76E79` | `--rose` del proyecto de referencia |
| `--color-primary-light` | `#d98e98` | `#FB8496` | `--rose-light` del proyecto de referencia |
| RGB base rgba | `183,110,121` | `255,142,159` | Calculado de `#ff8e9f` |

## Archivos modificados (código)

### Core
- `app/globals.css` — Tokens de tema actualizados
- `app/layout.tsx` — theme-color actualizado a `#ff8e9f`

### Admin
- `components/admin/ChartsSection.tsx` — Colores de gráficos
- `app/admin/page.tsx` — accentColor

### Componentes UI
- `components/ui/Button.tsx` — rgba en shadows
- `components/ui/ProductCard.tsx` — rgba en borders/shadows
- `components/ui/CategoryCard.tsx` — rgba en borders/shadows
- `components/shop/CatalogFilters.tsx` — rgba en shadow

### Layout
- `components/layout/Header.tsx` — rgba en shadows
- `components/layout/Footer.tsx` — (usa tokens)

### Auth
- `components/auth/PasswordInput.tsx` — rgba en focus ring
- `app/auth/login/page.tsx` — rgba en shadows
- `app/auth/registro/page.tsx` — rgba en shadows

### Shop pages
- `app/(shop)/page.tsx` — rgba en radial gradients, borders, shadows
- `app/(shop)/carrito/page.tsx` — (usa tokens)
- `app/(shop)/checkout/page.tsx` — (usa tokens)
- `app/(shop)/checkout/CheckoutForm.tsx` — rgba en borders, backgrounds
- `app/(shop)/checkout/[id]/success/page.tsx` — rgba en borders
- `app/(shop)/categorias/[slug]/page.tsx` — (usa tokens)
- `app/(shop)/productos/page.tsx` — (usa tokens)
- `app/(shop)/productos/[slug]/page.tsx` — rgba en borders, shadows
- `app/(shop)/productos/[slug]/AddToCartForm.tsx` — (usa tokens)
- `app/(shop)/faq/page.tsx` — rgba en borders, shadows

### Admin pages
- `app/admin/products/page.tsx` — (usa tokens)
- `app/admin/categories/page.tsx` — (usa tokens)
- `app/admin/lives/page.tsx` — (usa tokens)
- `app/admin/lives/nuevo/page.tsx` — (usa tokens)
- `app/admin/lives/[id]/editar/page.tsx` — (usa tokens)
- `app/admin/lives/[id]/studio/page.tsx` — (usa tokens)

## Archivos modificados (documentación)

- `README.md` — Sección de identidad visual con paleta oficial
- `AGENTS.md` — Regla permanente de identidad visual
- `AUDITORIA_FINAL.md` — Sección 5.1 con registro del cambio
- `docs_migracion/03-componentes-ui.md` — Tabla de colores actualizada

## Excepciones (sin cambios)

- Botones WhatsApp: `#25D366`, `#128C7E`, `#1DA851`
- Acciones de checkout por WhatsApp

## Verificación

- `npm run build` — Exitoso (18 páginas generadas)
- `npm run lint` — Errores preexistentes (tipos TypeScript, no relacionados)
- `grep '#B76E79'` — Solo en `globals.css` como `--color-primary-dark` (intencional)
- `grep 'rgba(183,110,121'` — 0 resultados (todos reemplazados)
- `grep 'rgba(255,142,159'` — 31 resultados (nuevos valores)

## Regla permanente

> La identidad visual oficial es `#ff8e9f` (rose-gold). No debe restaurarse la paleta anterior. Ningún agente debe cambiar los colores automáticamente. Cualquier modificación futura deberá realizarse únicamente mediante decisión explícita del propietario del proyecto.
