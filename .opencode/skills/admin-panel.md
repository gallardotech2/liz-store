---
name: admin-panel
description: Convenciones, estructura y patrones del panel administrativo de Escudo Market
---

# Panel Administrativo — Escudo Market

## Estructura

```
app/admin/
├── layout.tsx              # AuthGuard (verifica sesión + admin role)
├── page.tsx                # Dashboard (ISR, revalidate: 3600)
├── products/               # CRUD productos
│   ├── page.tsx            # Listado
│   ├── nuevo/page.tsx      # Crear
│   ├── [id]/editar/page.tsx # Editar
│   └── actions.ts          # Server Actions
├── categories/             # CRUD categorías (misma estructura)
├── orders/page.tsx         # Listado de pedidos
├── customers/page.tsx      # Clientes
├── lives/                  # Sesiones en vivo (CRUD + studio)
├── profile/page.tsx        # Perfil de tienda
├── payment-methods/        # Métodos de pago (admin)
├── pickup-points/          # Puntos de entrega (admin)
├── social-links/           # Redes sociales (admin)
└── whatsapp-requests/      # Solicitudes WhatsApp (admin)
```

## Layout

```tsx
<AdminShell>
  <AdminSidebar />            // 288px fijo, dark
  <div className="flex-1 flex flex-col">
    <AdminNavbar />           // Top bar con user info
    <main className="flex-1 p-6">   // Contenido
      {children}
    </main>
  </div>
</AdminShell>
```

## Autenticación

### Layout Guard
`app/admin/layout.tsx` verifica:
1. Sesión activa (Supabase auth)
2. Role `admin` en tabla `profiles`
3. Si no es admin: redirige a home
4. Si no hay sesión: redirige a `/auth/login`

### Server Action Guard (`requireAdmin()`)
**TODAS** las Server Actions de admin deben iniciar con `await requireAdmin()`:
```tsx
import { requireAdmin } from "@/lib/supabase/admin-auth"

export async function createProduct(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()
  // ... lógica
}
```
- Helper en `lib/supabase/admin-auth.ts`
- Usa `forbidden()` de Next.js 16+ (retorna 403)
- Verifica: `supabase.auth.getUser()` → `profiles.role === 'admin'`
- **Protege contra invocación directa vía POST** (Server Actions son endpoints independientes del layout)

## Tema Oscuro

| Elemento | Color |
|----------|-------|
| Fondo sidebar | `bg-secondary` (`#20232a`) |
| Fondo cards | `bg-secondary-light` (`#33373e`) |
| Border | `rgba(255,255,255,0.12)` |
| Texto | `text-white` o `text-gray-300` |
| Enlaces hover | `text-primary` |

## Sidebar (`AdminSidebar`)

- 288px fijo (`w-72`)
- Grupos de navegación: Dashboard, Comercio (Products, Categories, Orders), Usuarios (Customers), En Vivo (Lives)
- Active link: `bg-primary/12 text-primary`
- Mobile: overlay slide-in
- User section: avatar + nombre + quick links

## Dashboard (`MetricCard` + `ChartsSection`)

### MetricCard
```tsx
// Props: icon, value, label, trend (opcional)
// Icono en círculo coloreado con color-mix
<MetricCard icon={<DollarIcon />} value="Bs 12,450" label="Ingresos" trend="+12%" />
```

### ChartsSection
- SVG inline (sin librerías externas)
- Revenue chart: barras mensuales (6 meses), color `#ff8e9f`
- Category chart: donut con 8 colores de paleta

## Reglas

1. **ISR** en dashboard (`revalidate: 3600`). SSR en páginas CRUD.
2. **Server Actions** para mutaciones (crear, editar, eliminar).
3. **Componente `"use client"`** solo cuando hay interactividad (forms, sidebar toggle).
4. **No usar librerías de charts** — SVG inline es suficiente.
5. **DeleteButton** con confirmación en 2 pasos.
6. **Imágenes** subir a Supabase Storage mediante `ImageDropzone`.
7. **NO** exponer service role key en Server Actions — usar `createClient()` con cookies + `requireAdmin()`.
