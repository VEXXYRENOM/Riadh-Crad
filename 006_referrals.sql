-- RIADH CARD — Referral programme
-- Rewards are issued only after the invitee's first points-earning purchase.

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS referral_reward_points integer NOT NULL DEFAULT 100
  CHECK (referral_reward_points > 0 AND referral_reward_points <= 10000);

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  code text NOT NULL CHECK (code ~ '^[A-Z0-9]{8}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, customer_id),
  UNIQUE (merchant_id, code)
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  referrer_customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  referred_customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referrals_not_self CHECK (referrer_customer_id <> referred_customer_id),
  UNIQUE (merchant_id, referred_customer_id)
);

CREATE INDEX IF NOT EXISTS referrals_pending_invitee_idx
  ON public.referrals (merchant_id, referred_customer_id) WHERE status = 'PENDING';

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.complete_referral_after_first_purchase(
  p_merchant_id uuid,
  p_referred_customer_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referral public.referrals%ROWTYPE;
  v_reward integer;
  v_points_per_dinar numeric;
  v_referrer_result jsonb;
  v_referred_result jsonb;
BEGIN
  SELECT * INTO v_referral FROM public.referrals
  WHERE merchant_id = p_merchant_id AND referred_customer_id = p_referred_customer_id AND status = 'PENDING'
  FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('completed', false, 'reason', 'NO_PENDING_REFERRAL'); END IF;

  SELECT referral_reward_points, points_per_dinar INTO v_reward, v_points_per_dinar
  FROM public.merchants WHERE id = p_merchant_id;
  IF v_points_per_dinar IS NULL OR v_points_per_dinar <= 0 THEN RAISE EXCEPTION 'Invalid points-per-dinar configuration'; END IF;

  SELECT to_jsonb(public.award_points(p_merchant_id, v_referral.referrer_customer_id, v_reward::numeric / v_points_per_dinar, NULL, 'ADJUSTMENT', 'Referral reward: friend completed their first purchase')) INTO v_referrer_result;
  SELECT to_jsonb(public.award_points(p_merchant_id, v_referral.referred_customer_id, v_reward::numeric / v_points_per_dinar, NULL, 'ADJUSTMENT', 'Referral reward: first purchase completed')) INTO v_referred_result;

  UPDATE public.referrals SET status = 'COMPLETED', completed_at = now() WHERE id = v_referral.id;
  RETURN jsonb_build_object('completed', true, 'referral_id', v_referral.id, 'reward_points', v_reward, 'referrer_result', v_referrer_result, 'referred_result', v_referred_result);
END;
$$;
