import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Merchant Login Error]', error.message);
      return NextResponse.redirect(new URL(`/merchant/login?error=${encodeURIComponent(error.message)}`, request.url), {
        status: 302,
      });
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
