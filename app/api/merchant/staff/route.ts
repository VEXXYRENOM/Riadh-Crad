import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { ApiInputError, boundedText, consumeRateLimit, isUuid, readJsonBody } from '@/lib/api-safety';

type StaffRole = 'CASHIER' | 'MANAGER';

async function getOwnedMerchant() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, merchant: null };
  const admin = await createSupabaseAdminClient();
  const { data: merchant } = await admin.from('merchants').select('id').eq('owner_id', user.id).maybeSingle();
  return { user, merchant };
}

export async function GET() {
  const { user, merchant } = await getOwnedMerchant();
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (!merchant) return NextResponse.json({ success: false, message: 'Only the store owner can manage staff.' }, { status: 403 });
  const admin = await createSupabaseAdminClient();
  const { data, error } = await admin
    .from('merchant_staff')
    .select('id, email, role, status, created_at, activated_at')
    .eq('merchant_id', merchant.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ success: false, message: 'Unable to load staff.' }, { status: 500 });
  return NextResponse.json({ success: true, staff: data ?? [] });
}

export async function POST(request: NextRequest) {
  try {
    const { user, merchant } = await getOwnedMerchant();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!merchant) return NextResponse.json({ success: false, message: 'Only the store owner can manage staff.' }, { status: 403 });
    const limit = await consumeRateLimit(`staff-invite:${merchant.id}:${user.id}`, 20, 3600);
    if (!limit.allowed) return NextResponse.json({ success: false, message: 'Too many staff changes. Please retry later.' }, { status: limit.unavailable ? 503 : 429 });

    const body = await readJsonBody<{ email?: unknown; role?: unknown }>(request);
    const email = boundedText(body.email, 320).toLowerCase();
    const role = body.role === 'MANAGER' ? 'MANAGER' : body.role === 'CASHIER' ? 'CASHIER' : null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !role) {
      return NextResponse.json({ success: false, message: 'Enter a valid email and role.' }, { status: 400 });
    }

    const admin = await createSupabaseAdminClient();
    const { data, error } = await admin.from('merchant_staff').upsert({
      merchant_id: merchant.id,
      email,
      role: role as StaffRole,
      status: 'INVITED',
      auth_uid: null,
      invited_by: user.id,
      activated_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'merchant_id,email' }).select('id, email, role, status, created_at, activated_at').single();
    if (error || !data) return NextResponse.json({ success: false, message: 'Unable to save the staff invitation.' }, { status: 400 });
    return NextResponse.json({ success: true, staff: data });
  } catch (error) {
    if (error instanceof ApiInputError) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    console.error('[POST /api/merchant/staff]', error);
    return NextResponse.json({ success: false, message: 'Unable to invite staff.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, merchant } = await getOwnedMerchant();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!merchant) return NextResponse.json({ success: false, message: 'Only the store owner can manage staff.' }, { status: 403 });
    const body = await readJsonBody<{ staffId?: unknown; action?: unknown }>(request);
    if (!isUuid(body.staffId) || !['SUSPEND', 'REINVITE'].includes(String(body.action))) {
      return NextResponse.json({ success: false, message: 'Invalid staff action.' }, { status: 400 });
    }
    const admin = await createSupabaseAdminClient();
    const values = body.action === 'SUSPEND'
      ? { status: 'SUSPENDED', updated_at: new Date().toISOString() }
      : { status: 'INVITED', auth_uid: null, activated_at: null, updated_at: new Date().toISOString() };
    const { data, error } = await admin.from('merchant_staff').update(values).eq('id', body.staffId).eq('merchant_id', merchant.id).select('id, email, role, status, created_at, activated_at').single();
    if (error || !data) return NextResponse.json({ success: false, message: 'Unable to update staff access.' }, { status: 400 });
    return NextResponse.json({ success: true, staff: data });
  } catch (error) {
    if (error instanceof ApiInputError) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: false, message: 'Unable to update staff access.' }, { status: 500 });
  }
}
