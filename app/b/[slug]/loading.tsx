/**
 * @file app/b/[slug]/loading.tsx
 * @description Streaming skeleton for the PWA page — shown during RSC fetch.
 */

export default function PwaLoading() {
  return (
    <div className="flex flex-col items-center min-h-dvh bg-pearl px-5 pt-10 pb-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col items-center gap-3 mb-8 w-full">
        <div className="w-14 h-14 rounded-full bg-gold-200/60" />
        <div className="h-4 w-32 rounded-full bg-gold-200/60" />
        <div className="h-3 w-20 rounded-full bg-obsidian-100" />
      </div>

      {/* VIP Card skeleton */}
      <div
        className="w-full max-w-sm rounded-card bg-obsidian-800/30 shimmer-overlay"
        style={{ aspectRatio: '1.586 / 1' }}
      />

      {/* Points skeleton */}
      <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-sm">
        <div className="h-12 w-40 rounded-xl bg-gold-200/50" />
        <div className="h-2 w-full rounded-full bg-gold-100" />
        <div className="h-3 w-36 rounded-full bg-obsidian-100" />
      </div>

      {/* NFC button skeleton */}
      <div className="mt-8 w-full max-w-sm h-20 rounded-card bg-gold-100" />

      {/* Transaction skeletons */}
      <div className="mt-8 w-full max-w-sm space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white border border-gold-100" />
        ))}
      </div>
    </div>
  );
}
