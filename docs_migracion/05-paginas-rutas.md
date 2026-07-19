# Migración 05 — Páginas y Rutas (Next.js App Router)

**Fecha**: 2026-07-16
**Estado**: Completado

## Árbol de rutas generado

```
app/
├── layout.tsx                          # Root layout (fonts, metadata, viewport)
├── globals.css                         # Tailwind v4 + theme personalizado
├── (shop)/
│   ├── layout.tsx                      # Shop layout (Header + Footer + categorías)
│   ├── page.tsx                        # Home (hero, categorías, productos, testimonios)
│   ├── productos/
│   │   ├── page.tsx                    # Catálogo (ISR, revalidate: 3600)
│   │   └── [slug]/
│   │       ├── page.tsx                # Detalle de producto (ISR, revalidate: 3600)
│   │       └── AddToCartForm.tsx       # Client Component para agregar al carrito
│   ├── categorias/
│   │   └── [slug]/
│   │       └── page.tsx                # Productos por categoría (ISR, revalidate: 3600)
│   └── carrito/
│       ├── actions.ts                  # Server Actions (addToCart, removeFromCart, updateQuantity, checkout)
│       └── page.tsx                    # Carrito de compras (SSR - cookies)
├── auth/
│   ├── login/
│   │   └── page.tsx                    # Login (SSR - formulario placeholder)
│   └── registro/
│       └── page.tsx                    # Registro (SSR - formulario placeholder)
```

## Decisiones de renderizado

| Página | Estrategia | `revalidate` | `generateStaticParams` | Razón |
|---|---|---|---|---|
| Home (`/`) | ISR | 3600 | — | Contenido cambia poco; ISR da frescura sin rebuild |
| Catálogo (`/productos`) | ISR | 3600 | — | Filtros y paginación dinámicos; ISR para listados iniciales |
| Detalle producto (`/productos/[slug]`) | ISR | 3600 | ✅ (activos, limit 50) | Pre-genera páginas de productos activos; ISR para updates |
| Categoría (`/categorias/[slug]`) | ISR | 3600 | ✅ (activas, limit 50) | Pre-genera categorías activas; ISR para nuevos productos |
| Carrito (`/carrito`) | SSR | — | — | Depende de cookies del usuario (carrito). No cacheable |
| Login (`/auth/login`) | SSG | — | — | Estático, sin fetching de datos |
| Registro (`/auth/registro`) | SSG | — | — | Estático, sin fetching de datos |

### Notas sobre ISR
- El catálogo NO usa `generateStaticParams` porque acepta query params dinámicos (filtros, búsqueda, paginación). ISR cachea la página en el edge con `revalidate=3600`.
- El detalle y categorías sí usan `generateStaticParams` para pre-generar las páginas más visitadas. Nuevos productos/categorías se renderizan bajo demanda y luego se cachean.
- `prefetch={false}` en todos los `Link` para evitar prefetch innecesario (ahorro de ancho de banda).

## Metadata SEO

| Página | title template | description | keywords |
|---|---|---|---|
| Root layout | `%s \| Liz Store` | Tienda boliviana de bisutería... | bisutería, accesorios, Bolivia... |
| Catálogo | `Catálogo \| Liz Store` | Explora nuestro catálogo... | — |
| Detalle producto | `{product.name} \| Liz Store` | `product.metaDescription` | `product.metaKeywords` |
| Categoría | `{category.name} \| Liz Store` | `category.description` | — |
| Carrito | `Carrito de Compras \| Liz Store` | Revisa tu carrito... | — |
| Login | `Ingresar \| Liz Store` | Ingresa a tu cuenta... | — |
| Registro | `Registro \| Liz Store` | Crea tu cuenta... | — |

Todas las páginas heredan el `openGraph` y `robots` del root layout.

## Consultas Supabase utilizadas

### Catálogo (`/productos`)
```sql
-- Categorías para filtro
categories -> select(name, slug) where isActive = true order by order

-- Productos con filtros
products -> select(id, name, slug, price, discountPrice, rating, ratingCount, isNew, isFeatured, category:categories(name, slug))
  where isActive = true
  [if category] and categoryId = {cat.id}
  [if q] and name ilike '%{q}%'
  order by {sort}
  range({from}, {to})
  count = exact
```

### Detalle producto (`/productos/[slug]`)
```sql
products -> select(*, category:categories(id, name, slug), product_images(id, image, altText, isMain, order))
  where slug = {slug} and isActive = true
  single

reviews -> select(id, title, content, rating, isVerified, createdAt)
  where productId = {p.id} and isApproved = true
  limit 10

products -> select(...) where isActive = true and categoryId = {p.categoryId} and id != {p.id} limit 4
```

### Categoría (`/categorias/[slug]`)
```sql
categories -> select(*) where slug = {slug} and isActive = true single
products -> select(...) where isActive = true and categoryId = {cat.id} order by createdAt desc range({from}, {to})
```

### Carrito (`/carrito`)
```sql
products -> select(id, price, discountPrice, stock, slug, name, product_images(image, isMain))
  where id in ({cartItemIds}) and isActive = true
```

## Componentes Client Component

Solo dos componentes son Client Components en esta migración:

1. **`Header.tsx`** — Estado de menú móvil y efecto de scroll
2. **`AddToCartForm.tsx`** — Selector de cantidad interactivo + botones "Agregar al carrito" y "Comprar ahora"

El resto (ProductCard, CategoryCard, Button, páginas) son Server Components.

## Archivos creados

| Archivo | Propósito |
|---|---|
| `app/(shop)/productos/page.tsx` | Catálogo con filtros, búsqueda, paginación |
| `app/(shop)/productos/[slug]/page.tsx` | Detalle de producto con galería, reseñas, relacionados |
| `app/(shop)/productos/[slug]/AddToCartForm.tsx` | Client Component para carrito |
| `app/(shop)/categorias/[slug]/page.tsx` | Productos por categoría con paginación |
| `app/(shop)/carrito/page.tsx` | Carrito con items, resumen, actions |
| `app/auth/login/page.tsx` | Formulario de inicio de sesión |
| `app/auth/registro/page.tsx` | Formulario de registro |

## Pendientes

- [ ] Migrar checkout (`/checkout`) — Ver `04-logica-negocio.md` para acciones ya migradas
- [ ] Migrar páginas de pago (`/pago/procesar`, `/pago/success`, `/pago/:id`)
- [ ] Migrar perfil de usuario (`/perfil`, `/perfil/direcciones`, `/perfil/pedidos`)
- [ ] Migrar FAQ (`/faq`)
- [ ] Migrar páginas de error (404, 500)
- [ ] Implementar Server Actions de login/registro con Supabase Auth
- [ ] Agregar `loading.tsx` y `error.tsx` para cada segmento de ruta
