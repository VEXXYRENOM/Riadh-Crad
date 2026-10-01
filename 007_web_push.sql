CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, endpoint)
);
CREATE INDEX IF NOT EXISTS push_subscriptions_customer_idx ON public.push_subscriptions (customer_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
