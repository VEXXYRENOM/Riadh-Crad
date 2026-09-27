/**
 * @file components/pwa/PointsCounter.tsx
 * @description Animated large points balance display with gold gradient text.
 *              Uses a CSS counter animation driven by a CSS custom property.
 */

'use client';

import { useEffect, useRef } from 'react';

interface PointsCounterProps {
  points: number;
  label?: string;
}

export function PointsCounter({ points, label = 'Your Balance' }: PointsCounterProps) {
  const displayRef = useRef<HTMLSpanElement>(null);

  // Count-up animation from 0 → points
  useEffect(() => {
    const el = displayRef.current;
    if (!el) return;

    const duration = 1200;
    const start    = performance.now();
    const from     = 0;

    const tick = (now: number) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const value  = Math.round(from + (points - from) * eased);
      el.textContent = value.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [points]);

  return (
    <div
      className="flex flex-col items-center gap-1 animate-fade-up"
      style={{ animationDelay: '0.1s' }}
    >
      <p className="label-gold">{label}</p>

      <div className="flex items-baseline gap-2">
        <span
          ref={displayRef}
          className="text-gold-gradient font-display text-6xl font-semibold tabular-nums leading-none"
          aria-live="polite"
          aria-label={`${points} points`}
        >
          0
        </span>
        <span className="text-obsidian-400 text-lg font-medium">pts</span>
      </div>
    </div>
  );
}
