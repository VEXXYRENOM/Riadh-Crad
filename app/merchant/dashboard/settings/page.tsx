import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMerchantByOwnerId } from '@/services/merchant.service';
import { MerchantProfileSettings } from '@/components/dashboard/MerchantProfileSettings';

export default async function MerchantSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/merchant/login');

  const merchant = await getMerchantByOwnerId(user.id);
  if (!merchant) redirect('/merchant/setup');

  return <MerchantProfileSettings merchant={merchant} />;
}
