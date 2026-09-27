-- ==========================================
-- RIADH CARD — Demo Data Seed
-- ==========================================

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create a dummy merchant user in auth.users
-- Email: admin@demo.com
-- Password: password123
INSERT INTO auth.users (
  id, 
  instance_id, 
  aud, 
  role, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  raw_app_meta_data, 
  raw_user_meta_data, 
  created_at, 
  updated_at, 
  confirmation_token, 
  email_change, 
  email_change_token_new, 
  recovery_token
) 
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000000', 
  'authenticated', 
  'authenticated', 
  'admin@demo.com', 
  crypt('password123', gen_salt('bf')), 
  now(), 
  '{"provider":"email","providers":["email"]}', 
  '{}', 
  now(), 
  now(), 
  '', 
  '', 
  '', 
  ''
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create the 'Demo Cafe' merchant account linked to the user above
INSERT INTO public.merchants (
  id, 
  owner_id, 
  name, 
  slug, 
  points_per_dinar
)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  '00000000-0000-0000-0000-000000000000', 
  'Demo Cafe', 
  'demo-cafe', 
  1
)
ON CONFLICT (slug) DO NOTHING;

-- 4. Create a dummy customer
INSERT INTO public.customers (
  id,
  phone,
  full_name
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '+21655555555',
  'Tariq Al-Fasi'
)
ON CONFLICT (phone) DO NOTHING;

-- 5. Create a loyalty card for the customer at Demo Cafe
INSERT INTO public.loyalty_cards (
  id,
  customer_id,
  merchant_id,
  total_points,
  lifetime_points,
  current_tier
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  4250,
  4250,
  'GOLD'
)
ON CONFLICT ON CONSTRAINT loyalty_cards_unique_pair DO NOTHING;
