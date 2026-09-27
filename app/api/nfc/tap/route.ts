import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

interface TapRequestBody {
  merchantId: string;
  customerName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { merchantId, customerName } = (await request.json()) as TapRequestBody;
    if (!merchantId) {
      return NextResponse.json({ success: false, message: 'merchantId is required.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'A verified customer session is required.' }, { status: 401 });
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
        raw_payload: { source: 'PWA_TAP', customerName: customerName ?? null, triggeredAt: new Date().toISOString() },
      })
      .select('id')
      .single();
    if (error || !event) {
      return NextResponse.json({ success: false, message: error?.message ?? 'Unable to register this visit.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('[POST /api/nfc/tap]', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
