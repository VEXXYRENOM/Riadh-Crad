/**
 * @file app/api/campaigns/route.ts
 * @description POST — Send a campaign message to all customers of a merchant.
 *              Uses Web Push Notifications (via service worker) for PWA users.
 *              Also stores the campaign in the DB for the history tab.
 *
 *              Auth-guarded: only the authenticated merchant owner can call this.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendCampaignPushNotifications } from '@/lib/push';

interface CampaignRequestBody {
  merchantId: string;
  title:      string;
  message:    string;
  type:       'PROMOTION' | 'REMINDER' | 'EVENT' | 'ANNOUNCEMENT';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CampaignRequestBody;
    const { merchantId, title, message, type } = body;

    if (!merchantId || !title || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields.' },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    // Auth guard
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Verify this merchant belongs to the authenticated user
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, name, slug')
      .eq('id', merchantId)
      .eq('owner_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'Merchant not found or access denied.' },
        { status: 403 },
      );
    }

    const admin = await createSupabaseAdminClient();

    // Fetch all customer IDs for this merchant
    const { data: cards } = await admin
      .from('loyalty_cards')
      .select('customer_id')
      .eq('merchant_id', merchantId)
      .eq('is_blocked', false);

    const recipientCount = cards?.length ?? 0;
    const pushResult = await sendCampaignPushNotifications(merchantId, `/b/${merchant.slug}`, title, message);

    // Store campaign in DB for history
    const { data: campaign, error: insertErr } = await admin
      .from('campaigns')
      .insert({
        merchant_id:     merchantId,
        title,
        message,
        type,
        recipient_count: recipientCount,
        sent_at:         new Date().toISOString(),
        status:          'SENT',
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[campaigns] DB insert error:', insertErr.message);
      // Don't fail — still return success if push succeeded
    }

    return NextResponse.json({
      success:         true,
      campaign_id:     campaign?.id ?? null,
      recipient_count: recipientCount,
      push_delivered:  pushResult.delivered,
      merchant_name:   merchant.name,
      message:         `Campaign sent to ${recipientCount} customer(s).`,
    });

  } catch (err) {
    console.error('[POST /api/campaigns]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

/** GET — Fetch campaign history for a merchant */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ success: false, message: 'merchantId required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
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

    const admin = await createSupabaseAdminClient();
    const { data: campaigns, error } = await admin
      .from('campaigns')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaigns: campaigns ?? [] });
  } catch (err) {
    console.error('[GET /api/campaigns]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
