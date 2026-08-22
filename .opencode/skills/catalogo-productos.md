---
name: catalogo-productos
description: Convenciones para el catálogo y detalle de productos de Escudo Market
---

# Catálogo y Detalle de Productos — Escudo Market

## Catálogo (`/productos`)

**Archivo:** `app/(shop)/productos/page.tsx`

### Estrategia de renderizado
- ISR con `revalidate: 3600`
- Filtros en query params: `categoria`, `sort`, `search`
- Server Component — `CatalogFilters` es el único Client Component

### Grid de productos
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7.5">
  {products.map(p => <ProductCard key={p.id} product={p} />)}
</div>
```

### Filtros (`CatalogFilters`)
- Select de categorías
- Select de ordenamiento (newest, price_asc, price_desc, rating, name_asc)
- Input de búsqueda + botón
- Auto-submit al cambiar, usando `useRouter` + `searchParams`

## Detalle de Producto (`/productos/[slug]`)

**Archivo:** `app/(shop)/productos/[slug]/page.tsx` (Server Component)

### Datos consultados
- Producto por slug (con categoría, imágenes)
- Productos relacionados (misma categoría)
- Reseñas (si existen)

### Estructura visual (desktop)
```
┌─────────────────────┬──────────────────────────────┐
│                     │  Categoría label             │
│     Galería         │  Nombre del producto         │
│    (sticky)         │  Rating ★★★☆☆               │
│                     │  Precio (con descuento)      │
│                     │  Stock disponible             │
│                     │  Descripción corta           │
│                     │                              │
│                     │  Cantidad: [-] [2] [+]       │
│                     │                              │
│                     │  [Comprar ahora] [Carrito]    │
│                     │                              │
│                     │  🛡 Escudo Pago              │
│                     │                              │
│                     │  Descripción larga           │
│                     │  SKU                         │
├─────────────────────┴──────────────────────────────┤
│              Productos Relacionados                 │
├────────────────────────────────────────────────────┤
│                    Reseñas                          │
└────────────────────────────────────────────────────┘
```

### Botones (AddToCartForm)
- **Comprar ahora**: `variant="buy"` (negro), primera posición
- **Agregar al carrito**: `variant="primary"` (rose-gold), segunda posición
- Ambos con `flex-1` para igual ancho en desktop
- Apilados verticalmente en mobile (`max-md:flex-col`)
- Sólo visibles si `stock > 0`

### Galería de imágenes
- Imagen principal: `aspect-square`, `rounded-[16px]`
- Thumbnails: `w-20 h-20`, `rounded-[8px]`, borde hover primary
- Sticky en desktop (`sticky top-[100px]`), static en mobile

### Precio
```tsx
// Precio con descuento
<span className="text-[28px] font-bold text-[rgb(154,90,99)] font-serif">
  {formatCurrency(displayPrice)}
</span>
{hasDiscount && (
  <>
    <span className="text-xl text-[#888888] line-through">{formatCurrency(p.price)}</span>
    <span className="text-[12px] text-white bg-[#E74C3C] px-2 py-0.5 rounded font-semibold">
      -{discountPct}%
    </span>
  </>
)}
```

## Related Products

```tsx
{relatedProducts.length > 0 && (
  <section>
    <div className="section-tag">Relacionados</div>
    <h2 className="section-title">También te puede gustar</h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-7.5">
      {relatedProducts.map(p => <ProductCard key={p.id} product={...} />)}
    </div>
  </section>
)}
```

## Reseñas

```tsx
{reviews.length > 0 && (
  <section>
    <h3>Reseñas de clientes</h3>
    {reviews.map(r => (
      <div key={r.id}>
        <div>★★★★☆</div>
        <span>{r.userName}</span>
        <span>✓ Compra verificada</span>
        <p>{r.content}</p>
      </div>
    ))}
  </section>
)}
```

## Textos Homepage (actualizado 2026-08-22)

**Archivo:** `app/(shop)/page.tsx`

### Hero
- **Título:** "Tu estilo merece brillar"
- **Subtítulo:** "Descubre piezas que transforman un look sencillo en uno que roba miradas."

### Categorías
- **Label:** "Categorías"
- **Título:** "El detalle que buscas"
- **Subtítulo:** "Descubre piezas para cada ocasión y encuentra la que va contigo."

### Destacados
- **Label:** "Destacados"
- **Título:** "Las favoritas"
- **Subtítulo:** "Descubre las piezas que están marcando tendencia."

### Recién llegados
- **Label:** "Novedades"
- **Título:** "Recién llegados"
- **Subtítulo:** "Mira las nuevas piezas que tenemos para ti."

### Beneficios (íconos FaShieldAlt, FaTruck, FaGem, FaHeart)
- **Envío Seguro:** "Realizamos envíos seguros y rápidos a todo el país."
- **Calidad Seleccionada:** "Trabajamos con piezas cuidadosamente seleccionadas."
- **Atención Personalizada:** "Te brindamos asistencia durante tu proceso de compra."

### Footer (`components/layout/Footer.tsx`)
- **Descripción:** "Detalles que hablan de ti. Piezas seleccionadas para acompañarte en cada ocasión."

### ⚠️ Regla estricta
Al modificar textos del homepage: **SOLO cambiar el contenido textual**. No tocar botones, IDs, links, clases CSS, ni estructura HTML. El usuario se enoja si se modifica algo que no sea el texto literal.

## Reglas

1. **ISR** siempre que sea posible (`revalidate: 3600`).
2. **`generateStaticParams`** para slugs de productos activos.
3. **`dynamicParams: true`** para permitir productos nuevos no pre-renderizados.
4. **`notFound()`** si el producto no existe o no está activo.
5. **Precios** siempre con `formatCurrency()` de `lib/utils.ts`.
6. **Descripción larga** con `dangerouslySetInnerHTML` — sanitizar contenido.
7. **Stock** validar en Server Action al agregar al carrito (no confiar en cliente).
8. **No modificar** el orden de botones sin autorización explícita.
