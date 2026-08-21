---
name: convenciones-desarrollo
description: Convenciones generales de código, estilo, imports, y buenas prácticas de desarrollo en Escudo Market
---

# Convenciones de Desarrollo — Escudo Market

## Stack Tecnológico

| Tecnología | Versión | Rol |
|------------|---------|-----|
| Next.js | 16.3.1 | Framework (App Router) |
| React | 19.2.4 | UI Library |
| Tailwind CSS | 4.x | Estilos |
| TypeScript | 5.x | Tipado estricto |
| Supabase | JS SDK 2.x | Backend (DB + Auth + Storage) |
| Vercel | — | Despliegue |

## Convenciones de Código

### TypeScript
- **Strict mode** habilitado en `tsconfig.json`
- Tipar todo: props, returns, state, event handlers
- **NO** usar `any` — excepciones documentadas con comentario
- Path alias `@/*` para imports (`import { Button } from "@/components/ui/Button"`)
- Preferir `interface` sobre `type` para props de componentes
- Nombres en PascalCase para tipos, camelCase para variables/funciones

### Imports
Orden:
1. React/Next.js (`"use client"`, `import { useState } from "react"`)
2. Librerías externas (supabase, clsx)
3. Componentes (`@/components/...`)
4. Utilidades (`@/lib/...`, `@/types/...`)
5. Módulos locales (`./Component`, `../actions`)

### Naming
- Componentes: PascalCase (`ProductCard`, `AddToCartForm`)
- Archivos de componentes: PascalCase (`Button.tsx`, `AddToCartForm.tsx`)
- Archivos de página: `page.tsx`
- Utilidades: camelCase (`formatCurrency`, `parseCart`)
- Constantes: UPPER_SNAKE_CASE (`CART_COOKIE`, `FREE_SHIPPING_THRESHOLD`)
- Archivos de utilidades: kebab-case (`escudo-pago.ts`)

### Server vs Client Components
- **Server Component** por defecto
- Marcar `"use client"` SOLO cuando sea necesario:
  - Hooks de React (`useState`, `useEffect`, `useRouter`)
  - Event handlers (`onClick`, `onSubmit`)
  - `useFormStatus()`
  - Interactividad del navegador
- Server Components pueden importar Client Components
- Server Actions para mutaciones de datos

## Estructura de Archivos

### App Router
```
app/(grupo-ruta)/
├── page.tsx                    # Página (export default async function)
├── layout.tsx                  # Layout del grupo
├── loading.tsx                 # Loading state (opcional)
├── error.tsx                   # Error boundary (opcional)
├── [param]/
│   └── page.tsx                # Ruta dinámica
│   └── actions.ts              # Server Actions relacionadas
└── actions.ts                  # Server Actions del grupo
```

### Componentes
```
components/
├── ui/                         # Componentes atómicos (Button, Card)
├── layout/                     # Layout público
├── shop/                       # Componentes de tienda
├── admin/                      # Componentes admin
└── auth/                       # Componentes de autenticación
```

## Estilo de Código

- Sin comentarios en JSX/TSX a menos que expliquen lógica no obvia
- Tailwind utility classes sobre CSS personalizado
- `cn()` de `lib/utils.ts` para merge de clases condicionales
- Fragmentos `<>...</>` o `<></>` para múltiples elementos sin wrapper
- SVG inline para iconos (librería `react-icons` disponible como fallback)

## Seguridad

### Server Actions Admin
Todas las Server Actions del panel admin **deben** iniciar con `await requireAdmin()`:
```tsx
import { requireAdmin } from "@/lib/supabase/admin-auth"

export async function createProduct(formData: FormData) {
  await requireAdmin()
  // ... lógica
}
```
- Helper en `lib/supabase/admin-auth.ts` usa `forbidden()` de Next.js 16+
- Verifica auth (`getUser()`) + role admin (`profiles.role`)
- **NUNCA** usar `SUPABASE_SERVICE_ROLE_KEY` en Server Actions de admin

### Cookie del Carrito
- Cookie `liz_cart` tiene firma HMAC SHA-256 server-side (`signCartData()`)
- Protección contra manipulación de precios/cantidades
- Legible por JavaScript (no httpOnly) para badge del Header

### Checkout Validation
- Enums validados: `deliveryMethod` ("pickup" | "home"), `paymentMethod` ("escudo" | "direct")
- Phone: regex `/^\d{7,15}$/` (solo dígitos)
- Coordenadas: rango válido para Bolivia (lat -22 a -9, lng -70 a -57)
- Notes: máximo 500 caracteres
