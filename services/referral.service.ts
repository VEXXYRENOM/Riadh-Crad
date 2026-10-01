import { randomUUID } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

function newReferralCode() { return randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase(); }

/** Returns a stable, per-merchant referral code for a loyalty member. */
export async function getOrCreateReferralCode(merchantId: string, customerId: string): Promise<string | null> {
  const supabase = await createSupabaseAdminClient();
  const { data: existing } = await supabase.from('referral_codes').select('code').eq('merchant_id', merchantId).eq('customer_id', customerId).maybeSingle();
  if (existing?.code) return existing.code as string;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = newReferralCode();
    const { data, error } = await supabase.from('referral_codes').insert({ merchant_id: merchantId, customer_id: customerId, code }).select('code').single();
    if (data?.code) return data.code as string;
    if (error?.code !== '23505') { console.error('[getOrCreateReferralCode]', error?.message); return null; }
  }
  return null;
}
