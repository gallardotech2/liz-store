# Migración UI: Componentes React + Tailwind v4

## Template → Componente

| Template original | Componente React | Ruta |
|---|---|---|
| `base.html` (top-bar, header, nav, mobile-nav) | `Header.tsx` | `components/layout/Header.tsx` |
| `base.html` (newsletter, footer) | `Footer.tsx` | `components/layout/Footer.tsx` |
| `base.html` (estructura general) | `ShopLayout.tsx` | `components/layout/ShopLayout.tsx` |
| `home.html` (hero, categorías, productos, features, escudo) | `app/(shop)/page.tsx` | `app/(shop)/page.tsx` |
| `includes/product_card.html` | `ProductCard.tsx` | `components/ui/ProductCard.tsx` |
| — (nuevo) | `CategoryCard.tsx` | `components/ui/CategoryCard.tsx` |
| — (nuevo) | `Button.tsx` | `components/ui/Button.tsx` |

## Valores arbitrarios de Tailwind usados

No todos los colores del CSS original se mapean al theme de `globals.css`. Se usaron valores arbitrarios (`[valor]`) para preservar la fidelidad visual:

### Colores originales mapeados a arbitrarios

| Variable original | Color | Uso |
|---|---|---|
| `--rose-gold` (#B76E79 / #ff8e9f) | `text-primary` / `bg-primary` | Se mapeó al theme `#d4a574` como color primario |
| `--rose-gold` (#ff8e9f) | `[rgb(251,132,150)]` | Gradientes de iconos de categoría sin imagen, hover borders |
| `--rose-gold-dark` (#9A5A63) | `[rgb(154,90,99)]` | Nombres de categoría, precios, texto de categoría en producto |
| `--gold` (#C9A96E) | `[#C9A96E]` | Badge "Nuevo", spans decorativos en top-bar/footer, botón gold |
| `--gold-dark` (#B8954E) | `[#B8954E]` | Hover del botón de suscripción newsletter |
| `--dark` (#2D2D2D) | `[#2D2D2D]` | Texto de headings, color del logo, fondo del footer |
| `--text` (#4A4A4A) | `[#4A4A4A]` | Color de texto body |
| `--text-light` (#888888) | `[#888888]` | Subtítulos, textos secundarios |
| `--bg-warm` (#FDF8F6) | `[#FDF8F6]` | Fondo del body |
| `--bg-light` (#FFFBF9) | `[#FFFBF9]` | Fondo de imágenes sin contenido |
| `--shadow-md` (rgba(183,110,121,0.12)) | `[0_4px_15px_rgba(183,110,121,0.12)]` | Sombra del header scrolleado |
| `--shadow-lg` (rgba(183,110,121,0.15)) | `[0_10px_40px_rgba(183,110,121,0.15)]` | Sombra hover de cards |
| `--shadow-xl` (rgba(0,0,0,0.1)) | `[0_20px_60px_rgba(0,0,0,0.1)]` | Sombra de la imagen del hero |
| `--radius-md` (16px) | `[16px]` | Border radius de cards |
| `--radius-lg` (24px) | `[24px]` | Border radius de hero image |
| `--border-color` (rgba(183,110,121,0.05)) | `[rgba(183,110,121,0.05)]` | Bordes de cards |

### Gradientes

| Original | Tailwind |
|---|---|
| `linear-gradient(135deg, #FDF8F6 0%, #F5E6E8 50%, #FDF8F6 100%)` | `bg-gradient-to-br from-[#FDF8F6] via-[#F5E6E8] to-[#FDF8F6]` |
| `linear-gradient(135deg, #1a1a2e, #16213e, #0f0f1a)` | `bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f0f1a]` |
| `radial-gradient(circle, rgba(183,110,121,0.08) 0%, transparent 70%)` | `bg-[radial-gradient(circle,rgba(183,110,121,0.08)_0%,transparent_70%)]` |
| `linear-gradient(135deg, var(--rose-gold), var(--rose-gold-dark))` | `bg-gradient-to-br from-primary to-primary-dark` (usa theme) |
| `linear-gradient(135deg, var(--rose-light), var(--bg-warm))` | `bg-gradient-to-br from-[rgb(251,132,150)] to-[#FDF8F6]` |
| `linear-gradient(135deg, var(--rose-gold), var(--rose-gold-dark))` (newsletter) | `bg-gradient-to-br from-primary to-primary-dark` |
| Instagram gradient | `[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]` |

### Layout/spacing

| Original | Tailwind |
|---|---|
| `max-width: 1280px` | `max-w-7xl` |
| `padding: 0 20px` | `px-4` (1rem = 16px ≈ 20px en contexto) |
| `gap: 30px` (nav) | `gap-7.5` (1 unidad = 4px → 30px = 7.5) |
| `padding: 80px 0` (sections) | `py-20` |
| `padding: 60px 0` | `py-15` |
| `padding: 40px` | `p-10` |
| `aspect-ratio: 1` | `aspect-square` |

## Decisiones de diseño

1. **Colores**: Se priorizó usar las variables del theme de `globals.css` (`--color-primary: #d4a574`) como base. Cuando el diseño original usaba colores específicos (ej. rose-gold #ff8e9f, gold #C9A96E) que no tienen equivalente directo en el theme, se usaron valores arbitrarios de Tailwind `[color]` para mantener la fidelidad visual.

2. **Tipografía**: Se agregaron 4 fuentes via `next/font/google`:
   - `Playfair Display` → headings (serif, reemplaza `--font-serif`)
   - `Inter` → body text (sans-serif, reemplaza `--font-sans`)
   - `Great Vibes` → logo "Liz" (cursive)
   - `Cinzel` → logo "Store" (serif)
   - Las variables CSS se definen en el root layout y se usan via font-family en los componentes.

3. **Server Components**: La página Home (`app/(shop)/page.tsx`) es Server Component con `revalidate = 3600` para ISR. Las consultas a Supabase se hacen en el servidor. Los únicos Client Components son:
   - `Header.tsx`: necesita estado para menú móvil y efecto de scroll
   - El resto de componentes (ProductCard, CategoryCard, Button) son puramente presentacionales y se renderizan en servidor.

4. **Ruteo**: Se usa un Route Group `(shop)` para agrupar las páginas de la tienda. El layout del grupo (`app/(shop)/layout.tsx`) obtiene las categorías y envuelve todo con `ShopLayout` (Header + Footer). El root layout (`app/layout.tsx`) provee solo fonts, metadata y estructura HTML base.

5. **Imágenes**: Se usa `next/image` con `remotePatterns` configurado en `next.config.ts` para supabase.co, i.pinimg.com y picsum.photos. Las imágenes de placeholder usan picsum.photos con seed para consistencia.

6. **Iconos**: Se usan SVG inline en lugar de Font Awesome para evitar dependencias externas. Todos los iconos se definen como JSX en los componentes.

7. **Responsive**: Se replican los breakpoints del CSS original:
   - `max-md:hidden` para ocultar nav en mobile (< 768px)
   - Grid columns se ajustan con `repeat(auto-fill, minmax(...))`
   - Mobile: 2 columnas para productos y categorías, nav se reemplaza por hamburguesa

8. **Enlaces**: Se usa `prefetch={false}` en links del header (usuario y carrito) para ahorrar ancho de banda, según convención del proyecto.

## Archivos creados/modificados

### Creados
- `components/ui/Button.tsx` — Botón reutilizable con variantes
- `components/ui/ProductCard.tsx` — Tarjeta de producto
- `components/ui/CategoryCard.tsx` — Tarjeta de categoría
- `components/layout/Header.tsx` — Header con navegación y menú móvil
- `components/layout/Footer.tsx` — Footer con newsletter y enlaces
- `components/layout/ShopLayout.tsx` — Layout wrapper (Header + Footer)
- `app/(shop)/layout.tsx` — Route group layout con carga de categorías
- `app/(shop)/page.tsx` — Página principal (ISR, revalidate: 3600)

### Modificados
- `app/layout.tsx` — Se agregaron fuentes Google, viewport, metadata, body bg
- `next.config.ts` — Se agregaron remotePatterns para i.pinimg.com y picsum.photos

### Eliminados
- `app/page.tsx` — Página boilerplate de Next.js (reemplazada por `app/(shop)/page.tsx`)
