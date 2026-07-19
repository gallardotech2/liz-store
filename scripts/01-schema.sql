-- =============================================================================
-- Liz Store — Schema SQL para Supabase
-- Migrado desde modelos Django por model-migrator agent
-- Fecha: 2026-07-16
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tabla: profiles
-- Origen: apps.users.models.User (AbstractUser)
-- Nota: auth.users lo maneja Supabase Auth. profiles almacena campos extra.
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT DEFAULT '',
  avatar TEXT,
  is_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Perfiles de usuario — campos extra de User (AbstractUser)';

-- ---------------------------------------------------------------------------
-- Tabla: addresses
-- Origen: apps.users.models.Address
-- ---------------------------------------------------------------------------
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  colony TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  references TEXT DEFAULT '',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE addresses IS 'Direcciones de envío de usuarios';

CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- ---------------------------------------------------------------------------
-- Tabla: categories
-- Origen: apps.categories.models.Category
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE categories IS 'Categorías de productos';

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active_order ON categories(is_active, "order");

-- ---------------------------------------------------------------------------
-- Tabla: products
-- Origen: apps.products.models.Product
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE products IS 'Productos del catálogo';

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_active_featured ON products(is_active, is_featured);

-- ---------------------------------------------------------------------------
-- Tabla: product_images
-- Origen: apps.products.models.ProductImage
-- Nota: thumbnail, medium, large eran ImageSpecField (derivados, no columnas)
-- ---------------------------------------------------------------------------
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image TEXT NOT NULL,
  alt_text TEXT DEFAULT '',
  is_main BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE product_images IS 'Imágenes de productos';

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_main ON product_images(product_id, is_main);

-- ---------------------------------------------------------------------------
-- Tabla: orders
-- Origen: apps.orders.models.Order
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_key TEXT,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'paid', 'preparing', 'shipped', 'delivered',
    'completed', 'cancelled', 'refunded'
  )),
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

COMMENT ON TABLE orders IS 'Pedidos de clientes';

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- ---------------------------------------------------------------------------
-- Tabla: order_items
-- Origen: apps.orders.models.OrderItem
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE order_items IS 'Artículos individuales de un pedido';

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ---------------------------------------------------------------------------
-- Tabla: transactions
-- Origen: apps.payments.models.Transaction
-- ---------------------------------------------------------------------------
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN (
    'held', 'released', 'refunded', 'cancelled'
  )),
  payment_method TEXT DEFAULT 'card',
  transaction_id TEXT DEFAULT '',
  held_at TIMESTAMPTZ DEFAULT now(),
  released_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE transactions IS 'Transacciones del procesador Escudo Pago';

CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- ---------------------------------------------------------------------------
-- Tabla: payment_methods
-- Origen: apps.payments.models.PaymentMethod
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE payment_methods IS 'Métodos de pago disponibles';

-- ---------------------------------------------------------------------------
-- Tabla: qr_payments
-- Origen: apps.payments.models.QRPayment
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE qr_payments IS 'Configuraciones QR para métodos de pago';

CREATE INDEX idx_qr_payments_payment_method_id ON qr_payments(payment_method_id);

-- ---------------------------------------------------------------------------
-- Tabla: reviews
-- Origen: apps.reviews.models.Review
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE reviews IS 'Reseñas de productos';

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- ---------------------------------------------------------------------------
-- Tabla: review_images
-- Origen: apps.reviews.models.ReviewImage
-- ---------------------------------------------------------------------------
CREATE TABLE review_images (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE review_images IS 'Imágenes adjuntas a reseñas';

CREATE INDEX idx_review_images_review_id ON review_images(review_id);

-- ---------------------------------------------------------------------------
-- Tabla: store_profiles
-- Origen: apps.live_tools.models.StoreProfile
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE store_profiles IS 'Perfil de la tienda para lives';

-- ---------------------------------------------------------------------------
-- Tabla: live_sessions
-- Origen: apps.live_tools.models.LiveSession
-- Nota: ManyToManyField products se resuelve en live_session_products
--       duration (DurationField) se calcula, no se persiste como INTERVAL
-- ---------------------------------------------------------------------------
CREATE TABLE live_sessions (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES store_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'live', 'paused', 'ended'
  )),
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

COMMENT ON TABLE live_sessions IS 'Sesiones de live shopping';

CREATE INDEX idx_live_sessions_store_id ON live_sessions(store_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);

-- ---------------------------------------------------------------------------
-- Tabla: live_session_products (junction M2M)
-- Origen: apps.live_tools.models.LiveSession.products (ManyToManyField)
-- ---------------------------------------------------------------------------
CREATE TABLE live_session_products (
  live_session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (live_session_id, product_id)
);

COMMENT ON TABLE live_session_products IS 'Relación M2M entre sesiones live y productos';

-- ---------------------------------------------------------------------------
-- Tabla: live_products
-- Origen: apps.live_tools.models.LiveProduct
-- ---------------------------------------------------------------------------
CREATE TABLE live_products (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN (
    'available', 'requested', 'reserved', 'sold'
  )),
  "order" INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE live_products IS 'Productos mostrados en una sesión live';

CREATE INDEX idx_live_products_session_id ON live_products(session_id);

-- ---------------------------------------------------------------------------
-- Tabla: product_interests
-- Origen: apps.live_tools.models.ProductInterest
-- ---------------------------------------------------------------------------
CREATE TABLE product_interests (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('whatsapp', 'view', 'add_cart', 'checkout')),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE product_interests IS 'Interacciones de usuarios con productos en live';

CREATE INDEX idx_product_interests_session_id ON product_interests(session_id);
CREATE INDEX idx_product_interests_product_id ON product_interests(product_id);
