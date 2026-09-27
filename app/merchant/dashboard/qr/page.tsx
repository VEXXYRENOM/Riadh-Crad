/**
 * @file app/merchant/dashboard/qr/page.tsx
 * @description QR Code & NFC management page.
 */

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMerchantByOwnerId } from '@/services/merchant.service';
import { QrNfcClient } from '@/components/dashboard/QrNfcClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR & NFC Setup | RIADH CARD',
  description: 'Generate and manage your loyalty QR code and NFC tags.',
};

export default async function QrPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/merchant/login');

  const merchant = await getMerchantByOwnerId(user.id);
  if (!merchant) redirect('/merchant/setup');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const loyaltyUrl = `${baseUrl}/b/${merchant.slug}`;

  return (
    <div className="flex flex-col gap-8">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="label-gold mb-1">Distribution Tools</p>
          <h1 className="heading-luxury text-3xl lg:text-4xl text-obsidian-900">
            QR Code &amp;{' '}
            <span className="text-gold-gradient-static">NFC Setup</span> ✦
          </h1>
          <p className="text-obsidian-500 text-sm mt-1 max-w-lg">
            Share your loyalty link via QR code, NFC tag, or direct link.
            Customers scan once — and they&apos;re in your loyalty club.
          </p>
        </div>
      </div>

      {/* ── Client Component (interactive) ─────────────── */}
      <QrNfcClient
        merchantName={merchant.name}
        merchantSlug={merchant.slug}
        loyaltyUrl={loyaltyUrl}
      />
    </div>
  );
}

