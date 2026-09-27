/**
 * @file app/b/[slug]/layout.tsx
 * @description PWA shell layout — mobile-first, full-height, pearl background.
 *              Sets per-page metadata using the merchant slug.
 */

import type { Metadata } from 'next';
import { getMerchantBySlug } from '@/services/merchant.service';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);

  if (!merchant) {
    return {
      title: 'Not Found | RIADH CARD',
    };
  }

  return {
    title: `${merchant.name} | RIADH CARD`,
    description: `Your exclusive loyalty card at ${merchant.name}. Earn points, unlock VIP tiers.`,
    themeColor: '#D4AF37',
    openGraph: {
      title: `${merchant.name} — RIADH CARD`,
      description: `Your VIP loyalty membership at ${merchant.name}.`,
      images: merchant.logo_url ? [{ url: merchant.logo_url }] : [],
    },
  };
}

export default function PwaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col relative z-[1]">
      {children}
    </div>
  );
}
