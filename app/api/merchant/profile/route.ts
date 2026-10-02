import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { syncGoogleWalletMerchantClass } from '@/lib/google-wallet';

const MAX_TEXT_LENGTH = 500;

type ProfilePayload = {
  name?: unknown;
  description?: unknown;
  phone?: unknown;
  address?: unknown;
  welcome_message?: unknown;
  points_per_dinar?: unknown;
  tier_silver_min?: unknown;
  tier_gold_min?: unknown;
  tier_platinum_min?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  proximity_enabled?: unknown;
  proximity_radius_m?: unknown;
};

function text(value: unknown, max = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, max) : null;
}

function positiveNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function coordinate(value: unknown, minimum: number, maximum: number) {
  if (value === null || value === '' || value === undefined) return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : undefined;
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as ProfilePayload;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const pointsPerDinar = positiveNumber(body.points_per_dinar);
    const silver = positiveNumber(body.tier_silver_min);
    const gold = positiveNumber(body.tier_gold_min);
    const platinum = positiveNumber(body.tier_platinum_min);
    const name = text(body.name, 100);
    const latitude = coordinate(body.latitude, -90, 90);
    const longitude = coordinate(body.longitude, -180, 180);
    const radius = body.proximity_radius_m === undefined ? 100 : Math.round(Number(body.proximity_radius_m));
    const proximityEnabled = body.proximity_enabled === undefined ? true : body.proximity_enabled === true;

    if (!name || !pointsPerDinar || !silver || !gold || !platinum || !(silver < gold && gold < platinum)
      || latitude === undefined || longitude === undefined || (latitude === null) !== (longitude === null)
      || !Number.isInteger(radius) || radius < 50 || radius > 1000) {
      return NextResponse.json({
        success: false,
        message: 'Please enter a store name, a positive points rate, and ascending tier thresholds.',
      }, { status: 400 });
    }

    const { data: merchant, error } = await supabase
      .from('merchants')
      .update({
        name,
        description: text(body.description),
        phone: text(body.phone, 40),
        address: text(body.address, 250),
        welcome_message: text(body.welcome_message),
        points_per_dinar: pointsPerDinar,
        tier_silver_min: Math.round(silver),
        tier_gold_min: Math.round(gold),
        tier_platinum_min: Math.round(platinum),
        latitude,
        longitude,
        proximity_enabled: proximityEnabled,
        proximity_radius_m: radius,
      })
      .eq('owner_id', user.id)
      .select('*')
      .single();

    if (error || !merchant) {
      return NextResponse.json({ success: false, message: error?.message ?? 'Store profile was not found.' }, { status: 400 });
    }

    // The profile write is authoritative; a temporary Google outage must not block it.
    void syncGoogleWalletMerchantClass(merchant.id);

    return NextResponse.json({ success: true, merchant });
  } catch (error) {
    console.error('[PATCH /api/merchant/profile]', error);
    return NextResponse.json({ success: false, message: 'Unable to save your store profile.' }, { status: 500 });
  }
}
