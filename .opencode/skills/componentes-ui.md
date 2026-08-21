---
name: componentes-ui
description: Catálogo completo de componentes UI, sus props, variantes y reglas de uso
---

# Componentes UI — Escudo Market

## Ubicación

Todos los componentes están en `components/`, organizados por categoría:

```
components/
├── ui/               # Atómicos (Button, ProductCard, CategoryCard)
├── layout/           # Header, Footer, ShopLayout, SocialIcons, HeroSocialIcons
├── shop/             # CatalogFilters, WhatsAppOrderButton
├── admin/            # 10 componentes de panel admin
└── auth/             # GoogleButton, PasswordInput
```

## Button (`components/ui/Button.tsx`)

Componente `"use client"` con 6 variantes y 3 tamaños.

### Variantes

| Variant | Estilo visual | Uso principal |
|---------|--------------|---------------|
| `primary` | Gradiente `#ff8e9f`→`#B76E79`, texto blanco | "Agregar al carrito" |
| `secondary` | Blanco, borde `#ff8e9f`, texto `#ff8e9f` | Acciones secundarias |
| `gold` | Gradiente `#C9A96E`→`#B8954E`, texto blanco | Acciones premium |
| `buy` | Gradiente `#2D2D2D`→`#1a1a1a`, texto blanco | "Comprar ahora" |
| `outline` | Transparente, borde gris, texto gris | Acciones terciarias |
| `whatsapp` | `#25D366`, texto blanco | Botón WhatsApp |

### Tamaños

| Size | Padding | Font |
|------|---------|------|
| `sm` | `px-5 py-2.5` | `text-xs` |
| `md` | `px-8 py-3.5` | `text-sm` |
| `lg` | `px-10 py-4` | `text-base` |

### Reglas de uso
- Todos los botones: `rounded-full` (pill shape)
- Hover: `hover:-translate-y-0.5` (lift effect)
- Iconos: inline SVG de 16x16 con `gap-2`
- NO cambiar `rounded-full` por otros bordes
- NO usar `<a>` simulando ser botón — usar el componente Button

## ProductCard (`components/ui/ProductCard.tsx`)

Props: `product: ProductCardProduct`, `className?: string`

**Uso en:** Catálogo, productos relacionados, home (destacados/nuevos).

Estructura:
1. Badges (absolute): "Nuevo" (gold) + descuento (rojo)
2. Imagen: `aspect-square`, `bg-[#FFFBF9]`, hover scale-105
3. Contenido: categoría → nombre → rating → precio

### Reglas
- Usar `next/image` con `fill` y `sizes` responsive
- `loading="lazy"` excepto para imágenes above-the-fold
- Enlace a `/productos/${slug}` con `Link` de Next.js

## CategoryCard (`components/ui/CategoryCard.tsx`)

**Uso en:** Home (categorías). Enlace a `/categorias/${slug}`.
Sigue mismo estilo visual que ProductCard (bordes, sombras, hovers).

## Header (`components/layout/Header.tsx`)

Componente `"use client"`. Sticky con efecto de sombra al scrollear.

Secciones:
- Barra superior promocional / live session
- Logo "Liz Store" (Great Vibes + Cinzel)
- Navegación principal (Inicio, Catálogo, categorías dinámicas, FAQ)
- Icono usuario (link a login si no sesión, dropdown con perfil/pedidos/cerrar sesión si logueado)
- Icono carrito (con contador reactivo vía `useSyncExternalStore` + cookie)
- Menú hamburguesa en mobile con overlay

### Estados de sesión
- **Sin sesión:** Icono usuario linkea a `/perfil` → redirige a login
- **Con sesión:** Icono usuario abre dropdown con "Mi perfil", "Mis pedidos" y "Cerrar sesión"
- **Cerrar sesión:** `supabase.auth.signOut()` + redirección a `/`

### Badge carrito
- Actualización en tiempo real mediante `useSyncExternalStore` + evento `cart:changed` + polling 5s
- Lee contador desde cookie `liz_cart` via `document.cookie` (no httpOnly, pero tiene firma HMAC server-side)
- Se actualiza al agregar, eliminar, cambiar cantidad, navegar, cambiar de pestaña
- El cookie tiene firma HMAC SHA-256 (`signCartData()`) — la manipulación server-side es rechazada

### Reglas
- `prefetch={false}` en todos los links de navegación
- Menú hamburguesa en mobile con overlay
- NO modificar la estructura del logo

## Footer (`components/layout/Footer.tsx`)

Server Component. Secciones:
1. Newsletter: gradiente primary → primary-dark con input email
2. 4-column grid: marca + redes, shop links, ayuda, contacto
3. Copyright bar

### Reglas
- Redes sociales: Facebook, Instagram, TikTok, WhatsApp
- NO agregar redes que no existan
- Teléfono WhatsApp desde `lib/constants.ts`

## ShopLayout (`components/layout/ShopLayout.tsx`)

Wrapper: `<Header />` + `<main>{children}</main>` + `<Footer />`.

## CatalogFilters (`components/shop/CatalogFilters.tsx`)

Componente `"use client"`. Filtros: categoría (select), ordenar (select), búsqueda (text input + botón).
Auto-submitea al cambiar. Shadow, white bg, `rounded-[8px]`.

**Nota:** Usar `value` en `<select>` en lugar de `selected` en `<option>` (React no permite selected en controlled components).

## WhatsAppOrderButton (`components/shop/WhatsAppOrderButton.tsx`)

Botón "Pedir por WhatsApp" visible en catálogo y detalle de producto. Abre WhatsApp con mensaje predefinido incluyendo datos del producto.

## SocialIcons / HeroSocialIcons (`components/layout/SocialIcons.tsx`, `HeroSocialIcons.tsx`)

Iconos de redes sociales (Facebook, Instagram, TikTok, WhatsApp). `HeroSocialIcons` se usa en la hero section del home; `SocialIcons` en el footer y otras secciones.

## Admin Components

**Ver skill `admin-panel`** para detalles de componentes admin.
