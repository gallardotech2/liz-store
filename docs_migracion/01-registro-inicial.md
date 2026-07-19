# Registro de Migración 01 — Inicialización del Proyecto

**Fecha**: 2026-07-16
**Estado**: Completado

## Archivo Original
- Proyecto Django Liz Store (v1.2.1)
- Respaldo en: `/home/elvirio16/Proyect-app/liz-react-django-backup`

## Archivo Nuevo
- Proyecto Next.js 16 + Tailwind CSS v4 + Supabase
- Ruta: `/home/elvirio16/Proyect-app/liz-react`

## Stack Destino
| Componente | Tecnología |
|-----------|------------|
| Framework | Next.js 16.2.10 (App Router) |
| UI | React 19.2.4 + Tailwind CSS 4 |
| BD/Backend | Supabase (PostgreSQL + JS SDK) |
| Despliegue | Vercel (SSG/ISR prioritario) |

## Dependencias Instaladas
- `next@16.2.10`, `react@19.2.4`, `react-dom@19.2.4`
- `@supabase/ssr`, `@supabase/supabase-js`
- Dev: `typescript@5`, `tailwindcss@4`, `@tailwindcss/postcss@4`, `eslint@9`

## Subagentes Creados
| Agente | Archivo | Propósito |
|--------|---------|-----------|
| model-migrator | `.opencode/agents/model-migrator.md` | Migrar modelos Django → schema SQL + tipos TS |
| template-migrator | `.opencode/agents/template-migrator.md` | Migrar templates HTML/CSS → componentes React |
| logic-migrator | `.opencode/agents/logic-migrator.md` | Migrar lógica de negocio → Server Actions |
| page-architect | `.opencode/agents/page-architect.md` | Crear páginas App Router con ISR/SSG |
| admin-migrator | `.opencode/agents/admin-migrator.md` | Migrar panel admin → rutas protegidas |

## Decisiones Técnicas Iniciales
- Tailwind v4 con `@import "tailwindcss"` y `@theme` (sin tailwind.config.js)
- `@supabase/ssr` para manejo de auth Server/Client
- Route groups `(shop)` para layout público compartido
- ISR con `revalidate` como default; SSR solo cuando sea estrictamente necesario
- `prefetch={false}` en enlaces para ahorrar ancho de banda en Vercel
- Misma ruta reemplazando proyecto original (backup creado)

## Pendientes
- [ ] Migrar modelos Django → tablas Supabase (ver 02-mapeo-modelos.md)
- [ ] Migrar templates → componentes React (ver 03-componentes-ui.md)
- [ ] Migrar lógica de negocio (carrito, checkout, Escudo Pago)
- [ ] Migrar panel admin
- [ ] Configurar variables de entorno para Supabase
- [ ] Configurar PWA
