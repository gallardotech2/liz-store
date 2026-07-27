# Liz Store — Escudo Market

Tienda boliviana de bisutería y accesorios elegantes. Moneda: Bolivianos (Bs).

## Stack

- **Frontend:** Next.js 16.2.10 (App Router), React 19.2.4, Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Despliegue:** Vercel (SSG/ISR prioritario)
- **Tipos:** TypeScript (strict mode)

---

## Identidad Visual Oficial

> **Regla permanente:** La paleta de colores a continuación es la identidad visual oficial del proyecto, adoptada el 2026-07-20 desde el proyecto Django `liz-store pythom`. No debe restaurarse la paleta anterior. Ningún agente ni desarrollador debe cambiar los colores automáticamente. Cualquier modificación requiere decisión explícita del propietario del proyecto.

**Fuente de verdad:** `app/globals.css` (tokens `@theme inline`).

### Paleta de colores

| Token | Hex | Uso |
|-------|-----|-----|
| **Primary** | `#ff8e9f` | Botones principales, CTAs, enlaces, badges, iconografía |
| **Primary Dark** | `#B76E79` | Hover de botones, gradientes, elementos interactivos |
| **Primary Light** | `#FB8496` | Hover states, fondos, bordes hover |
| **Accent** | `#D4A5A5` | Elementos decorativos |
| **Secondary** | `#20232a` | Panel admin (fondo oscuro) |
| **Secondary Light** | `#33373e` | Cards del panel admin |
| **Gold** | `#C9A96E` | Badge "Nuevo", elementos premium |
| **Dark** | `#2D2D2D` | Headings, logo, fondo del footer |
| **Text** | `#4A4A4A` | Texto cuerpo |
| **Text Light** | `#888888` | Texto secundario |
| **BG Warm** | `#FDF8F6` | Fondo de página |
| **BG Light** | `#FFFBF9` | Fondos de placeholders |
| **Muted** | `#f5f0eb` | Fondos muted |
| **Success** | `#22c55e` | Estados de éxito |
| **Warning** | `#f59e0b` | Advertencias |
| **Danger** | `#ef4444` | Errores, eliminar |
| **Star Rating** | `#F4B740` | Estrellas de valoración |
| **WhatsApp** | `#25D366` | Botones WhatsApp — NO MODIFICAR |
| **WhatsApp Hover** | `#128C7E` | Hover botones WhatsApp — NO MODIFICAR |
| **WhatsApp Dark** | `#1DA851` | WhatsApp dark — NO MODIFICAR |

### Excepciones inmutables

1. **NO** restaurar la paleta anterior (`#B76E79` como primary, `#9A5A63` como primary-dark).
2. **NO** modificar colores de WhatsApp (`#25D366`, `#128C7E`, `#1DA851`).
3. **Ningún agente** debe cambiar la identidad visual automáticamente.

### Tipografía

| Variable | Fuente | Uso |
|----------|--------|-----|
| `--font-sans` | `"Open Sans", Inter, system-ui, sans-serif` | Texto cuerpo, botones, navegación |
| `--font-mono` | `Geist Mono, ui-monospace, monospace` | Código |
| `--font-playfair` | `Playfair Display` (Google Fonts) | Headings, títulos serif |
| `--font-inter` | `Inter` (Google Fonts) | Fallback sans-serif |
| `--font-great-vibes` | `Great Vibes` (400, Google Fonts) | Logo "Liz" (cursiva) |
| `--font-cinzel` | `Cinzel` (Google Fonts) | Logo "Store" (serif) |

**Carga:** `app/layout.tsx` mediante `next/font/google`. Cuatro Google Fonts con `display: "swap"`.

---

## Inicio rápido

```bash
npm install
cp .env.local.example .env.local   # Configurar variables de Supabase
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

---

## Estructura del proyecto

```
app/                                  # App Router — 30+ pages, 4 layouts
├── globals.css                       # Tailwind v4 + theme tokens
├── layout.tsx                        # Root layout (fonts, SEO, viewport)
├── (shop)/                           # Rutas públicas
│   ├── layout.tsx                    # Shop layout (Header + Footer)
│   ├── page.tsx                      # Home
│   ├── productos/
│   │   ├── page.tsx                  # Catálogo (ISR)
│   │   └── [slug]/
│   │       ├── page.tsx              # Detalle producto (ISR)
│   │       └── AddToCartForm.tsx     # Formulario carrito (Client)
│   ├── categorias/
│   │   └── [slug]/page.tsx           # Productos por categoría (ISR)
│   ├── carrito/
│   │   ├── page.tsx                  # Carrito (SSR, cookie-based)
│   │   └── actions.ts               # Server Actions del carrito
│   ├── checkout/
│   │   ├── page.tsx                  # Checkout
│   │   ├── CheckoutForm.tsx          # Formulario checkout (Client)
│   │   ├── OrderSummary.tsx          # Resumen lateral (Client)
│   │   └── [id]/success/page.tsx    # Pedido exitoso
│   └── faq/page.tsx                  # FAQ
├── admin/                            # Panel protegido (auth + role check)
│   ├── layout.tsx                    # Admin layout (AuthGuard)
│   ├── page.tsx                      # Dashboard (ISR)
│   ├── products/                     # CRUD + Server Actions
│   ├── categories/                   # CRUD + Server Actions
│   ├── orders/                       # Listado de pedidos
│   ├── lives/                        # Sesiones en vivo
│   ├── customers/                    # Clientes
│   ├── profile/                      # Perfil tienda
│   ├── payment-methods/              # Métodos de pago
│   ├── pickup-points/                # Puntos de entrega
│   ├── social-links/                 # Redes sociales
│   └── whatsapp-requests/            # Solicitudes WhatsApp
├── auth/
│   ├── login/
│   │   ├── page.tsx
│   │   └── actions.ts               # Server Action login
│   ├── registro/page.tsx             # Registro
│   └── callback/route.ts            # OAuth callback (Google)
├── perfil/                           # Perfil de usuario (no está en (shop))
│   ├── page.tsx                      # Editar perfil
│   ├── ProfileForm.tsx               # Formulario perfil (Client)
│   ├── historial/page.tsx            # Historial de pedidos
│   └── solicitudes/page.tsx          # Solicitudes WhatsApp
├── api/                              # Route Handlers
│   ├── auth/login/route.ts
│   ├── auth/register/route.ts
│   ├── check-admin/route.ts
│   ├── check-db/route.ts
│   ├── check-page/route.ts
│   ├── perfil/update/route.ts        # Actualizar perfil
│   ├── whatsapp-request/
│   │   ├── create/route.ts           # Crear solicitud
│   │   └── checkout/route.ts         # Solicitud desde checkout
│   └── social-links/route.ts         # Redes sociales

proxy.ts                              # Middleware (session refresh + redirects)

components/                           # 25+ componentes
├── ui/                               # Atómicos
│   ├── Button.tsx                    # 6 variants, 3 sizes
│   ├── ProductCard.tsx               # Card de producto
│   └── CategoryCard.tsx              # Card de categoría
├── layout/                           # Layout público
│   ├── Header.tsx                    # Header sticky + nav + cart + logout
│   ├── Footer.tsx                    # Footer completo
│   ├── ShopLayout.tsx               # Wrapper Header+Footer
│   ├── SocialIcons.tsx              # Iconos redes sociales
│   └── HeroSocialIcons.tsx          # Redes en hero section
├── shop/                             # Tienda
│   ├── CatalogFilters.tsx            # Filtros catálogo
│   └── WhatsAppOrderButton.tsx       # Botón pedir por WhatsApp
├── admin/                            # Admin panel
│   ├── AdminShell.tsx
│   ├── AdminSidebar.tsx
│   ├── AdminNavbar.tsx
│   ├── MetricCard.tsx
│   ├── ChartsSection.tsx
│   ├── ProductForm.tsx
│   ├── CategoryForm.tsx
│   ├── ImageDropzone.tsx
│   ├── DeleteButton.tsx
│   └── Icons.tsx
└── auth/
    ├── GoogleButton.tsx              # Google OAuth funcional
    └── PasswordInput.tsx

lib/                                  # 20+ módulos
├── supabase/                         # Clientes Supabase
│   ├── client.ts                     # Browser client
│   ├── server.ts                     # Server client (cookies)
│   ├── middleware.ts                 # Auth middleware helpers
│   ├── static.ts                     # Static client
│   └── storage.ts                    # Storage helpers
├── queries/                          # Consultas a BD
│   ├── products.ts
│   ├── categories.ts
│   ├── orders.ts
│   ├── reviews.ts
│   ├── profiles.ts
│   ├── store.ts
│   ├── social-links.ts
│   ├── whatsapp-requests.ts
│   └── index.ts
├── cart.ts                           # Carrito en cookies (no httpOnly)
├── checkout.ts                       # Lógica de checkout
├── escudo-pago.ts                    # Escudo Pago lifecycle (feature flag)
├── live.ts                           # Live shopping
├── constants.ts                      # Constantes globales
├── features.ts                       # Feature flags
└── utils.ts                          # cn(), formatCurrency(), etc.

types/                                # 786+ líneas
├── database.ts                       # 17+ tablas (Row/Insert/Update)
└── index.ts                          # App-level types + re-exports

supabase/sql/                         # Sistema de migraciones
├── esquema.sql                       # Source of truth (schema completo)
├── migraciones.sql                   # Historial de cambios
└── ejecucion.sql                     # Staging para próxima migración

.opencode/
├── agents/                           # 5 subagentes
└── skills/                           # 16 skills del proyecto
```

---

## Routing y Estrategia de Renderizado

| Ruta | Estrategia | Cache | Detalle |
|------|-----------|-------|---------|
| `/` (home) | ISR | `revalidate: 3600` | Productos destacados y nuevos |
| `/productos` | ISR | `revalidate: 3600` | Catálogo con filtros |
| `/productos/[slug]` | ISR + SSG | `revalidate: 3600`, `generateStaticParams` | Detalle de producto |
| `/categorias/[slug]` | ISR | `revalidate: 3600`, `generateStaticParams` | Productos por categoría |
| `/carrito` | SSR | Sin cache (cookie) | Contenido depende de cookie |
| `/checkout` | SSR | Sin cache | Formulario de pago |
| `/checkout/[id]/success` | SSR | Sin cache | Confirmación de pedido |
| `/perfil` | SSR | Sin cache | Usuario autenticado |
| `/perfil/historial` | SSR | Sin cache | Historial de pedidos |
| `/perfil/solicitudes` | SSR | Sin cache | Solicitudes WhatsApp |
| `/admin/*` | SSR + ISR | `revalidate: 3600` en dashboard | Protegido con auth |
| `/auth/*` | SSG | Estático | Login/registro |

**Client Components (~8):** `Header.tsx`, `AddToCartForm.tsx`, `CheckoutForm.tsx`, `OrderSummary.tsx`, `CatalogFilters.tsx`, `ProfileForm.tsx`, `GoogleButton.tsx`, `PasswordInput.tsx`.

---

## Arquitectura de Carrito

- **Almacenamiento:** Cookie `liz_cart` (30 días de expiración, NO httpOnly para permitir lectura client-side)
- **Tipo:** Sin sesión — funciona para invitados y usuarios registrados
- **Server Actions:** `app/(shop)/carrito/actions.ts` — `addToCartAction`, `removeFromCartAction`, `updateQuantityAction`, `checkoutAction`
- **Badge en tiempo real:** `Header.tsx` usa `useSyncExternalStore` para leer el contador desde la cookie. Se actualiza mediante eventos `cart:changed` (disparado desde `AddToCartForm.tsx`), re-renders por `revalidatePath`, y polling cada 5s como fallback.
- **Shipping:** Bs. 89. Envío gratis sobre Bs. 599.
- **Lógica pura:** `lib/cart.ts` — `parseCart()`, `addToCart()`, `updateQuantity()`, `removeFromCart()`, `calculateCartTotal()`

---

## Autenticación

| Método | Estado | Detalle |
|--------|--------|---------|
| Email + Password | ✅ Funcional | Login y registro con `@supabase/ssr` |
| Google OAuth | ✅ Funcional | Botón "Continuar con Google" en login/registro. Callback en `/auth/callback` |
| OTP (admin) | 🔲 Pendiente | Planeado para administradores |

**Flujo:**
1. Usuario se registra/login mediante Server Actions o Google OAuth
2. `proxy.ts` (middleware) refresca la sesión en cada navegación
3. Admin layout verifica sesión + role `admin` en tabla `profiles`
4. Perfil de usuario en `/perfil` (editar datos personales)

**Protección de rutas:**
- `/perfil/*` — redirige a `/auth/login` si no hay sesión
- `/admin/*` — redirige a `/auth/login` si no hay sesión, o a `/` si no es admin

---

## Perfil de Usuario

- `/perfil` — Editar nombre, teléfono, avatar
- `/perfil/historial` — Historial de pedidos con estados: Pendiente, Confirmado, En preparación, En camino, Entregado, Cancelado
- `/perfil/solicitudes` — Solicitudes de compra vía WhatsApp

---

## Panel Administrativo

Secciones gestionables desde el panel:

| Sección | Funcionalidad |
|---------|--------------|
| Dashboard | Métricas (productos, pedidos, ingresos, usuarios), gráficos de ingresos y categorías |
| Products | CRUD completo: crear, editar, eliminar, imágenes múltiples, descuento, stock |
| Categories | CRUD completo con imagen y orden |
| Orders | Listado de pedidos con estados |
| Lives | Sesiones en vivo (CRUD + productos asociados) |
| Customers | Listado de clientes registrados |
| Profile | Perfil de tienda (logo, descripción, QR, cuenta bancaria) |
| Payment Methods | Métodos de pago administrables (nombre, instrucciones, QR) |
| Pickup Points | Puntos de entrega administrables (dirección, horario, mapa) |
| Social Links | Redes sociales (Facebook, Instagram, TikTok, WhatsApp) |
| WhatsApp Requests | Solicitudes de compra recibidas por WhatsApp |

---

## Integraciones

### Google OAuth
- Proveedor configurado en Supabase Dashboard
- Botón en login y registro
- Callback route en `/auth/callback`
- Requiere configuración de URLs autorizadas en Google Cloud Console

### WhatsApp (Solicitudes de Compra)
- Botón "Pedir por WhatsApp" en catálogo y detalle de producto
- Formulario de solicitud con datos del producto
- Almacenamiento en tabla `whatsapp_requests`
- Visibles desde admin panel

### Escudo Pago
- Sistema de retención/release/reembolso
- Actualmente oculto con feature flag (`ESCUDO_PAGO_ENABLED=false` en `lib/features.ts`)
- Tabla `transactions` con estados: hold, completed, refunded

---

## Base de Datos (Supabase)

**Esquema:** 17+ tablas PostgreSQL administradas mediante migraciones manuales.

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Perfiles de usuario (extends auth.users) |
| `addresses` | Direcciones de envío |
| `categories` | Categorías de productos |
| `products` | Productos (con descuento, rating, stock) |
| `product_images` | Imágenes de productos |
| `orders` | Pedidos (con datos de envío) |
| `order_items` | Items de cada pedido |
| `transactions` | Transacciones Escudo Pago |
| `payment_methods` | Métodos de pago configurados |
| `qr_payments` | Códigos QR por método |
| `reviews` | Reseñas de productos |
| `review_images` | Imágenes de reseñas |
| `store_profiles` | Perfil de la tienda |
| `live_sessions` | Sesiones en vivo |
| `live_session_products` | Productos en sesiones (M2M) |
| `live_products` | Productos de live shopping |
| `product_interests` | Interés en productos (live) |
| `pickup_points` | Puntos de entrega |
| `social_links` | Redes sociales de la tienda |
| `whatsapp_requests` | Solicitudes de compra por WhatsApp |

**Sistema de migraciones:** 3 archivos en `supabase/sql/` — `ejecucion.sql` (staging), `migraciones.sql` (historial), `esquema.sql` (source of truth).

---

## Convenciones Técnicas

### Tailwind CSS 4
- Estilos con `@theme inline` en `globals.css`
- Uso de tokens semánticos (`bg-primary`, `text-primary-dark`)
- Valores arbitrarios solo cuando no existe token
- Sin módulos CSS — todo con utilidades Tailwind

### Server / Client Components
- Por defecto Server Components (App Router)
- Solo se marca `"use client"` cuando es estrictamente necesario (interactividad, hooks, eventos)
- Server Actions para mutaciones de datos
- Estado compartido mediante props, no context innecesario

### SEO
- Metadatos en cada page mediante `generateMetadata`
- OpenGraph: `type: website`, `locale: es_BO`
- `dynamicParams: true` para productos nuevos no pre-renderizados

### Tipos
- `types/database.ts` generado a partir del schema Supabase
- Tipos de aplicación en `types/index.ts`
- `as any` solo como escape temporal documentado

---

## Skills del Proyecto

Las Skills en `.opencode/skills/` contienen reglas detalladas para preservar la consistencia del proyecto. Skills disponibles:

| Skill | Propósito |
|-------|-----------|
| `identidad-visual` | Paleta oficial, prohibiciones, archivos fuente |
| `sistema-diseno` | Tokens de diseño, espaciados, bordes, sombras |
| `tipografia` | Familias, tamaños, pesos, jerarquía |
| `componentes-ui` | Todos los componentes: props, variantes, uso |
| `botones-estados` | Variantes de Button y todos sus estados |
| `responsive` | Breakpoints, patrones responsive |
| `formularios` | Patrones de formularios, validación |
| `admin-panel` | Convenciones del panel administrativo |
| `catalogo-productos` | Catálogo, detalle y fichas de producto |
| `convenciones-desarrollo` | Convenciones de código generales |
| `estructura-componentes` | Organización y naming de componentes |
| `react-practicas` | Buenas prácticas React/Next.js |
| `supabase-convenciones` | Convenciones Supabase (clientes, queries, RLS) |
| `vercel-despliegue` | Configuración de despliegue en Vercel |
| `flujo-trabajo` | Flujo de trabajo del proyecto |
| `iconografia` | Iconos SVG inline y react-icons |

---

## Archivos de Referencia Oficial

| Documento | Rol |
|-----------|-----|
| `README.md` | Visión general, stack, despliegue |
| `AGENTS.md` | Reglas del proyecto para Opencode |
| `app/globals.css` | Tokens de tema (fuente de verdad visual) |
| `types/database.ts` | Schema de BD en TypeScript |
| `supabase/sql/esquema.sql` | Schema de BD en SQL |
| `docs_migracion/` | Bitácoras históricas de migración |
| `.opencode/skills/` | Reglas detalladas por categoría |
| `AUDITORIA_FINAL.md` | Auditoría técnica pre-producción |
| `proxy.ts` | Middleware de sesión y redirecciones |

---

## Comandos

```bash
npm run dev        # Desarrollo
npm run build      # Build producción
npm run start      # Iniciar build
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript check
```
