-- ESTADO: ejecutado 
-- ============================================================
-- LIZ STORE — Archivo de Ejecución SQL
-- ============================================================

-- Fix 0014: Crear tabla social_links para URLs de redes desde admin
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
  ('whatsapp', 'WhatsApp', 'https://wa.me/591XXXXXXXX'),
  ('tiktok', 'TikTok', 'https://tiktok.com/@lizstore')
ON CONFLICT (platform) DO NOTHING;
