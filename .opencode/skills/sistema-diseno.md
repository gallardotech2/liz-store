---
name: sistema-diseno
description: Tokens de diseño, espaciados, bordes, sombras y convenciones de layout del sistema de diseño de Escudo Market
---

# Sistema de Diseño — Escudo Market

## Espaciados

| Contexto | Tailwind | px |
|----------|----------|----|
| Gap entre botones en detalle producto | `gap-3` | 12px |
| Gap en grillas de productos | `gap-7.5` | 30px |
| Padding contenedor página (mobile) | `px-4` | 16px |
| Padding contenedor página (desktop) | `px-4` (max-width lo controla) | 16px |
| Separación entre secciones | `my-6` | 24px |
| Separación precio-rating | `my-4` | 16px |
| Padding en cards de producto | `p-5` | 20px |
| Padding en botones (md) | `px-8 py-3.5` | 14px 32px |
| Padding en botones (sm) | `px-5 py-2.5` | 10px 20px |
| Padding en botones (lg) | `px-10 py-4` | 16px 40px |

## Bordes

| Elemento | Radio | Clase |
|----------|-------|-------|
| Botones | 50px (pill) | `rounded-full` |
| Cards de producto | 16px | `rounded-[16px]` |
| Inputs numéricos | 8px | `rounded-[8px]` |
| Imagen principal | 16px | `rounded-[16px]` |
| Badge Escudo Pago | 8px | `rounded-[8px]` |
| Thumbnails | 8px | `rounded-[8px]` |

## Breakpoints

| Breakpoint | Tailwind | Uso |
|------------|----------|-----|
| Mobile | `<768px` | `max-md:` — columnas, botones apilados |
| Tablet/Laptop | `768px-1024px` | `md:` — grillas 2 cols |
| Desktop | `>1024px` | `lg:` — grillas 3-4 cols |
| Wide | `>1280px` | `max-w-7xl` en contenedores |

## Contenedores

- Contenido público: `max-w-7xl mx-auto px-4`
- Detalle producto (grid): `max-w-7xl mx-auto px-4` con grid 2 columnas
- Admin: contenedor con padding variable según sidebar

## Transiciones

| Elemento | Duración | Efecto |
|----------|----------|--------|
| Botones hover | 300ms | `transition-all duration-300` + `hover:-translate-y-0.5` |
| Cards hover | 300ms | `transition-all duration-300` + `hover:-translate-y-1.5` |
| Inputs focus | 300ms | `transition-all duration-300` |
| Header shadow | 300ms | `transition-shadow duration-300` |

## Sombras

| Elemento | Sombra |
|----------|--------|
| Cards de producto | `shadow-[0_2px_8px_rgba(0,0,0,0.06)]` |
| Cards de producto (hover) | `shadow-[0_8px_25px_rgba(0,0,0,0.1)]` |
| Botón primary | `shadow-[0_4px_15px_rgba(255,142,159,0.3)]` |
| Botón primary (hover) | `shadow-[0_8px_25px_rgba(255,142,159,0.4)]` |
| Filtros catálogo | `shadow-[0_2px_8px_rgba(0,0,0,0.04)]` |
| Header (scroll) | `shadow-[0_2px_10px_rgba(0,0,0,0.08)]` |

## Animaciones

| Animación | Propósito |
|-----------|-----------|
| `animate-slide-in-right` | Transiciones de entrada (definida en globals.css) |
