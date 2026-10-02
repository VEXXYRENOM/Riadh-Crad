-- RIADH CARD — Merchant locations, nearby discovery, and proximity reminders.
-- Apply after the previous migrations.

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS latitude numeric(9, 6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9, 6),
  ADD COLUMN IF NOT EXISTS proximity_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS proximity_radius_m integer NOT NULL DEFAULT 100;

ALTER TABLE public.merchants
  DROP CONSTRAINT IF EXISTS merchants_latitude_range,
  DROP CONSTRAINT IF EXISTS merchants_longitude_range,
  DROP CONSTRAINT IF EXISTS merchants_proximity_radius_range,
  DROP CONSTRAINT IF EXISTS merchants_location_pair;

ALTER TABLE public.merchants
  ADD CONSTRAINT merchants_latitude_range CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT merchants_longitude_range CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  ADD CONSTRAINT merchants_proximity_radius_range CHECK (proximity_radius_m BETWEEN 50 AND 1000),
  ADD CONSTRAINT merchants_location_pair CHECK ((latitude IS NULL) = (longitude IS NULL));

CREATE INDEX IF NOT EXISTS merchants_discovery_coordinates_idx
  ON public.merchants (latitude, longitude)
  WHERE is_active = true AND proximity_enabled = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Uses a bounding box before the Haversine calculation, so nearby lookups stay
-- efficient without requiring PostGIS. Results deliberately contain public store data only.
CREATE OR REPLACE FUNCTION public.nearby_merchants(
  p_latitude numeric,
  p_longitude numeric,
  p_radius_m integer DEFAULT 10000,
  p_limit integer DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  cover_image_url text,
  description text,
  address text,
  latitude numeric,
  longitude numeric,
  distance_m integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      greatest(50, least(p_radius_m, 50000))::numeric AS radius_m,
      greatest(1, least(p_limit, 50))::integer AS result_limit,
      greatest(0.00001, greatest(50, least(p_radius_m, 50000)) / 111320.0)::numeric AS lat_delta,
      greatest(0.00001, greatest(50, least(p_radius_m, 50000)) / (111320.0 * greatest(0.1, cos(radians(p_latitude)))))::numeric AS lng_delta
  ), candidates AS (
    SELECT m.*,
      6371000 * acos(least(1.0, greatest(-1.0,
        cos(radians(p_latitude)) * cos(radians(m.latitude)) * cos(radians(m.longitude) - radians(p_longitude))
        + sin(radians(p_latitude)) * sin(radians(m.latitude))
      ))) AS raw_distance_m
    FROM public.merchants m CROSS JOIN bounds b
    WHERE m.is_active = true
      AND m.proximity_enabled = true
      AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL
      AND m.latitude BETWEEN p_latitude - b.lat_delta AND p_latitude + b.lat_delta
      AND m.longitude BETWEEN p_longitude - b.lng_delta AND p_longitude + b.lng_delta
  )
  SELECT c.id, c.name, c.slug, c.logo_url, c.cover_image_url, c.description, c.address,
    c.latitude, c.longitude, round(c.raw_distance_m)::integer AS distance_m
  FROM candidates c CROSS JOIN bounds b
  WHERE c.raw_distance_m <= b.radius_m
  ORDER BY c.raw_distance_m ASC
  LIMIT (SELECT result_limit FROM bounds);
$$;

REVOKE ALL ON FUNCTION public.nearby_merchants(numeric, numeric, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nearby_merchants(numeric, numeric, integer, integer) TO service_role;
