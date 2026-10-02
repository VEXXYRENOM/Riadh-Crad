-- Migration to add image_url to menu_items table
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update the comments
COMMENT ON COLUMN public.menu_items.image_url IS 'URL to an image for this menu item, usually stored in Supabase Storage or external.';
