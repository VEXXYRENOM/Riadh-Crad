/**
 * @file components/dashboard/KpiCards.tsx
 * @description 4-up KPI summary cards for the merchant dashboard header.
 *              Renders total customers, points outstanding, 30-day revenue,
 *              and member tier breakdown — all from the dashboard summary view.
 */

import type { MerchantDashboardSummaryRow } from '@/types';
import { ChartNoAxesCombined, Crown, Gem, UsersRound } from 'lucide-react';

interface KpiCardsProps {
  summary: MerchantDashboardSummaryRow;
}

interface KpiCardData {
  id:       string;
  label:    string;
  value:    string;
  sub?:     string;
  icon:     React.ElementType;
  accent:   string;
  delay:    string;
}

export function KpiCards({ summary }: KpiCardsProps) {
  const cards: KpiCardData[] = [
    {
      id:     'total-members',
      label:  'Total Members',
      value:  summary.total_customers.toLocaleString(),
      sub:    `${summary.platinum_members} Platinum · ${summary.gold_members} Gold`,
      icon:   UsersRound,
      accent: 'from-[#FFFDF9] to-[#F8F0E4] border-[#E7D2AE]',
      delay:  '0s',
    },
    {
      id:     'points-outstanding',
      label:  'Points Outstanding',
      value:  summary.total_points_outstanding.toLocaleString(),
      sub:    `${summary.total_points_ever_issued.toLocaleString()} issued all-time`,
      icon:   Gem,
      accent: 'from-[#FFF8E6] to-[#F5DFAB] border-[#E9C56F]/60',
      delay:  '0.06s',
    },
    {
      id:     'revenue-30d',
      label:  'Revenue (30 days)',
      value:  `${summary.revenue_30d.toLocaleString('en-TN', { minimumFractionDigits: 2 })} TND`,
      sub:    `${summary.points_issued_30d.toLocaleString()} pts awarded`,
      icon:   ChartNoAxesCombined,
      accent: 'from-[#FFFDF9] to-[#F5EEE4] border-[#E6D7C4]',
      delay:  '0.12s',
    },
    {
      id:     'tier-split',
      label:  'Tier Breakdown',
      value:  `${summary.platinum_members + summary.gold_members} VIP`,
      sub:    `${summary.silver_members} Silver · ${summary.bronze_members} Bronze`,
      icon:   Crown,
      accent: 'from-[#2B231C] to-[#4B3520] border-[#9F722E]/60',
      delay:  '0.18s',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isDark = card.id === 'tier-split';
        return (
        <div
          key={card.id}
          id={card.id}
          className={`group relative overflow-hidden rounded-[1.35rem] border bg-gradient-to-br ${card.accent} p-5 shadow-[0_18px_36px_-25px_rgba(73,49,16,0.42)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(112,73,16,0.42)] animate-fade-up`}
          style={{ animationDelay: card.delay }}
        >
          <div className="flex items-start justify-between mb-3">
            <span className={isDark ? 'text-[10px] font-bold tracking-[0.15em] text-[#F5D67F]' : 'label-gold'}>{card.label}</span>
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${isDark ? 'bg-[#F3D277]/15 text-[#F3D277]' : 'bg-white/75 text-[#A66B18] shadow-sm'}`}><Icon className="h-5 w-5" /></span>
          </div>
          <p className={`${isDark ? 'text-white' : 'text-obsidian-900'} text-3xl font-bold font-display leading-tight mb-1`}>
            {card.value}
          </p>
          {card.sub && (
            <p className={`${isDark ? 'text-white/55' : 'text-obsidian-500'} text-xs leading-relaxed`}>{card.sub}</p>
          )}
        </div>
      );
      })}
    </div>
  );
}
