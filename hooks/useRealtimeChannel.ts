/**
 * @file useRealtimeChannel.ts
 * @description React hook — subscribes to the merchant:{merchantId}:events
 *              Supabase Realtime channel. Uses postgres_changes for
 *              nfc_events and loyalty_cards, and broadcasts for business events.
 *
 *              Returns typed event callbacks so the dashboard can react
 *              without any `any` casts.
 */

'use client';

import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type {
  NfcEventRow,
  LoyaltyCardRow,
  NfcEventChanges,
  LoyaltyCardChanges,
} from '@/types';

export interface RealtimeChannelCallbacks {
  /** Fires when a new NFC tap INSERT lands on nfc_events */
  onNfcTap?: (row: NfcEventRow) => void;
  /** Fires on any loyalty_card UPDATE for this merchant */
  onCardUpdate?: (newRow: Partial<LoyaltyCardRow>, oldRow: Partial<LoyaltyCardRow>) => void;
}

export interface UseRealtimeChannelOptions {
  merchantId: string;
  callbacks: RealtimeChannelCallbacks;
  enabled?: boolean;
}

export function useRealtimeChannel({
  merchantId,
  callbacks,
  enabled = true,
}: UseRealtimeChannelOptions): void {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !merchantId) return;

    const supabase = createSupabaseBrowserClient();
    const channelName = `merchant:${merchantId}:events`;

    channelRef.current = supabase
      .channel(channelName)
      // ── NFC taps (postgres_changes INSERT on nfc_events) ────
      .on<NfcEventRow>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nfc_events',
          filter: `merchant_id=eq.${merchantId}`,
        },
        (payload: NfcEventChanges) => {
          const row = payload.new as NfcEventRow;
          if (row?.id && callbacks.onNfcTap) {
            callbacks.onNfcTap(row);
          }
        },
      )
      // ── Loyalty card updates ─────────────────────────────────
      .on<LoyaltyCardRow>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loyalty_cards',
          filter: `merchant_id=eq.${merchantId}`,
        },
        (payload: LoyaltyCardChanges) => {
          if (callbacks.onCardUpdate) {
            callbacks.onCardUpdate(payload.new, payload.old);
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info(`[Realtime] Subscribed to ${channelName}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Error on ${channelName}`);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // Callbacks are intentionally excluded from deps to avoid re-subscribing
    // on every render — wrap them in useCallback at the call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId, enabled]);
}
