/**
 * @file app/merchant/dashboard/layout.tsx
 * @description Executive dashboard shell — top nav + content.
 *              Premium layout with merchant logo and branding.
 */

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMerchantAccessByUserId } from '@/services/merchant-access.service';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, UtensilsCrossed, Users, LayoutDashboard, Megaphone, QrCode, LogOut } from 'lucide-react';

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

  const navLinks = [
    { href: '/merchant/dashboard',              label: 'Dashboard',      icon: LayoutDashboard, ownerOnly: false },
    { href: '/merchant/dashboard/campaigns',    label: 'Campaigns',      icon: Megaphone,       ownerOnly: true  },
    { href: '/merchant/dashboard/menu',         label: 'Menu & Rewards', icon: UtensilsCrossed, ownerOnly: true  },
    { href: '/merchant/dashboard/team',         label: 'Team',           icon: Users,           ownerOnly: true  },
    { href: '/merchant/dashboard/settings',     label: 'Settings',       icon: Settings,        ownerOnly: true  },
    { href: '/merchant/dashboard/qr',           label: 'NFC & QR',       icon: QrCode,          ownerOnly: false },
  ];

  const visibleLinks = navLinks.filter(l => !l.ownerOnly || role === 'OWNER');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF5' }}>

      {/* ── Top Nav Bar ──────────────────────────────────── */}
      <nav
        className="h-[72px] border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40"
        style={{
          background: 'rgba(255,253,240,0.97)',
          backdropFilter: 'blur(24px)',
          borderColor: 'rgba(212,175,55,0.22)',
          boxShadow: '0 2px 32px -6px rgba(212,175,55,0.15)',
        }}
      >
        {/* ─ Left: RIADH CARD brand + merchant identity ─ */}
        <div className="flex items-center gap-3">
          <Link href="/merchant/dashboard" className="flex items-center gap-2 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-obsidian-900 flex-shrink-0 transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #F5D060 0%, #C9971C 100%)' }}
            >
              R
            </div>
            <span className="font-bold text-sm tracking-widest hidden sm:block"
              style={{ background: 'linear-gradient(135deg,#C9971C,#F5D060)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              RIADH CARD
            </span>
          </Link>

          {/* Divider */}
          <div className="w-px h-7 bg-gold-200 hidden sm:block mx-1" />

          {/* Merchant logo + name — visible on ALL screen sizes */}
          <div className="flex items-center gap-2.5">
            {merchant.logo_url ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-gold-300 shadow-md flex-shrink-0 bg-white">
                <Image
                  src={merchant.logo_url.split('?')[0]}
                  alt={merchant.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-obsidian-900 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #F5D060 0%, #C9971C 100%)' }}
              >
                {merchant.name.charAt(0)}
              </div>
            )}
            <div className="leading-tight">
              <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-obsidian-400">
                {role === 'OWNER' ? 'Merchant' : role}
              </span>
              <span className="text-sm font-bold text-obsidian-800 line-clamp-1 max-w-[120px] sm:max-w-none">{merchant.name}</span>
            </div>
          </div>
        </div>

        {/* ─ Center: Navigation links (desktop) ─ */}
        <div className="hidden lg:flex items-center gap-0.5">
          {visibleLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-obsidian-600 transition-all border border-transparent hover:text-obsidian-900 hover:bg-gold-50 hover:border-gold-200"
            >
              <Icon className="h-3.5 w-3.5 text-gold-600" />
              {label}
            </Link>
          ))}
        </div>

        {/* ─ Right: Actions ─ */}
        <div className="flex items-center gap-2">
          <Link
            href={`/b/${merchant.slug}`}
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-gold-300 bg-white/70 px-3 py-2 text-xs font-semibold text-obsidian-700 transition hover:border-gold-500 hover:bg-gold-50"
          >
            ↗ <span className="hidden md:block">Customer View</span>
          </Link>

          <Link
            href="/api/auth/logout"
            className="inline-flex items-center gap-1.5 rounded-xl border border-obsidian-100 bg-white/60 px-3 py-2 text-xs font-semibold text-obsidian-500 transition hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Sign out</span>
          </Link>
        </div>
      </nav>

      {/* ── Mobile Bottom Nav ─────────────────────────── */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t flex items-center justify-around px-1 py-2"
        style={{
          background: 'rgba(255,253,240,0.98)',
          backdropFilter: 'blur(24px)',
          borderColor: 'rgba(212,175,55,0.25)',
          boxShadow: '0 -4px 24px -6px rgba(212,175,55,0.18)',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        {visibleLinks.slice(0, 5).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all"
            style={{ minWidth: 52 }}
          >
            {/* Active state is handled via CSS — for now use hover */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-gold-100">
              <Icon className="h-5 w-5 text-obsidian-500" />
            </div>
            <span className="text-[9px] font-bold text-obsidian-400 tracking-wide">{label.split(' ')[0]}</span>
          </Link>
        ))}
      </div>

      {/* ── Page Content ─────────────────────────────── */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
        {children}
      </main>
    </div>
  );
}
