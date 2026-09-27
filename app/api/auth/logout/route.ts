import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    await supabase.auth.signOut();

    // Redirect to login page after signing out
    return NextResponse.redirect(new URL('/merchant/login', request.url), {
      status: 302,
    });
    
  } catch (err: any) {
    console.error('[Merchant Logout Exception]', err);
    return NextResponse.redirect(new URL('/', request.url), {
      status: 302,
    });
  }
}
