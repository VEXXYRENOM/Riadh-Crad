/**
 * @file app/b/[slug]/page.tsx
 * @description Customer PWA — Ultra-luxury mobile loyalty card experience.
 *
 *              Server Component: fetches merchant + customer data.
 *              Renders: VIP Card, Points Counter, Tier Progress, NFC Trigger, Transaction Log.
 *
 *              If the customer is not yet registered, shows a lightweight
 *              onboarding prompt (phone number entry).
 */

import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMerchantBySlug } from '@/services/merchant.service';
import { getLoyaltyCard, getCardTransactions } from '@/services/loyalty.service';
import { getCustomerByAuthUid } from '@/services/customer.service';

import { VipCard }        from '@/components/pwa/VipCard';
import { PointsCounter }  from '@/components/pwa/PointsCounter';
import { TierProgress }   from '@/components/pwa/TierProgress';
import { NfcTrigger }     from '@/components/pwa/NfcTrigger';
import { TransactionLog } from '@/components/pwa/TransactionLog';
import { PwaOnboarding }  from '@/components/pwa/PwaOnboarding';
import { RedeemWidget }   from '@/components/pwa/RedeemWidget';
import { WalletButton }   from '@/components/pwa/WalletButton';
import { MerchantReviews } from '@/components/pwa/MerchantReviews';
import { ReferralCard } from '@/components/pwa/ReferralCard';
import { PushNotificationButton } from '@/components/pwa/PushNotificationButton';
import type { TransactionListItem } from '@/types';
import { getMerchantRatingSummary } from '@/services/review.service';
import { getOrCreateReferralCode } from '@/services/referral.service';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string | string[] }>;
}

export default async function PwaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const referralCode = typeof query.ref === 'string' ? query.ref : null;

  // ── Fetch merchant (public read) ─────────────────────────
  const merchant = await getMerchantBySlug(slug);
  if (!merchant) notFound();

  // ── Fetch the verified customer profile for this session ──
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const customer = user ? await getCustomerByAuthUid(user.id) : null;

  // ── Fetch loyalty card ────────────────────────────────────
  const card = customer
    ? await getLoyaltyCard(customer.id, merchant.id)
    : null;

  // ── Fetch last 15 transactions ───────────────────────────
  const [rawTransactions, ratingSummary] = await Promise.all([
    card ? getCardTransactions(card.id, 15) : [],
    getMerchantRatingSummary(merchant.id),
  ]);

  const ownReferralCode = customer && card
    ? await getOrCreateReferralCode(merchant.id, customer.id)
    : null;

  const transactions: TransactionListItem[] = rawTransactions.map((tx) => ({
    id:              tx.id,
    points_added:    tx.points_added,
    points_redeemed: tx.points_redeemed,
    amount_spent:    tx.amount_spent,
    source:          tx.source,
    note:            tx.note,
    created_at:      tx.created_at,
  }));

  const tierThresholds = {
    BRONZE:   merchant.tier_bronze_min,
    SILVER:   merchant.tier_silver_min,
    GOLD:     merchant.tier_gold_min,
    PLATINUM: merchant.tier_platinum_min,
  };

  // ── Not registered — show onboarding ────────────────────
  if (!customer) {
    return (
      <PwaOnboarding
        merchantId={merchant.id}
        merchantName={merchant.name}
        merchantLogoUrl={merchant.logo_url}
        slug={slug}
        referralCode={referralCode}
      />
    );
  }

  return (
    <main className="customer-shell flex flex-col items-center min-h-dvh px-4 pt-8 pb-12 gap-7 relative overflow-hidden">

      {merchant.cover_image_url && (
        <div className="absolute inset-x-0 top-0 h-44 overflow-hidden opacity-25" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={merchant.cover_image_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FAF8F5]" />
        </div>
      )}

      {/* ── Ambient gold orb (decorative) ─────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.13) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* ── Header ────────────────────────────────────────── */}
      <header className="flex flex-col items-center gap-2 animate-fade-up w-full max-w-sm">
        {merchant.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={merchant.logo_url}
            alt={merchant.name}
            className="w-14 h-14 rounded-full object-cover shadow-gold-glow border-2 border-gold-200"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-obsidian-900 shadow-gold-glow"
            style={{ background: 'var(--gradient-fluid-gold)' }}
            aria-label={merchant.name}
          >
            {merchant.name.charAt(0)}
          </div>
        )}
        <div className="text-center">
          <p className="heading-luxury text-lg text-obsidian-900">{merchant.name}</p>
          <p className="text-gold-gradient-static text-xs font-semibold tracking-widest uppercase">
            RIADH CARD ✦ VIP Loyalty
          </p>
          {merchant.description && (
            <p className="mt-2 text-xs leading-relaxed text-obsidian-500">{merchant.description}</p>
          )}
          {merchant.welcome_message && (
            <p className="mt-2 rounded-xl border border-gold-200 bg-white/70 px-3 py-2 text-xs font-medium text-obsidian-600 shadow-sm">
              {merchant.welcome_message}
            </p>
          )}
        </div>
        <p className="text-obsidian-400 text-xs">
          Welcome back,{' '}
          <span className="font-semibold text-obsidian-700">
            {customer.full_name.split(' ')[0]}
          </span>{' '}
          👋
        </p>
      </header>

      {/* ── VIP Card Mockup ───────────────────────────────── */}
      <div className="w-full max-w-sm animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <VipCard
          merchantName={merchant.name}
          merchantLogoUrl={merchant.logo_url}
          customerName={customer.full_name}
          cardId={card?.id ?? customer.id}
          tier={card?.current_tier ?? 'BRONZE'}
          totalPoints={card?.total_points ?? 0}
        />
      </div>

      {/* ── Points Counter ────────────────────────────────── */}
      <PointsCounter points={card?.total_points ?? 0} />

      <MerchantReviews
        merchantId={merchant.id}
        initialAverage={ratingSummary.average}
        initialCount={ratingSummary.count}
        initialReviews={ratingSummary.reviews.map(({ customer_id: _customerId, ...review }) => review)}
        canReview={Boolean(customer && card)}
      />

      {ownReferralCode && (
        <ReferralCard
          referralUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/b/${merchant.slug}?ref=${ownReferralCode}`}
          rewardPoints={merchant.referral_reward_points}
        />
      )}

      {/* ── Divider ───────────────────────────────────────── */}
      <div className="divider-gold w-full max-w-sm">Tier Progress</div>

      {/* ── Tier Progress Bar ─────────────────────────────── */}
      <TierProgress
        currentTier={card?.current_tier ?? 'BRONZE'}
        lifetimePoints={card?.lifetime_points ?? 0}
        tierThresholds={tierThresholds}
      />

      {/* ── Divider ───────────────────────────────────────── */}
      <div className="divider-gold w-full max-w-sm">Register Your Visit</div>

      {/* ── NFC Trigger ───────────────────────────────────── */}
      <NfcTrigger
        merchantId={merchant.id}
        customerId={customer.id}
        customerName={customer.full_name}
      />

      {/* ── Redeem Points ─────────────────────────────────── */}
      <RedeemWidget
        merchantId={merchant.id}
        merchantName={merchant.name}
        totalPoints={card?.total_points ?? 0}
        pointsPerDinar={merchant.points_per_dinar}
      />

      {/* ── Add to Wallet ─────────────────────────────────── */}
      <WalletButton
        merchantName={merchant.name}
        merchantSlug={merchant.slug}
        customerName={customer.full_name}
        totalPoints={card?.total_points ?? 0}
        currentTier={card?.current_tier ?? 'BRONZE'}
        loyaltyUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/b/${merchant.slug}`}
      />

      <PushNotificationButton />

      {/* ── Transaction History ───────────────────────────── */}
      <TransactionLog transactions={transactions} />

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="mt-2 text-center">
        <p className="text-obsidian-300 text-[10px] tracking-wide">
          Powered by{' '}
          <span className="text-gold-gradient-static font-semibold">RIADH CARD™</span>
        </p>
      </footer>
    </main>
  );
}
