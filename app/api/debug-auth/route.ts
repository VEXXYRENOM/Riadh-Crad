import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMerchantAccessByUserId } from '@/services/merchant-access.service';
import { createClient } from '@supabase/supabase-js';

/**
 * Diagnostic endpoint — open while logged in as a merchant user.
 * Does not expose secret keys; only reports whether env vars are present.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let adminMerchants: { id: string; owner_id: string; name: string; slug: string }[] | null =
    null;
  let adminError: string | null = null;

  if (user && url && serviceKey) {
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin
      .from('merchants')
      .select('id, owner_id, name, slug')
      .eq('owner_id', user.id);
    adminMerchants = data;
    adminError = error?.message ?? null;
  }

  const { data: sessionMerchant, error: sessionError } = user
    ? await supabase
        .from('merchants')
        .select('id, owner_id, name, slug')
        .eq('owner_id', user.id)
        .maybeSingle()
    : { data: null, error: null };

  const access = user ? await getMerchantAccessByUserId(user.id) : null;

  return NextResponse.json({
    logged_in: Boolean(user),
    user_id: user?.id ?? null,
    email: user?.email ?? null,
    env: {
      has_supabase_url: Boolean(url),
      has_anon_key: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      has_service_role_key: Boolean(serviceKey),
    },
    access_resolved: Boolean(access),
    role: access?.role ?? null,
    merchant_slug: access?.merchant?.slug ?? null,
    session_merchant: sessionMerchant,
    session_merchant_error: sessionError?.message ?? null,
    admin_merchants_for_user: adminMerchants,
    admin_merchants_error: adminError,
    hint:
      !user
        ? 'Not logged in — sign in first, then reload this URL.'
        : !access && !sessionMerchant && !adminMerchants?.length
          ? 'No merchant row with owner_id matching this user. Add or UPDATE public.merchants in Supabase.'
          : !access && (sessionMerchant || adminMerchants?.length)
            ? 'Merchant row exists but access check failed — redeploy after fixing service role / code.'
            : null,
  });
}
