# Bitácora 14 — Navegación a ficha, badges, checkout y sección Ofertas

Fecha: 2026-10-12
Estado: EJECUTADO
Módulo: Catálogo / Ficha de producto / Checkout / Admin / Ofertas (móvil + PC)

## Objetivo
Corregir la navegación a la ficha de producto en Android, eliminar la duplicación
del badge de descuento, mejorar el checkout (guía de errores y cierre del modal) y
crear la sección **Ofertas** alimentada desde el admin.

## Cambios

### 1. Navegación a ficha de producto (Android)
- Causa raíz: los enlaces a `/productos/[slug]` usaban `scroll={false}`, que en Next.js
  desactiva el scroll al tope y **conserva la posición** de la página anterior; al
  venir de una lista desplazada se aterrizaba a media página (precio o relacionados).
- `components/ui/ProductCard.tsx` y `app/(shop)/carrito/page.tsx`: se quitó `scroll={false}`.
- Nuevo `components/shop/ScrollToTop.tsx` (client, `useLayoutEffect` + `usePathname`):
  garantiza `scrollTo(0,0)` al abrir/cambiar de ficha (también producto → relacionado).
  Renderizado en `app/(shop)/productos/[slug]/page.tsx`.

### 2. Badge de descuento duplicado
- `components/ui/ProductCard.tsx`: el `-X%` ya no se muestra dentro de la imagen; solo
  queda el badge "Nuevo" arriba y el `-X%` al lado del precio tachado.

### 3. Breadcrumb ("barrita de navegación") oculto en móvil
- `max-md:hidden` en el breadcrumb de: `productos/page.tsx`, `ofertas/page.tsx`,
  `novedades/page.tsx`, `destacados/page.tsx`, `categorias/[slug]/page.tsx`
  (y `productos/[slug]/page.tsx` de antes). En móvil el contenido/título se ve primero.

### 4. Header
- `components/layout/Header.tsx`: el banner "NO TE PIERDAS NUESTROS LIVES · ÚNETE A
  NUESTRO GRUPO DE WHATSAPP" ahora solo se muestra en el inicio (`pathname === "/"`).

### 5. Checkout
- `app/(shop)/checkout/CheckoutForm.tsx`: al "Solicitar por WhatsApp" sin nombre, hace
  scroll suave al campo Nombre y lo resalta (borde/anillo rojo 2.5 s) **sin** abrir el
  teclado; `scroll-mt-24` en la card de contacto.
- Modal de éxito: botón **X** (y clic en el overlay) para cerrarlo.

### 6. Sección Ofertas (nueva)
- BD: `ALTER TABLE products ADD COLUMN is_offer BOOLEAN DEFAULT false;` (Fix 0019).
- `types/database.ts`: `is_offer` en Row/Insert/Update de `products`.
- Admin: nueva casilla **"En oferta"** en `components/admin/ProductForm.tsx`; lectura y
  guardado en `app/admin/products/actions.ts` (create/update); select + punto rojo en
  `app/admin/products/page.tsx`; tipo en `app/admin/products/[id]/editar/page.tsx`.
- Página `app/(shop)/ofertas/page.tsx`: grilla con `is_offer = true` (Android + PC),
  estilo Novedades con paginación y estado vacío.
- Nav: `components/layout/BottomNav.tsx` → el ítem "Ofertas" apunta a `/ofertas`
  (antes `/productos?sort=rating`); link "Ofertas" en el nav de PC (`Header.tsx`).

## SQL
- `supabase/sql/ejecucion.sql`: vacío (EJECUTADO).
- `supabase/sql/migraciones.sql`: entrada Fix 0019 (2026-10-12).
- `supabase/sql/esquema.sql`: columna `is_offer` en `products`.

## Verificación
- `npx tsc --noEmit` → 0 errores.
- `npm run build` → compila OK (ruta `/ofertas` presente).
- `npm run lint`: sin errores nuevos (los existentes son pre-existentes: `no-explicit-any`,
  `<img>`, set-state-in-effect).

## Notas
- `.gitignore`: se agregaron `/memory/` y `/.mcp_memory/` (memoria local, no versionar).
