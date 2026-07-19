# Migración 07 — Sistema de Migraciones SQL (estilo e-mstore)

**Fecha**: 2026-07-16
**Estado**: Completado

## Archivos creados

| Archivo | Propósito |
|---|---|
| `supabase/sql/ejecucion.sql` | Staging — SQL listo para ejecutar (ESTADO: EJECUTADO → vacío) |
| `supabase/sql/migraciones.sql` | Historial — Migración 00001 registrada |
| `supabase/sql/esquema.sql` | Source of truth — estado actual completo de la BD |

## Contenido de esquema.sql

| Sección | Detalle |
|---|---|
| Extensiones | uuid-ossp, pgcrypto |
| Tablas | 17 (profiles, addresses, categories, products, product_images, orders, order_items, transactions, payment_methods, qr_payments, reviews, review_images, store_profiles, live_sessions, live_session_products, live_products, product_interests) |
| Índices | 24 |
| Triggers | update_updated_at (11 tablas) + handle_new_user (crear profile al registrarse) |
| RLS Policies | ~35 policies (anon SELECT, authenticated CRUD propio, admin todo) |
| Storage | 3 buckets (product-images, reviews, live) con sus policies |
| Grants | Column-level para profiles |

## Flujo de trabajo

1. Escribir SQL en `ejecucion.sql` → ESTADO: PENDIENTE
2. Ejecutar en Dashboard de Supabase (SQL Editor)
3. Marcar ESTADO: EJECUTADO y vaciar `ejecucion.sql`
4. Agregar entrada a `migraciones.sql` con SQL comentado
5. Actualizar `esquema.sql` con los cambios
