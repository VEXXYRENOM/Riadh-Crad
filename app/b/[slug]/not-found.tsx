/**
 * @file app/b/[slug]/not-found.tsx
 * @description 404 page for unknown merchant slugs.
 */

import Link from 'next/link';

export default function PwaNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      {/* Gold orb */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-fluid-gold opacity-20 animate-gold-breathe" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">✦</span>
        </div>
      </div>

      <h1 className="heading-luxury text-3xl text-obsidian-900 mb-2">
        Card Not Found
      </h1>
      <p className="text-obsidian-500 text-sm max-w-xs leading-relaxed mb-8">
        This loyalty card link is invalid or the merchant is no longer active.
        Please ask your merchant for the correct link.
      </p>

      <Link href="/" className="btn-ghost-gold text-sm">
        Return Home
      </Link>
    </div>
  );
}
