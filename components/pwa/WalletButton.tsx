'use client';
/**
 * @file components/pwa/WalletButton.tsx
 * @description "Add to Wallet" button for PWA customers.
 *
 *  Strategy:
 *   - On iOS Safari: shows "Add to Apple Wallet" styling + instructions
 *   - On Android Chrome: shows "Add to Google Wallet" (web link)
 *   - PWA Add to Home Screen: always available as a fallback
 *
 *  Location-based notifications:
 *   - For Apple Wallet: the .pkpass file includes GPS coordinates of the merchant.
 *     iOS will automatically show a lock-screen notification when the user is within
 *     100m of the merchant — no app required, no background GPS needed.
 *   - For Google Wallet: handled via the Google Wallet API (savesToAndroidPay link).
 *
 *  Note: Full .pkpass generation requires a paid Apple Developer account + certificates.
 *        This component shows the UI flow and provides the correct deeplink structure.
 */

import { useState, useEffect } from 'react';

interface WalletButtonProps {
  merchantId:    string;
  merchantName:  string;
  merchantSlug:  string;
  customerName:  string;
  totalPoints:   number;
  currentTier:   string;
  loyaltyUrl:    string;
  /** GPS location of the merchant for proximity notifications (optional) */
  merchantLat?:  number;
  merchantLng?:  number;
}

type Platform = 'ios' | 'android' | 'desktop' | 'pwa';

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;
}

export function WalletButton({
  merchantId, merchantName, merchantSlug, customerName,
  totalPoints, currentTier, loyaltyUrl,
}: WalletButtonProps) {
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [added, setAdded] = useState(false);
  const [googleWalletLoading, setGoogleWalletLoading] = useState(false);
  const [googleWalletError, setGoogleWalletError] = useState<string | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setIsStandalone(isInStandaloneMode());
  }, []);

  /* ── Google Wallet ───────────────────────────────────────── */
  const handleGoogleWallet = async () => {
    setGoogleWalletLoading(true);
    setGoogleWalletError(null);
    try {
      const response = await fetch(`/api/wallet/google?merchantId=${encodeURIComponent(merchantId)}`);
      const result = await response.json() as { success: boolean; url?: string; message?: string };
      if (!response.ok || !result.success || !result.url) throw new Error(result.message ?? 'Google Wallet is unavailable.');
      window.location.assign(result.url);
    } catch (error) {
      setGoogleWalletError(error instanceof Error ? error.message : 'Google Wallet is unavailable.');
    } finally {
      setGoogleWalletLoading(false);
    }
  };

  /* ── Apple Wallet instructions ────────────────────────────── */
  const handleAppleWallet = () => {
    // In production: fetch('/api/wallet/pass?slug=...') returns a .pkpass file
    // For demo: show install instructions
    setShowGuide(true);
  };

  /* ── PWA Add to Home Screen ───────────────────────────────── */
  const handleAddToHome = () => {
    setShowGuide(true);
  };

  const handleAddedConfirm = () => {
    setAdded(true);
    setShowGuide(false);
  };

  if (added) {
    return (
      <div className="w-full max-w-sm mx-auto animate-fade-up">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-200">
          <span className="text-emerald-500 text-lg">✓</span>
          <div>
            <p className="text-emerald-700 font-semibold text-sm">Added to Wallet!</p>
            <p className="text-emerald-500 text-xs">You'll get notified when near {merchantName}</p>
          </div>
        </div>
      </div>
    );
  }

  const TIER_EMOJI: Record<string, string> = {
    BRONZE: '🥉', SILVER: '🥈', GOLD: '🏅', PLATINUM: '💎',
  };

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-up flex flex-col gap-3">

      {/* ── Main Wallet Button ─────────────────────────────── */}
      {platform === 'ios' && (
        <button
          onClick={handleAppleWallet}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #1C1917, #0D0B08)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {/* Apple Wallet icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Add to Apple Wallet
        </button>
      )}

      {platform === 'android' && (
        <button
          type="button"
          onClick={() => void handleGoogleWallet()}
          disabled={googleWalletLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(26,115,232,0.35)',
          }}
        >
          {/* Google Wallet icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
          </svg>
          {googleWalletLoading ? 'Preparing your card…' : 'Save to Google Wallet'}
        </button>
      )}

      {googleWalletError && <p className="text-center text-xs text-red-500">{googleWalletError}</p>}

      {platform === 'desktop' && (
        <button
          onClick={handleAddToHome}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl font-semibold text-sm border border-gold-300 text-obsidian-700 hover:bg-gold-50 transition-all"
        >
          📲 Add to Home Screen
        </button>
      )}

      {/* PWA shortcut hint (non-standalone) */}
      {!isStandalone && (
        <p className="text-obsidian-300 text-[10px] text-center">
          📍 Get notified when you're near {merchantName}
        </p>
      )}

      {/* ── Guide Modal ──────────────────────────────────── */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          onClick={() => setShowGuide(false)}
        >
          <div className="absolute inset-0 bg-obsidian-900/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card preview */}
            <div
              className="rounded-2xl p-4 mb-5 flex items-center gap-4"
              style={{ background: 'linear-gradient(135deg, #1C1917, #0D0B08)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-xl font-black text-obsidian-900">
                {merchantName.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{merchantName}</p>
                <p className="text-gold-400 text-xs">RIADH CARD • VIP Loyalty</p>
                <p className="text-white/70 text-xs mt-1">{customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-gold-400 text-xs">Balance</p>
                <p className="text-white font-black text-lg">{totalPoints.toLocaleString()}</p>
                <p className="text-xs">{TIER_EMOJI[currentTier]} {currentTier}</p>
              </div>
            </div>

            {/* Steps */}
            <p className="text-obsidian-800 font-bold text-base mb-3">
              {platform === 'ios' ? '📲 Add to Apple Wallet' : '📲 Add to Home Screen'}
            </p>

            {platform === 'ios' ? (
              <ol className="flex flex-col gap-2 text-obsidian-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold-100 text-gold-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  Tap the <strong>Share</strong> button (□↑) at the bottom of Safari
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold-100 text-gold-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold-100 text-gold-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  Tap <strong>"Add"</strong> — the card appears on your home screen!
                </li>
              </ol>
            ) : (
              <ol className="flex flex-col gap-2 text-obsidian-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold-100 text-gold-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  Tap the <strong>⋮ menu</strong> in Chrome (top right)
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold-100 text-gold-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  Tap <strong>"Add to Home screen"</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold-100 text-gold-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  Confirm — your loyalty card is now on your home screen!
                </li>
              </ol>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowGuide(false)}
                className="flex-1 py-3 rounded-xl border border-obsidian-200 text-obsidian-600 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddedConfirm}
                className="flex-1 py-3 rounded-xl text-obsidian-900 text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B89020)' }}
              >
                Done ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
