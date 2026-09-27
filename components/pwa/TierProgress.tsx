/**
 * @file components/pwa/TierProgress.tsx
 * @description Animated tier progress bar with next-tier milestone display.
 *              Shows current tier, animated fill, and points to next tier.
 */

'use client';

import { useEffect, useRef } from 'react';
import type { LoyaltyTier } from '@/types';

interface TierProgressProps {
  currentTier: LoyaltyTier;
  lifetimePoints: number;
  tierThresholds: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
  };
}

const TIER_ORDER: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

const TIER_DISPLAY: Record<LoyaltyTier, { label: string; emoji: string; color: string; bg: string }> = {
  BRONZE:   { label: 'Bronze',   emoji: '🥉', color: '#CD7F32', bg: 'bg-amber-50   border-amber-200' },
  SILVER:   { label: 'Silver',   emoji: '🥈', color: '#9CA3AF', bg: 'bg-slate-50   border-slate-200' },
  GOLD:     { label: 'Gold',     emoji: '🏅', color: '#D4AF37', bg: 'bg-yellow-50  border-yellow-200' },
  PLATINUM: { label: 'Platinum', emoji: '💎', color: '#B0C4DE', bg: 'bg-blue-50    border-blue-100'  },
};

export function TierProgress({ currentTier, lifetimePoints, tierThresholds }: TierProgressProps) {
  const fillRef = useRef<HTMLDivElement>(null);

  const currentIdx  = TIER_ORDER.indexOf(currentTier);
  const nextTier    = TIER_ORDER[currentIdx + 1] as LoyaltyTier | undefined;
  const isPlatinum  = currentTier === 'PLATINUM';

  // Calculate progress within current tier
  const tierStart   = tierThresholds[currentTier];
  const tierEnd     = nextTier ? tierThresholds[nextTier] : tierThresholds.PLATINUM;
  const progress    = isPlatinum
    ? 100
    : Math.min(((lifetimePoints - tierStart) / (tierEnd - tierStart)) * 100, 100);
  const pointsLeft  = isPlatinum ? 0 : Math.max(tierEnd - lifetimePoints, 0);

  // Animate fill bar on mount
  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    el.style.width = '0%';
    const raf = requestAnimationFrame(() => {
      setTimeout(() => {
        el.style.width = `${progress}%`;
      }, 300);
    });
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  const cfg = TIER_DISPLAY[currentTier];

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>

      {/* Tier badges row */}
      <div className="flex justify-between mb-3">
        {TIER_ORDER.map((tier, idx) => {
          const t   = TIER_DISPLAY[tier];
          const active   = tier === currentTier;
          const achieved = idx <= currentIdx;

          return (
            <div key={tier} className="flex flex-col items-center gap-1">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-500',
                  achieved
                    ? 'shadow-gold-glow scale-110'
                    : 'opacity-30 scale-90',
                  active ? 'ring-2 ring-offset-2' : '',
                ].join(' ')}
                style={{
                  background: achieved ? `linear-gradient(135deg, ${t.color}88, ${t.color})` : 'transparent',
                  border: achieved ? 'none' : `1px solid ${t.color}44`,
                  '--tw-ring-color': active ? t.color : 'transparent',
                } as React.CSSProperties}
              >
                <span className={achieved ? 'text-white' : ''} style={{ color: achieved ? 'white' : t.color }}>
                  {t.emoji}
                </span>
              </div>
              <span
                className="text-[9px] font-semibold tracking-wide uppercase"
                style={{ color: achieved ? t.color : '#94A3B8' }}
              >
                {t.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress track */}
      <div className="progress-gold mb-2.5">
        <div
          ref={fillRef}
          className="progress-gold-fill"
          style={{
            width: '0%',
            transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color}, #FCF6BA)`,
          }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Tier progress: ${Math.round(progress)}%`}
        />
      </div>

      {/* Points label */}
      {isPlatinum ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <span className="label-gold">✦ Platinum Member — Maximum Tier Achieved</span>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-obsidian-500 text-xs">
            <span className="font-semibold text-obsidian-700">
              {lifetimePoints.toLocaleString()} pts
            </span>
            {' '}lifetime
          </p>
          <p className="text-xs" style={{ color: TIER_DISPLAY[nextTier!].color }}>
            <span className="font-bold">{pointsLeft.toLocaleString()} pts</span>
            {' '}to {TIER_DISPLAY[nextTier!].label} {TIER_DISPLAY[nextTier!].emoji}
          </p>
        </div>
      )}
    </div>
  );
}
