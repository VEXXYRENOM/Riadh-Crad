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
import { ApiInputError, boundedText, consumeRateLimit, isUuid, readJsonBody } from '@/lib/api-safety';

interface CampaignRequestBody {
  merchantId: string;
  title:      string;
  message:    string;
  type:       'PROMOTION' | 'REMINDER' | 'EVENT' | 'ANNOUNCEMENT';
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody<CampaignRequestBody>(request, 8_192);
    const merchantId = body.merchantId;
    const title = boundedText(body.title, 120);
    const message = boundedText(body.message, 1_000);
    const type = body.type;

    if (!isUuid(merchantId) || !title || !message || !['PROMOTION', 'REMINDER', 'EVENT', 'ANNOUNCEMENT'].includes(type)) {
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

    const limit = await consumeRateLimit(`campaign:${merchantId}:${user.id}`, 2, 3600);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: limit.unavailable ? 'Service protection is unavailable. Please retry shortly.' : 'Too many campaigns. Please retry later.' },
        { status: limit.unavailable ? 503 : 429 },
      );
    }

    const admin = await createSupabaseAdminClient();

    // Count server-side: never load all customer rows only to calculate a number.
    const { count: recipientCount, error: countError } = await admin
      .from('loyalty_cards')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('is_blocked', false);
    if (countError) return NextResponse.json({ success: false, message: 'Could not count campaign recipients.' }, { status: 500 });

    // Persist first so a send failure remains visible and auditable to the merchant.
    const { data: campaign, error: insertErr } = await admin
      .from('campaigns')
      .insert({
        merchant_id:     merchantId,
        title,
        message,
        type,
        recipient_count: recipientCount ?? 0,
        status:          'DRAFT',
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[campaigns] DB insert error:', insertErr.message);
      return NextResponse.json({ success: false, message: 'Could not create the campaign.' }, { status: 500 });
    }

    try {
      const pushResult = await sendCampaignPushNotifications(merchantId, `/b/${merchant.slug}`, title, message);
      await admin.from('campaigns').update({ status: 'SENT', sent_at: new Date().toISOString() }).eq('id', campaign.id);
      return NextResponse.json({
        success: true,
        campaign_id: campaign.id,
        recipient_count: recipientCount ?? 0,
        push_delivered: pushResult.delivered,
        push_failed: pushResult.failed,
        merchant_name: merchant.name,
        message: `Campaign sent to ${recipientCount ?? 0} customer(s).`,
      });
    } catch (error) {
      console.error('[campaigns] push send failed:', error instanceof Error ? error.message : 'Unknown error');
      await admin.from('campaigns').update({ status: 'FAILED' }).eq('id', campaign.id);
      return NextResponse.json({ success: false, campaign_id: campaign.id, message: 'Campaign could not be delivered. It is marked as failed.' }, { status: 503 });
    }
  } catch (err) {
    if (err instanceof ApiInputError) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
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
