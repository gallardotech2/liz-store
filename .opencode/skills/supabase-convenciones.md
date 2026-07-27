---
name: supabase-convenciones
description: Convenciones para el uso de Supabase en Escudo Market: clientes, queries, RLS y migraciones
---

# Supabase — Escudo Market

## Clientes Supabase

| Archivo | Función | Uso |
|---------|---------|-----|
| `lib/supabase/client.ts` | `createClient()` | Cliente browser (Client Components) usando `createBrowserClient` de `@supabase/ssr` |
| `lib/supabase/server.ts` | `createClient()` | Cliente servidor (Server Components, Server Actions) con `createServerClient` + cookies de `next/headers` |
| `lib/supabase/static.ts` | `createStaticClient()` | Cliente estático (generación de rutas, build time) con `createClient` de `@supabase/supabase-js` |
| `lib/supabase/middleware.ts` | `updateSession()` | Middleware de Next.js para refresh de sesión |
| `lib/supabase/storage.ts` | `uploadImage()`, `deleteImage()` | Subida/eliminación de imágenes a Storage (server-side, usa service role) |

## Patrón de Queries

### Ubicación
Todas las queries reutilizables en `lib/queries/`.

### Estructura
```tsx
// lib/queries/products.ts
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

export async function getProductBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(`*, category:categories(*)`)
    .eq("slug", slug)
    .eq("is_active", true)
    .single()
  if (error) return null
  return data
}
```

### Reglas
1. **Tipar con `Database`** — `createClient<Database>(...)` para autocompletado.
2. **Select explícito** — no usar `select(*)` a menos que sea necesario.
3. **Manejar errores** — retornar `null` o lanzar error según el caso.
4. **Server Components** usan `createClient()` de `server.ts`.
5. **Client Components** usan `createClient()` de `client.ts`.
6. **Build time** usa `createStaticClient()` de `static.ts`.

## Row Level Security (RLS)

Políticas definidas en `supabase/sql/esquema.sql` (~35 políticas).

### Reglas generales
- **profiles**: lectura pública, escritura solo propio usuario.
- **products**: lectura pública (is_active=true), escritura solo admin.
- **categories**: lectura pública, escritura solo admin.
- **orders**: lectura del propio usuario o admin.
- **reviews**: lectura pública, creación desde cliente autenticado.
- **admin tables**: solo admin role puede leer/escribir.

## Sistema de Migraciones

Ver `AGENTS.md` → "Sistema de Migraciones SQL" para el flujo completo.

### Archivos
| Archivo | Propósito |
|---------|-----------|
| `supabase/sql/ejecucion.sql` | Staging — SQL listo para ejecutar |
| `supabase/sql/migraciones.sql` | Historial — changelog completo |
| `supabase/sql/esquema.sql` | Source of truth — schema actual |

### Flujo
1. Escribir SQL en `ejecucion.sql` (estado PENDIENTE)
2. Ejecutar en Supabase Dashboard SQL Editor
3. Marcar EJECUTADO y vaciar
4. Agregar entrada a `migraciones.sql`
5. Actualizar `esquema.sql`

## Almacenamiento (Storage)

- Buckets: `product-images`, `category-images`, `review-images`, `store-images`
- Subida mediante `lib/supabase/storage.ts`
- Service role key necesaria para operaciones server-side

## Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # Solo en Vercel env vars, NO en repo
NEXT_PUBLIC_SITE_URL=...
```

### Seguridad
- `SUPABASE_SERVICE_ROLE_KEY` no debe estar versionada en el repositorio.
- La cookie del carrito (`liz_cart`) NO es httpOnly para permitir lectura client-side del contador. Solo contiene IDs de producto y cantidades, no datos sensibles.
- El cliente browser (`client.ts`) usa anon key con RLS — no expone service role.
