# Documento de Continuidad — Investigación y Remediación de Seguridad H-01 (Liz Store)
**Fecha**: 1 de noviembre de 2026  
**Proyecto**: Liz Store (`liz-react`)  
**Identificador Engram/Proyecto**: `liz-react`  
**Estado General**: `Fix 0026` **EJECUTADO** en Supabase el 2026-11-01 (`Success. No rows returned`). Pendiente: re-login de admins, despliegue del código y validación funcional en producción.

---

## A. Identificación del Proyecto
- **Proyecto**: Liz Store (Escudo Market).
- **Stack Tecnológico**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Supabase (PostgreSQL 16 + JS SDK / SSR).
- **Objetivo de la Investigación**: Auditar la postura de seguridad y corregir la vulnerabilidad crítica **H-01** (escalada de privilegios administrativos derivada de la confianza en `profiles.role` y metadatos controlados por el usuario).
- **Estado General**: Código fuente local adaptado a la **Opción B**, migración `Fix 0026` ejecutada en Supabase el 2026-11-01, documentación y auditoría actualizadas. Vercel aún no desplegado.

---

## B. Antecedentes de la Investigación
1. **Inicio de la Auditoría**: Se realizó una revisión integral del repositorio para evaluar riesgos arquitectónicos, RLS, triggers y control de acceso administrativo.
2. **Hallazgos Identificados**: Se catalogaron hallazgos del H-01 al H-14.
   - **H-01 (Crítico)**: Escalada de privilegios administrativos.
     - **Causa Raíz Verificada**: 
       1. `handle_new_user()` (`supabase/sql/esquema.sql:476-487`) leía el rol directamente de `raw_user_meta_data ->> 'role'` (controlado por el usuario mediante `signUp`).
       2. La política `"Profiles: propio UPDATE"` (`esquema.sql:500`) carecía de restricciones `WITH CHECK`.
       3. Los grants globales en esquema (`esquema.sql:1208`) anulaban los permisos restrictivos por columna previamente definidos para `profiles` (`esquema.sql:1200-1203`).
       4. El helper `is_hot_admin()` (`esquema.sql:656-669`) y los puntos de entrada de la aplicación (`lib/supabase/admin-auth.ts`, `app/admin/layout.tsx`, etc.) consultaban `profiles.role`.
     - **Matiz de Impacto**: Las políticas RLS de CRUD en otras tablas ya usaban `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`. Por ende, un falso admin no obtenía CRUD completo en tablas por RLS, pero sí superaba el gate de la aplicación en `/admin`, ejecutaba RPCs de Hot/Live (`is_hot_admin`) e invocaba Server Actions con Storage (`service_role`).
   - **H-02 a H-14**: Órdenes, precios de WhatsApp, cookies de carrito, reseñas, rate limits, CSP, etc. (declarados **fuera de alcance** para esta fase según instrucciones estrictas).

---

## C. Solución Aprobada para H-01 (Opción B)
Se seleccionó y aplicó localmente la **Opción B**:
1. **`app_metadata.role` como fuente única de verdad** para la autorización administrativa.
2. **`profiles.role` como dato sincronizado** de visualización, sin privilegios de control.
3. **Corrección de `handle_new_user()`**: asigna `role` basado exclusivamente en `raw_app_meta_data ->> 'role' = 'admin'` (else `'customer'`), con `SET search_path = ''`.
4. **Protección de perfiles**:
   - `prevent_profile_role_change` (trigger `BEFORE UPDATE OF role`) que lanza excepción `42501` si un usuario autenticado intenta alterar su propio rol.
   - Restricción estricta de grants por columna en `profiles` aplicados **después** de los grants globales.
   - Eliminación de la política anónima de inserción (`"Profiles: anon INSERT (trigger)"`) y ajuste del UPDATE con `WITH CHECK ((SELECT auth.uid()) = id)`.
5. **Adaptación de `is_hot_admin()`**:
   - Cambiada a `SECURITY INVOKER`, `SET search_path = ''`.
   - Consulta directa sobre el JWT: `auth.uid() IS NOT NULL AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'`.
   - Revocación explícita de ejecución a `PUBLIC`, `anon` y `authenticated`.
6. **Actualización de la aplicación**:
   - `lib/supabase/admin-auth.ts` y `app/admin/layout.tsx` validan `user.app_metadata?.role === 'admin'`.
   - Acciones y rutas de login/callback/perfil adaptadas a `app_metadata.role`.
   - Registro en `app/api/auth/register/route.ts` limpio de metadatos de rol controlados por el usuario.

---

## D. Estado Real de Implementación
- **Completado y verificado localmente**:
  - Código fuente de autenticación admin y vistas adaptadas a `app_metadata`.
  - Esquema SQL (`supabase/sql/esquema.sql`) actualizado con las funciones, triggers, RLS y grants corregidos.
  - Migración `Fix 0026` ejecutada en Supabase el 2026-11-01 (`Success. No rows returned`) y registrada en `supabase/sql/migraciones.sql`; `ejecucion.sql` quedó vacío en estado EJECUTADO.
  - Documentación de migración (`docs_migracion/06`, `docs_migracion/15`), README, skills (`admin-panel`, `convenciones-desarrollo`) e informe (`AUDITORIA_FINAL.md`) actualizados.
  - Validación local de sintaxis SQL ejecutada exitosamente mediante contenedor temporal de PostgreSQL 16.
  - Verificación estática de TypeScript (`tsc --noEmit`) sin errores.
- **Backfill verificado (2026-11-01)**: no se requiere. Los únicos administradores
  (`gallardoelvirio@gmail.com` y `marielacondori037@gmail.com`) ya tienen
  `app_metadata.role = 'admin'` y `profiles.role = 'admin'`. El resto de cuentas
  son `customer`.
- **Pendiente**:
  - Re-login de los administradores para renovar el JWT con `app_metadata.role`.
  - Commit/push y despliegue del código en Vercel.
  - Pruebas funcionales: login admin, alta/edición de producto, subida/borrado de imagen y RPCs Hot/Live.

---

## E. Punto Exacto de Continuidad
- **Qué estaba haciendo OpenCode**: Implementando localmente la Opción B en el repositorio y preparando la migración SQL `Fix 0026`, documentando los cambios y verificando la compilación TypeScript.
- **Qué objetivo perseguía**: Dejar todo el código, esquema y documentación preparados de forma impecable sin alterar producción ni Git.
- **Qué alcanzó a completar**: 100% de los cambios locales previstos en la Opción B, redacción de `ejecucion.sql` y prueba de sintaxis en contenedor PostgreSQL.
- **Qué quedó sin terminar**: Re-login de admins, despliegue en Vercel y pruebas funcionales.
- **Qué información necesita recuperar**: Este documento de continuidad y `supabase/sql/migraciones.sql` (Fix 0026).
- **Siguiente paso concreto**: Cerrar/abrir sesión con ambos admins, desplegar el código y validar alta/edición de producto e imágenes.

---

## F. Estado de las Pruebras
- **Pruebas de compilación TypeScript**: ✅ `npx tsc --noEmit` completado sin errores.
- **Pruebas estáticas SQL**: ✅ Ejecutado `Fix 0026` en contenedor temporal Docker (PostgreSQL 16) con stubs de `auth` schema y triggers, sin errores de sintaxis ni de definición.
- **Pruebas de lint**: ⚠️ Errores de ESLint detectados exclusivamente en archivos preexistentes no modificados (ej. `any` types en componentes de tienda/admin, `useEffect` setState warnings); los archivos modificados para H-01 pasaron sin incidencias nuevas.
- **Pruebas unitarias**: ✅ `npm test` ejecutado con éxito (36 pruebas pasando).
- **Pruebas en Supabase remoto**: ✅ `Fix 0026` ejecutado el 2026-11-01 (`Success. No rows returned`); pruebas funcionales desde la app pendientes de despliegue.
- **Revalidación pre-ejecución (misma fecha)**: ✅ `Fix 0026` aplicado en PostgreSQL 16 (Docker) con stubs de `auth`, pruebas de `has_column_privilege`, RLS, triggers anti-escalada y RPC `SECURITY DEFINER` llamando a `is_hot_admin()`. `npm run build` completado sin errores.

---

## G. Estado de Supabase y Producción
- **Base de datos remota**: Modificada el 2026-11-01 con `Fix 0026`.
- **Migraciones ejecutadas**: `Fix 0026` aplicado en remoto (H-01 Opción B).
- **Permisos y políticas remotas**: Endurecidos: rol admin desde `app_metadata`, grants por columna y triggers anti-escalada activos.
- **Backfill de administradores**: ✅ Verificado el 2026-11-01; los 2 admins reales ya tienen `app_metadata.role = 'admin'`. No se requiere backfill.
- **Despliegues en Vercel**: Ninguno.

---

## H. Archivos y Cambios del Proyecto
### Archivos Modificados para H-01:
1. `supabase/sql/esquema.sql` (actualizado con triggers de rol, RLS, is_hot_admin y grants por columna corregidos).
2. `supabase/sql/ejecucion.sql` (vaciado en estado EJECUTADO) y `supabase/sql/migraciones.sql` (Fix 0026 registrado).
3. `lib/supabase/admin-auth.ts` (`requireAdmin` validando `app_metadata.role`).
4. `app/admin/layout.tsx` (layout admin validando `app_metadata.role`).
5. `app/auth/login/actions.ts` (login action validando `app_metadata.role`).
6. `app/api/auth/login/route.ts` (API login validando y devolviendo `app_metadata.role`).
7. `app/auth/callback/route.ts` (callback OAuth validando `app_metadata.role`).
8. `app/perfil/page.tsx` (`isAdmin` basado en `app_metadata.role`).
9. `app/api/auth/register/route.ts` (eliminado `role: 'customer'` de `options.data`).
10. `README.md`, `docs_migracion/06-admin-panel.md`, `docs_migracion/15-modo-hot.md`, `.opencode/skills/admin-panel.md`, `.opencode/skills/convenciones-desarrollo.md` (actualizados a la fuente `app_metadata`).
11. `AUDITORIA_FINAL.md` (hallazgo S10 y P6 actualizados a estado local corregido).

12. `app/admin/page.tsx` (contador de usuarios: `select("*")` sobre `profiles` cambiado a `select("id")`, obligatorio tras revocar el grant global de tabla).

### Trabajos Preexistentes Preservados:
- Cambios locales en `app/globals.css` y `components/shop/ProductGallery.tsx` (`?? components/shop/ProductGalleryModal.tsx`, `?? docs_migracion/23-galeria-global-detalle-producto.md`) — **Intactos**, no tocados por la remediación H-01.

### Revisión Funcional Pre-Ejecución (2026-11-01)
Se auditó la interacción de los cambios con cookies, panel admin, CRUD de productos e imágenes:
1. **Imágenes**: la subida/eliminación usa `SUPABASE_SERVICE_ROLE_KEY` en `lib/supabase/storage.ts`, por lo que no depende de RLS, grants ni cookies de sesión. La validación por magic bytes no cambió. El único punto de fallo sería que `requireAdmin()` rechace al admin (ver riesgo de backfill).
2. **Cookies/sesión**: `proxy.ts` y `lib/supabase/middleware.ts` no se tocaron; login, registro, callback OAuth y refresco de sesión conservan el mismo manejo de cookies.
3. **Grants de `profiles`**: se detectó que `app/admin/customers/page.tsx` selecciona/ordena por `created_at`. Se añadió `created_at` al grant `SELECT` de `authenticated` en `esquema.sql` y `ejecucion.sql` para no romper la lista de clientes.
4. **Contador del dashboard**: `app/admin/page.tsx` usaba `select("*")` sobre `profiles`; con grants por columna eso falla. Se cambió a `select("id")`.
5. **RLS verificada**: `authenticated` no puede hacer `SELECT *` sobre `profiles` (intencional), no puede cambiar `role`, no puede insertar roles privilegiados y solo ve su propia fila salvo que el JWT tenga `app_metadata.role = 'admin'`.
6. **Hot/Live**: `is_hot_admin()` ya no es ejecutable por `authenticated`, pero las RPC `SECURITY DEFINER` siguen funcionando porque se ejecutan como owner (probado en el contenedor).
7. **Riesgo operativo crítico — JWT viejo**: tras el backfill de `app_metadata`, el JWT de la cookie sigue sin el rol hasta el refresh. `getUser()` ve el dato nuevo (gate del panel), pero RLS usa el JWT (escrituras de productos fallarían). Es obligatorio forzar re-login (o `refreshSession()`) de los administradores tras el backfill y antes de desplegar/validar.
8. **Alta de administradores**: los usuarios creados desde el Dashboard de Auth quedan como `customer`. Para crear un admin debe fijarse `app_metadata.role = 'admin'` con Admin API/SQL y sincronizar `profiles.role`.

---

## I. Riesgos y Restricciones Vigentes
1. No ampliar el alcance a H-02–H-14.
2. No ejecutar backfill masivo automático de `profiles.role = 'admin'` a `app_metadata` (riesgo de legitimar atacantes).
3. No ejecutar operaciones remotas (SQL, Supabase Auth, Vercel, Git) sin autorización expresa del propietario.
4. Preservar el trabajo ajeno a H-01 en el worktree.

---

## J. Plan de Continuación para Mañana

### Tarea 1: Validación y Backfill de Administradores Legítimos
- **Objetivo**: Confirmar los administradores reales.
- **Estado Actual**: ✅ Completada. Únicos admins: `gallardoelvirio@gmail.com`
  (`c66788df-8d1b-47e6-9ad5-b0b44cf6598d`) y `marielacondori037@gmail.com`
  (`94cb59ff-fe55-461c-b65b-833945c5d661`), ambos ya con `app_metadata.role='admin'`.
  El resto de cuentas son `customer`.
- **Qué Falta**: Nada (no hay backfill pendiente).
- **Condición de Cierre**: Consulta verificada el 2026-11-01.
- **Nota**: Si en el futuro se crea un admin desde el Dashboard, debe fijarse
  `app_metadata.role='admin'` y sincronizar `profiles.role`.

### Tarea 2: Ejecución de la Migración en Staging / Supabase
- **Objetivo**: Aplicar `Fix 0026` en el Dashboard de Supabase.
- **Estado Actual**: ✅ Completada el 2026-11-01 (`Success. No rows returned`).
- **Resultado**: Base de datos endurecida; registrada en `migraciones.sql` y `esquema.sql`.
- **Pendiente de comprobación funcional**: login admin, CRUD de productos e imágenes, RPCs Hot/Live tras desplegar.

### Tarea 3: Verificación Funcional y Despliegue
- **Objetivo**: Desplegar los cambios de la app a Vercel y ejecutar la matriz de pruebas de regresión (login admin, OAuth, registro, perfil, RPCs Hot).
- **Estado Actual**: Código local listo.
- **Qué Falta**: Despliegue y pruebas end-to-end.
- **Dependencias**: Tarea 2 completada.
- **Resultado Esperado**: Sistema operando de forma segura con `app_metadata.role`.
- **Condición de Cierre**: Pruebas de acceso no autorizado rechazadas con `42501` / redirección y operaciones legítimas funcionando.
