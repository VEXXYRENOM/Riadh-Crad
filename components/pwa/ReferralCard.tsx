'use client';

import { useState } from 'react';
import { Check, Copy, Share2, Users } from 'lucide-react';

export function ReferralCard({ referralUrl, rewardPoints }: { referralUrl: string; rewardPoints: number }) {
  const [copied, setCopied] = useState(false);
  const copyLink = async () => { await navigator.clipboard.writeText(referralUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  const share = async () => { if (navigator.share) { await navigator.share({ title: 'RIADH CARD', text: `Join me and earn ${rewardPoints} bonus points after your first purchase.`, url: referralUrl }); } else await copyLink(); };

  return <section className="w-full max-w-sm overflow-hidden rounded-2xl border border-gold-200 bg-gradient-to-br from-[#FFF9EA] to-white shadow-gold-glow animate-fade-up">
    <div className="flex gap-3 p-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fluid-gold text-obsidian-900"><Users className="h-5 w-5" /></div><div><p className="label-gold mb-1">Invite friends</p><h2 className="text-base font-bold text-obsidian-900">Earn {rewardPoints.toLocaleString()} points together</h2><p className="mt-1 text-xs leading-relaxed text-obsidian-600">You both receive the reward after your friend’s first purchase.</p></div></div>
    <div className="flex gap-2 border-t border-gold-100 bg-white/70 p-3"><button type="button" onClick={() => void share()} className="btn-gold flex-1 px-3 py-2.5 text-xs"><Share2 className="h-4 w-4" /> Share</button><button type="button" onClick={() => void copyLink()} className="btn-ghost-gold px-3 py-2.5 text-xs">{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy'}</button></div>
  </section>;
}
