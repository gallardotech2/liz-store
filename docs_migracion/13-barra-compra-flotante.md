# Bitácora 13 — Barra de compra flotante en ficha de producto (Android)

Fecha: 2026-10-09
Estado: EJECUTADO
Módulo: Ficha de producto (móvil)

## Objetivo
Controles de compra (cantidad + Comprar ahora + Agregar al carrito) siempre accesibles en la ficha de producto móvil, sin scroll, ocupando la zona de la navegación inferior, sin superposiciones y sin duplicar lógica de compra. PC intacto.

## Decisión (aprobada por el propietario)
- Barra flotante SOLO móvil (`md:hidden`); en PC el formulario inline queda exactamente igual.
- En móvil, la barra flotante **reemplaza** la BottomNav en `/productos/[slug]` y los controles inline se ocultan.
- Todo el contenido de la ficha (imagen, nombre, descripción, relacionados, reseñas) se desliza normalmente bajo la barra.

## Cambios

### 1. `app/(shop)/productos/[slug]/AddToCartForm.tsx` (refactor, sin lógica nueva)
- Controles inline (Cantidad/Comprar ahora/Agregar al carrito + mensaje de error) ahora `max-md:hidden` → solo PC.
- Nueva rama flotante móvil: `md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-surface-elevated border-t border-line shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]`:
  - Fila 1: etiqueta "Cantidad:" + stepper compacto (− / input / +) con límites `1..stock`.
  - Fila 2: `Comprar ahora` (variant `buy`) y `Agregar al carrito` (variant `primary`), ambos `flex-1`, texto-only (sin iconos para garantizar el ajuste en 360px).
  - Comparte el MISMO estado (quantity/loading/error) y los mismos handlers `addAndGo` (→ `/checkout`) y `addAndStay` (`cart:changed` + `router.refresh()`) del server action `addToCartAction`.
  - Error visible sobre la barra en rojo.

### 2. `components/layout/BottomNav.tsx`
- `if (/^\/productos\/[^/]+$/.test(pathname)) return null` → la nav inferior se oculta solo en fichas de producto. Al salir de la ficha (Inicio/Catálogo/Carrito/etc.) reaparece.

### 3. `app/(shop)/productos/[slug]/page.tsx`
- Spacer de despeje móvil al final de la ficha: `<div className="md:hidden h-10" aria-hidden="true" />` para que la última sección (reseñas/footer) no quede oculta tras la barra (~100px) combinado con el spacer global del layout (64px).

## Sin cambios
- `Header.tsx` / `ProductSearch.tsx` / `lib/cart.ts` / `carrito/actions.ts` / backend / BD / PC (1240px+).
- La barra NO agrega listeners de scroll ni emite eventos al montar → el comportamiento de ocultar/mostrar el buscador móvil queda intacto.

## Verificación (Playwright, Google Chrome)
65/65 checks PASS en 360 / 390 / 412 / 767 / 1280:
- Barra visible desde el momento en que se abre la ficha (scrollY=0), fija durante todo el scroll (tops 752/752/752) sin tapar el footer.
- Cantidad + → 2, − → 1; agregar al carrito no navega y el carrito refleja cantidad 2; Comprar ahora → `/checkout`.
- Relacionados → nuevo producto con barra (qty reset 1) y nav aún oculta.
- Sin barra en `/`, `/productos`, `/categorias/*`, `/destacados`, `/novedades`, `/carrito` (nav inferior visible).
- Buscador móvil: visible → oculto → visible (1/0/1 opacidad) sin interferencias.
- PC 1280: sin barra flotante; controles inline y cantidad visibles.
- `npm run build` OK (Next.js 16.3.8, 41 páginas).

## Notas
- En fichas móviles ya no está la BottomNav: la navegación a Inicio/categoría vuelve por el breadcrumb (Inicio / Categoría / Nombre). Es la decisión acordada para "ocupar la zona sin superposiciones".
- Con productos agotados (stock 0) no se renderiza la barra ni los controles (comportamiento previo del AddToCartForm).