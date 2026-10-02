/**
 * @file components/pwa/PwaOnboarding.tsx
 * @description Shown when the user visits /b/[slug] without an account.
 *              Luxury phone number entry form — creates customer + redirects.
 */

'use client';

import { useState, useTransition } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface PwaOnboardingProps {
  merchantId:     string;
  merchantName:   string;
  merchantLogoUrl?: string | null;
  slug:           string;
  referralCode?:  string | null;
}

type Step = 'PHONE' | 'NAME' | 'OTP' | 'LOADING';

// ⚠️ DEV MODE: OTP verification is temporarily bypassed.
// Remove this flag and restore handlePhoneSubmit to re-enable SMS verification.
// Explicit local-only opt-in. This can never be enabled in a production build.
const SKIP_OTP_FOR_DEV = process.env.NODE_ENV !== 'production'
  && process.env.NEXT_PUBLIC_SKIP_OTP_FOR_DEV === 'true';

export function PwaOnboarding({ merchantId, merchantName, merchantLogoUrl, slug, referralCode }: PwaOnboardingProps) {
  const [step, setStep]         = useState<Step>('PHONE');
  const [phone, setPhone]       = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp]           = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createSupabaseBrowserClient();

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setError(null);

    // ⚠️ DEV: Skip OTP — go directly to name step
    if (SKIP_OTP_FOR_DEV) {
      setStep('NAME');
      return;
    }

    setStep('LOADING');
    void supabase.auth.signInWithOtp({ phone: phone.trim() }).then(({ error: otpError }) => {
      if (otpError) {
        setError(otpError.message);
        setStep('PHONE');
        return;
      }
      setStep('OTP');
    });
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setError(null);
    setStep('LOADING');

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: otp.trim(),
      type: 'sms',
    });

    if (verifyError) {
      setError(verifyError.message);
      setStep('OTP');
      return;
    }

    setStep('NAME');
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setError(null);
    setStep('LOADING');

    startTransition(async () => {
      let token: string | undefined;

      if (!SKIP_OTP_FOR_DEV) {
        // Normal flow: get session token after OTP verification
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }

      const res = await fetch('/api/customers/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        // ⚠️ DEV: send phone in body so the API can create the user server-side
        body: JSON.stringify({
          fullName,
          merchantId,
          referralCode,
          ...(SKIP_OTP_FOR_DEV ? { devPhone: phone.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Failed to create your profile. Please try again.');
        setStep('NAME');
        return;
      }

      // Reload the PWA page with session cookie set
      window.location.href = `/b/${slug}`;
    });
  };

  return (
    <main className="customer-shell flex flex-col items-center justify-center min-h-dvh px-5 pb-12 relative overflow-hidden">

      {/* Ambient orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }}
      />

      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-10 animate-fade-up">
        {merchantLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={merchantLogoUrl} alt={merchantName}
            className="w-16 h-16 rounded-full object-cover shadow-gold-glow border-2 border-gold-200" />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-obsidian-900 shadow-gold-glow"
            style={{ background: 'var(--gradient-fluid-gold)' }}>
            {merchantName.charAt(0)}
          </div>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
            <div>
              <h1 className="heading-luxury text-2xl text-obsidian-900 mb-1">Verify your number</h1>
              <p className="text-obsidian-500 text-sm">Enter the code sent to {phone}.</p>
            </div>
            <div>
              <label htmlFor="otp-input" className="label-gold mb-2 block">Verification Code</label>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="input-gold tracking-[0.4em]"
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" className="btn-gold w-full">Verify Code →</button>
            <button type="button" onClick={() => setStep('PHONE')} className="btn-ghost-gold w-full text-sm">
              ← Change number
            </button>
          </form>
        )}
        <div className="text-center">
          <p className="heading-luxury text-xl text-obsidian-900">{merchantName}</p>
          <p className="text-gold-gradient-static text-[11px] font-semibold tracking-widest uppercase mt-0.5">
            RIADH CARD ✦ VIP Loyalty
          </p>
        </div>
      </div>

      {/* Card form */}
      <div className="card-luxury w-full max-w-sm p-7 animate-fade-up" style={{ animationDelay: '0.1s' }}>

        {step === 'PHONE' && (
          <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-5">
            <div>
              <h1 className="heading-luxury text-2xl text-obsidian-900 mb-1">Join the Club</h1>
              <p className="text-obsidian-500 text-sm">Enter your phone number to get your loyalty card.</p>
            </div>
            <div>
              <label htmlFor="phone-input" className="label-gold mb-2 block">Phone Number</label>
              <input
                id="phone-input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+216 XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-gold"
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" className="btn-gold w-full">Continue →</button>
          </form>
        )}

        {step === 'NAME' && (
          <form onSubmit={handleNameSubmit} className="flex flex-col gap-5">
            <div>
              <h1 className="heading-luxury text-2xl text-obsidian-900 mb-1">Your Name</h1>
              <p className="text-obsidian-500 text-sm">This will appear on your VIP card.</p>
            </div>
            <div>
              <label htmlFor="name-input" className="label-gold mb-2 block">Full Name</label>
              <input
                id="name-input"
                type="text"
                autoComplete="name"
                placeholder="Ahmed Ben Ali"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-gold"
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" className="btn-gold w-full" disabled={isPending}>
              {isPending ? 'Activating…' : 'Activate Card ✦'}
            </button>
            <button type="button" onClick={() => setStep('PHONE')} className="btn-ghost-gold w-full text-sm">
              ← Back
            </button>
          </form>
        )}



        {step === 'LOADING' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-14 h-14 rounded-full bg-fluid-gold animate-spin-slow" />
            <p className="text-obsidian-600 text-sm font-medium">Setting up your card…</p>
          </div>
        )}
      </div>

      <p className="text-obsidian-300 text-[10px] mt-6 tracking-wide">
        Powered by <span className="text-gold-gradient-static font-semibold">RIADH CARD™</span>
      </p>
    </main>
  );
}
