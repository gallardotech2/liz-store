# Migración de Modelos Django a Supabase

**Agente:** model-migrator
**Fecha:** 2026-07-16

## Resumen

Se migraron **13 modelos Django** → **17 tablas SQL** + **perfiles extendidos**.

## Mapeo Modelo → Tabla

| App Django | Modelo | Tabla Supabase | Esquema | PK |
|---|---|---|---|---|
| users | User (AbstractUser) | `auth.users` (built-in) + `profiles` | Público | UUID |
| users | Address | `addresses` | Público | SERIAL |
| categories | Category | `categories` | Público | SERIAL |
| products | Product | `products` | Público | SERIAL |
| products | ProductImage | `product_images` | Público | SERIAL |
| orders | Order | `orders` | Público | SERIAL |
| orders | OrderItem | `order_items` | Público | SERIAL |
| payments | Transaction | `transactions` | Público | SERIAL |
| payments | PaymentMethod | `payment_methods` | Público | SERIAL |
| payments | QRPayment | `qr_payments` | Público | SERIAL |
| reviews | Review | `reviews` | Público | SERIAL |
| reviews | ReviewImage | `review_images` | Público | SERIAL |
| live_tools | StoreProfile | `store_profiles` | Público | SERIAL |
| live_tools | LiveSession | `live_sessions` | Público | SERIAL |
| live_tools | — (M2M) | `live_session_products` | Público | Compuesta |
| live_tools | LiveProduct | `live_products` | Público | SERIAL |
| live_tools | ProductInterest | `product_interests` | Público | SERIAL |

## Mapeo de Tipos Django → PostgreSQL

| Django Field | PostgreSQL | Notas |
|---|---|---|
| AutoField | SERIAL | — |
| BigAutoField | BIGSERIAL | — |
| CharField(max_length=N) | TEXT | Sin límite en PG, validar en app |
| TextField | TEXT | — |
| IntegerField / PositiveIntegerField | INTEGER | Con CHECK >= 0 para los unsigned |
| PositiveSmallIntegerField | INTEGER | CHECK (>= 1 AND <= 5) en rating |
| BooleanField | BOOLEAN DEFAULT false | — |
| DecimalField(max_digits=10, decimal_places=2) | NUMERIC(10,2) | — |
| FloatField | DOUBLE PRECISION | Para delivery_lat/lng |
| DateTimeField(auto_now_add) | TIMESTAMPTZ DEFAULT now() | — |
| DateTimeField(auto_now) | TIMESTAMPTZ DEFAULT now() | updated_at se maneja con trigger o app |
| JSONField(default=dict) | JSONB DEFAULT '{}' | — |
| ImageField(upload_to=...) | TEXT | URL de Supabase Storage |
| SlugField(unique) | TEXT UNIQUE | — |
| DurationField | INTERVAL | Solo en live_sessions.duration |
| ForeignKey(on_delete=CASCADE) | FK ... ON DELETE CASCADE | — |
| ForeignKey(on_delete=SET_NULL) | FK ... ON DELETE SET NULL | — |
| OneToOneField | FK ... UNIQUE | — |
| ManyToManyField | Tabla junction aparte | live_session_products |
| TextChoices (enum) | TEXT + CHECK | Con union type en TS |
| GenericForeignKey | No migrado | No usado directamente |

## Decisiones Importantes

### 1. User de Django → auth.users + profiles

Django `AbstractUser` se separa en dos partes:
- **`auth.users`** (Supabase nativo): maneja autenticación, email, password, rol
- **`profiles`**: campos extra (phone, avatar, is_verified, email_verified)

Esto sigue el patrón recomendado por Supabase. El trigger de creación de profile al registrarse se hará en Supabase (o desde la app).

### 2. ImageSpecField omitidos

Los campos `thumbnail`, `medium`, `large` de `ProductImage` eran procesadores de `django-imagekit` que generan imágenes derivadas en runtime. No existen en DB, solo se generan al acceder al atributo. Se migra solo el campo `image` (URL original). El redimensionamiento se hará mediante transformaciones de Supabase Storage o un Edge Function.

### 3. Choices → TEXT + CHECK

Todos los `TextChoices` de Django se migran como `TEXT` con `CHECK` constraints en lugar de ENUMs de PostgreSQL, para mayor flexibilidad. En TypeScript se definen como union types.

Choices migrados:
| Modelo | Campo | Valores |
|---|---|---|
| Order | status | pending, paid, preparing, shipped, delivered, completed, cancelled, refunded |
| Transaction | status | held, released, refunded, cancelled |
| QRPayment | qr_type | escudo, direct |
| LiveSession | status | not_started, live, paused, ended |
| LiveProduct | status | available, requested, reserved, sold |
| ProductInterest | action | whatsapp, view, add_cart, checkout |
| Review | rating | 1–5 (CHECK, no TEXT) |

### 4. IDs: SERIAL para tablas propias, UUID para profiles

Las tablas de negocio usan `SERIAL` (INTEGER) para coincidir con el `AutoField` de Django y facilitar la importación de datos. `profiles` usa `UUID` por ser FK a `auth.users.id` (UUID).

### 5. ManyToManyField → Junction Table

`LiveSession.products` (M2M a Product) se resuelve en `live_session_products` con PK compuesta.

### 6. updated_at sin trigger automático

Django maneja `auto_now` en la capa de aplicación. No se incluye trigger PG de `updated_at` por ahora; se manejará desde el código Next.js/Supabase.

### 7. `order` como palabra reservada

Se escapó como `"order"` en SQL y como campo `order` en TS (camelCase no es palabra reservada).

### 8. `rating` en Review como INTEGER con CHECK (1-5)

Django usaba `PositiveSmallIntegerField` con choices `[(1, '1'), ...]`. En SQL es `INTEGER CHECK (rating >= 1 AND rating <= 5)`.

## Pendientes

- [ ] **Trigger de `updated_at`**: Considerar añadir trigger SQL para actualizar `updated_at` automáticamente en cada tabla.
- [ ] **Trigger de `profiles`**: Añadir trigger `ON INSERT TO auth.users` que cree automáticamente un perfil.
- [ ] **Row Level Security (RLS)**: Definir políticas de acceso para cada tabla.
- [ ] **Índices de texto completo**: Agregar índices GIN/tsvector para búsqueda en productos si se requiere búsqueda textual.
- [ ] **Validación de email y slug a nivel DB**: Los CHECK constraints de email y slug se pueden reforzar con regex.
- [ ] **sample_data.py**: El archivo de datos de ejemplo del proyecto Django no existe en el backup (solo se menciona en README). El seed se creó con datos genéricos de joyería.
- [ ] **GenericForeignKey**: No se migró porque no hay instancias concretas en los modelos actuales.

## Archivos Generados

| Archivo | Descripción |
|---|---|
| `scripts/01-schema.sql` | Schema completo con 17 tablas, índices, constraints |
| `scripts/02-seed.sql` | Datos de ejemplo (6 categorías, 6 productos, 3 métodos de pago, 1 tienda) |
| `types/database.ts` | Interfaz Database completa con Row/Insert/Update para cada tabla |
| `types/index.ts` | Re-export de tipos compartidos |
