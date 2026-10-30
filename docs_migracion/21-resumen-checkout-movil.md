# Bitácora 21 — Resumen del pedido fijo en checkout móvil

Fecha: 2026-10-29
Estado: EJECUTADO
Módulo: Checkout (móvil)

## Objetivo
Mostrar un resumen compacto del pedido justo encima del botón fijo **Solicitar por WhatsApp** en el checkout móvil, como una sola zona inferior fija, sin modificar el checkout de PC ni la lógica de carrito, validaciones, envío, pago o mensaje de WhatsApp.

## Decisión (aprobada por el propietario)
- El resumen superior existente se oculta **solo en móvil** (`max-md:hidden`) para no duplicar información; en PC sigue igual en la columna derecha.
- La barra fija móvil contiene: encabezado **Resumen del pedido** + **Subtotal**, máximo 2 ítems visibles y botón **Mostrar N más / Ver menos** cuando hay más de 2.
- Al expandir, la lista tiene altura máxima `min(30dvh, 180px)` con scroll interno; el encabezado, el subtotal y el CTA permanecen siempre visibles.
- Se reserva espacio con un spacer medido con `ResizeObserver` para que la barra nunca tape el final del formulario.

## Cambios

### 1. `app/(shop)/checkout/CheckoutForm.tsx`
- Nuevo estado `summaryExpanded`, ref `mobileBarRef` y alto `mobileBarHeight`.
- `useEffect` con `ResizeObserver` sobre la barra fija: actualiza el alto ante cambios de contenido (expandir/contraer, error, fuente, rotación).
- Spacer `md:hidden` al final de la card `#datos-contacto`, con el alto medido de la barra.
- La barra fija ahora integra:
  - Encabezado con «Resumen del pedido» y `Subtotal Bs. {totals.subtotal.toFixed(2)}`.
  - Filas con miniatura (`next/image`, 32×32), nombre truncado, `x{cantidad}` y total de línea.
  - Lista colapsada a 2 ítems; expandida con scroll interno y `overscroll-contain`.
  - Botón de expandir/contraer con `aria-expanded` y `aria-controls`.
  - El bloque de error y el `Button` de WhatsApp existentes quedan debajo, con el mismo `onClick`, `disabled`, spinner y texto.
- Se mantiene el offset original sobre la BottomNav: `bottom-[calc(3.5rem+env(safe-area-inset-bottom))]`, `z-[60]`.

### 2. `app/(shop)/checkout/OrderSummary.tsx`
- `max-md:static` → `max-md:hidden` (línea 50). En PC el resumen sticky no cambia.

## Sin cambios
- Cálculos de carrito/subtotal/envío, validaciones, métodos de entrega/pago, generación del mensaje de WhatsApp, API de solicitudes, BottomNav, diseño de PC.
- No se agregaron dependencias ni se modificó la identidad visual.

## Verificación
- `npx tsc --noEmit` → 0 errores.
- `npm test` → 36/36 PASS.
- `npm run build` → OK (Next.js 16.3.8).
- ESLint sobre los archivos tocados: sin errores nuevos. Persisten los 2 errores pre-existentes de `react-hooks/set-state-in-effect` (efectos de perfil/sesión ajenos a este cambio) y los warnings pre-existentes de `<img>`.
- Validación CDP/Chrome 390×844 con carritos de 1, 2, 3 y 6 ítems:
  - Resumen superior oculto; barra fija visible sobre la BottomNav.
  - Spacer = alto exacto de la barra (148.25 / 195 / 231.5 / 319 px).
  - 1–2 ítems sin toggle; 3+ con «Mostrar N más»; expandido muestra todos y la lista de 6 ítems scrollea internamente (`scrollHeight 280` / `clientHeight 180`).
  - Imágenes cargadas; sin errores de aplicación (solo el 404 local de `_vercel/insights/script.js`).
  - Error de validación: la barra crece y el spacer se actualiza automáticamente (195 → 221 px).
- PC 1280×900: resumen sticky visible, barra fija y spacer ocultos (`display:none`, alto 0), layout intacto.

## Notas
- En móvil se pierden los botones «Eliminar» del resumen superior; el usuario puede gestionar el carrito desde `/carrito` antes de pagar.
- El resumen móvil muestra **Subtotal** (no Total) para no mezclar el envío de 89 Bs. que no siempre se cobra; el mensaje de WhatsApp conserva los totales calculados.
