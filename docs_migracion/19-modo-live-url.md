# Bitácora 19 — URL de «Abrir Live» en Modo Live

Fecha: 2026-10-29
Estado: Implementado en código — SQL Fix 0025 pendiente de ejecución manual
Módulo: Admin / Modo Live / Studio / Home pública

## Objetivo

Permitir que el botón «Abrir Live» de la tienda abra la transmisión real alojada
en TikTok u otra plataforma, sin reproducir el enlace dentro de la página.

La URL se administra desde «Abrir estudio»:

- guardar una URL `https://`;
- consultar la URL actual;
- modificarla;
- quitarla.

La tienda pública sigue mostrando la imagen del producto en la etapa. El enlace
solo se usa al pulsar «Abrir Live».

## Decisión de persistencia

`live_sessions` no tenía un campo para la transmisión. Se descartó reutilizar
`notes` (texto genérico) o `social_links` (segunda fuente de verdad para el
mismo dato). Se agregó una columna dedicada:

- `public.live_sessions.live_url TEXT`, nullable.
- Restricción `live_sessions_live_url_https_check`:
  `live_url IS NULL OR live_url ~ '^https://'`.
- Sin valor por defecto. Ninguna fila existente se modifica.

La sesión global es la fuente única. No se duplica en `localStorage` ni en el
catálogo.

## SQL — Fix 0025 (PENDIENTE)

El SQL quedó en `supabase/sql/ejecucion.sql` con estado `PENDIENTE`. No se
ejecutó contra Supabase desde esta sesión.

```sql
ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS live_url TEXT;

ALTER TABLE public.live_sessions
  DROP CONSTRAINT IF EXISTS live_sessions_live_url_https_check;

ALTER TABLE public.live_sessions
  ADD CONSTRAINT live_sessions_live_url_https_check
  CHECK (live_url IS NULL OR live_url ~ '^https://');

COMMENT ON COLUMN public.live_sessions.live_url
  IS 'URL https de la transmisión usada por Abrir Live en la vista pública';

NOTIFY pgrst, 'reload schema';
```

Después de ejecutarlo manualmente en Supabase Dashboard > SQL Editor:

1. Marcar `ejecucion.sql` como `EJECUTADO` y vaciarlo.
2. Registrar Fix 0025 en `migraciones.sql`.
3. Reflejar `live_url` y su CHECK en `esquema.sql`.

## Validación de la URL

`lib/live-url.ts` centraliza las reglas compartidas por cliente y servidor:

- solo `https://`;
- URL parseable, con dominio;
- sin credenciales, espacios ni valores `javascript:`/`data:`;
- máximo 2048 caracteres;
- vacío permitido para quitar la URL;
- `getSafeLiveUrl()` devuelve `null` si el valor guardado no es válido;
- `getLivePlatformLabel()` identifica TikTok, YouTube, Instagram, Facebook,
  Twitch y Vimeo; otros dominios muestran «Live»;
- `getTikTokHandle()` extrae `@usuario` solo de URLs de TikTok.

El servidor vuelve a validar con `parseLiveUrlInput()` aunque el formulario
también valide en el navegador.

## Admin

- `components/admin/LiveUrlForm.tsx`: formulario cliente con URL actual,
  validación, guardado, mensaje de éxito/error y botón «Quitar URL» con
  confirmación. Muestra la plataforma y el handle de TikTok cuando corresponde.
- `app/admin/lives/actions.ts`: `updateLiveModeUrl()` valida administrador,
  confirma que la fila sea el Modo Live global, normaliza la URL, actualiza
  `live_url` y revalida la home. Si falta la columna, devuelve el mensaje
  «Falta aplicar la migración de la URL del Live (Fix 0025) en Supabase.».
- `app/admin/lives/[id]/studio/page.tsx`: tarjeta «Poner URL del Live» con
  ancla `#live-url` en la cabecera del Studio. La consulta intenta leer
  `live_url`; si la columna todavía no existe, reintenta sin ella para no
  romper el estudio.
- `types/database.ts`: `live_url` agregado a fila, inserción y actualización de
  `live_sessions`.

No se agregaron controles en la tienda normal, el catálogo, las fichas de
producto, el carrito ni el checkout.

## Público

`components/shop/HotHome.tsx` se adaptó a la estructura de referencia:

- etapa oscura con la imagen real del producto (sin iframe ni reproductor);
- fondo desenfocado de la misma imagen;
- indicador `LIVE` y plataforma en la esquina;
- avatar/iniciales, nombre de tienda y handle de TikTok cuando la URL lo
  permite;
- botón «Abrir Live» con `target="_blank"` y `rel="noopener noreferrer"`;
- si no hay URL válida, el botón queda deshabilitado y se muestra
  «URL del Live no configurada»;
- ficha inferior con nombre, descripción corta, precio Live, precio normal,
  descuento, ahorro, compra por WhatsApp y enlace a la ficha;
- selección de hasta 4 productos públicos del Live; el producto actual se
  incluye si no estaba entre los primeros;
- carruseles por categoría con `ScrollNudge` para el resto del catálogo;
- se conservaron los carruseles, la compra rápida y el diseño responsive.

No se copiaron los colores, productos ni datos de la referencia. La etapa usa
la paleta oficial y los neutros ya presentes en el proyecto. No se implementó
«Ya vistos».

## Fallback mientras el SQL no esté aplicado

- La home consulta `live_url` y, si Supabase devuelve columna faltante,
  reintenta sin esa columna. La vista muestra el estado sin URL y no falla.
- El Studio hace el mismo fallback.
- Al guardar, el formulario muestra el mensaje de migración pendiente.
- La tienda normal y el Modo Live existente siguen funcionando.

## Verificación realizada

- `npm test` → 29 pruebas aprobadas. Incluye las 8 pruebas de `live-url`.
- `npx tsc --noEmit` → 0 errores.
- `npm run build` → compila correctamente. Se mantiene el aviso preexistente
  `Failed to load dynamic font for ✦`.
- ESLint focalizado en los archivos nuevos/modificados: `HotHome.tsx`,
  `LiveUrlForm.tsx` y `lib/live-url.ts` sin errores. El admin conserva la deuda
  preexistente de `no-explicit-any` y `<img>`; esta implementación sigue el
  patrón existente del módulo.
- Smoke test con `next start`:
  - `/` → HTTP 200.
  - `/productos` → HTTP 200.
  - `/ofertas` → HTTP 200.
  - `/admin/lives/4/studio` → HTTP 307 (redirección a login, sin sesión).
- No se pudo validar el flujo público del Live ni el formulario autenticado:
  no hay un Live activo en la base y no se dispone de credenciales de
  administrador en esta sesión.
- No se ejecutaron operaciones Git, despliegues ni SQL remoto.

## Pendientes

- [ ] Ejecutar Fix 0025 en Supabase y actualizar `migraciones.sql`/`esquema.sql`.
- [ ] Validar en el Studio autenticado: guardar, consultar, modificar y quitar
  la URL.
- [ ] Validar la home con un Live activo y una URL de TikTok: el botón debe
  abrir la transmisión y la etapa debe mostrar solo la imagen.
- [ ] Revisar si se desea mostrar el handle de TikTok también cuando la URL sea
  un enlace corto (`vm.tiktok.com`); en ese caso se usa el nombre de la tienda.
