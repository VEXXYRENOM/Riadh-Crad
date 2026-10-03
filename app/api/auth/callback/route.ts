/**
 * @file app/api/auth/callback/route.ts
 * @description Supabase OAuth callback handler.
 *
 *   After Google (or any OAuth provider) authenticates the user, Supabase
 *   redirects to this route with a ?code parameter. We exchange it for a
 *   session, then:
 *     - For PWA/loyalty users: upsert customer profile and loyalty card.
 *     - For merchant staff:    activate staff invitation by email.
 *   Then redirect to the correct destination.
 *
 *   Required Supabase setting:
 *     Dashboard → Auth → URL Configuration → Add Redirect URL:
 *       https://<your-domain>/api/auth/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code       = searchParams.get('code');
  const next       = searchParams.get('next');        // e.g. /b/taki-store
  const merchantId = searchParams.get('merchantId');  // present for PWA flow
  const slug       = searchParams.get('slug');        // merchant slug for redirect

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error('[OAuth callback]', error?.message);
    const dest = next ?? '/';
    return NextResponse.redirect(
      new URL(`${dest}?error=${encodeURIComponent(error?.message ?? 'Auth failed')}`, request.url),
    );
  }

  const user      = data.user;
  const userEmail = user.email?.trim().toLowerCase();
  const admin     = await createSupabaseAdminClient();

  // ── Merchant staff activation ─────────────────────────────────────────────
  // When a staff member signs in via Google with the same email they were
  // invited with, automatically promote them from INVITED → ACTIVE.
  if (userEmail) {
    await admin
      .from('merchant_staff')
      .update({
        auth_uid:     user.id,
        status:       'ACTIVE',
        activated_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq('email', userEmail)
      .eq('status', 'INVITED');
  }

  // ── Customer profile upsert (PWA loyalty-card flow) ───────────────────────
  if (merchantId) {
    // Find existing customer by auth_uid first, then by email
    const { data: byUid }   = await admin.from('customers').select('id').eq('auth_uid', user.id).maybeSingle();
    const { data: byEmail } = userEmail
      ? await admin.from('customers').select('id').eq('email', userEmail).maybeSingle()
      : { data: null };

    const customerId = byUid?.id ?? byEmail?.id;

    if (customerId) {
      // Existing customer — link Google UID + email + avatar (never touch points)
      await admin.from('customers').update({
        auth_uid:   user.id,
        email:      userEmail ?? undefined,
        avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? undefined,
        updated_at: new Date().toISOString(),
      }).eq('id', customerId);

      // Create loyalty card only if missing
      const { data: existingCard } = await admin
        .from('loyalty_cards')
        .select('id')
        .eq('customer_id', customerId)
        .eq('merchant_id', merchantId)
        .maybeSingle();

      if (!existingCard) {
        await admin.from('loyalty_cards').insert({
          customer_id:     customerId,
          merchant_id:     merchantId,
          total_points:    0,
          lifetime_points: 0,
        });
      }
    } else {
      // Brand-new customer — create from Google profile
      const googleName = (user.user_metadata?.full_name as string | undefined)
        ?? user.email?.split('@')[0]
        ?? 'Member';

      const { data: newCustomer } = await admin
        .from('customers')
        .insert({
          auth_uid:   user.id,
          email:      userEmail ?? null,
          full_name:  googleName,
          avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
        })
        .select('id')
        .single();

      if (newCustomer) {
        await admin.from('loyalty_cards').insert({
          customer_id:     newCustomer.id,
          merchant_id:     merchantId,
          total_points:    0,
          lifetime_points: 0,
        });
      }
    }

    // Redirect back to the merchant's PWA page
    const destination = next ?? (slug ? `/b/${slug}` : '/');
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // ── Default: merchant dashboard ───────────────────────────────────────────
  const destination = next ?? '/merchant/dashboard';
  return NextResponse.redirect(new URL(destination, request.url));
}
