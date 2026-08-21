-- ESTADO: PENDIENTE
-- ============================================================
-- LIZ STORE — Archivo de Ejecución SQL
-- ============================================================

-- RPC: increment_session_interested
-- Usado por lib/live.ts:trackInterest() cuando action es add_cart o checkout
CREATE OR REPLACE FUNCTION increment_session_interested(session_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE live_sessions
  SET total_interested = total_interested + 1,
      updated_at = now()
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: increment_session_shown
-- Usado por lib/live.ts:trackInterest() cuando action es view
CREATE OR REPLACE FUNCTION increment_session_shown(session_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE live_sessions
  SET total_products_shown = total_products_shown + 1,
      updated_at = now()
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
