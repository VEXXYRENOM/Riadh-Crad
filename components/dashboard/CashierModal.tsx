/**
 * @file components/dashboard/CashierModal.tsx
 * @description Ultra-luxury cashier modal — opens when an NFC tap arrives.
 *
 *              Displays customer info, live point preview, bill amount input,
 *              and calls the award_points() RPC on confirm.
 *
 *              States: AWAITING_AMOUNT → CONFIRMING → SUCCESS | ERROR
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { NfcEventRow, LoyaltyCardRow, LoyaltyTier } from '@/types';

interface CashierModalProps {
  isOpen:       boolean;
  nfcEvent:     NfcEventRow | null;
  card:         Pick<LoyaltyCardRow, 'id' | 'total_points' | 'current_tier'> | null;
  customerName: string;
  customerPhone:string;
  merchantId:   string;
  pointsPerDinar: number;
  onClose:      () => void;
  onSuccess:    (pointsAdded: number, newTotal: number) => void;
}

type ModalStep = 'AWAITING_AMOUNT' | 'CONFIRMING' | 'SUCCESS' | 'ERROR';

const TIER_COLORS: Record<LoyaltyTier, string> = {
  BRONZE:   '#CD7F32',
  SILVER:   '#C0C0C0',
  GOLD:     '#D4AF37',
  PLATINUM: '#B0C4DE',
};

export function CashierModal({
  isOpen, nfcEvent, card, customerName, customerPhone,
  merchantId, pointsPerDinar, onClose, onSuccess,
}: CashierModalProps) {
  const [step, setStep]       = useState<ModalStep>('AWAITING_AMOUNT');
  const [amount, setAmount]   = useState('');
  const [error, setError]     = useState<string | null>(null);
  const [result, setResult]   = useState<{ pointsAdded: number; newTotal: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  const projectedPoints = Math.floor((parseFloat(amount) || 0) * pointsPerDinar);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setStep('AWAITING_AMOUNT');
      setAmount('');
      setError(null);
      setResult(null);
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleConfirm = useCallback(async () => {
    const billAmt = parseFloat(amount);
    if (!billAmt || billAmt <= 0) {
      setError('Please enter a valid bill amount.');
      return;
    }
    if (!card && !nfcEvent) {
      setError('No customer card linked. Please try again.');
      return;
    }

    setStep('CONFIRMING');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/loyalty/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          customerId:  nfcEvent?.customer_id ?? null,
          amountTnd:   billAmt,
          nfcEventId:  nfcEvent?.id ?? null,
          source:      'NFC',
        }),
      });

      const data: {
        success: boolean;
        points_added?: number;
        total_points?: number;
        message?: string;
      } = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message ?? 'Failed to award points. Please retry.');
        setStep('ERROR');
        return;
      }

      setResult({ pointsAdded: data.points_added!, newTotal: data.total_points! });
      setStep('SUCCESS');
      onSuccess(data.points_added!, data.total_points!);
    } catch {
      setError('Network error. Please check your connection.');
      setStep('ERROR');
    } finally {
      setLoading(false);
    }
  }, [amount, card, nfcEvent, merchantId, onSuccess]);

  if (!isOpen) return null;

  const tier = card?.current_tier ?? 'BRONZE';
  const tierColor = TIER_COLORS[tier];

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Award Points"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-panel w-full overflow-hidden">

        {/* ── Header ──────────────────────────────────────── */}
        <div
          className="px-6 pt-6 pb-5 border-b border-gold-100 relative"
          style={{ background: 'linear-gradient(135deg, #FFFDF0, #FDF9D7)' }}
        >
          {/* Close button */}
          <button
            id="cashier-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-obsidian-100 hover:bg-obsidian-200 transition-colors flex items-center justify-center text-obsidian-500 text-sm focus-gold"
            aria-label="Close modal"
          >
            ✕
          </button>

          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-gold-glow flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${tierColor}99, ${tierColor})` }}
            >
              {customerName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-obsidian-900 font-semibold truncate">{customerName}</p>
              <p className="text-obsidian-400 text-xs">{customerPhone}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
                  style={{
                    color: tierColor,
                    background: `${tierColor}18`,
                    border: `1px solid ${tierColor}44`,
                  }}
                >
                  ◈ {tier}
                </span>
                <span className="text-obsidian-500 text-xs font-medium">
                  {(card?.total_points ?? 0).toLocaleString()} pts balance
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────── */}
        <div className="px-6 py-6">

          {/* AWAITING_AMOUNT */}
          {(step === 'AWAITING_AMOUNT' || step === 'CONFIRMING') && (
            <form 
              onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} 
              className="flex flex-col gap-5"
            >
              <div>
                <label htmlFor="bill-amount-input" className="label-gold mb-2 block">
                  Bill Amount (TND)
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="bill-amount-input"
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setAmount(e.target.value); setError(null); }}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleConfirm()}
                    className="input-gold pr-14 text-xl font-bold"
                    disabled={loading}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-obsidian-400 text-sm font-medium">
                    TND
                  </span>
                </div>
              </div>

              {/* Live point preview */}
              <div
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #FFFDF0, #FDF9D7)', border: '1px solid rgba(212,175,55,0.25)' }}
              >
                <div>
                  <p className="label-gold">Points to Award</p>
                  <p className="text-obsidian-900 text-3xl font-bold font-display mt-0.5">
                    <span className="text-gold-gradient-static">+{projectedPoints.toLocaleString()}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="label-gold">New Balance</p>
                  <p className="text-obsidian-700 text-xl font-semibold mt-0.5">
                    {((card?.total_points ?? 0) + projectedPoints).toLocaleString()}
                    <span className="text-sm font-normal text-obsidian-400 ml-1">pts</span>
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                  <span className="text-red-500 text-sm">⚠ {error}</span>
                </div>
              )}

              <button
                id="confirm-award-btn"
                onClick={handleConfirm}
                disabled={loading || !amount || projectedPoints <= 0}
                className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-obsidian-900/30 border-t-obsidian-900 rounded-full animate-spin" />
                    Awarding…
                  </span>
                ) : (
                  `Confirm — Award +${projectedPoints.toLocaleString()} pts`
                )}
              </button>
            </form>
          )}

          {/* SUCCESS */}
          {step === 'SUCCESS' && result && (
            <div className="flex flex-col items-center gap-5 py-4 animate-scale-in">
              {/* Success orb */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-fluid-gold flex items-center justify-center shadow-gold-glow-lg">
                  <span className="text-3xl">✦</span>
                </div>
                <div className="absolute inset-0 rounded-full animate-nfc-pulse border-2 border-gold-400" />
              </div>

              <div className="text-center">
                <p className="heading-luxury text-2xl text-obsidian-900 mb-1">Points Awarded!</p>
                <p className="text-obsidian-500 text-sm">Transaction complete</p>
              </div>

              <div
                className="w-full rounded-xl p-5 text-center"
                style={{ background: 'linear-gradient(135deg, #FFFDF0, #FDF9D7)', border: '1px solid rgba(212,175,55,0.30)' }}
              >
                <p className="label-gold mb-1">Points Added</p>
                <p className="text-gold-gradient-static text-5xl font-bold font-display">
                  +{result.pointsAdded.toLocaleString()}
                </p>
                <p className="text-obsidian-500 text-sm mt-2">
                  New balance:{' '}
                  <span className="font-bold text-obsidian-700">
                    {result.newTotal.toLocaleString()} pts
                  </span>
                </p>
              </div>

              <button
                id="cashier-done-btn"
                onClick={onClose}
                className="btn-gold w-full"
              >
                Done ✓
              </button>
            </div>
          )}

          {/* ERROR */}
          {step === 'ERROR' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl">
                ✕
              </div>
              <div className="text-center">
                <p className="heading-luxury text-xl text-obsidian-900 mb-1">Something went wrong</p>
                <p className="text-red-500 text-sm">{error}</p>
              </div>
              <button
                onClick={() => { setStep('AWAITING_AMOUNT'); setError(null); }}
                className="btn-ghost-gold w-full"
              >
                ← Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
