-- ============================================================
-- LIZ STORE — Historial de Migraciones
-- ============================================================
-- Cada migración se registra acá DESPUÉS de ejecutar.
-- Formato: nombre, fecha, estado, descripción, SQL comentado.
-- ============================================================

-- ============================================================
-- Fix 0013: Corregir role de nuevos administradores
-- Fecha ejecución: 2026-07-26
-- Estado: EJECUTADO
-- Descripción: Los admins creados por Supabase Dashboard tenían
--   role='customer' en profiles y sin 'admin' en app_metadata.
--   Se actualizan ambos para que el login y RLS funcionen.
-- ============================================================
/*
UPDATE profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('gallardoelvirio@gmail.com', 'marielacondori037@gmail.com')
)
AND role != 'admin';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
WHERE email IN ('gallardoelvirio@gmail.com', 'marielacondori037@gmail.com')
  AND (raw_app_meta_data ->> 'role') IS DISTINCT FROM 'admin';

NOTIFY pgrst, 'reload schema';
*/

-- ============================================================
-- Fix 0012: Crear tabla admin_authorized para admins autorizados con OTP
-- Fecha ejecución: 2026-07-26
-- Estado: EJECUTADO
-- Descripción: Nueva tabla para administradores que requieren verificación
--   OTP antes de acciones críticas. Campos: user_id, email, role, otp_enabled,
--   is_active. RLS: propio SELECT, admin INSERT/UPDATE/DELETE.
-- ============================================================
/*
CREATE TABLE IF NOT EXISTS admin_authorized (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  otp_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE admin_authorized ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin Authorized: propio SELECT" ON admin_authorized
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Authorized: admin INSERT" ON admin_authorized
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Authorized: admin UPDATE" ON admin_authorized
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin Authorized: admin DELETE" ON admin_authorized
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE INDEX IF NOT EXISTS idx_admin_authorized_user_id ON admin_authorized(user_id);

DROP TRIGGER IF EXISTS trg_update_updated_at ON admin_authorized;
CREATE TRIGGER trg_update_updated_at
  BEFORE UPDATE ON admin_authorized
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON admin_authorized TO authenticated;
*/

-- ============================================================
-- Fix 0011: Crear tabla pickup_points para puntos de recogida dinámicos
-- Fecha ejecución: 2026-07-26
-- Estado: EJECUTADO
-- Descripción: Nueva tabla para que el admin gestione puntos de recogida.
--   Campos: name, address, schedule, google_maps_url, is_active, order.
--   RLS: anon SELECT solo activos, admin ALL.
-- ============================================================
/*
CREATE TABLE IF NOT EXISTS pickup_points (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  schedule TEXT NOT NULL DEFAULT '',
  google_maps_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pickup_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pickup Points: anon SELECT activos" ON pickup_points
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Pickup Points: admin todo" ON pickup_points
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE INDEX IF NOT EXISTS idx_pickup_points_active_order ON pickup_points(is_active, "order");

DROP TRIGGER IF EXISTS trg_update_updated_at ON pickup_points;
CREATE TRIGGER trg_update_updated_at
  BEFORE UPDATE ON pickup_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

GRANT SELECT ON pickup_points TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON pickup_points TO authenticated;
*/

-- ============================================================
-- Fix 0010: Crear tabla whatsapp_requests para seguimiento de pedidos
-- Fecha ejecución: 2026-07-26
-- Estado: EJECUTADO
-- Descripción: Nueva tabla para que usuarios registrados puedan solicitar
--   productos por WhatsApp y dar seguimiento con 9 estados administrables.
--   RLS: usuario SELECT/INSERT propio, admin ALL.
-- ============================================================
/*
CREATE TABLE whatsapp_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_image TEXT DEFAULT '',
  product_price NUMERIC(10,2),
  reference_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'pending_payment', 'payment_confirmed', 'preparing',
    'in_package', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled'
  )),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE whatsapp_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "WhatsApp: propio SELECT" ON whatsapp_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "WhatsApp: auth INSERT" ON whatsapp_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "WhatsApp: admin todo" ON whatsapp_requests
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE INDEX IF NOT EXISTS idx_whatsapp_requests_user_id ON whatsapp_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_requests_reference_code ON whatsapp_requests(reference_code);
CREATE INDEX IF NOT EXISTS idx_whatsapp_requests_status ON whatsapp_requests(status);

DROP TRIGGER IF EXISTS trg_update_updated_at ON whatsapp_requests;
CREATE TRIGGER trg_update_updated_at
  BEFORE UPDATE ON whatsapp_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
*/

-- ============================================================
-- Fix 0009: Recrear usuario admin después de Fix 0008
-- Fecha ejecución: 2026-07-19
-- Estado: EJECUTADO
-- Descripción: Fix 0008 eliminó al admin corrupto (ID: 549d0e34)
--   pero nunca se recreó. Se creó vía Supabase Admin API
--   (service_role) con email_confirm=true, metadata role=admin.
--   Email: admin@lizstore.com, Password: Admin123
--   NOTA: No se puede recrear por SQL directo porque GoTrue
--   requiere hash bcrypt propio. Usar API o UI de Auth.
-- ============================================================
/*
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@lizstore.com',
    password: 'Admin123',
    email_confirm: true,
    user_metadata: { nombre: 'Admin', role: 'admin' },
    app_metadata: { role: 'admin' }
  });
*/

-- ============================================================
-- Fix 0008: Eliminar usuario admin corrupto
-- Fecha ejecución: 2026-07-19
-- Estado: EJECUTADO
-- Descripción: El admin (ID: 549d0e34-719c-4fff-a12e-44426f46b333)
--   tenía datos NULL en auth.users que rompen GoTrue. Se eliminó.
--   NOTA: No se recreó en ese momento — fue necesario Fix 0009.
-- ============================================================
/*
DELETE FROM profiles WHERE id = '549d0e34-719c-4fff-a12e-44426f46b333';
DELETE FROM auth.users WHERE id = '549d0e34-719c-4fff-a12e-44426f46b333';
*/

-- ============================================================
-- Fix 0007: Corregir NULLs en auth.users que rompen GoTrue
-- Fecha ejecución: 2026-07-19
-- Estado: EJECUTADO
-- Descripción: Columnas token (confirmation_token, recovery_token,
--   etc.) quedaron NULL tras migraciones manuales. GoTrue espera
--   string vacío y lanza "Database error querying schema" al
--   encontrar NULL. Se seteó email_confirmed_at al actual.
-- ============================================================
/*
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;
UPDATE auth.users SET email_change_token_current = '' WHERE email_change_token_current IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET phone_change_token = '' WHERE phone_change_token IS NULL;
UPDATE auth.users SET reauthentication_token = '' WHERE reauthentication_token IS NULL;
UPDATE auth.users SET email_confirmed_at = '2026-07-19T00:00:00Z' WHERE email_confirmed_at IS NULL;
NOTIFY pgrst, 'reload schema';
*/

-- ============================================================
-- Fix 0006: Reparar grants del rol authenticator en schema auth
-- Fecha ejecución: 2026-07-19
-- Estado: EJECUTADO
-- Descripción: El rol authenticator (usado por GoTrue) perdió
--   sus permisos en el schema auth al reactivar el proyecto.
--   Sin estos GRANT, Supabase Auth respondía 500 con
--   "Database error querying schema".
-- ============================================================
/*
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO authenticator;
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticator;
NOTIFY pgrst, 'reload schema';
*/

-- ============================================================
-- Fix 0004: Recrear usuario admin correctamente
-- Fecha ejecución: 2026-07-19
-- Estado: EJECUTADO
-- Descripción: El usuario admin creado en 00003 usó crypt() de
--   pgcrypto que genera un hash bcrypt incompatible con GoTrue.
--   Solución: eliminar el usuario, crearlo desde la UI de Auth
--   (Add User) y luego actualizar role='admin' via SQL.
-- ============================================================
/*
-- Eliminar usuario roto y su profile
DELETE FROM profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@lizstore.com');
DELETE FROM auth.users WHERE email = 'admin@lizstore.com';

-- Después de crear el usuario desde la UI (Auth → Add User):
UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@lizstore.com');
UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb WHERE email = 'admin@lizstore.com';
*/

-- ============================================================
-- Migración 00003: Crear usuario admin
-- Fecha ejecución: 2026-07-19
-- Estado: EJECUTADO
-- Descripción: Creación de usuario admin en auth.users
--   Email: admin@lizstore.com
--   Password: Admin123
--   El trigger handle_new_user() creó el profile con role='admin'
--   raw_app_meta_data incluye role='admin' para RLS
-- ============================================================
/*
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@lizstore.com', crypt('Admin123', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"],"role":"admin"}', '{"nombre":"Admin","role":"admin"}', now(), now());
*/
-- ============================================================
-- Migración 00002: Seed datos iniciales
-- Fecha ejecución: 2026-07-18
-- Estado: EJECUTADO
-- Descripción: Población inicial de BD:
--   - 1 store_profile (Liz Store)
--   - 6 categorías (collares, anillos, aretes, pulseras, relojes, accesorios)
--   - 2 métodos de pago (Escudo Pago, Pago Directo)
--   - 2 QR payments
--   - 12 productos (2 por categoría) con imágenes placeholder
-- ============================================================
/*
INSERT INTO store_profiles (name, account_name, account_number, bank_name) VALUES ('Liz Store', 'Liz Store', '', 'Banco Nacional');

INSERT INTO categories (name, slug, description, icon, "order") VALUES
  ('Collares', 'collares', 'Elegantes collares para toda ocasión', '✨', 1),
  ('Anillos', 'anillos', 'Anillos que realzan tu estilo', '💍', 2),
  ('Aretes', 'aretes', 'Pendientes y aretes para brillar', '💎', 3),
  ('Pulseras', 'pulseras', 'Pulseras y brazaletes con estilo', '📿', 4),
  ('Relojes', 'relojes', 'Relojes elegantes para tu día a día', '⌚', 5),
  ('Accesorios', 'accesorios', 'Complementos que marcan la diferencia', '🎀', 6);

INSERT INTO payment_methods (name, code, description, icon, "order", config) VALUES
  ('Escudo Pago', 'escudo_pago', 'Tu dinero protegido hasta recibir el pedido', '🛡️', 1, '{}'),
  ('Pago Directo', 'pago_directo', 'Pago directo por transferencia o QR', '💳', 2, '{}');

INSERT INTO qr_payments (payment_method_id, qr_type, account_name, account_number, bank_name, is_active)
VALUES (1, 'escudo', 'Liz Store', '000-000000-0', 'Banco Nacional', true),
       (2, 'direct', 'Liz Store', '000-000000-0', 'Banco Nacional', true);

INSERT INTO products (name, slug, sku, category_id, price, discount_price, stock, short_description, is_featured, is_new) VALUES
  ('Collar de Perlas', 'collar-de-perlas', 'COL-PRL-001', 1, 89.00, 69.00, 15, 'Collar de perlas cultivadas con cierre de plata', true, true),
  ('Collar Colgante Dorado', 'collar-colgante-dorado', 'COL-DOR-002', 1, 55.00, NULL, 20, 'Collar con colgante de baño dorado y cadena ajustable', true, false),
  ('Anillo de Compromiso', 'anillo-de-compromiso', 'ANI-CMP-003', 2, 120.00, 99.00, 10, 'Anillo con circonita cúbica en engaste de plata', true, true),
  ('Anillo Ajustable Plateado', 'anillo-ajustable-plateado', 'ANI-PLT-004', 2, 25.00, NULL, 30, 'Anillo ajustable de acero quirúrgico plateado', false, false),
  ('Aretes de Aro Dorados', 'aretes-de-aro-dorados', 'ARE-DOR-005', 3, 35.00, 29.00, 25, 'Aretes de aro medianos baño oro de 18K', true, true),
  ('Pendientes de Luna', 'pendientes-de-luna', 'ARE-LUN-006', 3, 42.00, NULL, 18, 'Pendientes colgantes con forma de luna', true, false),
  ('Pulsera de Charm', 'pulsera-de-charm', 'PUL-CHA-007', 4, 65.00, 55.00, 12, 'Pulsera con charms intercambiables de plata', true, true),
  ('Brazalete Trenzado', 'brazalete-trenzado', 'PUL-TRZ-008', 4, 30.00, NULL, 22, 'Brazalete trenzado de cuero con cierre dorado', false, false),
  ('Reloj Clásico Dorado', 'reloj-clasico-dorado', 'REL-DOR-009', 5, 150.00, 129.00, 8, 'Reloj analógico con correa dorada y esfera blanca', true, true),
  ('Reloj Deportivo Plateado', 'reloj-deportivo-plateado', 'REL-DEP-010', 5, 85.00, NULL, 15, 'Reloj deportivo resistente al agua', false, false),
  ('Pañuelo Seda Estampado', 'panuelo-seda-estampado', 'ACC-SED-011', 6, 45.00, 35.00, 20, 'Pañuelo de seda natural con estampado floral', true, true),
  ('Cartera de Mano Elegante', 'cartera-de-mano-elegante', 'ACC-CRT-012', 6, 110.00, NULL, 10, 'Cartera de mano en piel sintética con cierre dorado', true, false);

INSERT INTO product_images (product_id, image, alt_text, is_main, "order") VALUES
  (1, 'https://picsum.photos/seed/prod1/600/600', 'Collar de Perlas', true, 1),
  (2, 'https://picsum.photos/seed/prod2/600/600', 'Collar Colgante Dorado', true, 1),
  (3, 'https://picsum.photos/seed/prod3/600/600', 'Anillo de Compromiso', true, 1),
  (4, 'https://picsum.photos/seed/prod4/600/600', 'Anillo Ajustable Plateado', true, 1),
  (5, 'https://picsum.photos/seed/prod5/600/600', 'Aretes de Aro Dorados', true, 1),
  (6, 'https://picsum.photos/seed/prod6/600/600', 'Pendientes de Luna', true, 1),
  (7, 'https://picsum.photos/seed/prod7/600/600', 'Pulsera de Charm', true, 1),
  (8, 'https://picsum.photos/seed/prod8/600/600', 'Brazalete Trenzado', true, 1),
  (9, 'https://picsum.photos/seed/prod9/600/600', 'Reloj Clásico Dorado', true, 1),
  (10, 'https://picsum.photos/seed/prod10/600/600', 'Reloj Deportivo Plateado', true, 1),
  (11, 'https://picsum.photos/seed/prod11/600/600', 'Pañuelo Seda Estampado', true, 1),
  (12, 'https://picsum.photos/seed/prod12/600/600', 'Cartera de Mano Elegante', true, 1);
*/
-- ============================================================
-- Migración 00001: Schema inicial Liz Store
-- Fecha ejecución: 2026-07-16
-- Estado: EJECUTADO
-- Descripción: Creación completa de BD migrada desde Django:
--   17 tablas (profiles, addresses, categories, products,
--   product_images, orders, order_items, transactions,
--   payment_methods, qr_payments, reviews, review_images,
--   store_profiles, live_sessions, live_session_products,
--   live_products, product_interests)
--   + RLS policies, triggers, storage buckets, grants.
-- ============================================================
/*
-- =========================================================================
-- EXTENSIONES
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- TABLAS
-- =========================================================================

-- Profiles (campos extra de auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT DEFAULT '',
  avatar TEXT,
  nombre TEXT DEFAULT '',
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  is_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Addresses
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  colony TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  zip_code TEXT DEFAULT '',
  references TEXT DEFAULT '',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  image TEXT,
  icon TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  discount_price NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  short_description TEXT DEFAULT '',
  long_description TEXT DEFAULT '',
  specifications JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0),
  sales_count INTEGER DEFAULT 0 CHECK (sales_count >= 0),
  meta_description TEXT DEFAULT '',
  meta_keywords TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Product Images
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image TEXT NOT NULL,
  alt_text TEXT DEFAULT '',
  is_main BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_key TEXT,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded')),
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_cost NUMERIC(10,2) DEFAULT 0.00,
  discount NUMERIC(10,2) DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL,
  shipping_address JSONB,
  notes TEXT DEFAULT '',
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  payment_method TEXT DEFAULT '',
  delivery_latitude DOUBLE PRECISION,
  delivery_longitude DOUBLE PRECISION,
  delivery_address_text TEXT DEFAULT '',
  delivery_reference TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Order Items
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  product_image TEXT DEFAULT '',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Transactions (Escudo Pago)
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'cancelled')),
  payment_method TEXT DEFAULT 'card',
  transaction_id TEXT DEFAULT '',
  held_at TIMESTAMPTZ DEFAULT now(),
  released_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Payment Methods
CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- QR Payments
CREATE TABLE qr_payments (
  id SERIAL PRIMARY KEY,
  payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  qr_type TEXT NOT NULL CHECK (qr_type IN ('escudo', 'direct')),
  qr_image TEXT,
  qr_code TEXT DEFAULT '',
  account_name TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE qr_payments ENABLE ROW LEVEL SECURITY;

-- Reviews
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_key TEXT,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Review Images
CREATE TABLE review_images (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;

-- Store Profiles
CREATE TABLE store_profiles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Liz Store',
  logo TEXT,
  banner TEXT,
  followers INTEGER DEFAULT 0 CHECK (followers >= 0),
  likes INTEGER DEFAULT 0 CHECK (likes >= 0),
  rating NUMERIC(2,1) DEFAULT 0.0,
  reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
  customers_served INTEGER DEFAULT 0 CHECK (customers_served >= 0),
  qr_code TEXT,
  account_name TEXT DEFAULT 'Liz Store',
  account_number TEXT DEFAULT '',
  bank_name TEXT DEFAULT 'Banco Nacional',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE store_profiles ENABLE ROW LEVEL SECURITY;

-- Live Sessions
CREATE TABLE live_sessions (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES store_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'live', 'paused', 'ended')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration INTERVAL,
  current_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  total_products_shown INTEGER DEFAULT 0 CHECK (total_products_shown >= 0),
  total_products_sold INTEGER DEFAULT 0 CHECK (total_products_sold >= 0),
  total_reserved INTEGER DEFAULT 0 CHECK (total_reserved >= 0),
  total_interested INTEGER DEFAULT 0 CHECK (total_interested >= 0),
  total_likes INTEGER DEFAULT 0 CHECK (total_likes >= 0),
  total_followers INTEGER DEFAULT 0 CHECK (total_followers >= 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

-- Live Session Products (junction M2M)
CREATE TABLE live_session_products (
  live_session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (live_session_id, product_id)
);

ALTER TABLE live_session_products ENABLE ROW LEVEL SECURITY;

-- Live Products
CREATE TABLE live_products (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'requested', 'reserved', 'sold')),
  "order" INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE live_products ENABLE ROW LEVEL SECURITY;

-- Product Interests
CREATE TABLE product_interests (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('whatsapp', 'view', 'add_cart', 'checkout')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE product_interests ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- ÍNDICES
-- =========================================================================
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active_order ON categories(is_active, "order");
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_active_featured ON products(is_active, is_featured);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_main ON product_images(product_id, is_main);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_qr_payments_payment_method_id ON qr_payments(payment_method_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_review_images_review_id ON review_images(review_id);
CREATE INDEX idx_live_sessions_store_id ON live_sessions(store_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
CREATE INDEX idx_live_products_session_id ON live_products(session_id);
CREATE INDEX idx_product_interests_session_id ON product_interests(session_id);
CREATE INDEX idx_product_interests_product_id ON product_interests(product_id);

-- =========================================================================
-- TRIGGERS
-- =========================================================================

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'profiles', 'addresses', 'categories', 'products', 'orders',
      'transactions', 'payment_methods', 'qr_payments', 'reviews',
      'store_profiles', 'live_sessions', 'live_products'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_update_updated_at ON %I;
       CREATE TRIGGER trg_update_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- Trigger: crear profile automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =========================================================================
-- RLS POLICIES
-- =========================================================================

-- Profiles: cada uno ve su propio perfil; admin ve todos
CREATE POLICY "Profiles: propio SELECT"
  ON profiles FOR SELECT
  USING (id = auth.uid());
CREATE POLICY "Profiles: propio UPDATE"
  ON profiles FOR UPDATE
  USING (id = auth.uid());
CREATE POLICY "Profiles: admin todo"
  ON profiles FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Profiles: anon INSERT (trigger)"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Addresses: propias
CREATE POLICY "Addresses: propio SELECT"
  ON addresses FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Addresses: propio INSERT"
  ON addresses FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Addresses: propio UPDATE"
  ON addresses FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Addresses: propio DELETE"
  ON addresses FOR DELETE
  USING (user_id = auth.uid());
CREATE POLICY "Addresses: admin todo"
  ON addresses FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Categories: anon puede leer activas
CREATE POLICY "Categories: anon SELECT activas"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "Categories: admin todo"
  ON categories FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Products: anon puede leer activos
CREATE POLICY "Products: anon SELECT activos"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "Products: admin todo"
  ON products FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Product Images: anon puede leer
CREATE POLICY "Product Images: anon SELECT"
  ON product_images FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY "Product Images: admin todo"
  ON product_images FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Orders: cada uno ve sus propias; anon puede crear (guest checkout)
CREATE POLICY "Orders: propio SELECT"
  ON orders FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Orders: anon INSERT"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Orders: propio UPDATE"
  ON orders FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Orders: admin todo"
  ON orders FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Order Items
CREATE POLICY "Order Items: propio ver"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );
CREATE POLICY "Order Items: INSERT"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Order Items: admin todo"
  ON order_items FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Transactions
CREATE POLICY "Transactions: propio SELECT"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Transactions: admin todo"
  ON transactions FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Payment Methods: anon puede leer activos
CREATE POLICY "Payment Methods: anon SELECT activos"
  ON payment_methods FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "Payment Methods: admin todo"
  ON payment_methods FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- QR Payments
CREATE POLICY "QR Payments: anon SELECT activos"
  ON qr_payments FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "QR Payments: admin todo"
  ON qr_payments FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Reviews: anon puede leer aprobadas; autenticados pueden crear
CREATE POLICY "Reviews: anon SELECT aprobadas"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);
CREATE POLICY "Reviews: auth INSERT"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Reviews: admin todo"
  ON reviews FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Review Images
CREATE POLICY "Review Images: anon SELECT"
  ON review_images FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY "Review Images: admin todo"
  ON review_images FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Store Profiles: anon puede leer
CREATE POLICY "Store Profiles: anon SELECT"
  ON store_profiles FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY "Store Profiles: admin todo"
  ON store_profiles FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Live Sessions: anon puede leer activas
CREATE POLICY "Live Sessions: anon SELECT activas"
  ON live_sessions FOR SELECT
  TO anon, authenticated
  USING (status IN ('live', 'not_started'));
CREATE POLICY "Live Sessions: admin todo"
  ON live_sessions FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Live Session Products
CREATE POLICY "Live Session Products: anon SELECT"
  ON live_session_products FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY "Live Session Products: admin todo"
  ON live_session_products FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Live Products
CREATE POLICY "Live Products: anon SELECT"
  ON live_products FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY "Live Products: admin todo"
  ON live_products FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Product Interests
CREATE POLICY "Product Interests: INSERT anon"
  ON product_interests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Product Interests: admin SELECT"
  ON product_interests FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =========================================================================
-- STORAGE BUCKETS
-- =========================================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images', 'product-images', true),
  ('reviews', 'reviews', true),
  ('live', 'live', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: product-images
CREATE POLICY "Storage product-images: anon SELECT"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');
CREATE POLICY "Storage product-images: admin INSERT"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );
CREATE POLICY "Storage product-images: admin DELETE"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );

-- Storage policies: reviews
CREATE POLICY "Storage reviews: anon SELECT"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'reviews');
CREATE POLICY "Storage reviews: auth INSERT"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'reviews');

-- Storage policies: live
CREATE POLICY "Storage live: anon SELECT"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'live');
CREATE POLICY "Storage live: admin INSERT"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'live'
    AND ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );

-- =========================================================================
-- Fix 0014: social_links
-- =========================================================================
/*
CREATE TABLE IF NOT EXISTS social_links (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Social Links: admin todo" ON social_links
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Social Links: public SELECT" ON social_links
  FOR SELECT USING (true);

INSERT INTO social_links (platform, label, url) VALUES
  ('facebook', 'Facebook', 'https://facebook.com/lizstore'),
  ('instagram', 'Instagram', 'https://instagram.com/lizstore'),
  ('whatsapp', 'WhatsApp', 'https://wa.me/59176426643'),
  ('tiktok', 'TikTok', 'https://tiktok.com/@lizstore')
ON CONFLICT (platform) DO NOTHING;
*/

-- =========================================================================
-- GRANTS (column-level)
-- =========================================================================
-- profiles: anon solo puede leer ciertos campos
REVOKE ALL ON profiles FROM anon, authenticated;
GRANT SELECT(id, nombre, avatar) ON profiles TO anon;
GRANT SELECT(id, nombre, avatar, phone, role) ON profiles TO authenticated;
GRANT UPDATE(phone, avatar, nombre) ON profiles TO authenticated;

-- Resto de tablas: grants por defecto
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
*/

-- ============================================================
-- Fix 0015: Endurecer RLS orders — validar ownership en INSERT
-- Fecha ejecución: 2026-07-29
-- Estado: EJECUTADO
-- Descripción: Prevenir que usuarios autenticados creen pedidos con user_id ajeno
--              y que inserts en order_items validen que el order pertenece al usuario
-- ============================================================
/*
DROP POLICY IF EXISTS "Orders: anon INSERT" ON orders;

CREATE POLICY "Orders: auth INSERT propio" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Orders: anon INSERT guest" ON orders
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND session_key IS NOT NULL AND session_key != '');

DROP POLICY IF EXISTS "Order Items: INSERT" ON order_items;

CREATE POLICY "Order Items: INSERT propio" ON order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (
          (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
          OR
          (auth.uid() IS NULL AND orders.user_id IS NULL AND orders.session_key IS NOT NULL)
        )
    )
  );
*/

-- ============================================================
-- Fix 0016: Índice compuesto products(category_id, is_active)
-- Fecha ejecución: 2026-07-29
-- Estado: EJECUTADO
-- Descripción: Optimizar queries que filtran por categoría + estado activo
-- ============================================================
/*
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active);
*/

-- ============================================================
-- Fix 0017: order_items.product_id NOT NULL + RESTRICT
-- Fecha ejecución: 2026-07-29
-- Estado: EJECUTADO
-- Descripción: F11 — Prevenir huérfanos si se borra un producto. ON DELETE RESTRICT preserva historial.
-- ============================================================
/*
ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey,
  ALTER COLUMN product_id SET NOT NULL,
  ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;
*/

-- ============================================================
-- Fix 0018: reviews — DROP UNIQUE constraint
-- Fecha ejecución: 2026-07-29
-- Estado: EJECUTADO
-- Descripción: F12 — Permitir que usuarios actualicen su review en lugar de crear una nueva
-- ============================================================
/*
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_product_id_user_id_key;
*/

-- ============================================================
-- Fix 0003: WhatsApp de pedidos editable en admin + pedidos de visitantes
-- Fecha ejecución: 2026-08-14
-- Estado: EJECUTADO
-- Descripción: Agrega columna whatsapp_number a store_profiles para
--   configurar desde admin/Tienda el número que recibe los pedidos.
--   Permite whatsapp_requests sin usuario (pedidos de visitantes).
-- ============================================================
/*
ALTER TABLE store_profiles ADD COLUMN whatsapp_number TEXT DEFAULT '';
ALTER TABLE whatsapp_requests ALTER COLUMN user_id DROP NOT NULL;
*/

-- ============================================================
-- Fix 0004: RPC functions para live sessions
-- Fecha ejecución: 2026-08-21
-- Estado: EJECUTADO
-- Descripción: Crea increment_session_interested y increment_session_shown
--   para tracking de interés de productos en sesiones en vivo.
-- ============================================================
/*
CREATE OR REPLACE FUNCTION increment_session_interested(session_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE live_sessions
  SET total_interested = total_interested + 1,
      updated_at = now()
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_session_shown(session_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE live_sessions
  SET total_products_shown = total_products_shown + 1,
      updated_at = now()
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- ============================================================
-- Fix 0019: Agregar columna is_offer a products (sección Ofertas)
-- Fecha ejecución: 2026-10-12
-- Estado: EJECUTADO
-- Descripción: Permite marcar un producto como "En oferta" desde el admin
--   (estado: Activo / Destacado / Nuevo / En oferta) y mostrarlo
--   automáticamente en la sección /ofertas (Android y PC).
-- ============================================================
/*
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_offer BOOLEAN DEFAULT false;
*/

-- ============================================================
-- Fix 0020: Link de grupo de WhatsApp configurable desde el admin
-- Fecha ejecución: 2026-10-12
-- Estado: EJECUTADO
-- Descripción: Crea la fila platform 'whatsapp_group' en social_links.
--   Su URL se edita desde Admin > Redes Sociales y aparece en el botón
--   "Únete a nuestro grupo de WhatsApp" del footer.
-- ============================================================
/*
INSERT INTO social_links (platform, label, url, is_active)
VALUES ('whatsapp_group', 'Grupo de WhatsApp', '', true)
ON CONFLICT (platform) DO NOTHING;
*/

-- ============================================================
-- Fix 0021: Modo Hot global (campaña de venta rápida)
-- Fecha ejecución: 2026-10-26
-- Estado: EJECUTADO
-- Descripción: Agrega duración/expiración a live_sessions, precio Hot,
--   mostrado y updated_at a live_products, índices de unicidad, RLS
--   de campaña vencida y RPCs admin para gestionar la campaña.
-- ============================================================
/*
-- ---------------------------------------------------------------------------
-- 1. Columnas de campaña
-- ---------------------------------------------------------------------------

ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_hours INTEGER,
  ADD COLUMN IF NOT EXISTS ended_reason TEXT;

ALTER TABLE public.live_products
  ADD COLUMN IF NOT EXISTS promo_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS shown_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_sessions_duration_hours_check'
  ) THEN
    ALTER TABLE public.live_sessions
      ADD CONSTRAINT live_sessions_duration_hours_check
      CHECK (duration_hours IS NULL OR duration_hours > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_sessions_ended_reason_check'
  ) THEN
    ALTER TABLE public.live_sessions
      ADD CONSTRAINT live_sessions_ended_reason_check
      CHECK (ended_reason IS NULL OR ended_reason IN ('manual', 'expired'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_sessions_ends_at_check'
  ) THEN
    ALTER TABLE public.live_sessions
      ADD CONSTRAINT live_sessions_ends_at_check
      CHECK (ends_at IS NULL OR started_at IS NULL OR ends_at > started_at);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_products_promo_price_check'
  ) THEN
    ALTER TABLE public.live_products
      ADD CONSTRAINT live_products_promo_price_check
      CHECK (promo_price IS NULL OR promo_price >= 0);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Sincronización inicial y limpieza de duplicados
-- ---------------------------------------------------------------------------

INSERT INTO public.live_products (session_id, product_id, "order")
SELECT lsp.live_session_id, lsp.product_id, 0
FROM public.live_session_products lsp
WHERE NOT EXISTS (
  SELECT 1
  FROM public.live_products lp
  WHERE lp.session_id = lsp.live_session_id
    AND lp.product_id = lsp.product_id
);

DELETE FROM public.live_products a
USING public.live_products b
WHERE a.session_id = b.session_id
  AND a.product_id = b.product_id
  AND a.id > b.id;

-- Dejar una sola campaña live si hubiera duplicados previos.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           ORDER BY COALESCE(started_at, created_at) DESC, id DESC
         ) AS rn
  FROM public.live_sessions
  WHERE status = 'live'
)
UPDATE public.live_sessions s
SET status = 'ended',
    ended_at = now(),
    ended_reason = 'manual',
    updated_at = now()
FROM ranked r
WHERE s.id = r.id
  AND r.rn > 1;

-- ---------------------------------------------------------------------------
-- 3. Índices
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uniq_live_products_session_product
  ON public.live_products (session_id, product_id);

CREATE INDEX IF NOT EXISTS idx_live_sessions_active
  ON public.live_sessions (status, ends_at);

-- Una sola campaña live a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_live_session_active
  ON public.live_sessions ((true))
  WHERE status = 'live';

-- ---------------------------------------------------------------------------
-- 4. RLS pública: una campaña vencida deja de ser visible
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Live Sessions: anon SELECT activas" ON public.live_sessions;

CREATE POLICY "Live Sessions: anon SELECT activas"
  ON public.live_sessions
  FOR SELECT TO anon, authenticated
  USING (
    status = 'live'
    AND (ends_at IS NULL OR ends_at > now())
  );

-- ---------------------------------------------------------------------------
-- 5. Helpers y RPCs admin
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_hot_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_hot_admin() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.activate_hot_session(
  p_session_id INTEGER,
  p_duration_hours INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session public.live_sessions%ROWTYPE;
  v_duration INTEGER;
  v_current_product INTEGER;
  v_has_product BOOLEAN;
BEGIN
  IF NOT public.is_hot_admin() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  IF p_duration_hours IS NOT NULL AND p_duration_hours <= 0 THEN
    RAISE EXCEPTION 'La duración debe ser mayor a 0';
  END IF;

  -- Cerrar campañas vencidas para liberar el cupo de campaña activa.
  UPDATE public.live_sessions
  SET status = 'ended',
      ended_at = now(),
      ended_reason = 'expired',
      updated_at = now()
  WHERE status = 'live'
    AND ends_at IS NOT NULL
    AND ends_at <= now();

  SELECT *
  INTO v_session
  FROM public.live_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaña no encontrada';
  END IF;

  IF v_session.status NOT IN ('not_started', 'paused') THEN
    RAISE EXCEPTION 'Solo se puede activar una campaña no iniciada o pausada';
  END IF;

  IF v_session.status = 'paused'
     AND v_session.ends_at IS NOT NULL
     AND v_session.ends_at <= now() THEN
    UPDATE public.live_sessions
    SET status = 'ended',
        ended_at = now(),
        ended_reason = 'expired',
        updated_at = now()
    WHERE id = p_session_id;

    RAISE EXCEPTION 'La campaña ya venció; crea una nueva';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.live_sessions
    WHERE status = 'live'
      AND id <> p_session_id
  ) THEN
    RAISE EXCEPTION 'Ya hay una campaña Hot activa';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.live_products
    WHERE session_id = p_session_id
  ) INTO v_has_product;

  IF NOT v_has_product THEN
    RAISE EXCEPTION 'Agrega al menos un producto antes de activar';
  END IF;

  v_duration := COALESCE(p_duration_hours, v_session.duration_hours);

  SELECT product_id
  INTO v_current_product
  FROM public.live_products
  WHERE session_id = p_session_id
  ORDER BY "order", id
  LIMIT 1;

  UPDATE public.live_sessions
  SET status = 'live',
      started_at = COALESCE(started_at, now()),
      ends_at = CASE
        WHEN v_duration IS NOT NULL
          THEN COALESCE(started_at, now()) + make_interval(hours => v_duration)
        ELSE NULL
      END,
      duration_hours = v_duration,
      ended_at = NULL,
      ended_reason = NULL,
      current_product_id = COALESCE(current_product_id, v_current_product),
      updated_at = now()
  WHERE id = p_session_id;

  UPDATE public.live_products
  SET shown_at = COALESCE(shown_at, now())
  WHERE session_id = p_session_id
    AND product_id = (
      SELECT current_product_id
      FROM public.live_sessions
      WHERE id = p_session_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_hot_current_product(
  p_session_id INTEGER,
  p_product_id INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  IF NOT public.is_hot_admin() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  IF p_product_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.live_products
      WHERE session_id = p_session_id
        AND product_id = p_product_id
    ) INTO v_exists;

    IF NOT v_exists THEN
      RAISE EXCEPTION 'El producto no pertenece a la campaña';
    END IF;
  END IF;

  UPDATE public.live_sessions
  SET current_product_id = p_product_id,
      updated_at = now()
  WHERE id = p_session_id;

  IF p_product_id IS NOT NULL THEN
    UPDATE public.live_products
    SET shown_at = COALESCE(shown_at, now())
    WHERE session_id = p_session_id
      AND product_id = p_product_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_hot_product(
  p_session_id INTEGER,
  p_product_id INTEGER,
  p_order INTEGER DEFAULT 0,
  p_promo_price NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_normal NUMERIC;
BEGIN
  IF NOT public.is_hot_admin() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  IF p_order IS NULL OR p_order < 0 THEN
    RAISE EXCEPTION 'El orden no puede ser negativo';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.live_sessions WHERE id = p_session_id
  ) THEN
    RAISE EXCEPTION 'Campaña no encontrada';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.products
    WHERE id = p_product_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Producto no encontrado o inactivo';
  END IF;

  IF p_promo_price IS NOT NULL THEN
    IF p_promo_price < 0 THEN
      RAISE EXCEPTION 'El precio Hot no puede ser negativo';
    END IF;

    SELECT COALESCE(discount_price, price)
    INTO v_normal
    FROM public.products
    WHERE id = p_product_id;

    IF p_promo_price >= v_normal THEN
      RAISE EXCEPTION 'El precio Hot debe ser menor al precio normal';
    END IF;
  END IF;

  INSERT INTO public.live_products (
    session_id,
    product_id,
    "order",
    promo_price,
    updated_at
  )
  VALUES (
    p_session_id,
    p_product_id,
    p_order,
    p_promo_price,
    now()
  )
  ON CONFLICT (session_id, product_id)
  DO UPDATE SET
    "order" = EXCLUDED."order",
    promo_price = EXCLUDED.promo_price,
    updated_at = now();

  INSERT INTO public.live_session_products (live_session_id, product_id)
  VALUES (p_session_id, p_product_id)
  ON CONFLICT (live_session_id, product_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_hot_product_promo(
  p_session_id INTEGER,
  p_product_id INTEGER,
  p_promo_price NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_normal NUMERIC;
BEGIN
  IF NOT public.is_hot_admin() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  IF p_promo_price IS NOT NULL THEN
    IF p_promo_price < 0 THEN
      RAISE EXCEPTION 'El precio Hot no puede ser negativo';
    END IF;

    SELECT COALESCE(discount_price, price)
    INTO v_normal
    FROM public.products
    WHERE id = p_product_id;

    IF v_normal IS NULL THEN
      RAISE EXCEPTION 'Producto no encontrado';
    END IF;

    IF p_promo_price >= v_normal THEN
      RAISE EXCEPTION 'El precio Hot debe ser menor al precio normal';
    END IF;
  END IF;

  UPDATE public.live_products
  SET promo_price = p_promo_price,
      updated_at = now()
  WHERE session_id = p_session_id
    AND product_id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El producto no pertenece a la campaña';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_hot_product(
  p_session_id INTEGER,
  p_product_id INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_hot_admin() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.live_products
  WHERE session_id = p_session_id
    AND product_id = p_product_id;

  DELETE FROM public.live_session_products
  WHERE live_session_id = p_session_id
    AND product_id = p_product_id;

  UPDATE public.live_sessions
  SET current_product_id = NULL,
      updated_at = now()
  WHERE id = p_session_id
    AND current_product_id = p_product_id;
END;
$$;

-- Solo usuarios autenticados pueden invocar los RPCs; el helper interno
-- valida además que el perfil tenga role='admin'.
REVOKE ALL ON FUNCTION public.activate_hot_session(INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_hot_current_product(INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_hot_product(INTEGER, INTEGER, INTEGER, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_hot_product_promo(INTEGER, INTEGER, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remove_hot_product(INTEGER, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.activate_hot_session(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_hot_current_product(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_hot_product(INTEGER, INTEGER, INTEGER, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_hot_product_promo(INTEGER, INTEGER, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_hot_product(INTEGER, INTEGER) TO authenticated;
*/

-- ============================================================
-- Fix 0022: Precio Live persistente por producto y carga masiva
-- Fecha ejecución: 2026-10-26
-- Estado: EJECUTADO
-- Descripción: Agrega products.live_price para reutilizar el último
--   precio Live de cada producto, persiste ese precio al agregar o
--   editar productos de una sesión y agrega la RPC add_hot_products
--   para cargar varios productos en una sola operación.
-- ============================================================
/*
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS live_price NUMERIC(10,2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_live_price_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_live_price_check
      CHECK (live_price IS NULL OR live_price >= 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.add_hot_product(
  p_session_id INTEGER,
  p_product_id INTEGER,
  p_order INTEGER DEFAULT 0,
  p_promo_price NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_normal NUMERIC;
  v_live NUMERIC;
  v_promo NUMERIC;
BEGIN
  IF NOT public.is_hot_admin() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  IF p_order IS NULL OR p_order < 0 THEN
    RAISE EXCEPTION 'El orden no puede ser negativo';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.live_sessions WHERE id = p_session_id
  ) THEN
    RAISE EXCEPTION 'Campaña no encontrada';
  END IF;

  SELECT COALESCE(discount_price, price), live_price
  INTO v_normal, v_live
  FROM public.products
  WHERE id = p_product_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado o inactivo';
  END IF;

  IF p_promo_price IS NOT NULL THEN
    IF p_promo_price < 0 OR p_promo_price >= v_normal THEN
      RAISE EXCEPTION 'El precio Live debe ser menor al precio normal';
    END IF;
    v_promo := p_promo_price;
  ELSIF v_live IS NOT NULL AND v_live >= 0 AND v_live < v_normal THEN
    v_promo := v_live;
  ELSE
    v_promo := NULL;
  END IF;

  INSERT INTO public.live_products (
    session_id,
    product_id,
    "order",
    promo_price,
    updated_at
  )
  VALUES (
    p_session_id,
    p_product_id,
    p_order,
    v_promo,
    now()
  )
  ON CONFLICT (session_id, product_id)
  DO UPDATE SET
    "order" = EXCLUDED."order",
    promo_price = COALESCE(EXCLUDED.promo_price, live_products.promo_price),
    updated_at = now();

  INSERT INTO public.live_session_products (live_session_id, product_id)
  VALUES (p_session_id, p_product_id)
  ON CONFLICT (live_session_id, product_id) DO NOTHING;

  IF p_promo_price IS NOT NULL THEN
    UPDATE public.products
    SET live_price = p_promo_price
    WHERE id = p_product_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_hot_product_promo(
  p_session_id INTEGER,
  p_product_id INTEGER,
  p_promo_price NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_normal NUMERIC;
BEGIN
  IF NOT public.is_hot_admin() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(discount_price, price)
  INTO v_normal
  FROM public.products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado';
  END IF;

  IF p_promo_price IS NOT NULL THEN
    IF p_promo_price < 0 OR p_promo_price >= v_normal THEN
      RAISE EXCEPTION 'El precio Live debe ser menor al precio normal';
    END IF;
  END IF;

  UPDATE public.live_products
  SET promo_price = p_promo_price,
      updated_at = now()
  WHERE session_id = p_session_id
    AND product_id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El producto no pertenece a la campaña';
  END IF;

  UPDATE public.products
  SET live_price = p_promo_price
  WHERE id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_hot_products(
  p_session_id INTEGER,
  p_product_ids INTEGER[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_product_id INTEGER;
  v_normal NUMERIC;
  v_live NUMERIC;
  v_promo NUMERIC;
  v_order INTEGER;
  v_inserted INTEGER;
  v_added INTEGER := 0;
BEGIN
  IF NOT public.is_hot_admin() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.live_sessions WHERE id = p_session_id
  ) THEN
    RAISE EXCEPTION 'Campaña no encontrada';
  END IF;

  IF p_product_ids IS NULL OR cardinality(p_product_ids) = 0 THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(MAX("order"), -1)
  INTO v_order
  FROM public.live_products
  WHERE session_id = p_session_id;

  FOR v_product_id IN
    SELECT DISTINCT p.id
    FROM public.products p
    WHERE p.id = ANY(p_product_ids)
      AND p.is_active = true
    ORDER BY p.id
  LOOP
    SELECT COALESCE(discount_price, price), live_price
    INTO v_normal, v_live
    FROM public.products
    WHERE id = v_product_id;

    IF v_live IS NOT NULL AND (v_live < 0 OR v_live >= v_normal) THEN
      v_promo := NULL;
    ELSE
      v_promo := v_live;
    END IF;

    v_order := v_order + 1;

    INSERT INTO public.live_products (
      session_id,
      product_id,
      "order",
      promo_price,
      updated_at
    )
    VALUES (
      p_session_id,
      v_product_id,
      v_order,
      v_promo,
      now()
    )
    ON CONFLICT (session_id, product_id) DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    v_added := v_added + v_inserted;

    INSERT INTO public.live_session_products (live_session_id, product_id)
    VALUES (p_session_id, v_product_id)
    ON CONFLICT (live_session_id, product_id) DO NOTHING;
  END LOOP;

  RETURN v_added;
END;
$$;

REVOKE ALL ON FUNCTION public.add_hot_product(INTEGER, INTEGER, INTEGER, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_hot_product_promo(INTEGER, INTEGER, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_hot_products(INTEGER, INTEGER[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.add_hot_product(INTEGER, INTEGER, INTEGER, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_hot_product_promo(INTEGER, INTEGER, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_hot_products(INTEGER, INTEGER[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
*/

-- ============================================================
-- Fix 0023: Modo Live global permanente
-- Fecha ejecución: 2026-10-26
-- Estado: EJECUTADO
-- Descripción: Convierte Modo Live en una configuración única y
--   persistente. Reutiliza la transmisión activa o la última con
--   productos, marca una sola fila como global, conserva el catálogo
--   y permite reiniciar el Modo Live después de finalizarlo.
-- ============================================================
/*
ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN NOT NULL DEFAULT false;

DO $$
DECLARE
  v_global_id INTEGER;
  v_base_id INTEGER;
BEGIN
  SELECT id
  INTO v_global_id
  FROM public.live_sessions
  WHERE is_global = true
  ORDER BY id
  LIMIT 1;

  IF v_global_id IS NULL THEN
    SELECT s.id
    INTO v_base_id
    FROM public.live_sessions s
    WHERE s.status = 'live'
      AND (s.ends_at IS NULL OR s.ends_at > now())
    ORDER BY COALESCE(s.started_at, s.created_at) DESC, s.id DESC
    LIMIT 1;

    IF v_base_id IS NULL THEN
      SELECT s.id
      INTO v_base_id
      FROM public.live_sessions s
      WHERE EXISTS (
        SELECT 1
        FROM public.live_products lp
        WHERE lp.session_id = s.id
      )
      ORDER BY COALESCE(s.started_at, s.created_at) DESC, s.id DESC
      LIMIT 1;
    END IF;

    IF v_base_id IS NULL THEN
      SELECT s.id
      INTO v_base_id
      FROM public.live_sessions s
      ORDER BY s.created_at DESC, s.id DESC
      LIMIT 1;
    END IF;

    IF v_base_id IS NOT NULL THEN
      UPDATE public.live_sessions
      SET is_global = true,
          updated_at = now()
      WHERE id = v_base_id;

      v_global_id := v_base_id;
    ELSE
      INSERT INTO public.live_sessions (title, status, is_global)
      VALUES ('Modo Live', 'ended', true)
      RETURNING id INTO v_global_id;
    END IF;
  END IF;

  UPDATE public.live_sessions
  SET is_global = false,
      updated_at = now()
  WHERE is_global = true
    AND id <> v_global_id;

  IF NOT EXISTS (
    SELECT 1
    FROM public.live_products
    WHERE session_id = v_global_id
  ) THEN
    SELECT s.id
    INTO v_base_id
    FROM public.live_sessions s
    WHERE s.id <> v_global_id
      AND EXISTS (
        SELECT 1
        FROM public.live_products lp
        WHERE lp.session_id = s.id
      )
    ORDER BY COALESCE(s.started_at, s.created_at) DESC, s.id DESC
    LIMIT 1;

    IF v_base_id IS NOT NULL THEN
      INSERT INTO public.live_products (
        session_id,
        product_id,
        "order",
        promo_price,
        status,
        shown_at,
        updated_at
      )
      SELECT
        v_global_id,
        lp.product_id,
        lp."order",
        lp.promo_price,
        lp.status,
        lp.shown_at,
        now()
      FROM public.live_products lp
      WHERE lp.session_id = v_base_id
      ON CONFLICT (session_id, product_id) DO NOTHING;
    END IF;
  END IF;

  UPDATE public.live_sessions
  SET status = 'ended',
      ended_at = COALESCE(ended_at, now()),
      ended_reason = COALESCE(ended_reason, 'manual'),
      updated_at = now()
  WHERE status = 'live'
    AND id <> v_global_id;

  WITH ordered AS (
    SELECT
      id,
      row_number() OVER (ORDER BY "order", id) - 1 AS new_order
    FROM public.live_products
    WHERE session_id = v_global_id
  )
  UPDATE public.live_products lp
  SET "order" = ordered.new_order,
      updated_at = now()
  FROM ordered
  WHERE lp.id = ordered.id
    AND lp."order" IS DISTINCT FROM ordered.new_order;

  INSERT INTO public.live_session_products (live_session_id, product_id)
  SELECT v_global_id, product_id
  FROM public.live_products
  WHERE session_id = v_global_id
  ON CONFLICT (live_session_id, product_id) DO NOTHING;

  UPDATE public.products p
  SET live_price = lp.promo_price
  FROM public.live_products lp
  WHERE lp.session_id = v_global_id
    AND lp.product_id = p.id
    AND p.live_price IS NULL
    AND lp.promo_price IS NOT NULL
    AND lp.promo_price >= 0
    AND lp.promo_price < COALESCE(p.discount_price, p.price);

  UPDATE public.live_sessions
  SET current_product_id = CASE
        WHEN current_product_id IN (
          SELECT product_id
          FROM public.live_products
          WHERE session_id = v_global_id
        ) THEN current_product_id
        ELSE (
          SELECT product_id
          FROM public.live_products
          WHERE session_id = v_global_id
          ORDER BY "order", id
          LIMIT 1
        )
      END,
      updated_at = now()
  WHERE id = v_global_id;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_live_session_global
  ON public.live_sessions ((true))
  WHERE is_global = true;

CREATE OR REPLACE FUNCTION public.start_live_mode(
  p_session_id INTEGER,
  p_ends_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_global BOOLEAN;
  v_status TEXT;
  v_current_ends_at TIMESTAMPTZ;
  v_current_product INTEGER;
  v_has_products BOOLEAN;
BEGIN
  IF NOT public.is_hot_admin() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  IF p_ends_at IS NOT NULL AND p_ends_at <= now() THEN
    RAISE EXCEPTION 'La finalización debe ser una fecha futura';
  END IF;

  SELECT is_global, status, ends_at
  INTO v_is_global, v_status, v_current_ends_at
  FROM public.live_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Modo Live no encontrado';
  END IF;

  IF NOT v_is_global THEN
    RAISE EXCEPTION 'La configuración no es el Modo Live global';
  END IF;

  IF v_status = 'live'
     AND (v_current_ends_at IS NULL OR v_current_ends_at > now()) THEN
    RAISE EXCEPTION 'El Modo Live ya está activo';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.live_products
    WHERE session_id = p_session_id
  ) INTO v_has_products;

  IF NOT v_has_products THEN
    RAISE EXCEPTION 'Agrega al menos un producto antes de iniciar';
  END IF;

  UPDATE public.live_sessions
  SET status = 'ended',
      ended_at = now(),
      ended_reason = 'manual',
      updated_at = now()
  WHERE status = 'live'
    AND id <> p_session_id;

  SELECT product_id
  INTO v_current_product
  FROM public.live_products
  WHERE session_id = p_session_id
  ORDER BY "order", id
  LIMIT 1;

  UPDATE public.live_sessions
  SET status = 'live',
      started_at = now(),
      ends_at = p_ends_at,
      duration_hours = NULL,
      ended_at = NULL,
      ended_reason = NULL,
      current_product_id = CASE
        WHEN current_product_id IN (
          SELECT product_id
          FROM public.live_products
          WHERE session_id = p_session_id
        ) THEN current_product_id
        ELSE v_current_product
      END,
      updated_at = now()
  WHERE id = p_session_id;

  UPDATE public.live_products
  SET shown_at = COALESCE(shown_at, now())
  WHERE session_id = p_session_id
    AND product_id = (
      SELECT current_product_id
      FROM public.live_sessions
      WHERE id = p_session_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.start_live_mode(INTEGER, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_live_mode(INTEGER, TIMESTAMPTZ) TO authenticated;

NOTIFY pgrst, 'reload schema';
*/
