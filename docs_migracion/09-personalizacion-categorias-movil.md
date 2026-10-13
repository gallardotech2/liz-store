# Migración 09 — Personalización Local de Categorías (Android/móvil)

**Fecha:** 2026-10-09
**Estado:** Completado
**Alcance:** exclusivamente móvil (`max-md:`, `<768px`). PC sin cambios.

## Contexto

La sección de categorías del home debía personalizarse en móvil mostrando las **2 categorías de mayor interés** del usuario en un bloque "PARA TI", destacadas y a todo el ancho, sin depender del servidor.

## Funcionamiento

- Las interacciones (clics en categorías) se guardan en `localStorage` bajo la clave `liz_category_interactions` como `{ slug: conteo }`.
- El ranking ordena las categorías por conteo descendente y toma las 2 primeras.
- **Siempre 2 protagonistas:** la zona superior muestra exactamente 2 categorías en `grid-cols-2` (top-2 por interacciones; sin historial, las 2 primeras por orden). No existe el grid de 3.
- **Suficiencia:** la etiqueta "PARA TI" solo aparece cuando hay **≥2 categorías con interacción > 0**. Si no, se muestran las 2 protagonistas sin etiqueta.
- El resto de categorías (todas las que quedan tras las 2 protagonistas) va al scroll horizontal en cards compactas `w-[140px]`.
- Las preferencias **nunca** salen del dispositivo: no hay escritura en Supabase ni llamadas de red.

## Diseño

| Elemento | Tratamiento |
|----------|-------------|
| Interés 1 / Interés 2 | `grid-cols-2 gap-3`, ocupan todo el ancho útil, lado a lado |
| Tamaño protagonistas | imagen `h-28` (igual que secundarias), título `text-sm`, contador `text-[12px]`, `p-3` |
| Aumento | principalmente horizontal (≈ +18px ancho vs ≈ +8px alto) |
| Secundarias | compactas `w-[140px]`, scroll horizontal, todas accesibles |
| Desktop | grilla original `auto-fill minmax(220px,1fr)`, `max-md:hidden` |

## Cambios de código

- `components/ui/CategoryCard.tsx`
  - Ahora es el componente compartido y **client** con props `compact`, `featured`, `onClick`, `className`.
  - Clases construidas con **ramas explícitas** (nunca dos utilidades en conflicto en el mismo elemento). Antes `max-md:text-base` (featured) perdía frente a `max-md:text-xs` (compact) por el orden del CSS, por lo que el título de las protagonistas no crecía.
  - `onClick` se invoca sin `preventDefault`; la navegación la resuelve `Link` (`prefetch={false}`), eliminando la recarga completa con `window.location.href`.
- `components/shop/PersonalizedCategories.tsx`
  - Eliminado el `CategoryCard` interno duplicado; importa el de `components/ui/CategoryCard.tsx`.
  - `hasPersonalization` exige `interactedCount >= 2`.
  - Se removieron `min-h-[140px]` y `max-md:flex-1 max-md:min-w-0` (sin efecto).
  - **Fix 0001** (2026-10-09): eliminado el estado inicial de 3 protagonistas (`grid-cols-3` + `categories.slice(0,3)`). Ahora siempre se renderizan 2 en `grid-cols-2`; el scroll usa `remainingCategories` en todos los casos. Esto también corrige un bug por el que `categories.slice(3)` **omitía la 3ª categoría** del catálogo móvil.
  - El conteo continúa registrando todas las categorías (`{ slug: conteo }`).
- `components/layout/ShopLayout.tsx`
  - **Fix 0001** (2026-10-09): el spacer `<div className="md:hidden h-28">` (112px, vacío) estaba **entre `<main>` y el footer**, creando un hueco de altura indebida que desplazaba el contenido hacia abajo. Se movió **después del `<Footer>`** (donde debe compensar la `BottomNav` fija) y se dimensionó al alto real de la barra: `h-[calc(4rem+env(safe-area-inset-bottom))]` (≈64px + safe-area; la barra mide 57px y ya usa `pb-[env(safe-area-inset-bottom)]`).

## Verificación

- `npm run lint` — OK en ambos archivos (el repo tiene 115 errores pre-existentes en otros archivos).
- `npm run build` — OK.
- Playwright + Chrome del sistema, en 360/390/412/767/768/1280 px, con y sin interacciones sembradas:
  - Móvil: `grid-cols-2` con **2 protagonistas** siempre; `paraTi` solo con ≥2 interacciones; sin `grid-cols-3`; 4 categorías restantes en scroll (incluye la 3ª).
  - Spacer: 64px **después** del footer en móvil; 0px a partir de 768px; no hay hueco entre `</main>` y el footer.
  - Desktop (768+ y 1280): contenedor móvil `display:none`; grilla original `auto-fill` visible. Sin cambios en PC.
- PC conserva `h-40` + `text-base` y el grid `auto-fill`.

## Privacidad

El conteo vive exclusivamente en `localStorage` del dispositivo. No se persiste ni procesa en el servidor.
