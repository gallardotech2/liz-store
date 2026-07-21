# Liz Store — Escudo Market

Tienda boliviana de bisutería y accesorios elegantes. Moneda: Bolivianos (Bs).

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Despliegue:** Vercel (SSG/ISR)

## Identidad Visual Oficial

> **Regla permanente:** La paleta de colores definida a continuación es la identidad visual oficial del proyecto. No debe restaurarse la paleta anterior. Ningún agente debe cambiar los colores automáticamente. Cualquier modificación futura deberá realizarse únicamente mediante decisión explícita del propietario del proyecto.

**Fuente oficial:** Proyecto de referencia Django `liz-store pythom` → `static/css/style.css` (`:root` variables).

### Paleta de colores

| Token | Valor | Uso |
|-------|-------|-----|
| **Primary** | `#ff8e9f` | Botones principales, CTAs, enlaces destacados, badges, iconografía |
| **Primary Dark** | `#B76E79` | Hover de botones, gradientes, elementos interactivos |
| **Primary Light** | `#FB8496` | Hover states, fondos de categorías, bordes hover |
| **Accent** | `#D4A5A5` | Elementos decorativos, acentos secundarios |
| **Secondary** | `#20232a` | Panel admin (fondo oscuro) |
| **Secondary Light** | `#33373e` | Cards admin |
| **Gold** | `#C9A96E` | Badge "Nuevo", elementos premium |
| **Dark** | `#2D2D2D` | Headings, logo, fondo footer |
| **Text** | `#4A4A4A` | Texto cuerpo |
| **Text Light** | `#888888` | Texto secundario |
| **BG Warm** | `#FDF8F6` | Fondo de página |
| **BG Light** | `#FFFBF9` | Fondos de placeholders |
| **Success** | `#22c55e` | Estados de éxito |
| **Warning** | `#f59e0b` | Advertencias |
| **Danger** | `#ef4444` | Errores, eliminar |
| **WhatsApp** | `#25D366` | Botones de WhatsApp (NO modificar) |

### Excepción: WhatsApp

Los botones y acciones de WhatsApp conservan su color oficial `#25D366` / `#128C7E` / `#1DA851`. Estos colores **no deben ser modificados** bajo ninguna circunstancia.

## Inicio rápido

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Estructura del proyecto

```
app/                    # App Router pages
  (shop)/               # Rutas públicas (home, productos, categorías, carrito, checkout, faq)
  admin/                # Panel admin protegido
  auth/                 # Login / Registro
  api/                  # API routes
components/
  ui/                   # ProductCard, CategoryCard, Button
  admin/                # AdminShell, Sidebar, Navbar, Forms, Charts
  auth/                 # GoogleButton, PasswordInput
  layout/               # Header, Footer, ShopLayout
  shop/                 # CatalogFilters
lib/
  supabase/             # client.ts, server.ts, middleware.ts, storage.ts
  queries/              # queries a Supabase
  cart.ts               # Carrito basado en cookies
  checkout.ts           # Lógica de checkout
types/
  database.ts           # Types TypeScript del schema de Supabase
supabase/sql/
  esquema.sql           # Schema actual de la BD
  migraciones.sql       # Historial de migraciones
  ejecucion.sql         # Migración pendiente
docs_migracion/         # Bitácoras de migración
```

## Despliegue

- **Plataforma:** Vercel
- **ISR:** `revalidate=3600` por defecto
- **Prefetch:** `prefetch={false}` en links del header
