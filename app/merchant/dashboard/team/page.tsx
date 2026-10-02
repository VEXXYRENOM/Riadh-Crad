import { redirect } from 'next/navigation';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { getMerchantAccessByUserId } from '@/services/merchant-access.service';
import { StaffManager } from '@/components/dashboard/StaffManager';

export default async function TeamPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/merchant/login');
  const access = await getMerchantAccessByUserId(user.id);
  if (!access || access.role !== 'OWNER') redirect('/merchant/dashboard');
  const admin = await createSupabaseAdminClient();
  const { data: staff } = await admin.from('merchant_staff').select('id, email, role, status, created_at, activated_at').eq('merchant_id', access.merchant.id).order('created_at', { ascending: false });
  return <StaffManager initialStaff={staff ?? []} />;
}
