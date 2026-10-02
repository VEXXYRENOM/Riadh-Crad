'use client';

import Link from 'next/link';
import { CheckCircle2, ChevronLeft, Gift, Loader2, Lock, Sparkles, UtensilsCrossed } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MenuItemRow } from '@/types';

type Props = {
  merchantId: string;
  merchantSlug: string;
  merchantName: string;
  items: MenuItemRow[];
  totalPoints: number;
  canRedeem: boolean;
};

export function RewardsMenu({ merchantId, merchantSlug, merchantName, items, totalPoints, canRedeem }: Props) {
  const router = useRouter();
  const [balance, setBalance] = useState(totalPoints);
  const [selected, setSelected] = useState<MenuItemRow | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function redeem() {
    if (!selected) return;
    setRedeeming(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/loyalty/redeem-menu-item', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, menuItemId: selected.id }),
      });
      const result = await response.json() as { success: boolean; message?: string; total_points?: number; menu_item_name?: string };
      if (!response.ok || !result.success) throw new Error(result.message ?? 'Unable to redeem this reward.');
      setBalance(result.total_points ?? balance - selected.reward_points);
      setFeedback({ type: 'success', message: `${result.menu_item_name ?? selected.name} is ready to collect from ${merchantName}.` });
      setSelected(null);
      router.refresh();
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Unable to redeem this reward.' });
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <main className="customer-shell min-h-dvh px-4 py-7 pb-16">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <header className="animate-fade-up">
          <Link href={`/b/${merchantSlug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700 hover:text-gold-800"><ChevronLeft className="h-4 w-4" /> Back to your card</Link>
          <div className="mt-5 flex items-start justify-between gap-4">
            <div><p className="label-gold mb-1">Rewards menu</p><h1 className="heading-luxury text-3xl text-obsidian-900">Choose your <span className="text-gold-gradient-static">reward</span></h1><p className="mt-2 text-sm text-obsidian-500">Every item has its cash price and the points needed to claim it.</p></div>
            <div className="rounded-2xl border border-gold-200 bg-[#FFFBEA] px-3 py-2 text-right shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-gold-700">Your balance</p><p className="text-lg font-black text-obsidian-900">{balance.toLocaleString()} <span className="text-xs text-gold-700">pts</span></p></div>
          </div>
        </header>

        {feedback && <div role="status" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}><CheckCircle2 className="h-4 w-4 shrink-0" />{feedback.message}</div>}

        {!canRedeem && <div className="rounded-2xl border border-gold-200 bg-white/80 p-4 text-sm text-obsidian-600"><div className="flex gap-3"><Lock className="h-5 w-5 shrink-0 text-gold-700" /><p>Join or sign in to your loyalty card to redeem rewards. <Link href={`/b/${merchantSlug}`} className="font-bold text-gold-700 underline">Open my card</Link></p></div></div>}

        {items.length === 0 ? (
          <div className="card-luxury flex flex-col items-center gap-3 py-14 text-center"><UtensilsCrossed className="h-10 w-10 text-gold-500" /><p className="font-semibold text-obsidian-800">The rewards menu is being prepared.</p><p className="text-sm text-obsidian-500">Please check back soon.</p></div>
        ) : <section className="grid gap-4">
          {items.map((item, index) => {
            const affordable = balance >= item.reward_points;
            return <article key={item.id} className="card-luxury animate-fade-up overflow-hidden p-5" style={{ animationDelay: `${Math.min(index * 0.06, 0.3)}s` }}>
              <div className="flex gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gold-100 text-gold-700">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-obsidian-900">{item.name}</h2><span className="shrink-0 text-sm font-bold text-obsidian-800">{Number(item.price_tnd).toFixed(3)} TND</span></div>{item.description && <p className="mt-1 text-sm leading-relaxed text-obsidian-500">{item.description}</p>}{item.ingredients.length > 0 && <p className="mt-3 text-xs text-obsidian-400">{item.ingredients.join(' · ')}</p>}</div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-gold-100 pt-4"><div className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1.5 text-xs font-bold text-gold-800"><Sparkles className="h-3.5 w-3.5" /> {item.reward_points.toLocaleString()} points</div><button type="button" disabled={!canRedeem || !affordable} onClick={() => { setSelected(item); setFeedback(null); }} className="inline-flex items-center gap-1.5 rounded-xl bg-obsidian-900 px-3 py-2 text-xs font-bold text-gold-100 transition hover:bg-obsidian-800 disabled:cursor-not-allowed disabled:opacity-40"><Gift className="h-3.5 w-3.5" /> {!canRedeem ? 'Sign in' : affordable ? 'Redeem' : `Need ${(item.reward_points - balance).toLocaleString()} more`}</button></div>
            </article>;
          })}
        </section>}
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-end bg-obsidian-900/45 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="redeem-title"><div className="w-full max-w-sm rounded-3xl border border-gold-200 bg-white p-6 shadow-2xl animate-scale-in"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-gold-700"><Gift className="h-6 w-6" /></div><h2 id="redeem-title" className="text-center text-xl font-bold text-obsidian-900">Redeem {selected.name}?</h2><p className="mt-2 text-center text-sm text-obsidian-500">This will use <strong className="text-obsidian-800">{selected.reward_points.toLocaleString()} points</strong>. Your remaining balance will be {(balance - selected.reward_points).toLocaleString()} points.</p><div className="mt-6 flex gap-3"><button type="button" disabled={redeeming} onClick={() => setSelected(null)} className="flex-1 rounded-xl border border-gold-200 px-4 py-3 text-sm font-bold text-obsidian-600 hover:bg-gold-50">Cancel</button><button type="button" disabled={redeeming} onClick={redeem} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-obsidian-900 px-4 py-3 text-sm font-bold text-gold-100 disabled:opacity-60">{redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />} Confirm</button></div></div></div>}
    </main>
  );
}
