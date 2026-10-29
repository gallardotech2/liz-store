-- ESTADO: PENDIENTE
-- ============================================================
-- LIZ STORE — Archivo de Ejecución SQL
-- ============================================================

-- Fix 0025: URL de la transmisión del Modo Live
ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS live_url TEXT;

ALTER TABLE public.live_sessions
  DROP CONSTRAINT IF EXISTS live_sessions_live_url_https_check;

ALTER TABLE public.live_sessions
  ADD CONSTRAINT live_sessions_live_url_https_check
  CHECK (live_url IS NULL OR live_url ~ '^https://');

COMMENT ON COLUMN public.live_sessions.live_url
  IS 'URL https de la transmisión usada por Abrir Live en la vista pública';

NOTIFY pgrst, 'reload schema';
