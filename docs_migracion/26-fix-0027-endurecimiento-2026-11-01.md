# Bitácora 26 — Fix 0027: endurecimiento post-H-01

Fecha: 2026-11-01
Estado: IMPLEMENTADO Y EJECUTADO — SQL aplicado en Supabase el 2026-11-01; deploy pendiente
Módulo: Seguridad transversal (RLS, Storage, rate limit, carrito, checkout, autenticación, anti-bot)
Relacionado: `docs_migracion/25-backlog-seguridad-post-h01-2026-11-01.md`, Fix 0026

## 1. Objetivo

Cerrar los cinco hallazgos altos del backlog posterior a H-01 (SEC-01 a SEC-05) y las capas medias/bajas que dependían de ellos (SEC-06, SEC-07, SEC-08, SEC-10, SEC-11, SEC-12, SEC-13, SEC-15, SEC-16), sin tocar la identidad visual, el bucket `product-images`, el CRUD admin ni la galería del producto.

## 2. Cambios implementados

### SEC-01 — Precios y datos server-side

- Nuevo `lib/whatsapp/validation.ts`: valida items (1–20, IDs únicos, cantidad entera, stock), contacto, teléfono, método de entrega y honeypot.
- `repriceCart()` consulta el precio real (`discount_price ?? price`), el stock y la imagen principal desde `products`; ignora nombre, precio e imagen del cliente.
- `POST /api/whatsapp-request/checkout` y `POST /api/whatsapp-request/create` insertan con service role y usan exclusivamente datos de la BD. Si el precio cambió respecto al enviado por la página, responden `409 PRICE_CHANGED`.
- `CheckoutForm` ya no abre WhatsApp si la API falla; muestra el error y reinicia Turnstile.

### SEC-02 / SEC-03 — RLS de pedidos

En `supabase/sql/ejecucion.sql` (Fix 0027, ejecutado el 2026-11-01):

- Se eliminan `Orders: propio UPDATE`, `Orders: anon INSERT guest` y `Orders: auth INSERT propio`.
- Se elimina `Order Items: INSERT propio`.
- `Order Items: propio ver` se recrea solo para `authenticated` y dueño del pedido.
- La página legacy de éxito ahora exige sesión y pertenencia del pedido; usa `order_items.price` y `orders.shipping_cost`. Se eliminó la mutación de la cookie del carrito desde el Server Component (no permitida); el `checkoutAction` legacy ya la limpia en su Server Action.

### SEC-04 — HMAC del carrito

- `lib/cart.ts` usa el formato versionado `v1.<base64url(payload)>.<hex_hmac>`.
- `parseCart()` exige las tres partes, versión, firma hex de 64 caracteres y `timingSafeEqual`; rechaza cookies legacy sin firma.
- `signCartData()` falla cerrado si `CART_HMAC_SECRET` falta o tiene menos de 32 caracteres.
- Se añadió un secreto local de 64 hex en `.env.local` (no se versiona).

### SEC-05 / SEC-14 — Confirmación de correo

- Se eliminó la auto-confirmación con service role en `POST /api/auth/register`.
- La API devuelve `requiresConfirmation`; la página muestra el estado de éxito existente con el mensaje para revisar el correo.
- El mensaje de registro se mantiene genérico para no enumerar correos.

### SEC-06 / SEC-11 / SEC-12 — Anti-bot, rate limit y checkout invitado

- `lib/rate-limit.ts` ahora es asíncrono: usa la RPC `check_rate_limit` de Supabase con la service role y cae a memoria solo si la RPC o la clave no están disponibles (desarrollo o antes de ejecutar Fix 0027). La RPC no es ejecutable por `anon` ni `authenticated`.
- Fix 0027 crea `rate_limits` y `check_rate_limit` con `SECURITY DEFINER`, ventana atómica y limpieza de registros expirados.
- `lib/security/turnstile.ts` verifica `siteverify` con `TURNSTILE_MODE=off|log|enforce`, action y hostname opcional.
- `components/security/TurnstileWidget.tsx` carga el script de Cloudflare bajo demanda.
- Turnstile + honeypot en registro, login, recuperación de contraseña y checkout. `create` (solicitud de producto) usa rate limit + validación server-side para no renderizar un widget por tarjeta.
- El checkout invitado inserta server-side con service role; `user_id` se toma de `getUser()` y queda `null` para invitados.
- La solicitud de producto (`create`) también acepta invitados con rate limit; el botón no redirige a `/perfil/solicitudes` cuando la API devuelve `guest: true`.
- El panel admin muestra `Invitado` cuando `user_id` es `null` (antes asumía un UUID y podía romperse).

### SEC-07 / SEC-08 / SEC-10 / SEC-13 / SEC-15 / SEC-16

- Fix 0027 impide autopublicar reviews (`is_approved=false`, `is_verified=false`), limita el bucket `reviews` a imágenes de 5 MB y exige carpeta con el UID del usuario.
- Se revoca `EXECUTE` de `increment_session_*` a `PUBLIC`/`anon`; queda `authenticated`.
- Se elimina el INSERT anónimo en `product_interests`.
- `vercel.json`: CSP con Turnstile, `base-uri`, `form-action`, `object-src`; se retira `X-XSS-Protection`.
- Se eliminó `/api/check-page`.
- `.env.local.example` documenta Turnstile; `.env.local` local usa claves de prueba y `TURNSTILE_MODE=log`.

## 3. SQL ejecutado (crítico)

`supabase/sql/ejecucion.sql` contenía Fix 0027 en `ESTADO: PENDIENTE`. Se ejecutó manualmente en el SQL Editor de Supabase el 2026-11-01 con resultado `Success. No rows returned`. El SQL quedó registrado en `supabase/sql/migraciones.sql` (Fix 0027) y `supabase/sql/esquema.sql` refleja el estado final; `ejecucion.sql` quedó vacío en `ESTADO: EJECUTADO`.

Validación local: PostgreSQL 16 en Docker con un arnés que simula `auth.uid()`, roles `anon`/`authenticated`, Storage y las políticas anteriores. Resultado: `FIX 0027 OK`, incluida la prueba de rate limit (tercera llamada bloqueada, ventana expirada libera) y las pruebas de RLS de Storage, reviews, pedidos e items.

**Ventana de despliegue:** el orden recomendado era desplegar el código antes de ejecutar el SQL. El SQL se ejecutó antes del deploy, así que el código anterior —que inserta en `whatsapp_requests` y usa las policies de pedidos con la sesión del usuario— ya no puede crear solicitudes/pedidos hasta que se despliegue este cambio con service role. **Desplegar el código cuanto antes para cerrar la ventana.**

## 4. Variables de entorno requeridas en Vercel

Antes de desplegar este código:

| Variable | Uso | Riesgo si falta |
|----------|-----|-----------------|
| `CART_HMAC_SECRET` | Firmar/verificar el carrito | El carrito queda vacío y agregar falla (fail-closed) |
| `NEXT_PUBLIC_SITE_URL` | URL canónica para el `redirectTo` de recuperación | Reset usa el origin de la request; debe estar en Redirect URLs |
| `SUPABASE_SERVICE_ROLE_KEY` | Insertar checkout invitado y solicitudes | Checkout y solicitud de producto responden 503 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Widget en formularios | Sin widget; en `enforce` los formularios fallan |
| `TURNSTILE_SECRET_KEY` | `siteverify` server-side | En `enforce` los formularios fallan |
| `TURNSTILE_MODE` | `off`, `log` o `enforce` | Sin definir en producción se asume `enforce` |
| `TURNSTILE_EXPECTED_HOSTNAME` | Opcional, hostname permitido | Sin definir no se valida hostname |

En local se usan las claves de prueba de Cloudflare (`1x...`) con `TURNSTILE_MODE=log`. En producción usar claves reales.

Además, en **Supabase Dashboard → Authentication → Providers → Email**, la opción **Confirm email** debe estar activa. Si está desactivada, `signUp` devuelve una sesión, no envía correo y SEC-05 no queda cerrado.

En **Authentication → URL Configuration**, el **Site URL** debe ser el dominio de producción y la lista de **Redirect URLs** debe incluir `${SITE_URL}/auth/update-password`; sin eso, Supabase rechaza el `redirectTo` de la recuperación de contraseña.

La recuperación de contraseña usa PKCE: el enlace del correo debe abrirse en el mismo navegador donde se solicitó, porque el `code_verifier` vive en una cookie. Si se abre en otro dispositivo, el enlace confirma el cambio en Supabase pero la página puede quedar esperando; solicitar uno nuevo desde el mismo navegador.

### Orden de despliegue (estado actual)

1. **SQL Fix 0027: ejecutado** en Supabase el 2026-11-01. Las policies antiguas de INSERT ya no existen.
2. Configurar `CART_HMAC_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` y `TURNSTILE_MODE=log` en Vercel.
3. Desplegar el código **cuanto antes** y probar login, registro, checkout y solicitud de producto. Es prioritario porque el código anterior ya no puede insertar solicitudes/pedidos.
4. Verificar que `check_rate_limit` responde y que los límites devuelven `429`.
5. Cambiar `TURNSTILE_MODE=enforce` y redesplegar; repetir las pruebas de los formularios.

## 5. Verificación

- Fix 0027 ejecutado en Supabase el 2026-11-01 (`Success. No rows returned`); registrado en `migraciones.sql` y `esquema.sql`.
- `npm test`: 57 tests, 0 fallos (21 nuevos: HMAC, validación, Turnstile, rate limit).
- `npx tsc --noEmit`: sin errores.
- `npm run build`: compilación correcta; se mantiene el aviso preexistente de fuente dinámica.
- ESLint: los archivos nuevos/modificados no introducen errores; el repositorio conserva errores preexistentes de `any` y `setState` en efectos ajenos a este cambio.

## 6. Decisiones y pendientes

- No se implementó Upstash: el rate limit usa Supabase RPC para no añadir otro proveedor. SEC-06 queda resuelto con Fix 0027 ejecutado.
- No se incluyó SEC-09 (grants de `auth.*`) porque requiere staging y validación de GoTrue.
- Turnstile no se aplica a `create` para evitar un widget por tarjeta; esa ruta queda con rate limit + validación de producto.
- El flujo legacy `orders` sigue sin referencias en la UI; se endurecieron sus políticas y la página de éxito, pero no se eliminó.
- `TURNSTILE_MODE=off` es el interruptor de emergencia si Cloudflare falla.

## 7. Rollback

- **SQL:** restaurar las políticas anteriores documentadas en `docs_migracion/25-...` y eliminar `rate_limits`/`check_rate_limit`.
- **Código:** revertir el commit de esta fase; el carrito antiguo dejará de validar cookies nuevas, así que vaciar la cookie `liz_cart`.
- **Turnstile:** cambiar `TURNSTILE_MODE=off` y redesplegar (no requiere revertir código).
- **Checkout:** si falta la service role, el flujo responde 503; restaurar la variable en Vercel.

## 8. Próximos pasos

1. Configurar las variables de carrito/service role/Turnstile en Vercel.
2. Desplegar el código con `TURNSTILE_MODE=log` y probar los flujos.
3. Ejecutar Fix 0027 en Supabase (Dashboard → SQL Editor).
4. Registrar Fix 0027 en `migraciones.sql` y actualizar `esquema.sql`.
5. Verificar `check_rate_limit` y los `429`; luego pasar a `enforce`.
6. Probar en producción: registro con confirmación, login, checkout invitado y autenticado, carrito, subida de imágenes y admin.
