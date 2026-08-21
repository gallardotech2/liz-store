---
name: vercel-despliegue
description: Configuración y convenciones de despliegue en Vercel para Escudo Market
---

# Vercel — Escudo Market

## Estrategia de Renderizado

| Estrategia | Cuándo usarla |
|------------|---------------|
| **SSG** (Static Site Generation) | Páginas sin datos dinámicos (auth/login, auth/registro) |
| **ISR** (Incremental Static Regeneration) | Páginas con contenido que cambia ocasionalmente — **por defecto** |
| **SSR** (Server Side Rendering) | Páginas que dependen de cookies o datos de sesión (carrito, checkout) |
| **Pre-fetch** | `prefetch={false}` en links de navegación para evitar sobrecarga |

## Configuración ISR

```tsx
// Por defecto en páginas de contenido
export const revalidate = 3600  // 1 hora
export const dynamicParams = true // Permitir rutas no pre-renderizadas
```

## Next Config (`next.config.ts`)

```ts
const nextConfig = {
  allowedDevOrigins: ['192.168.0.29', '10.29.170.130', '192.168.0.27'],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "i.pinimg.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
}
```

### Reglas
1. **Remote patterns** en `images.remotePatterns` para cualquier nuevo host de imágenes.
2. **`optimizePackageImports`** para paquetes grandes (solo Supabase actualmente).
3. **`bodySizeLimit: "4mb"`** para Server Actions (imágenes de productos móviles).
4. **No deshabilitar** ESLint en build (mantener calidad).
5. **Variables de entorno** configuradas en dashboard de Vercel.

## Security Headers (`vercel.json`)

Headers configurados en `vercel.json` (aplicados a todas las rutas):
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy`: sin `'unsafe-eval'` en producción

## Optimizaciones

1. **ISR** sobre SSR siempre que sea posible.
2. **Prefetch** deshabilitado en navegación (`prefetch={false}`).
3. **next/image** con `loading="lazy"` y `sizes` responsive.
4. **Server Components** por defecto (menos JS en cliente).
5. **SVG inline** para iconos (sin librerías externas de iconos en build).

## Variables de Entorno en Vercel

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) — **NO versionar en repo** |
| `NEXT_PUBLIC_SITE_URL` | URL del sitio desplegado |

## Middleware (`proxy.ts`)

- El archivo `proxy.ts` en la raíz funciona como middleware de Next.js (Edge)
- Se encarga de refrescar la sesión de Supabase en cada navegación
- También maneja redirecciones según autenticación
- NOTA: El `matcher` configurado excluye `_next/static`, `_next/image`, `favicon.ico`, y paths de API de Supabase

## Reglas de Despliegue

1. **No hacer commit** de `.env.local` (contiene secrets).
2. **Build command:** `next build` (por defecto).
3. **Node.js version:** 20.x o superior.
4. **Framework detection:** Next.js (automático en Vercel).
