/**
 * @file app/merchant/dashboard/page.tsx
 * @description Executive merchant dashboard — server component.
 *
 *              Fetches: authenticated merchant, KPI summary, recent members.
 *              Renders: KPI cards, members table + DashboardClient (Realtime layer).
 */

import { redirect }  from 'next/navigation';
import { createSupabaseServerClient }  from '@/lib/supabase/server';
import { getMerchantByOwnerId, getMerchantDashboardSummary } from '@/services/merchant.service';
import { getMerchantLoyaltyCards }     from '@/services/loyalty.service';

import { KpiCards }        from '@/components/dashboard/KpiCards';
import { RecentMembers }   from '@/components/dashboard/RecentMembers';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import type { MemberRow }  from '@/components/dashboard/RecentMembers';
import type { CustomerRow, LoyaltyCardRow } from '@/types';
import { ExternalLink, Megaphone, QrCode, Radio } from 'lucide-react';

export default async function DashboardPage() {
  // ── Auth guard ───────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/merchant/login');

  const merchant = await getMerchantByOwnerId(user.id);
  if (!merchant) {
    redirect('/merchant/setup');
    return null; // unreachable — satisfies TypeScript narrowing
  }

  // ── Fetch data ───────────────────────────────────────────
  const [summary, rawCards] = await Promise.all([
    getMerchantDashboardSummary(merchant.id),
    getMerchantLoyaltyCards(merchant.id, 20),
  ]);

  // ── Resolve customer names for the members table ─────────
  const customerIds = rawCards.map((c) => c.customer_id);
  const { data: customersData } = customerIds.length > 0
    ? await supabase
        .from('customers')
        .select('id, full_name, phone, avatar_url')
        .in('id', customerIds)
    : { data: [] };

  type CustomerMapValue = Pick<CustomerRow, 'id' | 'full_name' | 'phone' | 'avatar_url'>;
  const customerMap = new Map<string, CustomerMapValue>();
  (customersData ?? []).forEach((c: CustomerMapValue) =>
    customerMap.set(c.id, c),
  );

  const members: MemberRow[] = rawCards
    .filter((card) => customerMap.has(card.customer_id))
    .map((card) => ({
      card: {
        id:              card.id,
        total_points:    card.total_points,
        lifetime_points: card.lifetime_points,
        current_tier:    card.current_tier,
        updated_at:      card.updated_at,
      } as Pick<LoyaltyCardRow, 'id' | 'total_points' | 'lifetime_points' | 'current_tier' | 'updated_at'>,
      customer: customerMap.get(card.customer_id)!,
    }));

  return (
    <div className="flex flex-col gap-8">

      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 animate-fade-up">
        <div>
          <p className="label-gold mb-1">Executive Overview</p>
          <h1 className="heading-luxury text-3xl lg:text-4xl text-obsidian-900">
            Good{' '}
            {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="text-gold-gradient-static">{merchant.name}</span> ✦
          </h1>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
            <Radio className="h-3.5 w-3.5" /> NFC desk is live and ready for customer taps
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <div className="self-start rounded-full border border-gold-200 bg-white/65 px-4 py-2 xl:self-end">
            <p className="text-obsidian-600 text-sm font-medium">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-obsidian-400">Quick actions</span>
            <a href={`/b/${merchant.slug}`} className="inline-flex items-center gap-1.5 rounded-xl border border-gold-200 bg-white/80 px-3 py-2 text-xs font-semibold text-obsidian-700 transition hover:border-gold-400 hover:bg-gold-50"><ExternalLink className="h-3.5 w-3.5 text-gold-700" /> Customer card</a>
            <a href="/merchant/dashboard/campaigns" className="inline-flex items-center gap-1.5 rounded-xl border border-gold-200 bg-white/80 px-3 py-2 text-xs font-semibold text-obsidian-700 transition hover:border-gold-400 hover:bg-gold-50"><Megaphone className="h-3.5 w-3.5 text-gold-700" /> Campaigns</a>
            <a href="/merchant/dashboard/qr" className="inline-flex items-center gap-1.5 rounded-xl bg-obsidian-900 px-3 py-2 text-xs font-bold text-gold-200 shadow-[0_8px_16px_-10px_rgba(47,31,14,.7)] transition hover:-translate-y-0.5 hover:bg-obsidian-800"><QrCode className="h-3.5 w-3.5" /> Set up NFC &amp; QR</a>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      {summary ? (
        <KpiCards summary={summary} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="card-luxury h-28 animate-pulse bg-gold-50" />
          ))}
        </div>
      )}

      {/* ── Two-column layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Members table (2/3 width) */}
        <div className="lg:col-span-2">
          <RecentMembers members={members} />
        </div>

        {/* Right panel — info + quick stats */}
        <div className="flex flex-col gap-4">

          {/* Tier distribution mini card */}
          <div className="card-luxury p-5 animate-fade-up" style={{ animationDelay: '0.35s' }}>
            <h3 className="label-gold mb-4">Tier Distribution</h3>
            {summary && (
              <div className="flex flex-col gap-3">
                {[
                  { tier: 'PLATINUM', count: summary.platinum_members, color: '#B0C4DE', emoji: '💎' },
                  { tier: 'GOLD',     count: summary.gold_members,     color: '#D4AF37', emoji: '🏅' },
                  { tier: 'SILVER',   count: summary.silver_members,   color: '#C0C0C0', emoji: '🥈' },
                  { tier: 'BRONZE',   count: summary.bronze_members,   color: '#CD7F32', emoji: '🥉' },
                ].map(({ tier, count, color, emoji }) => {
                  const total = summary.total_customers || 1;
                  const pct   = Math.round((count / total) * 100);
                  return (
                    <div key={tier}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-obsidian-600 text-xs flex items-center gap-1">
                          {emoji} {tier}
                        </span>
                        <span className="text-obsidian-700 text-xs font-semibold">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-obsidian-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PWA link card */}
          <div
            className="card-luxury p-5 animate-fade-up"
            style={{
              animationDelay: '0.4s',
              background: 'linear-gradient(135deg, #FFFDF0, #FDF9D7)',
              borderColor: 'rgba(212,175,55,0.30)',
            }}
          >
            <h3 className="label-gold mb-2">Customer Card Link</h3>
            <p className="text-obsidian-700 font-mono text-xs break-all mb-3">
              /b/{merchant.slug}
            </p>
            <a
              href={`/b/${merchant.slug}`}
              className="btn-gold w-full text-sm py-2"
            >
              ↗ Open Customer View
            </a>
          </div>
        </div>
      </div>

      {/* ── Realtime client layer (invisible, manages modal + toasts) ── */}
      <DashboardClient merchant={merchant} />
    </div>
  );
}
