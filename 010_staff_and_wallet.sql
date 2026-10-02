-- RIADH CARD — Merchant staff access
-- Apply after 009_scale_hardening.sql.

CREATE TABLE IF NOT EXISTS public.merchant_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (email = lower(trim(email)) AND char_length(email) BETWEEN 3 AND 320),
  auth_uid uuid,
  role text NOT NULL DEFAULT 'CASHIER' CHECK (role IN ('CASHIER', 'MANAGER')),
  status text NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED')),
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, email)
);

CREATE UNIQUE INDEX IF NOT EXISTS merchant_staff_active_user_per_merchant_idx
  ON public.merchant_staff (merchant_id, auth_uid) WHERE auth_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS merchant_staff_auth_active_idx
  ON public.merchant_staff (auth_uid, status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS merchant_staff_merchant_status_idx
  ON public.merchant_staff (merchant_id, status);

ALTER TABLE public.merchant_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchant owners manage staff" ON public.merchant_staff;
CREATE POLICY "Merchant owners manage staff"
  ON public.merchant_staff FOR ALL
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Staff can view their own access" ON public.merchant_staff;
CREATE POLICY "Staff can view their own access"
  ON public.merchant_staff FOR SELECT
  USING (auth_uid = auth.uid());

-- Resolves the authenticated user's access without exposing staff records to the client.
CREATE OR REPLACE FUNCTION public.merchant_access_role(p_merchant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.merchants WHERE id = p_merchant_id AND owner_id = auth.uid()) THEN 'OWNER'
    WHEN EXISTS (
      SELECT 1 FROM public.merchant_staff
      WHERE merchant_id = p_merchant_id AND auth_uid = auth.uid() AND status = 'ACTIVE'
    ) THEN (SELECT role FROM public.merchant_staff WHERE merchant_id = p_merchant_id AND auth_uid = auth.uid() AND status = 'ACTIVE' LIMIT 1)
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION public.merchant_access_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merchant_access_role(uuid) TO authenticated, service_role;
