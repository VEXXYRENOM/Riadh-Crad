import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { MerchantReviewRow } from '@/types';

export type MerchantRatingSummary = {
  average: number;
  count: number;
  reviews: MerchantReviewRow[];
};

/** Public, privacy-safe review feed for a merchant loyalty card. */
export async function getMerchantRatingSummary(merchantId: string): Promise<MerchantRatingSummary> {
  const supabase = await createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('merchant_reviews')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[getMerchantRatingSummary]', error.message);
    return { average: 0, count: 0, reviews: [] };
  }

  const reviews = (data ?? []) as MerchantReviewRow[];
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: reviews.length ? Math.round((total / reviews.length) * 10) / 10 : 0,
    count: reviews.length,
    reviews,
  };
}
