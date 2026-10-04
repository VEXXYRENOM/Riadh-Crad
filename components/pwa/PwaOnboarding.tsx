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
  const [email, setEmail]       = useState('');
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
          email: email.trim() || undefined,
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
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="heading-luxury text-2xl text-obsidian-900 mb-1">Join the Club</h1>
              <p className="text-obsidian-500 text-sm">Join the loyalty programme instantly.</p>
            </div>

            {/* ── Google Sign-In ─────────────────────────────── */}
            <a
              id="google-signin-btn"
              href={`/api/auth/google?merchantId=${encodeURIComponent(merchantId)}&slug=${encodeURIComponent(slug)}&next=${encodeURIComponent(`/b/${slug}`)}`}
              className="flex items-center justify-center gap-3 w-full rounded-xl border border-obsidian-200 bg-white hover:bg-obsidian-50 active:scale-[0.98] transition-all duration-150 px-4 py-3 text-obsidian-800 font-semibold text-sm shadow-sm"
            >
              {/* Google G logo SVG */}
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </a>

            {/* ── Divider ────────────────────────────────────── */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-obsidian-100" />
              <span className="text-obsidian-300 text-xs font-medium">or use phone number</span>
              <div className="flex-1 h-px bg-obsidian-100" />
            </div>

            {/* ── Phone form ─────────────────────────────────── */}
            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
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
              <button type="submit" className="btn-gold w-full">Continue with Phone →</button>
            </form>
          </div>
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
            <div>
              <label htmlFor="email-input" className="label-gold mb-2 block">Email Address (Optional)</label>
              <input
                id="email-input"
                type="email"
                autoComplete="email"
                placeholder="ahmed@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-gold"
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
