# Bitácora 25 — Backlog de seguridad posterior a H-01

Fecha: 2026-11-01
Estado: EN IMPLEMENTACIÓN — Fases 1–6 implementadas en código; Fix 0027 ejecutado en Supabase; deploy pendiente
Módulo: Seguridad transversal (Base de datos, APIs, autenticación, carrito, checkout, anti-bot)
Relacionado: `docs_migracion/24-continuidad-seguridad-h01-2026-11-01.md`, Fix 0026

## 1. Resumen ejecutivo

H-01 quedó cerrado: Fix 0026 fue ejecutado en Supabase, la autorización admin usa `app_metadata.role` y el login funciona. La revisión posterior encontró **5 hallazgos altos, 7 medios y 4 bajos**, además de la ausencia de una estrategia anti-bot/anti-spam coordinada.

Este documento es el registro permanente del backlog y el plan de remediación. La implementación fue aprobada y ejecutada en código; el detalle está en [`docs_migracion/26-fix-0027-endurecimiento-2026-11-01.md`](26-fix-0027-endurecimiento-2026-11-01.md). El SQL de Fix 0027 se ejecutó en Supabase el 2026-11-01 (`Success. No rows returned`) y quedó registrado en `supabase/sql/migraciones.sql` y `supabase/sql/esquema.sql`; el código aún debe desplegarse.

### Conteo

| Severidad | Cantidad |
|-----------|----------|
| Alto | 5 |
| Medio | 7 |
| Bajo | 4 |
| Total | 16 |

## 2. Contexto relevante

- El flujo de compra **activo** es: carrito → `/checkout` → `POST /api/whatsapp-request/checkout` → tabla `whatsapp_requests`.
- El flujo de `orders` / `order_items` (`checkoutAction` en `app/(shop)/carrito/actions.ts` y `lib/checkout.ts`) **no tiene referencias en la UI actual**. Es código legacy, pero sus políticas RLS siguen expuestas.
- `lib/checkout.ts` crea pedidos con precios que vienen del carrito del cliente. Aunque hoy no se invoque, es otra ruta de confianza en precios y debe corregirse o eliminarse.
- `app/(shop)/checkout/CheckoutForm.tsx` envía `id`, `name`, `price`, `quantity` e `image`; la API activa confía en esos valores.
- `next.config.ts` limita Server Actions a 4 MB, mientras `ImageDropzone` permite hasta 12 MB en cliente. Es una inconsistencia funcional preexistente, ajena a este plan, pero se debe vigilar al hacer pruebas de regresión.

## 3. Hallazgos

| ID | Severidad | Hallazgo | Evidencia principal |
|----|-----------|----------|---------------------|
| SEC-01 | Alto | Checkout y solicitud de producto confían en precios/nombres/imágenes enviados por el cliente | `app/api/whatsapp-request/checkout/route.ts:24`, `app/api/whatsapp-request/create/route.ts:28`, `app/(shop)/checkout/CheckoutForm.tsx:198` |
| SEC-02 | Alto | `Orders: propio UPDATE` sin `WITH CHECK`: el usuario puede alterar su pedido | `supabase/sql/esquema.sql:585` |
| SEC-03 | Alto | `order_items` expone ítems de pedidos invitados y permite insertar en pedidos ajenos; además hay INSERT directo en `orders` | `supabase/sql/esquema.sql:583-590` |
| SEC-04 | Alto | El HMAC del carrito acepta cookies sin firma y falla abierto si falta el secreto | `lib/cart.ts:47`, `lib/cart.ts:54`, `lib/cart.ts:69` |
| SEC-05 | Alto | El registro auto-confirma el correo con service role | `app/api/auth/register/route.ts:117-130` |
| SEC-06 | Medio | Rate limit en memoria: inefectivo en serverless y sin limpieza | `lib/rate-limit.ts:1-24` |
| SEC-07 | Medio | `reviews` permite autopublicarse aprobada y el bucket `reviews` acepta subidas de cualquier autenticado | `supabase/sql/esquema.sql:607`, `supabase/sql/esquema.sql:678` |
| SEC-08 | Medio | `increment_session_interested` e `increment_session_shown` son `SECURITY DEFINER` ejecutables por anon | `supabase/sql/esquema.sql:689,700` |
| SEC-09 | Medio | `GRANT DML ON auth.* TO authenticator`: privilegio excesivo | `supabase/sql/esquema.sql:1251` |
| SEC-10 | Medio | CSP con `'unsafe-inline'`; faltan `base-uri`, `form-action` y `object-src` | `vercel.json:27-34` |
| SEC-11 | Medio | `product_interests` permite INSERT anónimo sin límite (`WITH CHECK (true)`) | `supabase/sql/esquema.sql:631` |
| SEC-12 | Medio | El checkout de invitados no puede insertar en `whatsapp_requests` (no hay policy anon) | `app/api/whatsapp-request/checkout/route.ts:32`, `esquema.sql` (RLS de whatsapp_requests) |
| SEC-13 | Bajo | `/api/check-page` es un endpoint de debug público | `app/api/check-page/route.ts:1-45` |
| SEC-14 | Bajo | Enumeración de correos en el registro | `app/api/auth/register/route.ts` (`already registered`) |
| SEC-15 | Bajo | Página de éxito usa columnas inexistentes (`unit_price`, `shipping`) | `app/(shop)/checkout/[id]/success/page.tsx:37,94` |
| SEC-16 | Bajo | `.env.local` no tiene `CART_HMAC_SECRET` ni `SUPABASE_SERVICE_ROLE_KEY`; verificar Vercel | `.env.local`, `.env.local.example` |

## 4. Detalle de los cinco altos

### SEC-01 — Precios y datos del cliente

**Problema.** La API activa calcula el total con `price` enviado por el navegador y guarda `product_name`, `product_image` y `product_price` sin consultar la base de datos. `create` hace lo mismo para una sola solicitud. Cualquier persona puede enviar un precio menor, un nombre falso o cantidades fuera de stock.

**Remediación propuesta.**

1. Crear un módulo server-only `lib/checkout/validate-request.ts` con:
   - Esquema de entrada: `items` (1..20), `id` numérico, `quantity` entero 1..stock, sin IDs duplicados.
   - Validación de `name` (1..100), `phone` (7..15 dígitos), `deliveryMethod` (`pickup`/`home`), `addressText` (máx. 300), `reference` (máx. 200), `notes` (máx. 500).
   - Rechazo de campos desconocidos y de cuerpos que no sean JSON.
2. Consultar los productos en Supabase con `id, name, price, discount_price, stock, slug, product_images(image, is_main)` y `is_active = true`.
3. Usar siempre `discount_price ?? price` y el stock de la base de datos. Ignorar por completo `price`, `name` e `image` del cliente.
4. Calcular subtotal, envío y total con `calculateTotals` de `lib/checkout.ts` (pickup gratis; envío gratis desde Bs. 599; costo 89).
5. Guardar en `whatsapp_requests` únicamente datos generados en servidor: `product_id`, `product_name`, `product_image`, `product_price` (total server-side) y `notes` con el snapshot de ítems.
6. Si el precio actual difiere del que mostraba el cliente, responder `409` con el total actualizado para que la UI pida revisar el carrito.
7. Aplicar la misma lógica a `create` (producto único) y a `lib/checkout.ts` si se conserva el flujo legacy; si se elimina, documentarlo.

**Impacto.** Checkout, mensaje de WhatsApp, vista admin de solicitudes, descuentos, stock, envío gratis y Modo Live. La UI ya muestra precios de base de datos en `checkout/page.tsx`; el cambio principal es que el servidor deja de confiar en el payload.

**Verificación.** Tests unitarios de precios manipulados, producto inactivo, stock insuficiente, cantidad inválida, descuento, umbral de envío gratis y solicitud de un solo producto. Prueba E2E de checkout normal y de precio modificado.

### SEC-02 — `Orders: propio UPDATE`

**Problema.** La política permite al dueño actualizar cualquier columna de su pedido. Sin `WITH CHECK`, también puede reasignar `user_id`, cambiar `total` o marcar `is_paid = true`. No hay código que use esta política (`updateOrderStatus` no tiene llamadas), pero está expuesta vía PostgREST.

**Remediación propuesta.**

- Eliminar la política en Fix 0027:
  ```sql
  DROP POLICY IF EXISTS "Orders: propio UPDATE" ON public.orders;
  ```
- Mantener `Orders: admin todo`.
- Si más adelante se necesita que el cliente cancele su pedido, crear una RPC `cancel_own_order(order_id)` `SECURITY DEFINER` que solo permita pasar de `pending` a `cancelled`, validando `user_id = auth.uid()`.
- No revocar `UPDATE` de la tabla al rol `authenticated` sin antes comprobar que el panel admin sigue pudiendo actualizar (el admin usa el mismo rol con política admin).

**Impacto.** Ninguno en la UI actual. Si se activa Escudo Pago o el flujo legacy de pedidos, habrá que refactorizarlo a RPC o a una ruta server-side.

**Verificación.** En Docker: usuario autenticado no puede actualizar; admin sí; `cancel_own_order` (si se crea) solo cambia estado permitido.

### SEC-03 — `order_items` y creación directa de pedidos

**Problema.** La política SELECT incluye `orders.user_id IS NULL`, así que cualquier anon puede leer los ítems de todos los pedidos invitados. La política INSERT anon exige `session_key` no nulo, pero no lo compara con el solicitante: cualquiera puede añadir ítems a un pedido invitado si conoce su `order_id` (y el leak anterior permite enumerarlos). Además, `Orders: anon INSERT guest` y `Orders: auth INSERT propio` permiten insertar pedidos directamente con totales arbitrarios.

**Remediación propuesta.**

- Eliminar el acceso directo de escritura a `orders` y `order_items` para `anon` y `authenticated`:
  ```sql
  DROP POLICY IF EXISTS "Orders: anon INSERT guest" ON public.orders;
  DROP POLICY IF EXISTS "Orders: auth INSERT propio" ON public.orders;
  DROP POLICY IF EXISTS "Order Items: INSERT propio" ON public.order_items;
  ```
- Restringir la lectura de ítems a pedidos propios:
  ```sql
  DROP POLICY IF EXISTS "Order Items: propio ver" ON public.order_items;
  CREATE POLICY "Order Items: propio ver" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.user_id = (SELECT auth.uid())
  ));
  ```
- Crear pedidos solo desde servidor:
  - Opción A (recomendada si se elimina el flujo legacy): borrar `checkoutAction` y `lib/checkout.ts`; el checkout activo es WhatsApp.
  - Opción B (si se conserva): RPC `create_order_with_items(...)` `SECURITY DEFINER` que valide precios contra `products`, o ruta server-side con service role y validación previa.
- Si se necesita invitado, usar un `session_key` firmado en cookie HttpOnly y una RPC `get_guest_order(order_number, session_key)`; nunca acceso directo a tablas.

**Impacto.** Página de éxito de pedidos, panel admin, flujo legacy. El checkout activo de WhatsApp no usa `orders`.

**Verificación.** Anon no puede SELECT/INSERT; usuario solo ve sus ítems; admin ve todo; éxito de pedido propio funciona; no se puede insertar un pedido con total manipulado.

### SEC-04 — HMAC del carrito

**Problema.** `parseCart` acepta JSON sin `|` (`lib/cart.ts:47`) y, si falta `CART_HMAC_SECRET`, acepta cualquier payload (`lib/cart.ts:54`). `signCartData` devuelve el JSON sin firma si no hay secreto (`lib/cart.ts:69-73`). Esto anula la protección contra manipulación del carrito.

**Remediación propuesta.**

- Nuevo formato versionado: `v1.<base64url(payload)>.<hex_hmac>`.
- `parseCart` exige las tres partes, verifica con `timingSafeEqual` y devuelve `{}` ante cualquier anomalía. Sin excepciones para cookies antiguas.
- `signCartData` lanza un error claro si falta el secreto; no devuelve payload sin firmar.
- Documentar `CART_HMAC_SECRET` en `.env.local.example` y configurarlo en Vercel (Preview y Production). Generarlo con `openssl rand -hex 32`.
- Añadir un chequeo de arranque en el módulo para que producción falle de forma visible si el secreto no está configurado.
- Mantener el re-precio server-side en carrito y checkout como segunda capa.

**Impacto.** Carrito, contador del header, umbral de envío gratis, acciones de añadir/actualizar/eliminar y checkout. Las cookies antiguas se descartan una vez; los usuarios deberán volver a añadir productos. Es el comportamiento seguro esperado.

**Verificación.** Tests de firma válida, payload alterado, firma ausente, formato antiguo, secreto incorrecto y secreto ausente. Prueba manual de añadir, actualizar, eliminar y finalizar compra.

### SEC-05 — Auto-confirmación de correo

**Problema.** El registro usa service role para marcar `email_confirm: true`, saltándose la verificación de correo. Permite crear cuentas con direcciones ajenas, hacer squatting y dificultar el registro legítimo posterior.

**Remediación propuesta.**

- Eliminar el bloque de auto-confirmación de `app/api/auth/register/route.ts`.
- Devolver `requiresConfirmation: true` cuando `data.session` sea `null`.
- En `app/auth/registro/page.tsx`, mostrar el estado de éxito existente con el mensaje "Revisa tu correo para confirmar tu cuenta" y enlace a login; no redirigir a `/`.
- Verificar en Supabase Dashboard que "Confirm email" esté activo y que el SMTP/templates funcionen.
- Para desarrollo local, permitir auto-confirmación solo con una variable explícita `ALLOW_DEV_AUTOCONFIRM=true` y `NODE_ENV !== "production"`; nunca en producción.
- Mantener rate limit y añadir Turnstile (fase anti-bot).

**Impacto.** Registro, login antes de confirmar, creación de perfil por trigger, entrega de correos. Los usuarios existentes no se ven afectados. Si el negocio necesita acceso inmediato, evaluar magic link u OAuth en lugar de auto-confirmar.

**Verificación.** Registro devuelve sin sesión; login sin confirmar muestra mensaje; enlace de confirmación funciona; perfil se crea; login confirmado redirige según rol; plantilla de correo correcta.

## 5. Hallazgos medios y bajos (resumen)

- **SEC-06 (Medio).** Reemplazar `lib/rate-limit.ts` por un limitador distribuido (Upstash Ratelimit o equivalente) con ventana deslizante, `Retry-After` y limpieza; fallback en memoria solo para desarrollo. Aplicar a registro, login, reset, checkout, `create`, `check-page` y `product_interests`.
- **SEC-07 (Medio).** En `reviews`, impedir `is_approved = true` e `is_verified = true` en INSERT (RLS con `WITH CHECK` + grants por columna o trigger). En Storage, limitar el bucket `reviews` a `image/*`, tamaño máximo y subida solo del propio usuario; conservar lectura pública. No tocar el bucket `product-images`.
- **SEC-08 (Medio).** Revocar `EXECUTE` de `increment_session_*` a `PUBLIC`/`anon`; otorgar solo a `authenticated` o mover la llamada a una server action. Confirmar que Modo Live no las invoca desde el cliente.
- **SEC-09 (Medio).** Revisar el `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO authenticator` (Fix 0006). No revocar a ciegas: probar en una rama/staging porque GoTrue puede depender de ello. Objetivo: mínimo privilegio.
- **SEC-10 (Medio).** Añadir `base-uri 'self'`, `form-action 'self'` y `object-src 'none'`; retirar `X-XSS-Protection` (obsoleto). La CSP estricta con nonce es difícil con SSG/ISR; planificar una fase aparte. Si se usa Turnstile, agregar `https://challenges.cloudflare.com` a `script-src`, `frame-src` y `connect-src`.
- **SEC-11 (Medio).** `product_interests` no se usa en la UI actual, pero su INSERT abierto permite spam. Mover la inserción a una ruta server-side con Turnstile + rate limit, o añadir una RPC con límites; eliminar la policy `WITH CHECK (true)`.
- **SEC-12 (Medio).** Definir el checkout de invitados: (A) exigir login, o (B) insertar server-side con service role tras validar Turnstile, precios y rate limit. Hoy la API acepta `user_id: null` pero RLS lo rechaza, así que el invitado no puede completar. Recomendado B si se quiere conservar la conversión; A si se prioriza simplicidad.
- **SEC-13 (Bajo).** Eliminar `/api/check-page` o protegerlo con `requireAdmin`/secreto. No se referencia desde la app (solo artefactos de build).
- **SEC-14 (Bajo).** Unificar el mensaje de registro para no revelar si el correo existe; enviar correo genérico al titular si corresponde.
- **SEC-15 (Bajo).** Corregir `success/page.tsx`: `order_items.price` (no `unit_price`) y `orders.shipping_cost` (no `shipping`). Decidir si se conserva la página o se elimina con el flujo legacy.
- **SEC-16 (Bajo).** Confirmar `CART_HMAC_SECRET` y `SUPABASE_SERVICE_ROLE_KEY` en Vercel. En local, añadir el secreto de carrito; la service role solo si se prueba registro/Storage local. No commitear secretos.

## 6. Plan anti-bot y anti-spam (transversal)

Objetivo: que ningún formulario público pueda ser automatizado masivamente y que las tablas no acepten escrituras anónimas sin control.

### Capas

1. **Cloudflare Turnstile** en registro, login, recuperación de contraseña, checkout, solicitud de producto y "me interesa" de Modo Live.
   - Widget invisible/interaction-only; carga diferida solo en páginas con formulario.
   - Verificación server-side contra `https://challenges.cloudflare.com/turnstile/v0/siteverify` con `secret`, `response` y `remoteip`.
   - Validar `success`, `action` y `hostname`; token de un solo uso y 300 s de vida; fallar cerrado.
   - Variables: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
   - Modo de despliegue `TURNSTILE_MODE=log|enforce|off` para activar primero en observación y luego en bloqueo.
2. **Rate limit distribuido** con Upstash Ratelimit (ventana deslizante) por IP + ruta + usuario; `429` con `Retry-After`. Excluir `/admin` y las server actions de imágenes.
3. **Validación de entrada** con funciones puras (sin nueva dependencia): longitudes, enums, arrays, tipos, tamaño máximo de body y rechazo de campos desconocidos.
4. **Honeypot + tiempo de formulario**: campo oculto y marca de tiempo; rechazar si se rellena o si se envía en menos de ~2 s. Sin impacto visual.
5. **Supabase**: eliminar INSERT anónimo directo en `product_interests`, `whatsapp_requests` (si se permite invitado, server-side) y `reviews`; añadir constraints/triggers y RPCs acotadas.
6. **Opcional Vercel BotID/WAF** si se prefiere una capa nativa de Vercel; Turnstile es suficiente y independiente del proveedor.

### Impacto en funcionalidades existentes

| Funcionalidad | Riesgo del cambio | Mitigación | Prueba obligatoria |
|---------------|-------------------|------------|--------------------|
| Subida de imágenes admin | Rate limit o CSP podrían bloquearla | No aplicar Turnstile a `/admin`; excluir uploads del limitador; mantener `connect-src`/`img-src` de Supabase | Subir, previsualizar, guardar y eliminar imagen en producto |
| CRUD de productos | Validación o RLS nueva | No tocar Server Actions admin ni policies admin | Crear/editar/desactivar producto |
| Checkout WhatsApp | Token, rate limit o re-precio | Token invisible, reintento, `409` claro por cambio de precio | Compra normal, precio alterado, invitado/logueado |
| Carrito | HMAC fail-closed | Cookie versionada y re-precio server-side | Añadir, cambiar cantidad, eliminar, recargar |
| Registro/login | Turnstile + confirmación | Modo `log` primero, mensajes claros, test keys | Registro, confirmación, login admin/cliente |
| Panel admin | Policies de orders | Mantener `admin todo`; probar actualización de estado | Ver/actualizar pedido |
| Reseñas/Storage | Policies nuevas | Probar con usuario de prueba; no tocar `product-images` | Subida propia, lectura pública, rechazo ajeno |
| Modo Live | RPC de métricas | Revocar anon y probar desde la UI | Interacción live |
| Galería/zoom | Sin cambios | No tocar `ProductGallery*` | Hover PC y tap Android |
| SEO/ISR | Script de Turnstile | Carga diferida solo en formularios | Build y páginas estáticas sin errores |

## 7. Fases de implementación

### Fase 0 — Preparación
- Crear rama de trabajo y respaldo.
- Ejecutar baseline: `npx tsc --noEmit`, `npm test`, `npm run build`, ESLint.
- Levantar PostgreSQL 16 en Docker para validar SQL.
- Confirmar variables de entorno en Vercel (sin exponerlas).

### Fase 1 — Fix 0027 (base de datos)
- SEC-02, SEC-03, SEC-07, SEC-08, SEC-11.
- Se escribió en `supabase/sql/ejecucion.sql` con `ESTADO: PENDIENTE`, se validó en Docker, se ejecutó en Supabase el 2026-11-01 y se registró en `migraciones.sql`/`esquema.sql`.
- No incluir SEC-09 (auth grants) hasta probar en staging.
- Rollback documentado por política.

### Fase 2 — Precios server-side (SEC-01)
- Nuevo validador server-only.
- Refactor de `checkout` y `create`.
- Ajuste mínimo de `CheckoutForm` para manejar `409`.
- Tests puros + E2E.

### Fase 3 — Carrito HMAC (SEC-04)
- Formato versionado, fail-closed y env.
- Tests y prueba manual de carrito/checkout.

### Fase 4 — Confirmación de correo (SEC-05)
- Quitar auto-confirmación, ajustar UI y probar SMTP.
- Actualizar mensajes de error (SEC-14).

### Fase 5 — Anti-bot (SEC-06, SEC-11, SEC-12)
- Turnstile + Upstash + honeypot + validación.
- CSP de Turnstile.
- Decidir checkout invitado (A/B).
- Pruebas de abuso y regresión de uploads.

### Fase 6 — Limpieza y regresión
- SEC-10 (CSP/headers), SEC-13 (check-page), SEC-15 (success page), SEC-16 (env).
- Regresión completa y despliegue por fases.

## 8. Criterios de aceptación

- Un precio manipulado no altera el total ni el nombre del producto.
- Un usuario no puede actualizar `orders` ni insertar `order_items` directamente.
- Anon no puede leer ítems de pedidos invitados.
- Una cookie de carrito sin firma o con firma inválida se rechaza.
- El registro exige confirmación de correo; no hay auto-confirmación en producción.
- Los formularios públicos rechazan bots sin token válido; el rate limit responde `429`.
- Subida de imágenes, login, checkout, admin, galería y exportación siguen funcionando.
- `tsc`, ESLint, tests, build y validación SQL en Docker pasan.
- Sin secretos en git.

## 9. Decisiones pendientes

1. Checkout de invitados: exigir login (A) o flujo server-side con service role + Turnstile (B).
2. Auto-confirmación: eliminarla en producción; decidir si se conserva solo en desarrollo.
3. Proveedor anti-bot: Turnstile (recomendado) o Vercel BotID/WAF.
4. Rate limit: Upstash (recomendado) o tabla/RPC en Supabase.
5. Flujo legacy `orders`: eliminar o refactorizar a RPC server-side.
6. CSP estricta con nonce: evaluar impacto en SSG/ISR; por ahora mantener `unsafe-inline` y reforzar el resto.
7. Galería: confirmar si el usuario espera zoom en tarjetas del catálogo (no está implementado) o solo en la ficha de producto.

## 10. Referencias técnicas (Context7)

- `/supabase/supabase` — RLS con `WITH CHECK`, grants por columna, límites de bucket (`allowedMimeTypes`, `fileSizeLimit`).
  - `WITH CHECK` valida la fila resultante y evita reasignar `user_id`.
  - Column-level grants: `REVOKE UPDATE ...` + `GRANT UPDATE (columnas) ...`.
- `/websites/developers_cloudflare_turnstile` — verificación server-side con `siteverify`, token de 300 s de un solo uso, test keys (`1x...AA` pasa, `2x...AA` falla, `3x...AA` token gastado).
- `/websites/upstash_redis_sdks_ratelimit-` — rate limiting distribuido para serverless (resuelto; implementación en fase anti-bot).

## 11. Rollback

- **SQL:** guardar el SQL inverso de cada política en este documento/ejecución; restaurar políticas anteriores si un flujo se rompe.
- **Código:** commits por fase; revertir la fase afectada. Turnstile con `TURNSTILE_MODE=off` como interruptor de emergencia.
- **Carrito:** si falta el secreto, el carrito queda vacío (fail-closed); corregir env y redesplegar.
- **Registro:** si el SMTP falla, reactivar temporalmente la auto-confirmación solo con aprobación explícita y registro de la excepción.

## 12. Estado

- Revisión: completada.
- Registro: este documento + Engram (`security/backlog-post-h01`).
- Implementación en código: **completada** (Fases 1–6), detalle en `docs_migracion/26-fix-0027-endurecimiento-2026-11-01.md`.
- SQL Fix 0027: **ejecutado** en Supabase el 2026-11-01; SEC-02/03/07/08/11 y el rate limit distribuido quedan cerrados a nivel de base de datos.
- Código Fix 0027: **pendiente de deploy**. El código anterior ya no puede insertar solicitudes/pedidos porque las policies antiguas fueron eliminadas; desplegar cuanto antes.
- Variables de Vercel: **pendientes de confirmar/configurar** (`CART_HMAC_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, Turnstile).
