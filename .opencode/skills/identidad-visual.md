---
name: identidad-visual
description: Paleta oficial de colores, prohibiciones de modificación y archivos fuente de la identidad visual de Escudo Market
---

# Identidad Visual Oficial — Escudo Market

## Regla Permanente

La paleta de colores definida en este documento es la identidad visual **oficial e inamovible** del proyecto. Fue adoptada el 2026-07-20. Cualquier modificación requiere decisión **explícita del propietario**.

## Archivos Fuente

| Archivo | Rol |
|---------|-----|
| `app/globals.css` | Tokens de tema (fuente de verdad) |
| `app/layout.tsx` | theme-color meta tag |
| `README.md` | Documentación oficial de la paleta |
| `AGENTS.md` | Reglas de identidad para Opencode |

## Paleta Oficial

| Token | Hex | CSS Variable | Uso |
|-------|-----|-------------|-----|
| Primary | `#ff8e9f` | `--color-primary` | Botones, CTAs, enlaces, badges, iconografía |
| Primary Dark | `#B76E79` | `--color-primary-dark` | Hover botones, gradientes, elementos interactivos |
| Primary Light | `#FB8496` | `--color-primary-light` | Hover states, fondos, bordes hover |
| Accent | `#D4A5A5` | `--color-accent` | Elementos decorativos |
| Secondary | `#20232a` | `--color-secondary` | Panel admin (fondo oscuro) |
| Secondary Light | `#33373e` | `--color-secondary-light` | Cards admin |
| Gold | `#C9A96E` | (arbitrario) | Badge "Nuevo", elementos premium |
| Dark | `#2D2D2D` | (arbitrario) | Headings, logo, footer |
| Text | `#4A4A4A` | (arbitrario) | Texto cuerpo |
| Text Light | `#888888` | (arbitrario) | Texto secundario |
| BG Warm | `#FDF8F6` | (arbitrario) | Fondo de página |
| BG Light | `#FFFBF9` | (arbitrario) | Fondos placeholder |
| Muted | `#f5f0eb` | `--color-muted` | Fondos muted |
| Success | `#22c55e` | `--color-success` | Estados de éxito |
| Warning | `#f59e0b` | `--color-warning` | Advertencias |
| Danger | `#ef4444` | `--color-danger` | Errores, eliminar |
| Star Rating | `#F4B740` | (arbitrario) | Estrellas valoración |
| WhatsApp | `#25D366` | (arbitrario) | Botones WhatsApp |
| WhatsApp Hover | `#128C7E` | (arbitrario) | Hover WhatsApp |
| WhatsApp Dark | `#1DA851` | (arbitrario) | WhatsApp dark |

## Prohibiciones

1. **NO** restaurar la paleta anterior (`#B76E79` primary, `#9A5A63` primary-dark).
2. **NO** modificar colores de WhatsApp (`#25D366`, `#128C7E`, `#1DA851`).
3. **NO** cambiar la identidad visual automáticamente (sin decisión explícita del propietario).
4. **NO** introducir nuevos colores no contemplados en la paleta sin documentar.

## Reglas de Uso

### Gradientes Principales
- Botón primary: `bg-gradient-to-br from-primary to-primary-dark` (`#ff8e9f` → `#B76E79`)
- Botón gold: `bg-gradient-to-br from-[#C9A96E] to-[#B8954E]`
- Botón buy: `bg-gradient-to-br from-[#2D2D2D] to-[#1a1a1a]`
- Newsletter footer: `bg-gradient-to-r from-primary to-primary-dark`
- Escudo Pago badge: `bg-gradient-to-br from-[#FDF8F6] to-[#F5E6E8]`

### Sombras
- Botón primary: `shadow-[0_4px_15px_rgba(255,142,159,0.3)]`
- Hover primary: `shadow-[0_8px_25px_rgba(255,142,159,0.4)]`
- Botón gold: `shadow-[0_4px_15px_rgba(201,169,110,0.3)]`
- Botón buy: `shadow-[0_4px_15px_rgba(45,45,45,0.25)]`
- Card producto: `shadow-[0_2px_8px_rgba(0,0,0,0.06)]`

### Bordes
- Inputs: `border border-[#DDD]`
- Hover inputs: `hover:border-primary-light`
- Cards: `border border-[rgba(255,142,159,0.05)]`
- Escudo badge: `border border-[rgba(255,142,159,0.2)]`

### Badges
- "Nuevo": `bg-[#C9A96E] text-white`
- Descuento: `bg-[#E74C3C] text-white`
- Categoría: `text-[rgb(154,90,99)] uppercase text-[12px]`

## Colores NO Permitidos

- `#9A5A63` (antiguo primary-dark) — NO usar
- `#d98e98` (antiguo primary-light) — NO usar
- Cualquier tono de azul como primary — NO usar
- Verde que no sea WhatsApp green o Success green — solo si está en la paleta
