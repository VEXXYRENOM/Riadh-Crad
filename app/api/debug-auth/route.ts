import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const admin = await createSupabaseAdminClient();
    const { data: merchants, error: merchantError } = await admin
      .from('merchants')
      .select('id, owner_id, name')
      .limit(5);

    let merchantByUser = null;
    let merchantByUserError = null;
    if (user) {
      const { data, error } = await admin
        .from('merchants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      merchantByUser = data;
      merchantByUserError = error?.message;
    }

    return NextResponse.json({
      auth: {
        user_id: user?.id ?? null,
        user_email: user?.email ?? null,
        auth_error: authError?.message ?? null,
      },
      merchants_all: merchants ?? [],
      merchant_error: merchantError?.message ?? null,
      merchant_for_user: merchantByUser,
      merchant_for_user_error: merchantByUserError,
      env: {
        has_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ crash: String(err) }, { status: 500 });
  }
}
