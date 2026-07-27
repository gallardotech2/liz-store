---
name: tipografia
description: Familias tipográficas, tamaños, pesos y jerarquía de texto de Escudo Market
---

# Tipografía — Escudo Market

## Familias Tipográficas

| Variable CSS | Fuente | Peso | Uso |
|-------------|--------|------|-----|
| `--font-sans` | `"Open Sans", Inter, system-ui, sans-serif` | variable | Texto cuerpo, botones, navegación, formularios |
| `--font-mono` | `Geist Mono, ui-monospace, monospace` | variable | Código |
| `--font-playfair` | `Playfair Display` (Google Fonts) | regular | Headings, títulos serif |
| `--font-inter` | `Inter` (Google Fonts) | regular | Fallback sans-serif |
| `--font-great-vibes` | `Great Vibes` (400, Google Fonts) | 400 | Logo "Liz" (cursiva) |
| `--font-cinzel` | `Cinzel` (Google Fonts) | regular | Logo "Store" (serif) |

**Carga:** En `app/layout.tsx` mediante `next/font/google` con `display: "swap"`.

## Jerarquía de Texto

| Elemento | Clase/Estilo | Tamaño | Peso | Familia |
|----------|-------------|--------|------|---------|
| Título página | `text-[clamp(24px,3vw,36px)]` | 24-36px | bold | `font-serif` (Playfair) |
| Nombre producto detalle | `text-[clamp(24px,3vw,36px)]` | 24-36px | bold | `font-serif` |
| Precio producto | `text-[28px]` | 28px | bold | `font-serif` |
| Precio card | `text-[22px]` | 22px | bold | `font-serif` |
| Título sección (home) | `text-3xl` | 30px | bold | `font-serif` |
| Título sección admin | `text-2xl` | 24px | bold | `font-sans` |
| Body | `text-[#4A4A4A] font-sans` | 16px (base) | normal | `font-sans` |
| Texto secundario | `text-[#888888]` | 14px | normal | `font-sans` |
| Botones | `text-sm` | 14px | semibold (600) | `font-sans` |
| Categoría label | `text-[12px]` | 12px | semibold | `font-sans` |
| Badge descuento | `text-[12px]` | 12px | semibold | `font-sans` |
| Descripción corta | `text-[#888888] leading-[1.8]` | 14px | normal | `font-sans` |
| Footer texto | `text-sm` | 14px | normal | `font-sans` |
| Footer heading | `text-sm` | 14px | semibold | `font-sans` |

## Reglas

1. **Headings decorativos** usan `font-serif` (Playfair Display).
2. **Texto funcional** (botones, labels, navegación) usa `font-sans`.
3. **Precios** usan `font-serif` combinado con `font-bold` y color `text-[rgb(154,90,99)]`.
4. **Logo** usa Great Vibes ("Liz") + Cinzel ("Store"), en color `#2D2D2D`.
5. **NO** usar más de 4 Google Fonts.
6. **NO** cargar fuentes que no sean las definidas en la jerarquía.
7. **Tamaños de fuente** en texto fluido usar `clamp()` para responsive.
