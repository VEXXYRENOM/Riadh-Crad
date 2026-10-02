import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createGoogleWalletSaveUrl } from '@/lib/google-wallet';
import { consumeRateLimit, isUuid } from '@/lib/api-safety';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const merchantId = new URL(request.url).searchParams.get('merchantId');
  if (!isUuid(merchantId)) return NextResponse.json({ success: false, message: 'merchantId is required.' }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, message: 'Sign in before adding your card.' }, { status: 401 });
  const limit = await consumeRateLimit(`wallet:${merchantId}:${user.id}`, 10, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: limit.unavailable ? 'Service protection is unavailable. Please retry shortly.' : 'Too many Wallet requests. Please retry in a few minutes.' },
      { status: limit.unavailable ? 503 : 429 },
    );
  }
  const result = await createGoogleWalletSaveUrl(merchantId, user.id);
  if (!result.url) return NextResponse.json({ success: false, message: result.error }, { status: 503 });
  return NextResponse.json({ success: true, url: result.url });
}
