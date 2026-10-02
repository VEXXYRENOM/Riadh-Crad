-- RIADH CARD — Scale and reliability hardening
-- Apply this migration in the Supabase SQL Editor before deploying the related API code.

-- These indexes cover the queries used by the dashboard, customer wallet, NFC flow,
-- transaction history, notifications, and campaign history.
CREATE INDEX IF NOT EXISTS loyalty_cards_merchant_updated_idx
  ON public.loyalty_cards (merchant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS loyalty_cards_merchant_active_idx
  ON public.loyalty_cards (merchant_id, customer_id) WHERE is_blocked = false;
CREATE INDEX IF NOT EXISTS transactions_card_created_idx
  ON public.transactions (loyalty_card_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_merchant_created_idx
  ON public.transactions (merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS nfc_events_merchant_status_created_idx
  ON public.nfc_events (merchant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS campaigns_merchant_sent_idx
  ON public.campaigns (merchant_id, sent_at DESC);

-- Shared, atomic rate-limit buckets. Unlike an in-memory limiter, these limits
-- remain correct when the app is running on many server instances.
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  bucket text PRIMARY KEY CHECK (char_length(bucket) BETWEEN 1 AND 220),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_rate_limits_updated_idx
  ON public.api_rate_limits (updated_at);
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(
  p_bucket text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_window_start timestamptz;
BEGIN
  IF p_bucket IS NULL OR char_length(p_bucket) < 1 OR char_length(p_bucket) > 220
    OR p_max_requests < 1 OR p_max_requests > 100000 OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate-limit parameters';
  END IF;

  INSERT INTO public.api_rate_limits AS limits (bucket, window_started_at, request_count, updated_at)
  VALUES (p_bucket, v_now, 1, v_now)
  ON CONFLICT (bucket) DO UPDATE
  SET
    window_started_at = CASE
      WHEN limits.window_started_at <= v_now - make_interval(secs => p_window_seconds) THEN v_now
      ELSE limits.window_started_at
    END,
    request_count = CASE
      WHEN limits.window_started_at <= v_now - make_interval(secs => p_window_seconds) THEN 1
      ELSE limits.request_count + 1
    END,
    updated_at = v_now
  WHERE limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
     OR limits.request_count < p_max_requests
  RETURNING window_started_at INTO v_window_start;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(text, integer, integer) TO service_role;

-- Retain only recent buckets. Run this daily from a trusted scheduled job if desired.
CREATE OR REPLACE FUNCTION public.purge_expired_api_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.api_rate_limits WHERE updated_at < now() - interval '7 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_api_rate_limits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_api_rate_limits() TO service_role;
