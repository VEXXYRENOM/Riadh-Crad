import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { consumeRateLimit } from '@/lib/api-safety';

function coordinate(value: string | null, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
}

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const latitude = coordinate(params.get('lat'), -90, 90);
  const longitude = coordinate(params.get('lng'), -180, 180);
  const radius = Math.max(500, Math.min(50_000, Math.round(Number(params.get('radius') ?? 10_000)) || 10_000));
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rate = await consumeRateLimit(`discover:${clientIp}`, 60, 60);
  if (!rate.allowed) return NextResponse.json({ success: false, message: 'Please wait before searching again.' }, { status: rate.unavailable ? 503 : 429 });

  const admin = await createSupabaseAdminClient();
  if (latitude !== null && longitude !== null) {
    const { data, error } = await admin.rpc('nearby_merchants', {
      p_latitude: latitude,
      p_longitude: longitude,
      p_radius_m: radius,
      p_limit: 30,
    });
    if (error) return NextResponse.json({ success: false, message: 'Nearby stores are temporarily unavailable.' }, { status: 503 });
    return NextResponse.json({ success: true, merchants: data ?? [], locationUsed: true });
  }

  const { data, error } = await admin
    .from('merchants')
    .select('id, name, slug, logo_url, cover_image_url, description, address, latitude, longitude')
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ success: false, message: 'Stores are temporarily unavailable.' }, { status: 503 });
  return NextResponse.json({ success: true, merchants: data ?? [], locationUsed: false });
}
