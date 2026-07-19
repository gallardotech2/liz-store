-- =============================================================================
-- Liz Store — Seed Data
-- Datos de ejemplo replicando el proyecto Django
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Categorías
-- ---------------------------------------------------------------------------
INSERT INTO categories (name, slug, description, icon, is_active, "order") VALUES
  ('Anillos', 'anillos', 'Anillos de compromiso, matrimonio y moda', 'fas fa-ring', true, 1),
  ('Collares', 'collares', 'Collares y gargantillas', 'fas fa-gem', true, 2),
  ('Pulseras', 'pulseras', 'Pulseras y tobilleras', 'fas fa-braille', true, 3),
  ('Aretes', 'aretes', 'Aretes y pendientes', 'fas fa-earrings', true, 4),
  ('Dijes', 'dijes', 'Dijes y colgantes', 'fas fa-star', true, 5),
  ('Sets', 'sets', 'Juegos de joyería', 'fas fa-crown', true, 6);

-- ---------------------------------------------------------------------------
-- Productos
-- ---------------------------------------------------------------------------
INSERT INTO products (name, slug, sku, category_id, price, discount_price, stock, short_description, long_description, specifications, is_active, is_featured, is_new, rating, rating_count, sales_count, meta_description, meta_keywords) VALUES
  (
    'Anillo de Compromiso Solitario',
    'anillo-compromiso-solitario',
    'ESC-2026-000001',
    1,
    5999.00,
    4999.00,
    10,
    'Anillo con diamante solitario en oro blanco',
    'Elegante anillo de compromiso con diamante solitario montado en oro blanco de 14k. Certificado de autenticidad incluido.',
    '{"material": "Oro blanco 14k", "piedra": "Diamante", "quilates": "0.5ct", "talla": "Ajustable"}',
    true, true, true, 4.80, 24, 15,
    'Anillo de compromiso con diamante solitario en oro blanco 14k',
    'anillo, compromiso, diamante, oro blanco'
  ),
  (
    'Collar de Perlas Naturales',
    'collar-perlas-naturales',
    'ESC-2026-000002',
    2,
    3499.00,
    NULL,
    15,
    'Collar de perlas naturales de agua dulce',
    'Collar de perlas naturales de agua dulce con cierre de plata ley 925. Cada perla es seleccionada a mano.',
    '{"material": "Perla agua dulce", "cierre": "Plata 925", "largo": "45cm", "tipo_perla": "Blanca"}',
    true, true, false, 4.50, 18, 22,
    'Collar de perlas naturales de agua dulce con cierre de plata',
    'collar, perlas, agua dulce, plata'
  ),
  (
    'Pulsera de Oro Rosa',
    'pulsera-oro-rosa',
    'ESC-2026-000003',
    3,
    2499.00,
    1999.00,
    20,
    'Pulsera delicada de oro rosa 14k',
    'Pulsera delicada de oro rosa 14k con dije de corazón. Ideal para regalo.',
    '{"material": "Oro rosa 14k", "largo": "18cm", "dije": "Corazón", "tipo_cadena": "Grano de arroz"}',
    true, true, false, 4.60, 12, 30,
    'Pulsera delicada de oro rosa 14k con dije de corazón',
    'pulsera, oro rosa, corazon, cadena'
  ),
  (
    'Aretes de Plata con Zafiro',
    'aretes-plata-zafiro',
    'ESC-2026-000004',
    4,
    1899.00,
    NULL,
    8,
    'Aretes de plata 925 con zafiro azul',
    'Aretes de plata ley 925 con zafiro azul natural talla ovalada. Incluye estuche de regalo.',
    '{"material": "Plata 925", "piedra": "Zafiro azul", "talla_piedra": "Ovalada 6x4mm", "tipo_cierre": "Palomilla"}',
    true, false, true, 4.90, 6, 8,
    'Aretes de plata 925 con zafiro azul natural',
    'aretes, plata, zafiro, azul'
  ),
  (
    'Dije de Estrella con Rubí',
    'dije-estrella-rubi',
    'ESC-2026-000005',
    5,
    1299.00,
    999.00,
    25,
    'Dije de estrella con rubí en oro amarillo',
    'Dije de estrella en oro amarillo 10k con rubí sintético al centro. Incluye cadena de regalo.',
    '{"material": "Oro amarillo 10k", "piedra": "Rubí sintético", "medidas": "1.5cm", "incluye_cadena": true}',
    true, false, false, 4.30, 9, 18,
    'Dije de estrella con rubí en oro amarillo',
    'dije, estrella, rubi, oro amarillo'
  ),
  (
    'Set de Joyería Completo',
    'set-joyeria-completo',
    'ESC-2026-000006',
    6,
    8999.00,
    7499.00,
    5,
    'Set completo: collar, aretes y pulsera',
    'Set completo de joyería en oro blanco 14k con circonitas. Incluye collar, aretes y pulsera en estuche de lujo.',
    '{"material": "Oro blanco 14k", "incluye": ["Collar 40cm", "Aretes", "Pulsera 17cm"], "piedra": "Circonita cúbica", "estuche": "Lujo"}',
    true, true, true, 5.00, 3, 5,
    'Set de joyería completo oro blanco con circonitas',
    'set, joyeria, oro blanco, circonitas'
  );

-- ---------------------------------------------------------------------------
-- Métodos de pago
-- ---------------------------------------------------------------------------
INSERT INTO payment_methods (name, code, description, icon, is_active, "order", config) VALUES
  ('Escudo Pago', 'escudo_pago', 'Pago seguro con Escudo Pago — retención y liberación contra entrega', 'fas fa-shield-alt', true, 1, '{"type": "escudo_pago", "commission_rate": "3.5"}'),
  ('Pago Directo', 'pago_directo', 'Transferencia bancaria directa o depósito', 'fas fa-university', true, 2, '{"type": "pago_directo", "bank": "Banco Nacional"}'),
  ('Pago en Efectivo', 'efectivo', 'Pago en efectivo contra entrega', 'fas fa-money-bill-wave', true, 3, '{"type": "cash"}');

-- ---------------------------------------------------------------------------
-- Perfil de tienda
-- ---------------------------------------------------------------------------
INSERT INTO store_profiles (name, followers, likes, rating, reviews_count, customers_served, account_name, account_number, bank_name) VALUES
  ('Liz Store', 15420, 89300, 4.8, 1240, 3680, 'Elizabeth López', '1234-5678-9012-3456', 'Banco Nacional');
