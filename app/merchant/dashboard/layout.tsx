/**
 * @file app/merchant/dashboard/layout.tsx
 * @description Executive dashboard shell — sidebar nav + header.
 *              Desktop/tablet first. Protected: redirects if not authenticated.
 */

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMerchantAccessByUserId } from '@/services/merchant-access.service';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Settings, UtensilsCrossed, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | RIADH CARD',
  description: 'Merchant executive dashboard — manage your loyalty program.',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/merchant/login');

  const access = await getMerchantAccessByUserId(user.id);
  if (!access) redirect('/merchant/login?error=No%20merchant%20access');
  const { merchant, role } = access;

  return (
    <div className="dashboard-shell min-h-screen flex flex-col">

      {/* ── Top Nav Bar ──────────────────────────────────── */}
      <nav className="dashboard-nav h-[72px] border-b flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {/* Brand mark */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-obsidian-900 font-bold text-sm"
            style={{ background: 'var(--gradient-fluid-gold)' }}
          >
            R
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-gold-gradient-static font-bold text-sm tracking-wider">RIADH CARD</span>
            <span className="text-obsidian-400 text-xs">Merchant dashboard</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {role === 'OWNER' && <Link
            href="/merchant/dashboard/menu"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-gold-200 bg-white/70 px-3 text-xs font-semibold text-obsidian-700 transition hover:border-gold-400 hover:bg-gold-50"
          >
            <UtensilsCrossed className="h-4 w-4 text-gold-700" />
            <span className="hidden sm:inline">Menu &amp; rewards</span>
          </Link>}
          {role === 'OWNER' && <Link
            href="/merchant/dashboard/settings"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-gold-200 bg-white/70 px-3 text-xs font-semibold text-obsidian-700 transition hover:border-gold-400 hover:bg-gold-50"
          >
            <Settings className="h-4 w-4 text-gold-700" />
            <span className="hidden sm:inline">Store settings</span>
          </Link>}
          {role === 'OWNER' && <Link href="/merchant/dashboard/team" className="inline-flex h-9 items-center gap-2 rounded-xl border border-gold-200 bg-white/70 px-3 text-xs font-semibold text-obsidian-700 transition hover:border-gold-400 hover:bg-gold-50"><Users className="h-4 w-4 text-gold-700" /><span className="hidden sm:inline">Team</span></Link>}
          <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-gold-200 bg-white/65 px-3 py-2 shadow-sm">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-obsidian-900"
              style={{ background: 'var(--gradient-fluid-gold)' }}
            >
              {merchant.name.charAt(0)}
            </div>
            <div className="leading-tight"><span className="block text-[9px] font-medium uppercase tracking-wider text-obsidian-400">{role === 'OWNER' ? 'Current venue' : role}</span><span className="text-xs font-semibold text-obsidian-700">{merchant.name}</span></div>
          </div>
        </div>
      </nav>


      {/* ── Page Content ─────────────────────────────────── */}
      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
