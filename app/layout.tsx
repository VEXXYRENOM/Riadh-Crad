import type { Metadata, Viewport } from 'next';
import { Outfit, Cormorant_Garamond, JetBrains_Mono } from 'next/font/google';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import './globals.css';

// ─── Font Loading ──────────────────────────────────────────────────────────

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500'],
});

// ─── SEO Metadata ──────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: 'RIADH CARD — Premium Digital Loyalty',
    template: '%s | RIADH CARD',
  },
  description:
    'Ultra-premium NFC-powered loyalty cards for elite cafes, barbers, and lounges. Earn points, unlock exclusive tiers.',
  keywords: ['loyalty card', 'NFC rewards', 'digital loyalty', 'cafe rewards', 'Tunisia'],
  authors: [{ name: 'Riadh Card Engineering' }],
  creator: 'RIADH CARD',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'RIADH CARD',
    title: 'RIADH CARD — Premium Digital Loyalty',
    description: 'Ultra-premium NFC-powered loyalty for elite merchants.',
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#D4AF37',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// ─── Root Layout ───────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased text-obsidian-900 page-canvas">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
