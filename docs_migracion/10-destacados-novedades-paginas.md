# Bitácora 10 — Páginas dedicadas Destacados y Novedades (Android)

**Fecha:** 2026-10-09
**Estado:** EJECUTADO y verificado
**Ámbito:** solo móvil (`max-md:`) + 2 rutas nuevas. PC intacto.

## Problema / Requerimiento

El usuario pidió para Android:

1. **Destacados (home, móvil):** ocultar etiqueta "Destacados" y el h2 "Las favoritas"; mostrar solo la frase "Descubre las piezas que están marcando tendencia." + un acceso "Ver todos los destacados" que abra una página dedicada.
2. **Novedades (home, móvil):** ocultar "Recién llegados" y subtítulo; título "Novedades"; layout de 2 productos arriba + fila horizontal desplazable + botón "Ver todos los productos" que abra una **página dedicada** de Novedades (SUPERA la decisión previa de apuntar a `/categorias/pulseras`).
3. **Espaciado:** respetar paddings actuales y separar la zona del texto/última card del newsletter en `/categorias/[slug]` (gap era 0px).

## Cómo se determinan los productos

- **Destacados** = `products` con `is_featured = true AND is_active = true` → 3 productos reales (pendites, reloj-clasico-dorado, pulcera-tulipan).
- **Novedades** = `products` con `is_new = true AND is_active = true` → 11 productos.
- Orden: `created_at` descendente. En el home se limitan a 8 (por eso el scroll móvil lleva 6 cards: 8 − 2 top).

## Cambios

### NUEVO `app/(shop)/destacados/page.tsx`
Ruta `/destacados`. Réplica del patrón de `/categorias/[slug]`:
- Breadcrumbs `Inicio / Destacados`, h1 "Las favoritas", etiqueta "Destacados", frase.
- Query sin límite (`is_featured`, `is_active`), grid responsive de `ProductCard`, paginación `PAGE_SIZE 12`, `revalidate = 3600`, `generateMetadata` (/destacados canonical), estado vacío "Próximamente".
- Sección con `pt-8 pb-16 md:pt-12 md:pb-20` (igual que categorías).

### NUEVO `app/(shop)/novedades/page.tsx`
Ruta `/novedades`. Idéntico pero con `is_new = true`; h1 "Recién llegados".

### MOD `app/(shop)/page.tsx` (home) — solo móvil
- **Destacados:** etiqueta y h2 con `max-md:hidden`; CTA PC (`/productos?sort=rating`) con `max-md:hidden`; nuevo `hidden max-md:flex justify-center mt-10` con botón "Ver todos los destacados" → `/destacados` (`prefetch={false}`).
- **Novedades:** etiqueta/subtítulo y grid PC con `max-md:hidden`; h2 dual (PC "Recién llegados" / móvil "Novedades"); bloque móvil `hidden max-md:block`:
  - 2 top: `grid grid-cols-2 gap-3.75` con `slice(0,2)`.
  - scroll: `flex gap-3 overflow-x-auto pb-2 -mx-4 px-4` con `slice(2)` de `ProductCard className="flex-shrink-0 w-[170px]"` (scrollbar oculto por inline style).
  - botón "Ver todos los productos" → `/novedades`.

### MOD `app/(shop)/categorias/[slug]/page.tsx`
Sección `py-0` → `py-0 pt-8 pb-16 md:pt-12 md:pb-20`: separa el encabezado/las cards del primer section del footer ("Únete a nuestra comunidad"). Gap medido: 0px → 64px en móvil.

## Verificación (Playwright, Chrome headless, viewports 360/390/412/767/1280)

- Home 390: h2 "Las favoritas"/"Recién llegados" **ocultos**; "Novedades" visible; frase visible; CTAs móviles visibles; bloque Novedades = 2 top + scroll (scrollW 628 > clientW 390) + CTA. PC 1280: títulos originales y grid PC visibles; CTAs móviles ocultos.
- `/destacados`: 3 cards (pendites, reloj-clasico-dorado, pulcera-tulipan); breadcrumbs "Inicio / Destacados"; h1 ok.
- `/novedades`: 11 cards; breadcrumbs "Inicio / Novedades"; h1 ok.
- Navegación móvil 390: click primera card → `/productos/{slug}` y `goBack` vuelve a `/destacados`/`/novedades`.
- `/categorias/pulseras` 390: gap última card → newsletter = **64px**.
- `npm run build`: OK (rutas `/destacados` y `/novedades` registradas). eslint: sin errores nuevos (los 2 de `/categorias/[slug]` en líneas 83/95 son preexistentes, patrón `as any` del repo).

## Notas

- El click en 390 falló antes solo por timing del soft-nav: se resolvió usando `waitForURL`; la navegación funciona.
- Decisión previa (`/categorias/pulseras` como destino del botón) **superada** por esta spec.