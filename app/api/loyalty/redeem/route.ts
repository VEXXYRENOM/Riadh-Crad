/**
 * @file app/api/loyalty/redeem/route.ts
 * @description POST Route Handler — wraps the redeem_points() RPC.
 *              Called by the RedeemModal client component from the PWA.
 *              Requires: customer cookie session (riadh_customer_id).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { syncGoogleWalletLoyaltyCard } from '@/lib/google-wallet';
import { ApiInputError, boundedText, consumeRateLimit, isUuid, readJsonBody } from '@/lib/api-safety';

interface RedeemRequestBody {
  merchantId: string;
  points:     number;
  note?:      string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody<RedeemRequestBody>(request);
    const { merchantId, points, note } = body;

    if (!isUuid(merchantId) || !Number.isSafeInteger(points) || points <= 0 || points > 1_000_000) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid fields: merchantId, points' },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Not authenticated. Please register first.' }, { status: 401 });
    }

    const limit = await consumeRateLimit(`redeem:${merchantId}:${user.id}`, 20, 3600);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: limit.unavailable ? 'Service protection is unavailable. Please retry shortly.' : 'Too many redemption requests. Please retry later.' },
        { status: limit.unavailable ? 503 : 429 },
      );
    }

    const admin = await createSupabaseAdminClient();
    const { data: customer } = await admin
      .from('customers')
      .select('id')
      .eq('auth_uid', user.id)
      .maybeSingle();
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer profile not found.' }, { status: 404 });
    }
    const customerId = customer.id;

    // Verify customer exists and has enough points
    const { data: card } = await admin
      .from('loyalty_cards')
      .select('id, total_points, current_tier')
      .eq('customer_id', customerId)
      .eq('merchant_id', merchantId)
      .single();

    if (!card) {
      return NextResponse.json(
        { success: false, message: 'No loyalty card found for this merchant.' },
        { status: 404 },
      );
    }

    if (card.total_points < points) {
      return NextResponse.json(
        { success: false, message: `Insufficient points. You have ${card.total_points} pts.` },
        { status: 422 },
      );
    }

    // Call atomic RPC with the authenticated supabase client so auth.uid() is populated
    const { data, error } = await supabase.rpc('redeem_points', {
      p_merchant_id: merchantId,
      p_customer_id: customerId,
      p_points:      points,
      p_note:        boundedText(note, 240) || `Redeemed ${points} points`,
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    }

    const result = data as {
      success: boolean;
      points_redeemed?: number;
      total_points?: number;
      current_tier?: string;
      message?: string;
    };

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    void syncGoogleWalletLoyaltyCard(merchantId, customerId);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof ApiInputError) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    console.error('[POST /api/loyalty/redeem]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
