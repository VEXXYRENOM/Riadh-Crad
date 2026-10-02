import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { ApiInputError, boundedText, consumeRateLimit, isUuid, readJsonBody } from '@/lib/api-safety';

interface TapRequestBody {
  merchantId: string;
  customerName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { merchantId, customerName } = await readJsonBody<TapRequestBody>(request);
    if (!isUuid(merchantId)) {
      return NextResponse.json({ success: false, message: 'merchantId is required.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'A verified customer session is required.' }, { status: 401 });
    }

    const limit = await consumeRateLimit(`tap:${merchantId}:${user.id}`, 12, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: limit.unavailable ? 'Service protection is unavailable. Please retry shortly.' : 'Too many taps. Please wait before trying again.' },
        { status: limit.unavailable ? 503 : 429 },
      );
    }

    const admin = await createSupabaseAdminClient();
    const [{ data: customer }, { data: merchant }] = await Promise.all([
      admin.from('customers').select('id').eq('auth_uid', user.id).maybeSingle(),
      admin.from('merchants').select('id').eq('id', merchantId).eq('is_active', true).maybeSingle(),
    ]);
    if (!customer || !merchant) {
      return NextResponse.json({ success: false, message: 'Customer or merchant not found.' }, { status: 404 });
    }

    const { data: event, error } = await admin
      .from('nfc_events')
      .insert({
        merchant_id: merchantId,
        customer_id: customer.id,
        raw_payload: { source: 'PWA_TAP', customerName: boundedText(customerName, 80) || null, triggeredAt: new Date().toISOString() },
      })
      .select('id')
      .single();
    if (error || !event) {
      return NextResponse.json({ success: false, message: error?.message ?? 'Unable to register this visit.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    if (error instanceof ApiInputError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error('[POST /api/nfc/tap]', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
