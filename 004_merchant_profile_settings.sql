-- RIADH CARD — Merchant public profile and media
-- Run this migration in the Supabase SQL editor before deploying the settings page.

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS welcome_message text;

-- Public bucket: images are intentionally viewable from each public loyalty card.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-media',
  'merchant-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Uploads are performed only by the protected server route using the service role.
-- The public read policy lets the customer PWA render a merchant's storefront image.
DROP POLICY IF EXISTS "Public can view merchant media" ON storage.objects;
CREATE POLICY "Public can view merchant media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'merchant-media');
