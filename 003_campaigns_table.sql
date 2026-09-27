-- ==========================================
-- RIADH CARD — Migration 003: Campaigns Table
-- ==========================================
-- Run this in your Supabase SQL Editor.
-- Creates the campaigns table for storing
-- merchant marketing campaign history.

CREATE TABLE IF NOT EXISTS public.campaigns (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id      uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  title            text NOT NULL,
  message          text NOT NULL,
  type             text NOT NULL DEFAULT 'ANNOUNCEMENT'
                   CHECK (type IN ('PROMOTION', 'REMINDER', 'EVENT', 'ANNOUNCEMENT')),
  recipient_count  integer NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'SENT'
                   CHECK (status IN ('DRAFT', 'SENT', 'FAILED')),
  sent_at          timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for fast merchant lookups
CREATE INDEX IF NOT EXISTS campaigns_merchant_id_idx ON public.campaigns(merchant_id);
CREATE INDEX IF NOT EXISTS campaigns_sent_at_idx ON public.campaigns(sent_at DESC);

-- RLS Policies
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Only the merchant owner can read/write their campaigns
DROP POLICY IF EXISTS "Merchant owner can manage campaigns" ON public.campaigns;
CREATE POLICY "Merchant owner can manage campaigns"
  ON public.campaigns
  FOR ALL
  USING (
    merchant_id IN (
      SELECT id FROM public.merchants
      WHERE owner_id = auth.uid()
    )
  );

-- Service role (admin) can do everything (for API routes)
DROP POLICY IF EXISTS "Service role full access to campaigns" ON public.campaigns;
CREATE POLICY "Service role full access to campaigns"
  ON public.campaigns
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
