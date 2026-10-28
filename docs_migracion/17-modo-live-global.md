# Bitácora 17 — Modo Live global permanente

Fecha: 2026-10-26
Estado: EJECUTADO (2026-10-26)
Módulo: Admin / Modo Live / Studio / Catálogo Live / Home / Ofertas / Ficha de producto

## Objetivo

Convertir el Modo Live basado en sesiones en una **configuración única,
permanente y global** para toda la tienda. El administrador deja de crear o
elegir sesiones: trabaja con un solo Modo Live que conserva su catálogo,
precios, orden y producto en pantalla entre activaciones.

## Decisiones de arquitectura

- Una sola fila global en `live_sessions`, marcada con `is_global = true`.
  El índice único parcial impide duplicados.
- El catálogo vive en `live_products` y se conserva al finalizar. Desactivar
  no borra productos, precios ni orden.
- El estado se resuelve con `status` + `ends_at`. Un Live vencido se considera
  inactivo en lectura; el admin lo finaliza de forma perezosa al abrir el
  dashboard (`finalizeExpiredLiveMode`), sin cron ni escrituras por segundo.
- La finalización programada usa una fecha absoluta (`ends_at`). No se usa
  `duration_hours` para el nuevo flujo.
- No se crean sesiones, listados, selectores ni numeración en la UI.
- El Studio y la página de catálogo trabajan sobre la misma fila global.
- El modo de pausa desaparece del nuevo flujo. Los estados heredados se
  conservan en la base para no romper filas históricas.
- Se conservan las acciones heredadas (`createLiveSession`, `updateLiveSession`,
  `deleteLiveSession`, `startLiveSession`, `pauseLiveSession`) para no borrar
  código de migraciones anteriores, pero ya no tienen UI.

## SQL — Fix 0023 (EJECUTADO 2026-10-26)

Archivo: `supabase/sql/ejecucion.sql`. Ejecutado por el propietario en
Supabase Dashboard > SQL Editor el 2026-10-26. Registrado en
`supabase/sql/migraciones.sql` y reflejado en `supabase/sql/esquema.sql`.

1. `ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS is_global BOOLEAN
   NOT NULL DEFAULT false`.
2. Selección de la configuración base, en este orden:
   - fila global existente;
   - Live activo no vencido;
   - última configuración con productos;
   - última sesión existente;
   - si no hay ninguna, se crea `Modo Live` con estado `ended`.
3. Solo si la fila global no tiene productos, se copia el catálogo de la
   última configuración que sí los tenga. No se fusionan catálogos de varias
   sesiones: se evita mezclar productos históricos.
4. Se cierran otros `status = 'live'`, se renumera `live_products.order` y se
   reconstruye `live_session_products`.
5. Se rellena `products.live_price` solo cuando está vacío y el precio es
   válido (`0 <= live_price < discount_price ?? price`).
6. Se crea el índice único parcial `uniq_live_session_global`.
7. Se crea la RPC `start_live_mode(p_session_id, p_ends_at)`:
   - valida administrador con `is_hot_admin()`;
   - exige fila global y fecha futura;
   - impide iniciar un Live ya activo y vigente;
   - exige al menos un producto;
   - cierra otras filas activas;
   - conserva el catálogo y el producto actual si sigue existiendo;
   - permite reiniciar después de finalizar.

## Admin

- `app/admin/lives/page.tsx`: dashboard único con estado, contador, producto en
  pantalla, catálogo, inicio, finalización y programación. Si falta la columna
  `is_global`, muestra un aviso con el archivo SQL pendiente.
- `app/admin/lives/[id]/studio/page.tsx`: Studio global. Conserva el catálogo,
  permite agregar, quitar, reordenar, editar precio Live y cambiar el estado
  comercial. Inicia/finaliza y programa el cierre. Polling cada 30 s.
- `app/admin/lives/[id]/editar/page.tsx`: administración del catálogo global,
  sin configuración de sesión, tienda, duración ni borrado.
- `app/admin/lives/nuevo/page.tsx`: redirige a `/admin/lives`.
- `app/admin/lives/actions.ts`: nuevas acciones `ensureLiveMode`,
  `startLiveMode`, `scheduleLiveEnd`, `updateLiveModeTitle`, `moveLiveProduct`
  y `finalizeExpiredLiveMode`. Mensajes actualizados a "Modo Live".
- `components/admin/LiveModeStartForm.tsx`: inicio con finalización opcional.
- `components/admin/LiveEndScheduler.tsx`: programar/quitar finalización.
- `components/admin/LiveElapsed.tsx`: tiempo transcurrido en cliente.
- `components/admin/LiveExpirySync.tsx`: finalización perezosa del vencido.
- `components/admin/LiveProductStatusSelect.tsx`: estado comercial sin recargar
  la página.
- `components/admin/AdminSidebar.tsx`: etiqueta "Modo Live".

## Público

- `lib/live.ts`: la campaña activa se consulta con `is_global = true`.
- `lib/live-copy.ts`: centraliza la etiqueta pública "EN VIVO", el título
  público "En vivo" y la detección de títulos por defecto. Los títulos
  personalizados se conservan.
- `components/shop/HotHome.tsx`, `components/shop/HotBanner.tsx`,
  `app/(shop)/ofertas/page.tsx`, `app/(shop)/productos/[slug]/page.tsx`,
  `components/layout/Footer.tsx`: la tienda muestra una sola etiqueta
  "EN VIVO" y evita repetir el título por defecto; "Modo Live" queda para el
  panel interno.
- La tienda normal sigue funcionando cuando el Live está desactivado, vencido
  o sin productos públicos.
- No se agregaron rutas nuevas ni se modificaron carrito, checkout, cookies,
  imágenes ni la identidad visual.

## Verificación realizada

- `npx tsc --noEmit` → 0 errores (repetido después de la revisión final).
- `npm run build` → compila correctamente; 49 rutas (repetido después de la
  revisión final). Se mantiene el aviso preexistente
  `Failed to load dynamic font for ✦`.
- SQL Fix 0023 ejecutado en Supabase por el propietario el 2026-10-26 y
  probado en PostgreSQL 16 desechable con esquema mínimo.
- REST contra Supabase: `live_sessions?select=is_global` responde 200; la fila
  global visible es `id=4`, título `Modo Live`, estado `live`, sin `ends_at`.
  La RPC `start_live_mode` existe y devuelve 42501 ("No autorizado") para anon.
- Smoke test público con `next start`: `/`, `/productos`, `/ofertas`,
  `/destacados`, `/novedades` y la ficha `/productos/pulcera-tulipan` responden
  HTTP 200. La home mostraba `MODO LIVE` en esa validación (la copy pública
  actual es `EN VIVO`; ver la sección final), el producto actual y la sección
  "No te los pierdas". `/admin/lives` redirige a login (307).
- SQL Fix 0023 probado en PostgreSQL 16 desechable con esquema mínimo:
  - escenario con Live activo: se reutiliza, se conserva su catálogo y se
    rellenan precios;
  - escenario sin Live activo: se reutiliza la última configuración con
    productos;
  - escenario vacío: se crea `Modo Live` desactivado;
  - índice único global;
  - rechazo de inicio duplicado, de fila no global, de fecha pasada y de
    catálogo vacío;
  - reinicio después de finalizar y cierre de otra fila activa.
- Los componentes nuevos no introducen errores de `react-hooks/set-state-in-effect`.
  ESLint conserva la deuda histórica de `no-explicit-any` y `<img>` del admin.

## Estado del despliegue

1. [x] Ejecutar Fix 0023 en Supabase.
2. [x] Marcar `ejecucion.sql` como `EJECUTADO` y vaciarlo.
3. [x] Registrar Fix 0023 en `migraciones.sql`.
4. [x] Reflejar `is_global` y `start_live_mode` en `esquema.sql`.
5. [ ] Desplegar el código después del smoke test autenticado.

El SQL ya está aplicado. El smoke test público pasó; falta validar el flujo
administrativo autenticado. No se ejecutaron operaciones Git ni despliegues
desde esta sesión.

## Pendientes

- [x] Ejecutar Fix 0023 en Supabase.
- [x] Actualizar `migraciones.sql` y `esquema.sql` después de ejecutar.
- [x] Smoke test público: home, catálogo, ofertas, destacados, novedades y
  ficha de producto.
- [ ] Smoke test admin autenticado: iniciar, programar, dejar vencer, finalizar,
  reiniciar y agregar/quitar/reordenar productos.
- [ ] Revisar si se eliminan las acciones heredadas de sesiones.
- [ ] Revisar el fallback de producto actual al primero del catálogo cuando
  `current_product_id` es `null`.

## Corrección de Inicio y Ofertas (2026-10-26)

### Causa exacta

- `mapHotProduct` descartaba toda fila del catálogo Live que no tuviera un
  `promo_price` válido y menor al precio efectivo. La sesión global `id=4`
  tiene 20 productos configurados, pero solo 3 tienen precio del Modo Live
  (`product_id` 3, 13 y 30); los otros 17 tienen `promo_price = null`.
- Inicio excluía además el producto actual del bloque de catálogo, por lo que
  solo renderizaba 2 tarjetas: el actual aparecía en el hero y los otros 2 con
  precio Live en la grilla.
- Ofertas no tenía un límite de 3. Mostraba 3 porque solo 3 productos cumplen
  el criterio comercial actual de oferta Live (precio Live válido, estado
  público y stock). No se listaban los 17 sin oferta para no convertir el
  catálogo completo en ofertas. Además, `topDiscounts` tenía un tope de 8 que
  se retiró para no limitar futuros casos.

### Cambios

- `HotCampaign.catalog` incluye todo el catálogo activo del Modo Live, con o
  sin precio Live.
- Inicio usa ese catálogo completo, agrupa por la categoría real de cada
  producto y renderiza un carrusel horizontal por categoría con `ScrollNudge`.
  El título de la sección era `Modo Live` (ahora `Catálogo activo`) y se
  conserva el botón `Pedir`.
- Las tarjetas sin precio Live muestran el precio regular. Si el producto
  tiene un descuento normal, muestran el precio normal tachado y el porcentaje
  de ahorro; no se inventan descuentos.
- `topDiscounts` devuelve todas las ofertas Live; Ofertas no muestra productos
  sin oferta.
- No se crearon sesiones, productos ni duplicados. No se modificaron precios,
  descuentos, Studio, administración, carrito, checkout, cookies, imágenes ni
  identidad visual.

### Validación

- `npx tsc --noEmit` OK.
- `npm run build` OK, 49 rutas; se mantiene el aviso preexistente de la fuente
  dinámica `✦`.
- ESLint dirigido a `lib/hot.ts`, `HotHome.tsx` y `LiveProductCard.tsx` sin
  errores. El lint global conserva la deuda preexistente de `no-explicit-any`,
  `set-state-in-effect` y `<img>`.
- Datos verificados por REST: 20 filas en `live_products`, 3 con precio Live
  válido, 17 sin precio, 1 producto vendido/sin stock.
- Inicio: 20 enlaces únicos de producto (actual + 19 en carruseles), conjunto
  exactamente igual a los 20 `live_products` de la sesión global, sin productos
  externos ni duplicados. 6 grupos de categoría con `overflow-x-auto`, 18
  botones `Pedir` y 1 tarjeta `Vendido`. No aparecen `No te los pierdas` ni
  `Catálogo del Modo Live`.
- Ofertas: 3 productos, exactamente los 3 con oferta Live válida; sin
  duplicados. No se listan los 17 productos sin oferta.
- No se probó en un dispositivo Android físico; se validó el patrón
  `overflow-x-auto` + `ScrollNudge` y los anchos compactos en el HTML de
  producción.

## Unificación de compra rápida y tarjetas (2026-10-26)

### Causa

- Inicio tenía compra rápida mediante `LiveProductCard`, pero Catálogo y
  Ofertas solo mostraban el precio Live dentro de `ProductCard`; obligaban a
  abrir la ficha para solicitar el producto.
- `ProductCard` envolvía toda la tarjeta en un `<Link>` y no tenía footer de
  acción. `LiveProductCard` usaba `h-full` dentro de un flex de altura
  automática, el botón `Pedir` y la etiqueta `Vendido` tenían alturas distintas
  y la fila de precio podía envolver en móvil. Eso producía tarjetas de
  distinta altura aun dentro del mismo carrusel.
- La referencia del precio normal tampoco era homogénea: Inicio no mostraba el
  tachado/porcentaje de un descuento normal cuando el producto no tenía precio
  Live, mientras que Catálogo sí lo mostraba.

### Cambios

- `lib/card-pricing.ts`: resolución única de precio efectivo, precio tachado,
  porcentaje y disponibilidad. La regla prioriza el precio Live válido; si no
  existe, respeta el descuento normal; si tampoco existe, usa el precio normal.
- `components/shop/ProductCardAction.tsx`: acción reutilizable para WhatsApp o
  etiqueta de no disponible, con altura fija de 40 px. `WhatsAppOrderButton`
  acepta `className` para compartir esa altura sin alterar su flujo.
- `ProductCard`: nuevos props opcionales `liveProduct` y `quickOrder`. El
  `<Link>` de la ficha ahora cubre imagen/contenido y la acción queda fuera del
  enlace, evitando botones anidados. Con `quickOrder` se reservan altura de
  título y footer; sin `quickOrder` se conserva el comportamiento visual
  anterior de las demás páginas.
- `LiveProductCard`: usa el mismo resolver y la misma acción. Se eliminó
  `h-full`, se fijó el footer y se normalizó la fila de precio para que no
  envuelva en móvil. Las tarjetas de una misma fila/carrusel quedan con la
  misma altura, incluida la tarjeta `Vendido`.
- `HotProduct` expone `listPrice` y `hasNormalDiscount` para mostrar la
  referencia del descuento normal también en Inicio. Se agregó
  `getHotCatalogMap` para reutilizar el catálogo Live completo.
- Catálogo y Ofertas usan `getHotCatalogMap`: mientras el Modo Live está
  activo, todas sus tarjetas muestran `Pedir`; los productos con precio Live
  usan ese precio y los demás respetan su precio/descuento normal.
- Ofertas mantiene sus criterios: la sección Live sigue usando solo productos
  con oferta Live válida y `is_offer` no se modifica. No se convirtieron los 17
  productos sin precio Live en ofertas.
- Con el Modo Live inactivo, `quickOrder` es `false`, no se renderiza la acción
  y las páginas vuelven al comportamiento normal.

### Validación

- `npx tsc --noEmit` OK.
- ESLint dirigido a los archivos modificados de componentes y `lib` sin
  errores. El lint global conserva la deuda preexistente de `no-explicit-any`
  en las páginas de Catálogo/Ofertas y `<img>`/`set-state-in-effect` del admin.
- `npm run build` OK, 49 rutas; se mantiene el aviso preexistente de la fuente
  dinámica `✦`.
- Chrome headless (CDP) a 1280 px y 390 px:
  - Inicio: 19 tarjetas en 6 carruseles; una sola altura por carrusel y la misma
    altura entre categorías (393.59 px escritorio / 339.59 px móvil); 18
    botones `Pedir` y 1 tarjeta `Vendido` con la misma altura; sin overflow
    horizontal de página.
  - Catálogo: 12 tarjetas, 12 botones `Pedir`, altura única 504.05 px
    escritorio / 417.3 px móvil.
  - Ofertas: 3 tarjetas, 3 botones `Pedir`, altura única 504.05 px escritorio /
    417.3 px móvil; sin duplicados.
  - Precios: 0 diferencias entre Inicio, Catálogo y Ofertas para los productos
    compartidos, comparando precio actual y precio tachado. Ninguna de las 34
    tarjetas recorta o desborda su bloque de precio a 1280 px ni a 390 px.
  - El `productPrice` que recibe cada botón coincide con el precio visible de
    su tarjeta en las tres páginas.
  - El enlace de la tarjeta navega a la ficha (`/productos/collar`).
  - Se interceptó y abortó la petición `POST /api/whatsapp-request/create`
    desde Catálogo, Inicio y Ofertas: no se creó ninguna solicitud, no se
    navegó y el body envió el `productId` y `productPrice` de la tarjeta
    visible (por ejemplo, producto 54 / Bs. 5.00 y producto 3 / Bs. 65.00).
- Prueba unitaria temporal de `resolveCardPricing` y `getCardAvailability`:
  normal, descuento normal, Live, Live sin precio, Live inválido, vendido,
  reservado, agotado y disponible; todos OK.
- Las páginas fuera del alcance (`/destacados`, `/novedades`,
  `/categorias/anillos`) siguen sin acción rápida y conservan el layout normal
  de `ProductCard`; la ficha de producto mantiene su botón de WhatsApp y los
  precios 30/35. Las páginas fuera de alcance tampoco muestran el nuevo badge
  `Live` de las tarjetas de Catálogo/Ofertas.
- No se desactivó el Modo Live para probar el estado inactivo porque la
  activación/desactivación está protegida. Se validó la rama condicional
  (`quickOrder`) y el camino por defecto de `ProductCard` en las páginas fuera
  de alcance.
- No se probó en un dispositivo Android físico; se validaron alturas y overflow
  con viewport móvil headless.
- No se ejecutaron operaciones Git ni despliegues. El smoke test administrativo
  autenticado y el despliegue siguen pendientes de autorización.

## Copy público único y script de tema (2026-10-26)

### Copy

- Se separó el vocabulario: el panel interno conserva "MODO LIVE"; la tienda
  muestra una sola etiqueta `EN VIVO` en la barra superior.
- `lib/live-copy.ts` centraliza `PUBLIC_LIVE_TITLE`, `PUBLIC_LIVE_BADGE_LABEL`,
  `getPublicLiveTitle()` e `isDefaultLiveTitle()`. Un título vacío, "Modo Live"
  o "En vivo" se considera por defecto; los títulos personalizados se conservan.
- `components/ui/LiveBadge.tsx` usa `EN VIVO` por defecto. Las vistas del admin
  (`app/admin/lives/page.tsx`, editar y studio) pasan `label="MODO LIVE"` de
  forma explícita.
- `components/layout/Header.tsx`: el título por defecto ya no se imprime junto
  al badge; solo aparece si la sesión tiene un título personalizado.
- `components/shop/HotHome.tsx`: "Producto destacado" y "Catálogo activo"
  reemplazan los títulos repetidos. Queda una sola mención "Precio exclusivo".
- `components/layout/Footer.tsx`: la franja del Live solo aparece si existe
  `endsAt` (cuenta regresiva); sin fin programado no se renderiza.
- `components/shop/HotBanner.tsx`: oculta el título por defecto; si no hay
  título personalizado ni `endsAt`, no se renderiza para evitar un CTA
  duplicado. Cuando aparece, usa el CTA "Ver productos".
- `components/layout/BottomNav.tsx`: el indicador móvil es un punto rojo con
  `aria-label="En vivo activo"`, sin el texto "VIVO".
- `app/(shop)/ofertas/page.tsx` y la ficha de producto eliminan las repeticiones
  "en vivo"; la ficha usa "Precio exclusivo" una vez y "Compra por WhatsApp".

### Script de tema

- `app/layout.tsx`: el `<script>` inline del tema se reemplazó por
  `components/theme/InlineScript.tsx`, con el patrón oficial de Next.js 16
  (`type="text/javascript"` en servidor, `text/plain` en cliente y
  `suppressHydrationWarning`). Se elimina el warning de React sin perder la
  aplicación del tema antes del primer paint.

### Validación

- `npx tsc --noEmit` → 0 errores.
- ESLint dirigido a los archivos nuevos/modificados → sin errores nuevos.
- Chrome headless en `/`, `/ofertas`, `/productos` y
  `/productos/pulcera-tulipan`: 0 errores de consola, sin warning de
  `script tag`, tema oscuro persistente tras recargar y exactamente una
  etiqueta `EN VIVO` visible por página.
- No se modificaron datos, precios, carrito, checkout, cookies, imágenes,
  identidad visual ni el estado global del Live.
