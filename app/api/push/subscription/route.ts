import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { ApiInputError, boundedText, consumeRateLimit, readJsonBody } from '@/lib/api-safety';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, message: 'Sign in first.' }, { status: 401 });
  try {
    const body = await readJsonBody<{ endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }>(request, 8_192);
    const endpoint = boundedText(body.endpoint, 2_000);
    const p256dh = boundedText(body.keys?.p256dh, 512);
    const auth = boundedText(body.keys?.auth, 128);
    if (!endpoint.startsWith('https://') || !p256dh || !auth) return NextResponse.json({ success: false, message: 'Invalid subscription.' }, { status: 400 });
    const limit = await consumeRateLimit(`push-subscription:${user.id}`, 20, 3600);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: limit.unavailable ? 'Service protection is unavailable. Please retry shortly.' : 'Too many subscription updates. Please retry later.' },
        { status: limit.unavailable ? 503 : 429 },
      );
    }
    const admin = await createSupabaseAdminClient();
    const { data: customer } = await admin.from('customers').select('id').eq('auth_uid', user.id).maybeSingle();
    if (!customer) return NextResponse.json({ success: false, message: 'Customer not found.' }, { status: 403 });
    const { error } = await admin.from('push_subscriptions').upsert({ customer_id: customer.id, endpoint, p256dh, auth, user_agent: boundedText(request.headers.get('user-agent'), 512) || null, updated_at: new Date().toISOString() }, { onConflict: 'endpoint' });
    return error ? NextResponse.json({ success: false, message: error.message }, { status: 400 }) : NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiInputError) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    console.error('[POST /api/push/subscription]', error);
    return NextResponse.json({ success: false, message: 'Unable to save subscription.' }, { status: 500 });
  }
}
