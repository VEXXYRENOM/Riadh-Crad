import Link from 'next/link';
import Image from 'next/image';
import { LogoMark } from '@/components/LogoMark';

export default function MerchantLogin({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error;
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-riyadh-mesh opacity-80"
      />
      <div className="w-full max-w-md p-8 md:p-10 surface-luxury rounded-[1.75rem] animate-scale-in relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-2"><LogoMark size={48} /></div>
            <h1 className="font-display text-3xl text-dune-950 mt-4">Merchant Access</h1>
            <p className="text-sm text-obsidian-500 mt-2 text-center">Sign in to manage your loyalty program</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form className="space-y-5" action="/api/auth/login" method="POST">
            <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="input-gold w-full"
              placeholder="admin@merchant.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="input-gold w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-gold w-full !mt-8">
            Sign In to Dashboard
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-gold-deep transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
