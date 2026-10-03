import { NextResponse } from 'next/server';
import { getGoogleWalletEnvStatus } from '@/lib/google-wallet';

export const runtime = 'nodejs';

/** Public sanity check for deployment — no secrets, no customer data. */
export async function GET() {
  return NextResponse.json(await getGoogleWalletEnvStatus());
}
