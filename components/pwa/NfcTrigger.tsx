/**
 * @file components/pwa/NfcTrigger.tsx
 * @description The hero NFC trigger button — simulates a card tap by inserting
 *              an nfc_events row and subscribing to its status update.
 *
 *              States: IDLE → SCANNING → WAITING → SUCCESS | ERROR
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { NfcEventRow } from '@/types';

type TapState = 'IDLE' | 'SCANNING' | 'WAITING' | 'SUCCESS' | 'ERROR';

interface NfcTriggerProps {
  merchantId: string;
  customerId: string;
  customerName: string;
}

const STATE_COPY: Record<TapState, { headline: string; sub: string; icon: string }> = {
  IDLE:     { headline: 'Present Your Card',      sub: 'Tap to register your visit',          icon: '◉' },
  SCANNING: { headline: 'Scanning…',              sub: 'Hold your card near the terminal',     icon: '◎' },
  WAITING:  { headline: 'Waiting for Cashier',    sub: 'Your visit has been registered',       icon: '⟳' },
  SUCCESS:  { headline: 'Points Awarded!',        sub: 'Your balance has been updated',        icon: '✦' },
  ERROR:    { headline: 'Something went wrong',   sub: 'Please try again or ask your cashier', icon: '✕' },
};

export function NfcTrigger({ merchantId, customerId, customerName }: NfcTriggerProps) {
  const [state, setState]   = useState<TapState>('IDLE');
  const [eventId, setEventId] = useState<string | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  const supabase = createSupabaseBrowserClient();

  // Subscribe to nfc_event status once we have an eventId
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`nfc-status:${eventId}`)
      .on<NfcEventRow>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'nfc_events',
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          const updated = payload.new as Partial<NfcEventRow>;
          if (updated.status === 'RESOLVED') {
            setState('SUCCESS');
            channel.unsubscribe();
          } else if (updated.status === 'FAILED' || updated.status === 'EXPIRED') {
            setState('ERROR');
            channel.unsubscribe();
          }
        },
      )
      .subscribe();

    // Auto-expire waiting state after 90 seconds
    const timeout = setTimeout(() => {
      if (state === 'WAITING') setState('ERROR');
      channel.unsubscribe();
    }, 90_000);

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleTap = useCallback(async () => {
    if (state !== 'IDLE' && state !== 'ERROR') return;

    setState('SCANNING');
    setPointsEarned(null);

    // Simulate NFC scan delay (250ms)
    await new Promise<void>((r) => setTimeout(r, 250));

    const response = await fetch('/api/nfc/tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, customerName }),
    });
    const data = await response.json() as { success: boolean; eventId?: string; message?: string };

    if (!response.ok || !data.success || !data.eventId) {
      console.error('[NfcTrigger] tap error', data.message);
      setState('ERROR');
      return;
    }

    setEventId(data.eventId);
    setState('WAITING');
  }, [state, merchantId, customerId, customerName, supabase]);

  const handleReset = () => {
    setState('IDLE');
    setEventId(null);
    setPointsEarned(null);
  };

  const copy = STATE_COPY[state];
  const isActive = state === 'IDLE' || state === 'ERROR';

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-up" style={{ animationDelay: '0.3s' }}>
      <button
        id="nfc-trigger-btn"
        onClick={isActive ? handleTap : undefined}
        disabled={state === 'SCANNING'}
        className={[
          'w-full rounded-card transition-all duration-500 select-none relative overflow-hidden',
          'focus-gold',
          isActive
            ? 'cursor-pointer active:scale-[0.98]'
            : 'cursor-default',
        ].join(' ')}
        style={{ minHeight: '90px' }}
        aria-label={copy.headline}
      >
        {/* Background layer */}
        <div
          className={[
            'absolute inset-0 rounded-card transition-opacity duration-500',
            state === 'SUCCESS' ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          style={{
            background: 'linear-gradient(135deg, #14532d22, #16a34a44)',
            border: '1px solid #16a34a44',
          }}
        />

        {/* Primary gold background (IDLE / ERROR) */}
        <div
          className={[
            'absolute inset-0 rounded-card transition-opacity duration-500',
            state === 'IDLE' ? 'opacity-100 bg-fluid-gold shimmer-overlay' : 'opacity-0',
          ].join(' ')}
          style={{
            border: '1px solid rgba(212,175,55,0.40)',
          }}
        />

        {/* WAITING pulsing ring background */}
        <div
          className={[
            'absolute inset-0 rounded-card border transition-all duration-500',
            state === 'WAITING' ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          style={{
            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
            borderColor: 'rgba(212,175,55,0.40)',
          }}
        />

        {/* ERROR background */}
        <div
          className={[
            'absolute inset-0 rounded-card border transition-opacity duration-500',
            state === 'ERROR' ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          style={{ background: '#FFF5F5', borderColor: '#FCA5A5' }}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-5 px-6 py-5">
          {/* Icon / pulse ring */}
          <div className="relative flex-shrink-0">
            {/* Outer pulse rings (IDLE + WAITING) */}
            {(state === 'IDLE' || state === 'WAITING') && (
              <>
                <div
                  className="absolute inset-0 rounded-full animate-nfc-pulse"
                  style={{
                    border: `2px solid ${state === 'WAITING' ? 'rgba(212,175,55,0.5)' : 'rgba(15,23,42,0.30)'}`,
                    margin: '-8px',
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full animate-nfc-pulse"
                  style={{
                    border: `2px solid ${state === 'WAITING' ? 'rgba(212,175,55,0.3)' : 'rgba(15,23,42,0.15)'}`,
                    margin: '-16px',
                    animationDelay: '0.5s',
                  }}
                />
              </>
            )}

            {/* Central icon */}
            <div
              className={[
                'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold',
                'transition-all duration-500',
                state === 'IDLE'    ? 'bg-obsidian-900 text-white shadow-gold-glow' : '',
                state === 'SCANNING'? 'bg-gold-500 text-obsidian-900 animate-spin-slow' : '',
                state === 'WAITING' ? 'bg-gold-500/20 text-gold-400 border-2 border-gold-500/40' : '',
                state === 'SUCCESS' ? 'bg-green-500 text-white' : '',
                state === 'ERROR'   ? 'bg-red-100 text-red-500' : '',
              ].join(' ')}
            >
              {state === 'SCANNING' ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" strokeLinecap="round" />
                </svg>
              ) : (
                <span className={state === 'WAITING' ? 'animate-spin' : ''}>
                  {copy.icon}
                </span>
              )}
            </div>
          </div>

          {/* Text */}
          <div className="text-left flex-1">
            <p
              className={[
                'font-semibold text-base leading-tight transition-colors duration-300',
                state === 'IDLE'    ? 'text-obsidian-900' : '',
                state === 'SCANNING'? 'text-obsidian-700' : '',
                state === 'WAITING' ? 'text-white' : '',
                state === 'SUCCESS' ? 'text-green-700' : '',
                state === 'ERROR'   ? 'text-red-600' : '',
              ].join(' ')}
            >
              {copy.headline}
              {state === 'SUCCESS' && pointsEarned && (
                <span className="ml-2 text-gold-600 font-bold animate-count-up">
                  +{pointsEarned} pts
                </span>
              )}
            </p>
            <p
              className={[
                'text-xs mt-0.5 transition-colors duration-300',
                state === 'IDLE'    ? 'text-obsidian-600' : '',
                state === 'SCANNING'? 'text-obsidian-500' : '',
                state === 'WAITING' ? 'text-gold-400/80' : '',
                state === 'SUCCESS' ? 'text-green-600' : '',
                state === 'ERROR'   ? 'text-red-400' : '',
              ].join(' ')}
            >
              {copy.sub}
            </p>
          </div>

          {/* Right arrow / reset */}
          {state === 'IDLE' && (
            <svg className="w-5 h-5 text-obsidian-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
          {(state === 'SUCCESS' || state === 'ERROR') && (
            <button
              onClick={(e) => { e.stopPropagation(); handleReset(); }}
              className="text-xs underline text-obsidian-400 hover:text-obsidian-600 flex-shrink-0 focus-gold rounded"
            >
              Reset
            </button>
          )}
        </div>
      </button>

      {/* Info label below */}
      <p className="text-center text-obsidian-400 text-[10px] mt-2 tracking-wide">
        {state === 'IDLE' && 'Your visit will be instantly logged at the counter'}
        {state === 'WAITING' && 'Show this screen to the cashier to confirm your points'}
        {state === 'SUCCESS' && 'Thank you for your visit — see you soon!'}
      </p>
    </div>
  );
}
