import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMerchantByOwnerId } from '@/services/merchant.service';
import { getMerchantMenuItems } from '@/services/menu.service';
import { MenuManager } from '@/components/dashboard/MenuManager';

export default async function MerchantMenuPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/merchant/login');
  const merchant = await getMerchantByOwnerId(user.id);
  if (!merchant) redirect('/merchant/setup');
  const items = await getMerchantMenuItems(merchant.id);
  return <MenuManager initialItems={items} />;
}
