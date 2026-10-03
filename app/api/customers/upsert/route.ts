/**
 * @file app/api/customers/upsert/route.ts
 * @description POST Route Handler — creates or links a customer profile
 *              after OTP verification in the PWA onboarding flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { ApiInputError, boundedText, consumeRateLimit, isUuid, readJsonBody } from '@/lib/api-safety';

interface UpsertBody {
  fullName:     string;
  merchantId:   string;
  referralCode?: string;
  // ⚠️ DEV only — sent when SKIP_OTP_FOR_DEV is active on the client
  devPhone?:    string;
}

// Never allow a client to bypass OTP in a production deployment.
const SKIP_OTP_FOR_DEV = process.env.NODE_ENV !== 'production'
  && process.env.NEXT_PUBLIC_SKIP_OTP_FOR_DEV === 'true';

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody<UpsertBody>(request);
    const fullName = boundedText(body.fullName, 80);
    const merchantId = body.merchantId;
    const referralCode = body.referralCode;
    const devPhone = boundedText(body.devPhone, 30);

    if (!fullName || !isUuid(merchantId)) {
      return NextResponse.json({ success: false, message: `Missing fields. Name: ${fullName}, Merchant: ${merchantId}` }, { status: 400 });
    }

    // ── Auth ─────────────────────────────────────────────────────────────────
    const supabase = await createSupabaseServerClient();
    let { data: { user }, error: authError } = await supabase.auth.getUser();

    // Fallback: Authorization Bearer token
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

    // ⚠️ DEV MODE: bypass phone auth — accept phone from request body directly
    let phone = user?.phone;
    if (SKIP_OTP_FOR_DEV && devPhone) {
      phone = devPhone;
      // create a synthetic auth uid for dev so the admin client can still insert
      if (!user) {
        // use admin to create a temp anonymous user
        const admin = await createSupabaseAdminClient();
        const { data: anonUser } = await admin.auth.admin.createUser({
          phone: devPhone,
          phone_confirm: true,
          user_metadata: { dev_bypass: true },
        });
        if (anonUser?.user) user = anonUser.user;
      }
    }

    if (!phone || !user) {
      console.error('[upsert] no authenticated user. authError:', authError?.message);
      return NextResponse.json({ success: false, message: 'A verified phone session is required.' }, { status: 401 });
    }

    const limit = await consumeRateLimit(`join:${merchantId}:${user.id}`, 10, 3600);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: limit.unavailable ? 'Service protection is unavailable. Please retry shortly.' : 'Too many registration requests. Please retry later.' },
        { status: limit.unavailable ? 503 : 429 },
      );
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
      ? admin.from('customers').update({ auth_uid: user.id, full_name: fullName }).eq('id', customerId).select('id').single()
      : admin.from('customers').insert({ phone, auth_uid: user.id, full_name: fullName }).select('id').single();
    const { data: customer, error } = await customerWrite;

    if (error || !customer) {
      console.error('[upsert customer]', error);
      return NextResponse.json(
        { success: false, message: error?.message ?? 'Failed to create customer' },
        { status: 500 },
      );
    }
    
    // Ensure loyalty card exists — only INSERT if it doesn't exist yet.
    // NEVER update/overwrite an existing card: that would erase the customer's points.
    const { data: existingCard } = await admin
      .from('loyalty_cards')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (!existingCard) {
      const { error: cardError } = await admin
        .from('loyalty_cards')
        .insert({ customer_id: customer.id, merchant_id: merchantId, total_points: 0, lifetime_points: 0 });
      if (cardError) {
        console.error('[upsert card]', cardError);
      }
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
    if (err instanceof ApiInputError) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    console.error('[POST /api/customers/upsert]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
