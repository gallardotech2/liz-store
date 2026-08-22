---
name: formularios
description: Patrones de formularios, estilos de inputs, validación y comportamiento de formularios en Escudo Market
---

# Formularios — Escudo Market

## Input Fields

### Estilos Base
```tsx
// Inputs de texto/number estándar
className="border border-[#DDD] rounded-[8px] p-2.5 text-base font-semibold"

// Inputs con hover/focus (herencia de globals.css)
// hover:border-primary-light, focus:outline-none + ring
```

### Quantity Selector (AddToCartForm)
```tsx
<div className="flex items-center gap-3 my-6">
  <span className="font-semibold text-sm">Cantidad:</span>
  <button type="button"           // Botón -
    className="w-10 h-10 rounded-full border border-[rgb(251,132,150)] bg-white
               cursor-pointer text-lg transition-all duration-300 flex items-center
               justify-center hover:bg-primary hover:text-white hover:border-primary
               disabled:opacity-40"
    onClick={decrement} disabled={quantity <= 1}>−</button>
  <input type="number"            // Input cantidad
    className="w-15 text-center border border-[#DDD] rounded-[8px] p-2.5 text-base font-semibold"
    value={quantity} min={1} max={stock} onChange={...} />
  <button type="button"           // Botón +
    className="w-10 h-10 ..."     // Mismo estilo que botón -
    onClick={increment} disabled={quantity >= stock}>+</button>
</div>
```

### ImageDropzone (Admin)
- Drag & drop con preview de imagen
- Validación client-side: tipo JPG/PNG/WEBP, tamaño máximo 5MB
- Muestra current image o upload prompt
- Soporta clear/reset

## Formularios en Admin

### ProductForm
- Campos: name, slug (auto desde name), SKU, category (select), price, discount, stock, image, description (short/long), checkboxes (active/featured/new), SEO fields
- Auto-slugify desde name con `slugify()`
- Sección de imágenes adicionales con AddImageForm, DeleteImageForm, SetMainForm

### CategoryForm
- Campos: name, slug, image (ImageDropzone), order, description, is_active
- Usa `useFormStatus()` para pending state

## Reglas de Formularios

1. **Server Actions** para envío de datos — no API routes propias.
2. **`useFormStatus()`** para estado pending — no estados locales de loading.
3. **Validación server-side** en la Server Action — no confiar solo en validación client-side.
4. **Errores** mostrar en alert box rojo con icono:
   ```tsx
   <div className="flex items-start gap-2 p-3 rounded-xl
         bg-[rgba(231,76,60,0.08)] border border-[rgba(231,76,60,0.2)]
         text-[#E74C3C] text-[13px]">
     <svg ... /> {error}
   </div>
   ```
5. **Botones de submit** usar `<button type="submit">` o `<Button type="submit">`.
6. **Forms de server action** usar `<form action={serverAction}>` sin `onSubmit`.
7. **NO** usar `useState` para formularios simples — dejar que el form data se maneje nativamente.
8. **Max-width** en inputs numéricos: `w-15` (60px).
9. **Selects** en filtros con estilo consistente: shadow, white bg, rounded.

## Formularios de Autenticación

Patrón: Client Components con `useState` para error/loading.

### Login (`app/auth/login/page.tsx`)
- Email + Password + Google OAuth (GoogleButton)
- Link "¿Olvidaste tu contraseña?" → `/auth/reset-password`
- Link "Regístrate aquí" → `/auth/registro`
- Error message en alert box rojo

### Reset Password (`app/auth/reset-password/page.tsx`)
- Campo email → `resetPasswordForEmail()`
- Mensaje de confirmación tras envío
- Botón "Volver al login"

### Update Password (`app/auth/update-password/page.tsx`)
- Intercambia code por sesión → `updateUser({ password })`
- Redirige a login con mensaje de éxito

### Convenciones
- NO usar `useFormStatus()` en auth (Supabase client es async, no Server Action)
- Validación client-side con `useState` + regex
- Loading state con `useState` + spinner SVG
- Errores de Supabase mostrar directamente al usuario
