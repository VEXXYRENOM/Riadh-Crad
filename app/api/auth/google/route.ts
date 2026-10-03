/**
 * @file app/api/auth/google/route.ts
 * @description Initiates Google OAuth sign-in via Supabase.
 *   Accepts optional ?merchantId=&slug=&next= query params so the
 *   callback knows where to redirect after authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const merchantId = searchParams.get('merchantId');
  const slug       = searchParams.get('slug');
  const next       = searchParams.get('next');

  const supabase = await createSupabaseServerClient();

  // Build the callback URL, passing through the merchant context
  const callbackParams = new URLSearchParams();
  if (merchantId) callbackParams.set('merchantId', merchantId);
  if (slug)       callbackParams.set('slug', slug);
  if (next)       callbackParams.set('next', next);

  const redirectTo = `${origin}/api/auth/callback?${callbackParams.toString()}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error || !data.url) {
    console.error('[Google OAuth init]', error?.message);
    const dest = next ?? (slug ? `/b/${slug}` : '/');
    return NextResponse.redirect(
      new URL(`${dest}?error=${encodeURIComponent(error?.message ?? 'Google sign-in failed')}`, request.url),
    );
  }

  return NextResponse.redirect(data.url);
}
