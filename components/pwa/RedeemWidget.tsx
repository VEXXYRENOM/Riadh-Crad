'use client';
/**
 * @file components/pwa/RedeemWidget.tsx
 * @description Inline "Use My Points" button that opens the RedeemModal.
 *              This is the client-side glue between the server PWA page
 *              and the interactive RedeemModal.
 */

import { useState } from 'react';
import { RedeemModal } from './RedeemModal';

interface RedeemWidgetProps {
  merchantId:     string;
  merchantName:   string;
  totalPoints:    number;
  pointsPerDinar: number;
}

export function RedeemWidget({
  merchantId, merchantName, totalPoints, pointsPerDinar,
}: RedeemWidgetProps) {
  const [open, setOpen]           = useState(false);
  const [currentPoints, setCurrentPoints] = useState(totalPoints);

  const handleSuccess = (pointsRedeemed: number, newTotal: number) => {
    setCurrentPoints(newTotal);
  };

  const canRedeem = currentPoints >= 50;

  return (
    <>
      <div className="w-full max-w-sm mx-auto animate-fade-up" style={{ animationDelay: '0.35s' }}>
        <button
          onClick={() => canRedeem && setOpen(true)}
          disabled={!canRedeem}
          className={[
            'w-full rounded-card px-6 py-5 flex items-center gap-5 transition-all duration-300',
            'border relative overflow-hidden select-none',
            canRedeem
              ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]'
              : 'cursor-not-allowed opacity-50',
          ].join(' ')}
          style={{
            background: canRedeem
              ? 'linear-gradient(135deg, #FFFDF0, #FDF9D7)'
              : '#F9FAFB',
            borderColor: canRedeem ? 'rgba(212,175,55,0.40)' : '#E5E7EB',
            boxShadow: canRedeem ? '0 4px 20px rgba(212,175,55,0.15)' : 'none',
          }}
          aria-label="Redeem points"
        >
          {/* Icon */}
          <div className={[
            'w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0',
            canRedeem ? 'shadow-gold-glow' : '',
          ].join(' ')}
            style={{
              background: canRedeem
                ? 'linear-gradient(135deg, #D4AF37, #8B6914)'
                : '#E5E7EB',
            }}
          >
            🎁
          </div>

          {/* Text */}
          <div className="text-left flex-1">
            <p className={[
              'font-semibold text-base leading-tight',
              canRedeem ? 'text-obsidian-900' : 'text-obsidian-400',
            ].join(' ')}>
              {canRedeem ? 'Use My Points' : 'Not Enough Points'}
            </p>
            <p className={[
              'text-xs mt-0.5',
              canRedeem ? 'text-gold-700' : 'text-obsidian-300',
            ].join(' ')}>
              {canRedeem
                ? `${currentPoints.toLocaleString()} pts → ${(currentPoints / pointsPerDinar).toFixed(3)} TND`
                : `Minimum 50 pts required`}
            </p>
          </div>

          {/* Arrow */}
          {canRedeem && (
            <svg className="w-5 h-5 text-gold-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      <RedeemModal
        isOpen={open}
        onClose={() => setOpen(false)}
        merchantId={merchantId}
        merchantName={merchantName}
        totalPoints={currentPoints}
        pointsPerDinar={pointsPerDinar}
        onSuccess={handleSuccess}
      />
    </>
  );
}
