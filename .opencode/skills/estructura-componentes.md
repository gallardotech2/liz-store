---
name: estructura-componentes
description: Organización, naming y estructura de componentes React en Escudo Market
---

# Estructura de Componentes — Escudo Market

## Categorías de Componentes

```
components/
├── ui/           # Atómicos — reutilizables en cualquier contexto
├── layout/       # Shell público — Header, Footer, ShopLayout, SocialIcons, HeroSocialIcons
├── shop/         # Específicos de la tienda pública
├── admin/        # Específicos del panel admin
└── auth/         # Específicos de autenticación
```

### UI (Atómicos)
Componentes puramente visuales, sin lógica de negocio:
- `Button.tsx` — 6 variantes, 3 tamaños
- `ProductCard.tsx` — Card de producto
- `CategoryCard.tsx` — Card de categoría

### Layout (Shell)
Componentes de estructura de página:
- `Header.tsx` — Navegación principal (Client Component) con perfil dropdown y badge carrito reactivo
- `Footer.tsx` — Footer (Server Component)
- `ShopLayout.tsx` — Wrapper Header + Footer
- `SocialIcons.tsx` — Iconos redes sociales
- `HeroSocialIcons.tsx` — Redes en hero section

### Shop
Componentes específicos de la tienda:
- `CatalogFilters.tsx` — Filtros del catálogo (Client Component)
- `WhatsAppOrderButton.tsx` — Botón pedir por WhatsApp

### Admin
Componentes del panel de administración:
- `AdminShell.tsx`, `AdminSidebar.tsx`, `AdminNavbar.tsx` — Layout admin
- `MetricCard.tsx`, `ChartsSection.tsx` — Dashboard
- `ProductForm.tsx`, `CategoryForm.tsx` — CRUD forms
- `ImageDropzone.tsx`, `DeleteButton.tsx` — Helpers
- `Icons.tsx` — SVG icon library

### Auth
Componentes de autenticación:
- `GoogleButton.tsx` — Botón OAuth (funcional)
- `PasswordInput.tsx` — Input con toggle show/hide

## Reglas de Organización

1. **Cada componente en su propio archivo** — no múltiples exports por archivo.
2. **Nombre del archivo = nombre del componente** (PascalCase).
3. **Componentes de página** en `app/` (no en `components/`).
4. **Componentes reutilizables** en `components/ui/`.
5. **Componentes específicos** en la subcarpeta correspondiente.
6. **NO** crear carpetas dentro de `components/ui/` — aplanar.
7. **Client Components** mantener al mínimo — solo los que necesitan interactividad.

## Patrón de Props

```tsx
// Props con interface, nombradas como ComponentNameProps
interface ProductCardProps {
  product: ProductCardProduct
  className?: string
}

// Default export del componente
export function ProductCard({ product, className }: ProductCardProps) {
  // ...
}
```

## Composición

- `ShopLayout` compone `Header` + `main` + `Footer`
- `AdminShell` compone `AdminSidebar` + `AdminNavbar` + main content
- `Page` components componen secciones directamente en el archivo de página
