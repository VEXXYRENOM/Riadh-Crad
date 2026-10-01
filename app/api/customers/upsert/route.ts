/**
 * @file app/api/customers/upsert/route.ts
 * @description POST Route Handler — creates or links a customer profile
 *              after OTP verification in the PWA onboarding flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

interface UpsertBody {
  fullName:   string;
  merchantId: string;
  referralCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UpsertBody;
    const { fullName, merchantId, referralCode } = body;

    if (!fullName?.trim() || !merchantId) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    // ── DEV BYPASS: Skip OTP phone session check ─────────────────────
    // TODO: Remove this block when SMS provider is ready and SKIP_OTP_VERIFICATION=false
    if (process.env.SKIP_OTP_VERIFICATION === 'true') {
      const phone = (body as UpsertBody & { phone?: string }).phone;
      if (!phone) {
        return NextResponse.json({ success: false, message: 'Phone number is required in dev bypass mode.' }, { status: 400 });
      }
      const admin = await createSupabaseAdminClient();

      const { data: existingByPhone } = await admin
        .from('customers')
        .select('id, auth_uid')
        .eq('phone', phone)
        .maybeSingle();

      const customerId = existingByPhone?.id;
      const customerWrite = customerId
        ? admin.from('customers').update({ full_name: fullName.trim() }).eq('id', customerId).select('id').single()
        : admin.from('customers').insert({ phone, full_name: fullName.trim() }).select('id').single();
      const { data: customer, error } = await customerWrite;

      if (error || !customer) {
        return NextResponse.json({ success: false, message: error?.message ?? 'Failed to create customer' }, { status: 500 });
      }

      await admin
        .from('loyalty_cards')
        .upsert(
          { customer_id: customer.id, merchant_id: merchantId, total_points: 0, lifetime_points: 0 },
          { onConflict: 'customer_id, merchant_id', ignoreDuplicates: true }
        );

      return NextResponse.json({ success: true, customerId: customer.id }, { status: 200 });
    }
    // ── END DEV BYPASS ───────────────────────────────────────────────

    // Primary: try cookie-based session (standard SSR flow)
    const supabase = await createSupabaseServerClient();
    let { data: { user }, error: authError } = await supabase.auth.getUser();

    // Fallback: if no cookie session, try Authorization Bearer token
    // (happens when browser OTP client stores session in memory before cookie sync)
    if (!user || authError) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data.user) {
          user = data.user;
          authError = null;
        }
      }
    }

    const phone = user?.phone;
    if (authError || !user || !phone) {
      console.error('[upsert] no authenticated user. authError:', authError?.message);
      return NextResponse.json({ success: false, message: 'A verified phone session is required.' }, { status: 401 });
    }

    const admin = await createSupabaseAdminClient();

    const { data: existingByAuth } = await admin
      .from('customers')
      .select('id, phone')
      .eq('auth_uid', user.id)
      .maybeSingle();
    const { data: existingByPhone } = await admin
      .from('customers')
      .select('id, auth_uid')
      .eq('phone', phone)
      .maybeSingle();

    if (existingByAuth && existingByAuth.phone !== phone) {
      return NextResponse.json({ success: false, message: 'This account is already linked to another phone number.' }, { status: 409 });
    }
    if (existingByPhone?.auth_uid && existingByPhone.auth_uid !== user.id) {
      return NextResponse.json({ success: false, message: 'This phone number is linked to another account.' }, { status: 409 });
    }

    const customerId = existingByAuth?.id ?? existingByPhone?.id;
    const customerWrite = customerId
      ? admin.from('customers').update({ auth_uid: user.id, full_name: fullName.trim() }).eq('id', customerId).select('id').single()
      : admin.from('customers').insert({ phone, auth_uid: user.id, full_name: fullName.trim() }).select('id').single();
    const { data: customer, error } = await customerWrite;

    if (error || !customer) {
      console.error('[upsert customer]', error);
      return NextResponse.json(
        { success: false, message: error?.message ?? 'Failed to create customer' },
        { status: 500 },
      );
    }
    
    // Ensure loyalty card exists for this customer and merchant
    const { error: cardError } = await admin
      .from('loyalty_cards')
      .upsert(
        { customer_id: customer.id, merchant_id: merchantId, total_points: 0, lifetime_points: 0 },
        { onConflict: 'customer_id, merchant_id', ignoreDuplicates: true }
      );

    if (cardError) {
      console.error('[upsert card]', cardError);
    }

    // We only record the invitation here. The database grants both rewards
    // after the invited customer completes their first paid visit.
    const code = referralCode?.trim().toUpperCase();
    if (code && /^[A-Z0-9]{8}$/.test(code)) {
      const { data: codeRow } = await admin
        .from('referral_codes')
        .select('customer_id')
        .eq('merchant_id', merchantId)
        .eq('code', code)
        .maybeSingle();
      if (codeRow && codeRow.customer_id !== customer.id) {
        const { error: referralError } = await admin.from('referrals').upsert({
          merchant_id: merchantId,
          referrer_customer_id: codeRow.customer_id,
          referred_customer_id: customer.id,
        }, { onConflict: 'merchant_id,referred_customer_id', ignoreDuplicates: true });
        if (referralError) console.error('[upsert referral]', referralError.message);
      }
    }
    
    return NextResponse.json({ success: true, customerId: customer.id }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/customers/upsert]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
