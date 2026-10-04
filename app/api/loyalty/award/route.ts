/**
 * @file app/api/loyalty/award/route.ts
 * @description POST Route Handler — wraps the award_points() RPC.
 *              Called by the CashierModal client component.
 *              Auth-guarded: only the merchant owner can call this.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { syncGoogleWalletLoyaltyCard } from '@/lib/google-wallet';
import { ApiInputError, boundedText, consumeRateLimit, isUuid, readJsonBody } from '@/lib/api-safety';
import { canAwardPoints } from '@/services/merchant-access.service';
import { sendRewardEmail } from '@/lib/email';
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
  try {
    const body = await readJsonBody<AwardRequestBody>(request);
    const { merchantId, customerId, amountTnd, nfcEventId, source, note } = body;

    if (!isUuid(merchantId) || !isUuid(customerId) || !Number.isFinite(amountTnd) || amountTnd <= 0 || amountTnd > 100_000) {
      return NextResponse.json(
        { success: false, message: 'Invalid merchant, customer, or purchase amount.' },
        { status: 400 },
      );
    }
    if (nfcEventId !== undefined && nfcEventId !== null && !isUuid(nfcEventId)) {
      return NextResponse.json({ success: false, message: 'Invalid NFC event.' }, { status: 400 });
    }
    if (source && !['CASHIER', 'NFC', 'MANUAL', 'ADJUSTMENT'].includes(source)) {
      return NextResponse.json({ success: false, message: 'Invalid transaction source.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Verify session
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const limit = await consumeRateLimit(`award:${merchantId}:${user.id}`, 240, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: limit.unavailable ? 'Service protection is unavailable. Please retry shortly.' : 'Too many award requests. Please retry in one minute.' },
        { status: limit.unavailable ? 503 : 429 },
      );
    }

    if (!await canAwardPoints(merchantId, user.id)) {
      return NextResponse.json({ success: false, message: 'Merchant not found or access denied.' }, { status: 403 });
    }

    // Call atomic RPC
    // Use the authenticated 'supabase' client so the user's JWT is passed to Postgres.
    // This allows the RPC to verify auth.uid() successfully.
    const { data, error } = await supabase.rpc('award_points', {
      p_merchant_id:  merchantId,
      p_customer_id:  customerId,
      p_amount_tnd:   amountTnd,
      p_nfc_event_id: nfcEventId ?? null,
      p_source:       source ?? 'CASHIER',
      p_note:         boundedText(note, 240) || null,
    });

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

    // Idempotent: the SQL function only processes a pending invitation.
    const { error: referralError } = await supabase.rpc('complete_referral_after_first_purchase', {
      p_merchant_id: merchantId,
      p_referred_customer_id: customerId,
    });
    if (referralError) console.error('[referral completion]', referralError.message);

    // ── Reward email ──────────────────────────────────────────────────
    // Best-effort — runs in parallel with wallet sync, never blocks the response.
    void (async () => {
      try {
        const { data: customerRow } = await (await createSupabaseAdminClient())
          .from('customers')
          .select('full_name, auth_uid')
          .eq('id', customerId)
          .single();
        const { data: authUser } = await (await createSupabaseAdminClient())
          .auth.admin.getUserById(customerRow?.auth_uid ?? '');
        const { data: merchantRow } = await (await createSupabaseAdminClient())
          .from('merchants')
          .select('name, slug')
          .eq('id', merchantId)
          .single();

        if (authUser?.user?.email && customerRow && merchantRow) {
          await sendRewardEmail({
            to:           authUser.user.email,
            customerName: customerRow.full_name ?? 'عزيزي العميل',
            merchantName: merchantRow.name,
            eventType:    'earned',
            points:       result.points_added ?? 0,
            totalPoints:  result.total_points ?? 0,
            cardUrl:      `${process.env.NEXT_PUBLIC_APP_URL}/b/${merchantRow.slug}`,
          });
        }
      } catch (e) {
        console.error('[email] award reward email failed:', e);
      }
    })();

    // Best effort: the points transaction is already committed atomically in Supabase.
    // A temporary Google outage must never make the cashier operation fail.
    // A bounded background queue prevents an external Wallet slowdown from delaying checkout.
    void syncGoogleWalletLoyaltyCard(merchantId, customerId);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof ApiInputError) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    console.error('[POST /api/loyalty/award]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
