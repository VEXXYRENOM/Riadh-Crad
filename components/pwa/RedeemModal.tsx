'use client';
/**
 * @file components/pwa/RedeemModal.tsx
 * @description Customer-facing points redemption modal.
 *
 *  Flow:
 *   1. Customer taps "Use My Points"
 *   2. Selects how many points to redeem
 *   3. Confirms → calls /api/loyalty/redeem
 *   4. Shows success animation with points deducted
 *
 *  Rules enforced client-side:
 *   - Cannot redeem more than current balance
 *   - Minimum 50 points per redemption
 */

import { useState, useCallback, useEffect } from 'react';

interface RedeemModalProps {
  isOpen:        boolean;
  onClose:       () => void;
  merchantId:    string;
  merchantName:  string;
  totalPoints:   number;
  pointsPerDinar: number;
  onSuccess:     (pointsRedeemed: number, newTotal: number) => void;
}

const PRESET_AMOUNTS = [50, 100, 200, 500];
const MIN_REDEEM = 50;

export function RedeemModal({
  isOpen, onClose, merchantId, merchantName,
  totalPoints, pointsPerDinar, onSuccess,
}: RedeemModalProps) {
  const [points, setPoints]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [step, setStep]       = useState<'INPUT' | 'SUCCESS'>('INPUT');
  const [redeemed, setRedeemed] = useState<{ pts: number; newTotal: number } | null>(null);

  const parsedPoints = parseInt(points) || 0;
  const dinarsValue  = (parsedPoints / pointsPerDinar).toFixed(3);
  const isValid      = parsedPoints >= MIN_REDEEM && parsedPoints <= totalPoints;

  useEffect(() => {
    if (isOpen) {
      setPoints('');
      setError(null);
      setStep('INPUT');
      setRedeemed(null);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleRedeem = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);

    try {
      const res  = await fetch('/api/loyalty/redeem', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ merchantId, points: parsedPoints }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message ?? 'Redemption failed. Please try again.');
        return;
      }

      setRedeemed({ pts: data.points_redeemed, newTotal: data.total_points });
      setStep('SUCCESS');
      onSuccess(data.points_redeemed, data.total_points);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [isValid, merchantId, parsedPoints, onSuccess]);

  if (!isOpen) return null;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-obsidian-900/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">

        {/* Header */}
        <div
          className="px-6 pt-6 pb-5 border-b border-gold-100"
          style={{ background: 'linear-gradient(135deg, #FFFDF0, #FDF9D7)' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-obsidian-100 hover:bg-obsidian-200 flex items-center justify-center text-obsidian-500 text-sm transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-xl shadow-md">
              🎁
            </div>
            <div>
              <p className="text-obsidian-900 font-bold text-base">Use My Points</p>
              <p className="text-obsidian-400 text-xs">Redeem at {merchantName}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === 'INPUT' && (
            <div className="flex flex-col gap-4">

              {/* Balance chip */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-obsidian-50 border border-obsidian-100">
                <span className="text-obsidian-500 text-xs font-medium">Available Balance</span>
                <span className="text-obsidian-900 font-bold text-lg">
                  {totalPoints.toLocaleString()}
                  <span className="text-xs text-gold-600 font-semibold ml-1">pts</span>
                </span>
              </div>

              {/* Preset quick amounts */}
              <div>
                <p className="text-obsidian-500 text-xs font-medium mb-2">Quick Select</p>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      disabled={amt > totalPoints}
                      onClick={() => { setPoints(String(amt)); setError(null); }}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-all
                        ${parsedPoints === amt
                          ? 'bg-obsidian-900 text-white border-obsidian-900'
                          : 'bg-white text-obsidian-700 border-gold-200 hover:border-gold-400 hover:bg-gold-50'}
                        disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount input */}
              <div>
                <label htmlFor="redeem-points-input" className="text-obsidian-500 text-xs font-medium block mb-2">
                  Or enter amount
                </label>
                <div className="relative">
                  <input
                    id="redeem-points-input"
                    type="number"
                    min={MIN_REDEEM}
                    max={totalPoints}
                    step="50"
                    placeholder={`Min ${MIN_REDEEM} pts`}
                    value={points}
                    onChange={(e) => { setPoints(e.target.value); setError(null); }}
                    className="w-full border border-gold-200 rounded-xl px-4 py-3 text-lg font-bold text-obsidian-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200 bg-white pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-600 text-sm font-bold">pts</span>
                </div>
              </div>

              {/* Value preview */}
              {parsedPoints > 0 && (
                <div
                  className="rounded-xl p-4 flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg, #FFFDF0, #FDF9D7)', border: '1px solid rgba(212,175,55,0.25)' }}
                >
                  <div>
                    <p className="text-obsidian-400 text-xs">You redeem</p>
                    <p className="text-gold-600 text-2xl font-black">{parsedPoints.toLocaleString()} pts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-obsidian-400 text-xs">Equals</p>
                    <p className="text-obsidian-900 text-xl font-bold">{dinarsValue}
                      <span className="text-sm font-normal text-obsidian-400 ml-1">TND</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                  <span className="text-red-500 text-sm">⚠ {error}</span>
                </div>
              )}

              {/* Validation hint */}
              {parsedPoints > 0 && !isValid && (
                <p className="text-red-400 text-xs text-center">
                  {parsedPoints < MIN_REDEEM
                    ? `Minimum redemption is ${MIN_REDEEM} points`
                    : `You only have ${totalPoints} points available`}
                </p>
              )}

              {/* Confirm button */}
              <button
                onClick={handleRedeem}
                disabled={!isValid || loading}
                className="w-full py-4 rounded-2xl font-bold text-sm text-obsidian-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: isValid && !loading
                    ? 'linear-gradient(135deg, #D4AF37, #B89020)'
                    : '#E5D7C4',
                  boxShadow: isValid && !loading ? '0 8px 24px rgba(212,175,55,0.35)' : 'none',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-obsidian-900/30 border-t-obsidian-900 rounded-full animate-spin" />
                    Processing…
                  </span>
                ) : isValid ? (
                  `Redeem ${parsedPoints.toLocaleString()} pts → ${dinarsValue} TND`
                ) : (
                  'Select an amount to continue'
                )}
              </button>

              <p className="text-obsidian-300 text-[10px] text-center">
                Present this screen to the cashier to complete your redemption
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'SUCCESS' && redeemed && (
            <div className="flex flex-col items-center gap-5 py-4 animate-scale-in">
              {/* Success orb */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-gold-glow-lg text-4xl"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #8B6914)' }}>
                  🎁
                </div>
                <div className="absolute inset-0 rounded-full animate-nfc-pulse border-2 border-gold-400" />
              </div>

              <div className="text-center">
                <p className="text-obsidian-900 font-black text-2xl mb-1">Redeemed!</p>
                <p className="text-obsidian-400 text-sm">Show this screen to the cashier</p>
              </div>

              <div
                className="w-full rounded-2xl p-5 text-center"
                style={{ background: 'linear-gradient(135deg, #FFFDF0, #FDF9D7)', border: '1px solid rgba(212,175,55,0.30)' }}
              >
                <p className="text-obsidian-400 text-xs mb-1">Points Used</p>
                <p className="text-4xl font-black text-obsidian-900">
                  −{redeemed.pts.toLocaleString()}
                  <span className="text-gold-600 text-lg ml-1">pts</span>
                </p>
                <p className="text-obsidian-500 text-sm mt-3">
                  Remaining balance:{' '}
                  <span className="font-bold text-obsidian-800">{redeemed.newTotal.toLocaleString()} pts</span>
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 rounded-2xl font-bold text-sm text-obsidian-900"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B89020)' }}
              >
                Done ✓
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
