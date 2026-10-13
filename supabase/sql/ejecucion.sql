-- ESTADO: PENDIENTE
-- ============================================================
-- LIZ STORE — Archivo de Ejecución SQL
-- ============================================================

-- Fix 0020: Link de grupo de WhatsApp configurable desde el admin
-- Crea la fila con platform 'whatsapp_group' en social_links.
-- Luego se edita su URL desde Admin > Redes Sociales.
INSERT INTO social_links (platform, label, url, is_active)
VALUES ('whatsapp_group', 'Grupo de WhatsApp', '', true)
ON CONFLICT (platform) DO NOTHING;