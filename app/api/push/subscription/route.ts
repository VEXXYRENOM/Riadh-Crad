import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, message: 'Sign in first.' }, { status: 401 });
  const body = await request.json() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!body.endpoint || !body.keys?.p256dh || !body.keys.auth) return NextResponse.json({ success: false, message: 'Invalid subscription.' }, { status: 400 });
  const admin = await createSupabaseAdminClient();
  const { data: customer } = await admin.from('customers').select('id').eq('auth_uid', user.id).maybeSingle();
  if (!customer) return NextResponse.json({ success: false, message: 'Customer not found.' }, { status: 403 });
  const { error } = await admin.from('push_subscriptions').upsert({ customer_id: customer.id, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth, user_agent: request.headers.get('user-agent'), updated_at: new Date().toISOString() }, { onConflict: 'endpoint' });
  return error ? NextResponse.json({ success: false, message: error.message }, { status: 400 }) : NextResponse.json({ success: true });
}
