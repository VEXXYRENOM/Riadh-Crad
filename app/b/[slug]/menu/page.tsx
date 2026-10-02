import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMerchantBySlug } from '@/services/merchant.service';
import { getCustomerByAuthUid } from '@/services/customer.service';
import { getLoyaltyCard } from '@/services/loyalty.service';
import { getAvailableMenuItems } from '@/services/menu.service';
import { RewardsMenu } from '@/components/pwa/RewardsMenu';

export default async function CustomerMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);
  if (!merchant) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const customer = user ? await getCustomerByAuthUid(user.id) : null;
  const [card, items] = await Promise.all([
    customer ? getLoyaltyCard(customer.id, merchant.id) : null,
    getAvailableMenuItems(merchant.id),
  ]);

  return <RewardsMenu merchantId={merchant.id} merchantSlug={merchant.slug} merchantName={merchant.name} items={items} totalPoints={card?.total_points ?? 0} canRedeem={Boolean(customer && card)} />;
}
