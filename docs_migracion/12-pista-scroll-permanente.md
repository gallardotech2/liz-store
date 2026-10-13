# Bitácora 12 — Pista de scroll permanente (Android)

**Fecha:** 2026-10-09
**Estado:** EJECUTADO y verificado
**Ámbito:** solo la animación indicativa de las filas horizontales (móvil). PC intacto; cards, botones y rutas sin cambios.

## Requerimiento
La pista actual hacía ida y vuelta (`translateX(0 → −28 → 0)`). Se desea que la fila quede desplazada permanentemente: cuando entra en el área visible se mueve suavemente a una posición que deja ver que hay más contenido y **permanece allí**, sin volver a 0, sin repetirse, y sin interferir con el scroll manual.

## Cambio
### `components/shop/ScrollNudge.tsx` (único archivo)
- Animación: `translateX(0 → −28px)` de **600ms** `ease-out` con **`fill: "forwards"`** (se elimina el keyframe de retorno; adiós al ida y vuelta).
- Sigue siendo única: `IntersectionObserver` + `animated` ref + `io.disconnect()`, con 350ms de delay tras entrar en vista.
- Se **eliminaron** los listeners de cancelación (`wheel`/`scroll`/`touchstart`): antes cancelaban el movimiento de retorno; ahora el offset es permanente y no compite con el gesto (solo `transform`, no toca `scrollLeft` ni `scrollWidth`).
- `prefers-reduced-motion: reduce` → sin desplazamiento (offset 0), como antes.

## Verificación (Playwright, Chrome headless 390/1280)
- **Antes de entrar en vista:** `x=0` (desplazamiento inicial y navegación intactos).
- **Al entrar:** anima hasta **−28px y persiste** (muestreo: últimos 5 lecturas = −28, nunca vuelve a 0).
- **Scroll manual normal:** `scrollLeft` alcanzó `max` (702) y la última card queda totalmente visible; el transform no bloquea el gesto.
- **Sin re-ejecución:** salir de la sección y volver → sigue en −28 (constante, sin re-animación).
- **Reduced motion:** `x=0` (sin desplazamiento).
- **PC 1280:** 0 filas de scroll visibles en Novedades (bloque móvil oculto como siempre).

## Notas
- La fila horizontal pertinente es solo la de Novedades (Destacados no tiene fila horizontal). El componente `ScrollNudge` es la única implementación y se comporta igual donde se use.
- 28px sobre cards de ~157–360px ≈ 7–10% del ancho → pista visible sin ocultar excesivamente.
- `npm run build`: OK. eslint: `ScrollNudge` limpio.