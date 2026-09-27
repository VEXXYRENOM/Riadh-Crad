/**
 * @file components/pwa/TransactionLog.tsx
 * @description Crisp, minimal transaction history list.
 *              Renders server-fetched transactions with source icons,
 *              signed point deltas, and formatted timestamps.
 */

import type { TransactionListItem, TransactionSource } from '@/types';

interface TransactionLogProps {
  transactions: TransactionListItem[];
}

const SOURCE_CONFIG: Record<TransactionSource, { icon: string; label: string }> = {
  CASHIER:    { icon: '🧾', label: 'Cashier' },
  NFC:        { icon: '📡', label: 'NFC Tap'  },
  MANUAL:     { icon: '✏️', label: 'Manual'   },
  REDEMPTION: { icon: '🎁', label: 'Redemption' },
  ADJUSTMENT: { icon: '⚖️', label: 'Adjustment' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function TransactionLog({ transactions }: TransactionLogProps) {
  if (transactions.length === 0) {
    return (
      <div className="w-full max-w-sm mx-auto animate-fade-up" style={{ animationDelay: '0.4s' }}>
        <div className="label-gold mb-3 flex items-center gap-2">
          <span>Recent Activity</span>
        </div>
        <div className="card-luxury p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-gold-50 flex items-center justify-center text-2xl">
            🏷️
          </div>
          <p className="text-obsidian-600 text-sm font-medium">No transactions yet</p>
          <p className="text-obsidian-400 text-xs leading-relaxed">
            Your first visit will appear here after you tap your card at the counter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-up" style={{ animationDelay: '0.4s' }}>
      <div className="label-gold mb-3 flex items-center justify-between">
        <span>Recent Activity</span>
        <span className="text-obsidian-400 text-[10px] normal-case font-normal tracking-normal">
          {transactions.length} transactions
        </span>
      </div>

      <div className="space-y-2">
        {transactions.map((tx, i) => {
          const isEarn    = tx.points_added > 0;
          const delta     = isEarn ? tx.points_added : tx.points_redeemed;
          const src       = SOURCE_CONFIG[tx.source] ?? SOURCE_CONFIG.CASHIER;

          return (
            <div
              key={tx.id}
              className="card-luxury px-4 py-3.5 flex items-center gap-3 animate-fade-up"
              style={{ animationDelay: `${0.4 + i * 0.06}s` }}
            >
              {/* Source icon */}
              <div className="w-9 h-9 rounded-xl bg-pearl flex items-center justify-center text-base flex-shrink-0 border border-gold-100">
                {src.icon}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-obsidian-800 text-sm font-semibold">
                    {src.label}
                  </span>
                  {tx.note && (
                    <span className="text-obsidian-400 text-xs truncate">
                      — {tx.note}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-obsidian-400 text-[10px]">
                    {formatDate(tx.created_at)}
                  </span>
                  <span className="text-obsidian-300 text-[10px]">·</span>
                  <span className="text-obsidian-400 text-[10px]">
                    {formatTime(tx.created_at)}
                  </span>
                  {tx.amount_spent && (
                    <>
                      <span className="text-obsidian-300 text-[10px]">·</span>
                      <span className="text-obsidian-500 text-[10px] font-medium">
                        {tx.amount_spent.toFixed(2)} TND
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Delta */}
              <div
                className={[
                  'flex-shrink-0 text-sm font-bold tabular-nums',
                  isEarn ? 'text-emerald-600' : 'text-amber-600',
                ].join(' ')}
              >
                {isEarn ? '+' : '−'}{delta.toLocaleString()}
                <span className="text-[10px] font-normal ml-0.5 text-obsidian-400">pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
