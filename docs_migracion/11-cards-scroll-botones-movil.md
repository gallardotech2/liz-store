# Bitácora 11 — Cards uniformes, pista de scroll y botones unificados (Android)

**Fecha:** 2026-10-09
**Estado:** EJECUTADO y verificado
**Ámbito:** solo móvil (`max-md:`). PC intacto.

## Requerimiento y diagnosis

1. **Cards uniformes:** la grilla móvil de Destacados y las 2-top de Novedades usaban celdas adaptativas (dependientes del ancho), mientras el scroll tenía `w-[170px]` fijo con `gap-3` (12px) vs `gap-3.75` (15px) de las grillas. Resultado: mismatch a casi todo ancho (360 → grid 156.5 vs scroll 170; 767 → Destacados 4 columnas mientras las 2-top quedaban en 2).
2. **Sin señal visual de scroll** en la fila horizontal.
3. **Botones** del mismo `variant="secondary"` pero texto distinto → dimensión distinta (sin ancho común).

## Cambios

### `components/shop/ScrollNudge.tsx` (NUEVO, cliente, sin dependencias)
Envuelve la fila horizontal y al primer cruce con `IntersectionObserver` (threshold 0.7) aplica UNA animación `translateX(0 → −28px → 0)` de 900ms `ease-in-out` vía Web Animations API, tras 350ms de delay; luego se desconecta.
- Respeta `prefers-reduced-motion` (no anima).
- Se cancela ante `wheel`/`scroll`/`touchstart` del contenedor (no interfiere con la interacción).
- Solo `transform` → sin saltos de layout ni scrolls verticales/posición de scroll.

### `app/(shop)/page.tsx` (solo móvil)
- **Grilla Destacados:** `max-md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]` → `max-md:grid-cols-2` (mismo patrón que las 2-top; desktop `auto-fill minmax(260px)` intacto).
- **Scroll Novedades:** contenedor `flex gap-3` → `overflow-x-auto` puro + `ScrollNudge` (interno, `flex gap-3.75`); cards `w-[170px]` → `flex-shrink-0 w-[calc(50%-7.5px)]` (== celda de grilla `(100%−15px)/2` a cualquier ancho).
- **Botones:** ambos `Button variant="secondary" size="md"` con `className="w-60"` (240px) → dimensiones/estilos idénticos. Textos y destinos conservados (`/destacados`, `/novedades`).

## Verificación (Playwright, Chrome headless)

- **Anchos cards** — Destacados grilla, 2-top y las 6 del scroll son idénticos y equivalentes a `(W−47)/2` en 360 (157px), 412 (183px), 480 (217px) y 767 (360px). `aspect-square` dentro de ProductCard → alturas iguales.
- **Pista de scroll** — en 390 al llegar a la fila el transform alcanzó −23px (muestreo 100ms) y regresó a 0 en ~1.2s; con `prefers-reduced-motion: reduce` no hay movimiento (0 sobre 12 muestras).
- **Botones** — en 360 y 412: `identical=true`, ambos 240×48px, misma tipografía/colores/borde/tipos de estado; cada uno navega a `/destacados` y `/novedades`.
- **PC 1280 intacto** — CTA desktop "Ver todos los productos" (/productos?sort=rating) visible sin `w-60`; CTAs móviles ocultos; h2 "Recién llegados" y grilla desktop presentes; sin filas de scroll visibles.

## Notas
- Hay DOS botones con texto "Ver todos los productos": el desktop (/productos?sort=rating, sin `w-60`, sin cambios) y el móvil (/novedades, con `w-60`). El test aísla el visible en móvil.
- `npm run build`: OK. eslint: `ScrollNudge` limpio; `page.tsx` sin errores nuevos (pre-existentes: `as any` línea 40 y vars sin usar).