/**
 * @file components/dashboard/DashboardClient.tsx
 * @description Client shell that owns:
 *               - Supabase Realtime subscription (NFC taps + card updates)
 *               - Cashier modal state machine
 *               - Toast notifications for tier upgrades
 *
 *              Receives server-fetched data as props and drives the
 *              interactive layer of the dashboard.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel';
import { CashierModal }  from '@/components/dashboard/CashierModal';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type {
  MerchantRow,
  NfcEventRow,
  LoyaltyCardRow,
  CustomerRow,
} from '@/types';

interface DashboardClientProps {
  merchant: MerchantRow;
}

interface LiveSession {
  nfcEvent:      NfcEventRow;
  card:          Pick<LoyaltyCardRow, 'id' | 'total_points' | 'current_tier'> | null;
  customerName:  string;
  customerPhone: string;
}

interface Toast {
  id:      string;
  message: string;
  type:    'success' | 'info';
}

export function DashboardClient({ merchant }: DashboardClientProps) {
  const [session, setSession]         = useState<LiveSession | null>(null);
  const [modalOpen, setModalOpen]     = useState(false);
  const [toasts, setToasts]           = useState<Toast[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const supabase = createSupabaseBrowserClient();

  const addToast = useCallback((message: string, type: 'success' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev: Toast[]) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev: Toast[]) => prev.filter((t: Toast) => t.id !== id)), 4500);
  }, []);

  const router = useRouter();

  // ── Realtime: NFC tap received ───────────────────────────
  const onNfcTap = useCallback(async (row: NfcEventRow) => {
    setPendingCount((n: number) => n + 1);

    // Resolve customer + card from the tap
    let customerName  = 'Unknown Customer';
    let customerPhone = '—';
    let card: Pick<LoyaltyCardRow, 'id' | 'total_points' | 'current_tier'> | null = null;

    if (row.customer_id) {
      const [custRes, cardRes] = await Promise.all([
        supabase
          .from('customers')
          .select('full_name, phone')
          .eq('id', row.customer_id)
          .single(),
        supabase
          .from('loyalty_cards')
          .select('id, total_points, current_tier')
          .eq('customer_id', row.customer_id)
          .eq('merchant_id', merchant.id)
          .single(),
      ]);

      if (custRes.data) {
        customerName  = custRes.data.full_name  as string;
        customerPhone = custRes.data.phone as string;
      }
      if (cardRes.data) {
        card = cardRes.data as Pick<LoyaltyCardRow, 'id' | 'total_points' | 'current_tier'>;
      }
    }

    setSession({ nfcEvent: row, card, customerName, customerPhone });
    setModalOpen(true);
  }, [merchant.id, supabase]);

  // ── Realtime: card updated (tier change detection) ───────
  const onCardUpdate = useCallback(
    (newRow: Partial<LoyaltyCardRow>, oldRow: Partial<LoyaltyCardRow>) => {
      if (newRow.current_tier && oldRow.current_tier && newRow.current_tier !== oldRow.current_tier) {
        addToast(`🏆 Tier upgrade! Customer reached ${newRow.current_tier}`, 'success');
      }
    },
    [addToast],
  );

  // Subscribe
  useRealtimeChannel({
    merchantId: merchant.id,
    callbacks:  { onNfcTap, onCardUpdate },
    enabled:    true,
  });

  // ── Pending indicator count cleanup on modal close ───────
  const handleClose = useCallback(() => {
    setModalOpen(false);
    setSession(null);
    setPendingCount((n: number) => Math.max(n - 1, 0));
  }, []);

  const handleSuccess = useCallback((pointsAdded: number, newTotal: number) => {
    addToast(`✦ +${pointsAdded} pts awarded — balance now ${newTotal.toLocaleString()} pts`, 'success');
    router.refresh();
  }, [addToast, router]);

  return (
    <>
      {pendingCount > 0 && (
        <div className="fixed bottom-5 right-5 z-30 flex items-center gap-1.5 rounded-full border border-gold-200 bg-[#FFF8E5]/95 px-3 py-2 shadow-[0_12px_30px_-16px_rgba(91,57,15,.42)] backdrop-blur-xl animate-scale-in">
            <span className="w-4 h-4 rounded-full bg-fluid-gold animate-spin-slow text-[8px] flex items-center justify-center">✦</span>
            <span className="text-gold-700 text-xs font-semibold">{pendingCount} pending</span>
        </div>
      )}

      {/* ── Cashier Modal ────────────────────────────────── */}
      {session && (
        <CashierModal
          isOpen={modalOpen}
          nfcEvent={session.nfcEvent}
          card={session.card}
          customerName={session.customerName}
          customerPhone={session.customerPhone}
          merchantId={merchant.id}
          pointsPerDinar={merchant.points_per_dinar}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      {/* ── Toast notifications ───────────────────────────── */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast: Toast) => (
          <div
            key={toast.id}
            className={[
              'px-4 py-3 rounded-xl text-sm font-medium shadow-gold-glow animate-fade-up pointer-events-auto',
              toast.type === 'success'
                ? 'bg-obsidian-900 text-gold-300 border border-gold-500/30'
                : 'bg-white text-obsidian-800 border border-gold-200',
            ].join(' ')}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}
