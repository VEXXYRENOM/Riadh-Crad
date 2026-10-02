import { NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return NextResponse.redirect(new URL('/merchant/login?error=Missing credentials', request.url), {
        status: 302,
      });
    }

    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Merchant Login Error]', error.message);
      return NextResponse.redirect(new URL(`/merchant/login?error=${encodeURIComponent(error.message)}`, request.url), {
        status: 302,
      });
    }

    // An owner grants staff access by email. Bind that invitation only after this
    // account has authenticated with the same email; the client cannot self-assign a role.
    const authenticatedEmail = data.user?.email?.trim().toLowerCase();
    if (data.user && authenticatedEmail) {
      const admin = await createSupabaseAdminClient();
      const { error: activationError } = await admin
        .from('merchant_staff')
        .update({ auth_uid: data.user.id, status: 'ACTIVE', activated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('email', authenticatedEmail)
        .eq('status', 'INVITED');
      if (activationError) console.error('[Staff activation]', activationError.message);
    }

    // Success! Redirect to the dashboard
    return NextResponse.redirect(new URL('/merchant/dashboard', request.url), {
      status: 302,
    });
    
  } catch (err: any) {
    console.error('[Merchant Login Exception]', err);
    return NextResponse.redirect(new URL('/merchant/login?error=Internal Error', request.url), {
      status: 302,
    });
  }
}
