# Migración 04 — Lógica de Negocio (Django Views → Server Actions + Lib)

**Fecha**: 2026-07-16
**Estado**: Completado

## Vistas Django Migradas

| Django View | Archivo Next.js | Tipo de Migración |
|---|---|---|
| `orders/views.py` — `cart_view`, `cart_add`, `cart_update`, `cart_remove` | `lib/cart.ts` + `app/(shop)/carrito/actions.ts` | Server Actions con cookies |
| `orders/views.py` — `checkout_view` | `lib/checkout.ts` + `app/(shop)/carrito/actions.ts` (checkoutAction) | Server Action |
| `orders/views.py` — `cart_add_logic` | `lib/cart.ts` — `addToCart()` | Función pura |
| `payments/views.py` — `payment_process` | `lib/escudo-pago.ts` — `holdPayment()` | Server Action (pendiente de migrar) |
| `payments/views.py` — `payment_success`, `payment_detail` | `lib/escudo-pago.ts` — helpers | Consultas directas Supabase |
| `products/views.py` — `ProductDetailView` | Server Component directo (ver página-architect) | No requiere Server Action |
| `live_tools/views.py` — `register_interest` | `lib/live.ts` — `trackInterest()` | Server Action |
| `live_tools/views.py` — `live_status_api` | `lib/live.ts` — `getActiveSession()` | Server Component |
| `live_tools/signals.py` — `increment_session_interested` | `lib/live.ts` (vía RPC `increment_session_interested`) | Base de datos (migrar a DB function) |
| `live_tools/signals.py` — `update_store_review_stats` | Consulta directa en Server Component | No requiere señal (ISR) |

## Mapeo Detallado

### Carrito (`lib/cart.ts`)

**Original (Django)**: Carrito en `request.session['cart']` como dict JSON.
- `_get_cart(request)` → `parseCart(raw)`
- `_save_cart(request, cart)` → Cookie `liz_cart` con `httpOnly`, `secure`, `maxAge: 30 días`
- `_calculate_cart_total(cart)` → `calculateCartTotal(cart)`
- `cart_add(request)` → `addToCart(cart, product, quantity)` + `addToCartAction(formData)`
- `cart_update(request)` → `updateQuantity(cart, productId, quantity)` + `updateQuantityAction(formData)`
- `cart_remove(request, product_id)` → `removeFromCart(cart, productId)` + `removeFromCartAction(formData)`

**Destino (Next.js)**:
- `CartData` es un `Record<string, CartItem>` — mismo shape que el session dict de Django
- El carrito se guarda en cookie HTTP-only (`liz_cart`) usando `cookies()` de `next/headers`
- Server Components llaman `parseCart(cookieStore.get(CART_COOKIE)?.value)`
- Client Components usan `localStorage` (pendiente de implementar — usar `getCartFromLocalStorage`)
- Los precios se validan contra Supabase en cada Server Action (no se confía en el cookie)
- El stock se valida en `addToCartAction` y `updateQuantityAction`

### Checkout (`lib/checkout.ts`)

**Original (Django)**: Vista `checkout_view` manejaba GET (form) y POST (creación).

**Destino (Next.js)**:
- `validateCheckoutData(data)` — valida nombre requerido, ubicación si es envío a domicilio
- `calculateTotals(subtotal, deliveryMethod)` — replica lógica: 
  - Pickup: shipping = 0
  - Home: shipping = 89 si subtotal < 599, gratis si >= 599
- `createOrder(supabase, input)` — inserta en tabla `orders` + `order_items`
- `generateOrderNumber()` — formato `LZ-{timestamp-base36}-{random}`
- `checkoutAction(formData)` — Server Action que:
  1. Valida datos del formulario
  2. Lee carrito de cookies
  3. Calcula totales en servidor (NUNCA confiar en cliente)
  4. Obtiene usuario autenticado (si aplica)
  5. Crea orden + items en Supabase
  6. Limpia cookie del carrito
  7. Redirige a página de éxito

**Precaución**: En Django, el checkout enviaba la orden por WhatsApp (no procesaba pago real). El flujo actual crea la orden en BD y redirige al éxito. La integración con WhatsApp se maneja en el frontend.

### Escudo Pago (`lib/escudo-pago.ts`)

**Original (Django)**: `payment_process` creaba `Transaction` con status `HELD`, marcaba orden como `PAID`.

**Destino (Next.js)**:
- `holdPayment(supabase, input)` — Crea transacción en estado `held`, marca orden como `paid`
- `releasePayment(supabase, transactionId)` — Cambia transacción a `released`, orden a `completed`
- `refundPayment(supabase, transactionId)` — Cambia transacción a `refunded`, orden a `refunded`
- `getTransactionStatus(supabase, transactionId)` — Consulta estado actual
- Los métodos de pago (`PaymentMethod`) se cargan directamente desde Supabase en Server Components
- StoreProfile (QR, cuenta bancaria) también se consulta directo desde Server Components

**Flujo Escudo Pago**:
1. Cliente hace checkout → orden creada en estado `pending`
2. Cliente va a pago → `holdPayment` crea transacción `held`, orden → `paid`
3. Vendedor confirma envío → (futuro) notifica al sistema
4. Cliente confirma recepción → `releasePayment`, orden → `completed`
5. Si hay disputa → `refundPayment`, orden → `refunded`

### Live Tools (`lib/live.ts`)

**Original (Django)**: Vistas para dashboard, studio, API de estado, registro de interés. Señales para tracking.

**Destino (Next.js)**:
- `trackInterest(supabase, input)` — Inserta `ProductInterest`, llama RPCs para incrementar contadores
- `getActiveSession(supabase)` — Consulta sesión live activa (para badge "EN VIVO")
- Las señales de Django (`post_save`/`pre_delete`) se reemplazan por RPCs de PostgreSQL o lógica inline
- Se necesitan dos RPCs en Supabase:
  - `increment_session_interested(session_id)` 
  - `increment_session_shown(session_id)`
- `update_store_review_stats` se maneja con consulta directa en Server Component con `revalidate` (ISR)

## Decisiones Importantes

### 1. Manejo de Carrito: Cookies HTTP-only vs Sesión Django

| Aspecto | Django (session) | Next.js (cookies) |
|---|---|---|
| Storage | `request.session` (BD/cache) | Cookie `liz_cart` (JSON) |
| Guest support | Sí (session_key) | Sí (cookie sin auth) |
| Server access | `request.session['cart']` | `cookies().get('liz_cart')` |
| Client access | No necesario | `localStorage` (Client Component) |
| TTL | Sesión del navegador | 30 días (`maxAge: CART_MAX_AGE`) |

**Razón**: Las cookies HTTP-only permiten mantener el carrito en guest sin necesidad de sesión en BD. Para Client Components, se necesita un hook que sincronice con localStorage.

### 2. Sesión Guest

- En Django se usaba `request.session.session_key` para asociar órdenes a guests
- En Next.js, las órdenes guardan `sessionKey` nulo si el usuario no está autenticado
- No hay sesión server-side para guests; el carrito vive en cookie
- Para asociar órdenes a guests, se podría generar un `sessionId` en cookie aparte (pendiente)

### 3. Cálculo de Precios en Servidor

- Los precios en la cookie del carrito son solo para display
- Cada Server Action (`addToCartAction`, `updateQuantityAction`) consulta Supabase para validar precio y stock
- `checkoutAction` recalcula totales con `calculateTotals()` ignorando el total del carrito
- El shipping se calcula basado en `deliveryMethod`, no en datos del cliente

### 4. Escudo Pago: Transacciones vs Pago Real

- El Escudo Pago original era un sistema simulado (creaba transacción y marcaba como pagado)
- La migración mantiene el mismo comportamiento pero en Supabase
- Para integración real con pasarela de pago, se necesitaría un webhook externo

## Archivos Creados

| Archivo | Propósito |
|---|---|
| `lib/cart.ts` | Lógica de carrito: funciones puras + tipos `CartItem`, `CartData`, `CartSummary` |
| `lib/checkout.ts` | Validación, cálculo de totales, creación de orden en Supabase |
| `lib/escudo-pago.ts` | Ciclo de vida de transacciones Escudo Pago (hold/release/refund) |
| `lib/live.ts` | Tracking de intereses en live sessions + consulta de sesión activa |
| `app/(shop)/carrito/actions.ts` | Server Actions: addToCart, removeFromCart, updateQuantity, checkout |

## Pendientes

- [ ] Migrar vistas de pago (`payment_process`, `success`, `detail`) a Server Components + Server Actions en `app/(shop)/pago/`
- [ ] Migrar `live_status_api` a API Route (`app/api/live/status/route.ts`) para polling del frontend
- [ ] Crear RPCs en Supabase: `increment_session_interested`, `increment_session_shown`
- [ ] Implementar `getCartFromLocalStorage()` para Client Components (hook `useCart`)
- [ ] Migrar `StoreProfile` signals a consultas directas en Server Components con revalidate
- [ ] Agregar validación de stock al momento del checkout (re-verificar stock de cada item)
- [ ] Migrar dashboard/admin de live_tools a rutas protegidas
