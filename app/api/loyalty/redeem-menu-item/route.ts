import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { syncGoogleWalletLoyaltyCard } from '@/lib/google-wallet';
import { ApiInputError, consumeRateLimit, isUuid, readJsonBody } from '@/lib/api-safety';

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody<{ merchantId?: unknown; menuItemId?: unknown }>(request);
    if (!isUuid(body.merchantId) || !isUuid(body.menuItemId)) {
      return NextResponse.json({ success: false, message: 'Missing merchant or menu item.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: 'Please sign in to redeem a reward.' }, { status: 401 });

    const limit = await consumeRateLimit(`reward-redeem:${body.merchantId}:${user.id}`, 20, 3600);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: limit.unavailable ? 'Service protection is unavailable. Please retry shortly.' : 'Too many redemption requests. Please retry later.' },
        { status: limit.unavailable ? 503 : 429 },
      );
    }

    const admin = await createSupabaseAdminClient();
    const { data: customer } = await admin.from('customers').select('id').eq('auth_uid', user.id).maybeSingle();
    if (!customer) return NextResponse.json({ success: false, message: 'Customer profile not found.' }, { status: 404 });

    // Call atomic RPC with the authenticated supabase client so auth.uid() is populated
    const { data, error } = await supabase.rpc('redeem_menu_item', {
      p_merchant_id: body.merchantId,
      p_customer_id: customer.id,
      p_menu_item_id: body.menuItemId,
    });
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

    const result = data as { success: boolean; message?: string };
    if (result.success) void syncGoogleWalletLoyaltyCard(body.merchantId, customer.id);
    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (error) {
    if (error instanceof ApiInputError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error('[POST /api/loyalty/redeem-menu-item]', error);
    return NextResponse.json({ success: false, message: 'Could not redeem this reward.' }, { status: 500 });
  }
}
