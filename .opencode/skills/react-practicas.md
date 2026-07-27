---
name: react-practicas
description: Buenas prácticas de React y Next.js para Escudo Market
---

# Buenas Prácticas React/Next.js — Escudo Market

## Server Components (Prioridad)

Por defecto, todo componente es Server Component en Next.js App Router.

### Beneficios
- 0 JavaScript en bundle para componentes puramente visuales
- Acceso directo a BD, archivos, y recursos del servidor
- SEO optimizado (HTML completo en servidor)

### Cuándo usar "use client"
Solo cuando sea estrictamente necesario:
- `useState`, `useEffect`, `useReducer`
- `useRouter` (navegación programática)
- `useSearchParams` (acceso a query params)
- Event handlers (`onClick`, `onSubmit`, `onChange`)
- `useFormStatus()` o `useFormState()`
- `useRef`
- Context providers

## Server Actions (Mutaciones)

Todas las mutaciones de datos usan Server Actions:

```tsx
// actions.ts
"use server"
export async function myAction(formData: FormData) {
  // Validar datos
  // Ejecutar operación en BD
  // Revalidar caché
  revalidatePath("/ruta")
}
```

### Reglas
- Validar **siempre** en server (nunca confiar solo en cliente)
- Tipar formData correctamente
- Usar `revalidatePath()` o `revalidateTag()` después de mutaciones
- Manejar errores con try/catch y retornar mensajes legibles

## Estado

- Estado local con `useState` para UI state simple
- Estado compartido mediante props (lifting state up)
- **NO** usar Context API ni estado global a menos que sea estrictamente necesario
- **NO** usar Redux, Zustand, u otras librerías de estado

## Routing y Navegación

- `next/link` para navegación declarativa
- `useRouter` para navegación programática
- `prefetch={false}` en links de navegación (optimización Vercel)
- `usePathname` y `useSearchParams` para acceso a ruta actual
- Query params para estado de filtros (compartible por URL)

## Optimización

- `next/image` para todas las imágenes con `loading="lazy"` (excepto above-the-fold)
- `generateMetadata` para SEO de cada página
- `generateStaticParams` para rutas dinámicas predecibles
- Layouts anidados para evitar re-renders completos
- `dynamicParams: true` para contenido nuevo no pre-renderizado

## Formularios

- `<form action={serverAction}>` sobre `onSubmit` (App Router pattern)
- `useFormStatus()` para pending states
- Errores inline con diseño consistente (ver skill `formularios`)
