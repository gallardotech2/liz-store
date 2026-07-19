# Proyecto: Liz Store (Migración a Next.js/Supabase)

## Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + JS SDK)
- **Despliegue**: Vercel (priorizar SSG/ISR)

## Estructura del proyecto
- `app/` — Páginas App Router
- `components/` — Componentes React (ui/, layout/, shop/, admin/)
- `lib/` — Utilidades, clientes Supabase, lógica de negocio
- `types/` — Tipos TypeScript (database.ts mapea schema de Supabase)
- `docs_migracion/` — Bitácoras de migración
- `.opencode/agents/` — Subagentes especializados por módulo
- `supabase/sql/` — Sistema de migraciones manual (ejecucion.sql, migraciones.sql, esquema.sql)

## Reglas de migración
1. **Fidelidad visual**: réplica pixel-perfect del diseño original (respaldo en liz-react-django-backup)
2. **Optimización Vercel**: ISR (`revalidate`) por defecto, `prefetch={false}`, evitar SSR innecesario
3. **Documentar cada paso** en `docs_migracion/` antes y después de cada migración
4. **Consultar agentes** según la tarea: model-migrator para BD, template-migrator para UI, etc.

## Sistema de Migraciones SQL (estilo e-mstore V2.0)

### Los 3 archivos
| Archivo | Propósito |
|---------|-----------|
| `supabase/sql/ejecucion.sql` | Staging — SQL listo para ejecutar en el Dashboard |
| `supabase/sql/migraciones.sql` | Historial — changelog de todo lo ejecutado desde el día 1 |
| `supabase/sql/esquema.sql` | Source of truth — estado actual completo de la BD |

### Flujo para cada cambio en BD

**Paso 1** — Escribir SQL en `ejecucion.sql` con estado PENDIENTE:
```sql
-- ESTADO: PENDIENTE
-- ============================================================
-- LIZ STORE — Archivo de Ejecución SQL
-- ============================================================

-- Fix 0002: Descripción del cambio
ALTER TABLE products ADD COLUMN descuento INT DEFAULT 0;
```

**Paso 2** — El usuario abre el Dashboard de Supabase, va a SQL Editor, pega y ejecuta.

**Paso 3** — Marcar `ejecucion.sql` como EJECUTADO y vaciarlo:
```sql
-- ESTADO: EJECUTADO
-- ============================================================
-- LIZ STORE — Archivo de Ejecución SQL
-- ============================================================
```

**Paso 4** — Agregar entrada a `migraciones.sql`:
```sql
-- ============================================================
-- Fix 0002: Agregar columna descuento a products
-- Fecha ejecución: 2026-07-16
-- Estado: EJECUTADO
-- Descripción: Breve explicación del cambio
-- ============================================================
/*
ALTER TABLE products ADD COLUMN descuento INT DEFAULT 0;
*/
```

**Paso 5** — Actualizar `esquema.sql` reflejando el cambio.

### Reglas clave
- `ejecucion.sql` NUNCA tiene SQL si está EJECUTADO. Si llega con SQL y estado EJECUTADO, moverlo a migraciones.sql y esquema.sql, luego vaciarlo.
- `ejecucion.sql` solo tiene UNA migración pendiente a la vez. No acumular SQL pendiente.
- Las migraciones se ejecutan SOLO a mano en el Dashboard. No hay automatización.
- `esquema.sql` es la fuente de verdad. Ante duda, leer ese archivo.

## Para iniciar servidor de desarrollo
```bash
npm run dev
```
