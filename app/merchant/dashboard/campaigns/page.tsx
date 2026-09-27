/**
 * @file app/merchant/dashboard/campaigns/page.tsx
 * @description Marketing Campaigns page — merchants send messages to customers.
 */

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMerchantByOwnerId } from '@/services/merchant.service';
import { CampaignsClient } from '@/components/dashboard/CampaignsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campaigns | RIADH CARD',
  description: 'Send promotions and messages to your loyal customers.',
};

export default async function CampaignsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/merchant/login');

  const merchant = await getMerchantByOwnerId(user.id);
  if (!merchant) redirect('/merchant/setup');

  // Fetch customer count for this merchant
  const { count: customerCount } = await supabase
    .from('loyalty_cards')
    .select('*', { count: 'exact', head: true })
    .eq('merchant_id', merchant.id);

  return (
    <div className="flex flex-col gap-8">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="label-gold mb-1">Marketing</p>
          <h1 className="heading-luxury text-3xl lg:text-4xl text-obsidian-900">
            Campaigns &amp;{' '}
            <span className="text-gold-gradient-static">Messages</span> ✦
          </h1>
          <p className="text-obsidian-500 text-sm mt-1">
            Send promotions and announcements to your{' '}
            <span className="font-semibold text-obsidian-700">{customerCount ?? 0} registered customers</span>.
          </p>
        </div>
      </div>

      {/* ── Client UI ───────────────────────────────────────── */}
      <CampaignsClient
        merchantId={merchant.id}
        merchantName={merchant.name}
        customerCount={customerCount ?? 0}
      />
    </div>
  );
}
