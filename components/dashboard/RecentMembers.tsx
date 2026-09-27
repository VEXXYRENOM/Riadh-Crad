/**
 * @file components/dashboard/RecentMembers.tsx
 * @description Merchant's top members table with tier badge, points, and last visit.
 */

import type { LoyaltyCardRow, CustomerRow, LoyaltyTier } from '@/types';
import Link from 'next/link';
import { ArrowRight, Nfc, QrCode, UsersRound } from 'lucide-react';

export interface MemberRow {
  card:     Pick<LoyaltyCardRow, 'id' | 'total_points' | 'lifetime_points' | 'current_tier' | 'updated_at'>;
  customer: Pick<CustomerRow,     'id' | 'full_name' | 'phone' | 'avatar_url'>;
}

interface RecentMembersProps {
  members: MemberRow[];
}

const TIER_STYLES: Record<LoyaltyTier, { bg: string; text: string; border: string }> = {
  BRONZE:   { bg: '#CD7F3218', text: '#CD7F32', border: '#CD7F3240' },
  SILVER:   { bg: '#9CA3AF18', text: '#6B7280', border: '#9CA3AF40' },
  GOLD:     { bg: '#D4AF3718', text: '#AA771C', border: '#D4AF3740' },
  PLATINUM: { bg: '#B0C4DE18', text: '#5B7FA6', border: '#B0C4DE40' },
};

function formatLastVisit(iso: string): string {
  const d   = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return `${diffDays}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function RecentMembers({ members }: RecentMembersProps) {
  if (members.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-[1.5rem] border border-[#E3CFA9] bg-[linear-gradient(135deg,rgba(255,255,255,.90),rgba(255,247,229,.84))] p-8 shadow-[0_20px_42px_-28px_rgba(91,57,15,.34)] animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#F0C866]/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#261F19] text-[#F2CF73] shadow-lg"><UsersRound className="h-7 w-7" /></div>
          <div className="max-w-md"><p className="font-display text-2xl font-semibold text-obsidian-900">Your first member is one tap away.</p><p className="mt-1 text-sm leading-6 text-obsidian-500">Place your NFC stand on the counter or print your QR code. When a customer joins, their live loyalty activity will appear here.</p></div>
          <Link href="/merchant/dashboard/qr" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#261F19] px-4 py-2.5 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#453322]"><Nfc className="h-4 w-4 text-[#F2CF73]" /> Set up NFC <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="relative mt-7 grid grid-cols-2 gap-3 border-t border-[#EADCC6] pt-5 text-left"><div className="flex items-center gap-2 rounded-xl bg-white/70 p-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FFF0CA] text-[#A66B18]"><Nfc className="h-4 w-4" /></span><span className="text-xs font-semibold text-obsidian-700">Tap NFC stand</span></div><div className="flex items-center gap-2 rounded-xl bg-white/70 p-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FFF0CA] text-[#A66B18]"><QrCode className="h-4 w-4" /></span><span className="text-xs font-semibold text-obsidian-700">Display QR code</span></div></div>
      </div>
    );
  }

  return (
    <div className="card-luxury overflow-hidden animate-fade-up" style={{ animationDelay: '0.25s' }}>
      <div className="px-5 py-4 border-b border-gold-50 flex items-center justify-between">
        <h2 className="text-obsidian-900 font-semibold text-sm">Recent Members</h2>
        <span className="label-gold">{members.length} shown</span>
      </div>

      <div className="divide-y divide-gold-50">
        {members.map(({ card, customer }, i) => {
          const ts = TIER_STYLES[card.current_tier];
          const initials = customer.full_name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          return (
            <div
              key={card.id}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-gold-50/50 transition-colors animate-fade-up"
              style={{ animationDelay: `${0.3 + i * 0.04}s` }}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${ts.text}88, ${ts.text})` }}
              >
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-obsidian-900 text-sm font-semibold truncate">{customer.full_name}</p>
                <p className="text-obsidian-400 text-xs">{customer.phone}</p>
              </div>

              {/* Tier */}
              <div
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase flex-shrink-0"
                style={{ background: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}
              >
                ◈ {card.current_tier}
              </div>

              {/* Points */}
              <div className="text-right flex-shrink-0">
                <p className="text-obsidian-900 font-bold text-sm tabular-nums">
                  {card.total_points.toLocaleString()}
                  <span className="text-obsidian-400 text-xs font-normal ml-0.5">pts</span>
                </p>
                <p className="text-obsidian-400 text-[10px]">{formatLastVisit(card.updated_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
