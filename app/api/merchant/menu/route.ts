import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type MenuPayload = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  ingredients?: unknown;
  price_tnd?: unknown;
  reward_points?: unknown;
  is_available?: unknown;
  sort_order?: unknown;
};

const asText = (value: unknown, max: number, required = false) => {
  if (typeof value !== 'string') return required ? null : null;
  const cleaned = value.trim().slice(0, max);
  return cleaned || null;
};

const asNumber = (value: unknown, integer = false) => {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number < 0 || (integer && !Number.isInteger(number))) return null;
  return number;
};

async function getOwnedMerchant() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, merchant: null };
  const { data: merchant } = await supabase.from('merchants').select('id').eq('owner_id', user.id).maybeSingle();
  return { supabase, merchant };
}

function parseMenuPayload(body: MenuPayload) {
  const name = asText(body.name, 120, true);
  const price = asNumber(body.price_tnd);
  const points = asNumber(body.reward_points, true);
  const ingredients = Array.isArray(body.ingredients)
    ? body.ingredients.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 20)
    : [];

  if (!name || price === null || points === null || points < 1) return null;

  return {
    name,
    description: asText(body.description, 500),
    ingredients,
    price_tnd: Math.round(price * 1000) / 1000,
    reward_points: points,
    is_available: body.is_available !== false,
    sort_order: asNumber(body.sort_order, true) ?? 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, merchant } = await getOwnedMerchant();
    if (!merchant) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const values = parseMenuPayload((await request.json()) as MenuPayload);
    if (!values) return NextResponse.json({ success: false, message: 'Enter a name, a valid price, and at least 1 reward point.' }, { status: 400 });

    const { data, error } = await supabase.from('menu_items').insert({ ...values, merchant_id: merchant.id }).select('*').single();
    if (error || !data) return NextResponse.json({ success: false, message: error?.message ?? 'Could not add the menu item.' }, { status: 400 });
    return NextResponse.json({ success: true, item: data }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/merchant/menu]', error);
    return NextResponse.json({ success: false, message: 'Could not add the menu item.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, merchant } = await getOwnedMerchant();
    if (!merchant) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const body = (await request.json()) as MenuPayload;
    const id = typeof body.id === 'string' ? body.id : null;
    const values = parseMenuPayload(body);
    if (!id || !values) return NextResponse.json({ success: false, message: 'Enter a name, a valid price, and at least 1 reward point.' }, { status: 400 });

    const { data, error } = await supabase.from('menu_items').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).eq('merchant_id', merchant.id).select('*').maybeSingle();
    if (error || !data) return NextResponse.json({ success: false, message: error?.message ?? 'Menu item not found.' }, { status: 400 });
    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error('[PATCH /api/merchant/menu]', error);
    return NextResponse.json({ success: false, message: 'Could not update the menu item.' }, { status: 500 });
  }
}
