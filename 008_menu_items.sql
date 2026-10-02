-- RIADH CARD — Merchant menu and fixed-point rewards
-- Run this migration in the Supabase SQL editor before using the menu feature.

CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  description text,
  ingredients text[] NOT NULL DEFAULT '{}',
  price_tnd numeric(10, 3) NOT NULL CHECK (price_tnd >= 0),
  reward_points integer NOT NULL CHECK (reward_points > 0),
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS menu_items_merchant_available_order_idx
  ON public.menu_items (merchant_id, is_available, sort_order, created_at);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view available menu items" ON public.menu_items;
CREATE POLICY "Public can view available menu items"
  ON public.menu_items FOR SELECT
  USING (is_available = true);

DROP POLICY IF EXISTS "Merchant owners manage their menu" ON public.menu_items;
CREATE POLICY "Merchant owners manage their menu"
  ON public.menu_items FOR ALL
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid()));

-- Redeems exactly the point value configured for a menu item.  The item and
-- customer card are locked, preventing a client from submitting a forged price.
CREATE OR REPLACE FUNCTION public.redeem_menu_item(
  p_merchant_id uuid,
  p_customer_id uuid,
  p_menu_item_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.menu_items%ROWTYPE;
  v_card public.loyalty_cards%ROWTYPE;
  v_new_total integer;
  v_transaction_id uuid;
BEGIN
  SELECT * INTO v_item
  FROM public.menu_items
  WHERE id = p_menu_item_id AND merchant_id = p_merchant_id AND is_available = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'ITEM_UNAVAILABLE', 'message', 'This menu item is no longer available.');
  END IF;

  SELECT * INTO v_card
  FROM public.loyalty_cards
  WHERE merchant_id = p_merchant_id AND customer_id = p_customer_id AND is_blocked = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'CARD_NOT_FOUND', 'message', 'No active loyalty card was found.');
  END IF;

  IF v_card.total_points < v_item.reward_points THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INSUFFICIENT_POINTS', 'message', 'You do not have enough points for this item.');
  END IF;

  v_new_total := v_card.total_points - v_item.reward_points;

  UPDATE public.loyalty_cards
  SET total_points = v_new_total, updated_at = now()
  WHERE id = v_card.id;

  INSERT INTO public.transactions (
    loyalty_card_id, merchant_id, customer_id, points_added, points_redeemed,
    amount_spent, source, note
  ) VALUES (
    v_card.id, p_merchant_id, p_customer_id, 0, v_item.reward_points,
    NULL, 'REDEMPTION', 'Menu reward: ' || v_item.name
  ) RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'points_redeemed', v_item.reward_points,
    'total_points', v_new_total,
    'current_tier', v_card.current_tier,
    'merchant_name', (SELECT name FROM public.merchants WHERE id = p_merchant_id),
    'menu_item_name', v_item.name,
    'redeemed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_menu_item(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_menu_item(uuid, uuid, uuid) TO service_role;
