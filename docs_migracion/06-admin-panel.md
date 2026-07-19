# Migración 06: Panel Administrativo (Adexa Dashboard → Next.js)

## Mapeo Django → Next.js

| Django Template/Ruta | Next.js Ruta | Componente | Estado |
|---|---|---|---|
| `admin/base_site.html` (layout) | `app/admin/layout.tsx` | `AdminShell` + `AdminSidebar` + `AdminNavbar` | ✅ |
| `admin/index.html` (dashboard) | `app/admin/page.tsx` | `MetricCard`, `ChartsSection` | ✅ |
| `admin:app_list products` | `/admin/products` | — | 🔲 Pendiente |
| `admin:app_list categories` | `/admin/categories` | — | 🔲 Pendiente |
| `admin:app_list orders` | `/admin/orders` | — | 🔲 Pendiente |
| `admin:app_list payments` | `/admin/payments` | — | 🔲 Pendiente |
| `admin:app_list users` | `/admin/customers` | — | 🔲 Pendiente |
| `admin:app_list reviews` | `/admin/reviews` | — | 🔲 Pendiente |
| `live_tools:studio` | `/admin/lives` | — | 🔲 Pendiente |
| `admin:app_list live_tools` | `/admin/live-config` | — | 🔲 Pendiente |

## Decisiones de implementación

### Autenticación y autorización
- El layout (`app/admin/layout.tsx`) es un **Server Component** que verifica la sesión con `createClient()` de `@supabase/ssr`.
- Redirige a `/auth/login` si no hay sesión.
- Verifica el rol `admin` en la columna `role` de la tabla `profiles`.
- Al cerrar sesión, se llama `supabase.auth.signOut()` del lado del cliente y redirige a `/auth/login`.

### Layout y sidebar
- **Dark mode fijo**: fondo `#20232A` (`bg-secondary`), cards `#33373E` (`bg-secondary-light`), bordes `rgba(255,255,255,0.12)`.
- Sidebar de 288px fijo en desktop, deslizable en móvil con overlay semitransparente.
- Navegación agrupada: **Comercio** (Productos, Pedidos, Categorías), **Usuarios** (Clientes), **En Vivo** (Lives, Perfil).
- Enlace activo resaltado con `bg-primary/12` (12% de opacidad del rosa).
- Estado del sidebar manejado en `AdminShell.tsx` (cliente) con `useState`.

### Componentes creados
| Componente | Tipo | Props clave |
|---|---|---|
| `AdminShell` | Client | `userName`, `userEmail`, `children` |
| `AdminSidebar` | Client | `userName`, `userEmail`, `sidebarOpen`, `onClose` |
| `AdminNavbar` | Client | `userName`, `onMenuClick` |
| `MetricCard` | Server | `icon`, `value`, `label`, `trend?`, `accentColor` |
| `ChartsSection` | Server | — (fetches data internally) |
| `Icons` | — | SVG inline components |

### Iconos
- SVG inline puro en `components/admin/Icons.tsx`.
- No se usa Font Awesome ni ninguna librería externa de iconos.
- Cada icono es un componente React que renderiza un SVG con `stroke="currentColor"`.

### Dashboard
- **Server Component** con `revalidate: 3600` (ISR).
- Consultas paralelas con `Promise.all` para 8 métricas.
- Hero card con bienvenida y enlace a la tienda.
- 4 `MetricCard` con datos reales de Supabase.

### Charts
- Implementación propia sin librerías externas (Chart.js / recharts no están en package.json).
- Gráfico de barras SVG para ingresos mensuales (últimos 6 meses).
- Donut chart SVG para productos por categoría.
- Si se requiere interactividad, migrar a recharts.

### Diseño responsive
- Sidebar colapsa en móvil (`max-md:translate-x-full`).
- Grid de métricas: 4 columnas en desktop, 2 en tablet, 2 en móvil.
- Navbar: avatar con nombre en desktop, solo avatar en móvil.
- Botón de notificaciones oculto en móvil (`max-sm:hidden`).
- Padding responsivo: `p-7` → `p-5` → `p-3`.

### Estilos
- Usa los tokens de Tailwind v4 definidos en `globals.css`: `secondary`, `secondary-light`, `primary`, `primary-dark`.
- Clases condicionales con `cn()` de `@/lib/utils`.
- `prefetch={false}` en todos los links del sidebar.

## Pendientes

- [ ] Migrar páginas CRUD: Productos (`/admin/products`), Pedidos (`/admin/orders`), Categorías (`/admin/categories`).
- [ ] Migrar detalle de producto, pedido, usuario.
- [ ] Migrar tabla `changelist` views (listado con filtros, búsqueda, paginación).
- [ ] Migrar formularios de edición/creación.
- [ ] Migrar vista de Lives (Live Studio).
- [ ] Agregar recharts para gráficos interactivos (opcional).
- [ ] Agregar tema light (heredar data-theme del original).
- [ ] Notificaciones en tiempo real con Supabase Realtime.
