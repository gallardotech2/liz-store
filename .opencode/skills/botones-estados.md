---
name: botones-estados
description: Estados visuales de todos los botones del sistema: hover, active, disabled, focus y loading
---

# Botones y Estados — Escudo Market

## Estados de Botón

### Normal (idle)

Cada variante tiene su estilo base (ver skill `componentes-ui`).

### Hover

Todas las variantes comparten: `hover:-translate-y-0.5` (lift de 2px).

| Variant | Hover Style |
|---------|-------------|
| `primary` | Sombra intensificada: `shadow-[0_8px_25px_rgba(255,142,159,0.4)]` |
| `secondary` | Fondo se llena: `bg-primary text-white` |
| `gold` | Sombra intensificada: `shadow-[0_8px_25px_rgba(201,169,110,0.4)]` |
| `buy` | Transición a primary: `hover:from-primary hover:to-primary-dark` |
| `outline` | Borde más oscuro + `bg-gray-50` |
| `whatsapp` | Fondo más oscuro: `bg-[#128C7E]` + sombra intensificada |

### Active (click)

| Variant | Active Style |
|---------|-------------|
| `buy` | `active:translate-y-0 active:shadow-[0_2px_8px_rgba(45,45,45,0.3)]` |
| Otras | No tienen active explícito (uso default browser) |

### Disabled

- `disabled:opacity-40` en todos los botones
- `cursor-not-allowed` implícito por el disabled nativo
- NO cambiar el color de fondo al deshabilitar — solo opacidad
- NO quitar sombras al deshabilitar

### Focus

- Los botones no tienen estilo focus explícito (default browser)
- NO eliminar el outline de focus a menos que se proporcione un reemplazo accesible

## Loading State

Los botones en detalle de producto muestran texto alternativo mientras cargan:

| Botón | Texto normal | Texto loading |
|-------|-------------|---------------|
| Comprar ahora | "Comprar ahora" | "Procesando..." |
| Agregar al carrito | "Agregar al carrito" | "Agregando..." |

- El estado loading deshabilita el botón: `disabled={loading}`
- El icono SVG permanece visible durante loading

## Estados en Botones Admin

### DeleteButton
- Estado 1: "Eliminar" (rojo danger)
- Estado 2 (click): "Cancel" + "Confirmar" (dos botones)
- Texto durante submit: "Eliminando..."

## Reglas de Implementación

1. **Siempre** incluir `transition-all duration-300` para animaciones suaves.
2. **Siempre** usar `disabled` prop para estado loading — no deshabilitar manualmente.
3. **NO** cambiar el color del botón primario en estados.
4. **NO** cambiar `rounded-full` a otros radios.
5. **NO** usar outline o border en botones primary/gold/buy/whatsapp (son `border-none`).
6. **NO** implementar spinner durante loading — usar cambio de texto.
