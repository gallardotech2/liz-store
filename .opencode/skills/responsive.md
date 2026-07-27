---
name: responsive
description: Estrategia responsive, breakpoints y patrones de diseño adaptativo de Escudo Market
---

# Diseño Responsive — Escudo Market

## Breakpoints Oficiales

| Nombre | Tailwind | Ancho | Aplicación |
|--------|----------|-------|------------|
| Mobile | `max-md:` | `<768px` | Diseño de una columna |
| Tablet | `md:` | `>=768px` | Diseño 2 columnas, menú horizontal |
| Desktop | `lg:` | `>=1024px` | Diseño completo 3-4 columnas |
| Wide | (max-width) | `>=1280px` | Contenedor max-w-7xl |

## Patrones Responsive

### Product Detail Grid
```tsx
// Desktop: 2 columnas iguales
// Mobile: 1 columna
<div className="grid grid-cols-[1fr_1fr] gap-12.5 py-15 max-lg:grid-cols-1">
```

### Product Grid (Catálogo)
```tsx
// Desktop: 4 columnas
// Tablet: 3 columnas
// Mobile: 2 columnas
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7.5">
```

### Product Buttons (Detalle)
```tsx
// Desktop: lado a lado (flex row)
// Mobile: apilados verticalmente
<div className="flex gap-3 my-6 max-md:flex-col max-md:items-stretch">
  // Cada botón: className="flex-1 max-md:w-full"
```

### Header Navigation
- Desktop: menú horizontal completo
- Mobile: menú hamburguesa con overlay

### Admin Sidebar
- Desktop: sidebar fijo de 288px
- Mobile: overlay deslizante

## Reglas de Maquetación

1. **Mobile first** — empezar con diseño mobile y agregar breakpoints hacia arriba.
2. **max-md:** para cambios mobile — NO usar `sm:` como breakpoint principal.
3. **Contenedor:** `max-w-7xl mx-auto px-4` para contenido público.
4. **Imágenes:** usar `next/image` con `sizes` responsive:
   - Card: `sizes="(max-width: 768px) 50vw, 25vw"`
   - Detalle: `sizes="(max-width: 768px) 100vw, 50vw"`
5. **Gap en grillas** usar números con decimal (ej: `gap-7.5` para 30px).
6. **NO** duplicar componentes para mobile — usar CSS/Tailwind para adaptar.
7. **Padding de página:** mantener `px-4` consistente en todos los tamaños.
8. **Touch targets:** mínimo 44x44px en mobile.
9. **Prefetch:** `prefetch={false}` en links de navegación para evitar sobrecarga en mobile.
