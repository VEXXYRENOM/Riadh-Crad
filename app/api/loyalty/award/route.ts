/**
 * @file app/api/loyalty/award/route.ts
 * @description POST Route Handler — wraps the award_points() RPC.
 *              Called by the CashierModal client component.
 *              Auth-guarded: only the merchant owner can call this.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { TransactionSource } from '@/types';

interface AwardRequestBody {
  merchantId:  string;
  customerId:  string | null;
  amountTnd:   number;
  nfcEventId?: string | null;
  source?:     TransactionSource;
  note?:       string | null;
}

export async function POST(request: NextRequest) {
  console.log('[AWARD API] Request received');
  try {
    const body = (await request.json()) as AwardRequestBody;
    console.log('[AWARD API] Body parsed:', body);
    const { merchantId, customerId, amountTnd, nfcEventId, source, note } = body;

    if (!merchantId || !customerId || !amountTnd) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: merchantId, customerId, amountTnd' },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    console.log('[AWARD API] Supabase client created');

    // Verify session
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    console.log('[AWARD API] Session verified. User ID:', user?.id, 'Error:', authErr?.message);
    if (authErr || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('owner_id', user.id)
      .maybeSingle();
    if (!merchant) {
      return NextResponse.json({ success: false, message: 'Merchant not found or access denied.' }, { status: 403 });
    }

    // Call atomic RPC
    console.log('[AWARD API] Calling award_points RPC...');
    const { data, error } = await supabase.rpc('award_points', {
      p_merchant_id:  merchantId,
      p_customer_id:  customerId,
      p_amount_tnd:   amountTnd,
      p_nfc_event_id: nfcEventId ?? null,
      p_source:       source ?? 'CASHIER',
      p_note:         note   ?? null,
    });
    console.log('[AWARD API] RPC finished. Data:', data, 'Error:', error?.message);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    }

    const result = data as {
      success: boolean;
      points_added?: number;
      total_points?: number;
      current_tier?: string;
      message?: string;
    };

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[POST /api/loyalty/award]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
