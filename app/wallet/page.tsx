import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

const TIER_STYLE: Record<string, { emoji: string; color: string }> = {
  BRONZE: { emoji: '🥉', color: '#CD7F32' },
  SILVER: { emoji: '🥈', color: '#7C8791' },
  GOLD: { emoji: '🏅', color: '#B89020' },
  PLATINUM: { emoji: '💎', color: '#536C8D' },
};

export default async function CustomerWalletPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const admin = await createSupabaseAdminClient();
  const { data: customer } = await admin.from('customers').select('id, full_name').eq('auth_uid', user.id).maybeSingle();
  if (!customer) redirect('/');
  const { data: cards } = await admin
    .from('loyalty_cards')
    .select('id, merchant_id, total_points, lifetime_points, current_tier, updated_at')
    .eq('customer_id', customer.id)
    .eq('is_blocked', false)
    .order('updated_at', { ascending: false });
  const merchantIds = [...new Set((cards ?? []).map((card) => card.merchant_id))];
  const { data: merchants } = merchantIds.length
    ? await admin.from('merchants').select('id, name, slug, logo_url, description').in('id', merchantIds).eq('is_active', true)
    : { data: [] };
  const merchantsById = new Map((merchants ?? []).map((merchant) => [merchant.id, merchant]));
  const activeCards = (cards ?? []).filter((card) => merchantsById.has(card.merchant_id));

  return <main className="customer-shell min-h-dvh px-4 py-8"><div className="mx-auto flex w-full max-w-md flex-col gap-5">
    <header className="rounded-3xl border border-gold-200 bg-white/75 p-6 shadow-sm"><p className="label-gold">RIADH CARD</p><h1 className="heading-luxury mt-1 text-3xl text-obsidian-900">My Wallet</h1><p className="mt-2 text-sm text-obsidian-500">{customer.full_name}, all your loyalty cards are together here.</p></header>
    {activeCards.length === 0 ? <section className="rounded-3xl border border-dashed border-gold-300 bg-white/60 px-6 py-12 text-center"><p className="text-3xl">👛</p><h2 className="mt-3 font-semibold text-obsidian-800">Your wallet is empty</h2><p className="mt-2 text-sm text-obsidian-500">Visit a RIADH CARD store and activate your first card.</p></section> : <section className="flex flex-col gap-4">{activeCards.map((card) => {
      const merchant = merchantsById.get(card.merchant_id)!;
      const tier = TIER_STYLE[card.current_tier] ?? TIER_STYLE.BRONZE;
      return <Link key={card.id} href={`/b/${merchant.slug}`} className="group relative overflow-hidden rounded-3xl border border-gold-200 bg-gradient-to-br from-[#2A211A] to-[#120E0A] p-5 text-white shadow-[0_14px_30px_-20px_rgba(23,16,7,.75)] transition hover:-translate-y-0.5">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-400/15 blur-2xl" />
        <div className="relative flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gold-300 font-bold text-obsidian-900">{merchant.logo_url ? <img src={merchant.logo_url} alt="" className="h-full w-full object-cover" /> : merchant.name.charAt(0)}</div><div className="min-w-0 flex-1"><p className="truncate font-bold">{merchant.name}</p><p className="mt-0.5 text-xs text-gold-200">RIADH CARD loyalty</p></div><span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ color: tier.color, background: `${tier.color}22`, border: `1px solid ${tier.color}66` }}>{tier.emoji} {card.current_tier}</span></div>
        <div className="relative mt-6 flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-white/55">Available points</p><p className="mt-1 text-3xl font-bold text-gold-300">{card.total_points.toLocaleString()} <span className="text-sm font-medium">pts</span></p></div><span className="text-xs font-semibold text-white/70 group-hover:text-gold-200">Open card →</span></div>
      </Link>;
    })}</section>}
    <Link href="/discover" className="mx-auto mt-2 text-xs font-semibold text-obsidian-500 hover:text-gold-700">🧭 Discover RIADH CARD stores</Link>
  </div></main>;
}
