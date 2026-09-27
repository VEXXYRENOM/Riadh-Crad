/**
 * @file components/pwa/VipCard.tsx
 * @description The hero VIP loyalty card — luxury dark obsidian with
 *              fluid metallic gold accents, NFC chip graphic, and
 *              animated shimmer sweep. Matches ISO 7810 aspect ratio.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { LoyaltyTier } from '@/types';

interface VipCardProps {
  merchantName: string;
  merchantLogoUrl?: string | null;
  customerName: string;
  cardId: string;
  tier: LoyaltyTier;
  totalPoints: number;
}

const TIER_CONFIG: Record<LoyaltyTier, { label: string; color: string; icon: string }> = {
  BRONZE:   { label: 'Bronze',   color: '#CD7F32', icon: '◈' },
  SILVER:   { label: 'Silver',   color: '#C0C0C0', icon: '◈' },
  GOLD:     { label: 'Gold',     color: '#D4AF37', icon: '◈' },
  PLATINUM: { label: 'Platinum', color: '#B0C4DE', icon: '◈' },
};

export function VipCard({
  merchantName,
  merchantLogoUrl,
  customerName,
  cardId,
  tier,
  totalPoints,
}: VipCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const tierCfg = TIER_CONFIG[tier];

  // Draw subtle circuit pattern on canvas for card texture
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = 'rgba(212,175,55,0.06)';
    ctx.lineWidth = 1;

    // Draw subtle grid lines
    const w = rect.width;
    const h = rect.height;
    for (let x = 0; x < w; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }, []);

  // Format card ID as last 8 chars grouped
  const maskedId = `•••• •••• ${cardId.slice(-8, -4).toUpperCase()} ${cardId.slice(-4).toUpperCase()}`;

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 7;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -7;
    setTilt({ x: y, y: x });
  };

  return (
    <div
      className="vip-card w-full max-w-sm mx-auto select-none"
      style={{ perspective: '1000px', transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)` }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      {/* Circuit texture canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded-card pointer-events-none"
        aria-hidden="true"
      />

      {/* Gold ambient orb top-right */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        aria-hidden="true"
      />

      {/* Card content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6">

        {/* Top row: logo + tier badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {merchantLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={merchantLogoUrl}
                alt={merchantName}
                className="w-9 h-9 rounded-full object-cover border border-gold-500/30"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-obsidian-900 font-bold text-sm"
                style={{ background: 'var(--gradient-fluid-gold)' }}
              >
                {merchantName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-gold-300 text-[10px] font-semibold tracking-widest uppercase">
                RIADH CARD
              </p>
              <p className="text-white/70 text-[11px] font-medium leading-none mt-0.5">
                {merchantName}
              </p>
            </div>
          </div>

          {/* Tier badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${tierCfg.color}22, ${tierCfg.color}44)`,
              border: `1px solid ${tierCfg.color}55`,
            }}
          >
            <span style={{ color: tierCfg.color }} className="text-[10px]">
              {tierCfg.icon}
            </span>
            <span
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: tierCfg.color }}
            >
              {tierCfg.label}
            </span>
          </div>
        </div>

        {/* NFC chip graphic */}
        <div className="flex items-center gap-3">
          <svg
            width="36"
            height="28"
            viewBox="0 0 36 28"
            fill="none"
            aria-hidden="true"
          >
            <rect width="36" height="28" rx="4" fill="url(#chipGrad)" />
            <line x1="0"  y1="9"  x2="36" y2="9"  stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
            <line x1="0"  y1="19" x2="36" y2="19" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
            <line x1="12" y1="0"  x2="12" y2="28" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
            <line x1="24" y1="0"  x2="24" y2="28" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
            <defs>
              <linearGradient id="chipGrad" x1="0" y1="0" x2="36" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#FCF6BA" />
                <stop offset="50%"  stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#AA771C" />
              </linearGradient>
            </defs>
          </svg>

          {/* Contactless waves */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M${5 + i * 4} ${12 - i * 2} Q${12} ${4 + i * 2} ${19 - i * 4} ${12 - i * 2}`}
                stroke={`rgba(212,175,55,${0.8 - i * 0.2})`}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </svg>
        </div>

        {/* Bottom: points + customer name */}
        <div>
          {/* Points */}
          <div className="mb-3">
            <p className="text-gold-200/60 text-[9px] font-semibold tracking-widest uppercase mb-1">
              Balance
            </p>
            <p className="text-gold-gradient-static text-3xl font-bold font-display leading-none">
              {totalPoints.toLocaleString()}
              <span className="text-lg font-normal ml-1 text-gold-400/80"> pts</span>
            </p>
          </div>

          {/* Card number + name row */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/40 text-[9px] tracking-widest font-mono mb-0.5">
                {maskedId}
              </p>
              <p className="text-white text-sm font-semibold tracking-wide uppercase">
                {customerName}
              </p>
            </div>

            {/* RIADH CARD wordmark */}
            <p className="text-gold-500/60 text-[10px] font-display italic font-medium">
              RIADH CARD™
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
