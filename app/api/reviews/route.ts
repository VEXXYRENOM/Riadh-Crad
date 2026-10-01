import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { getMerchantRatingSummary } from '@/services/review.service';
import type { MerchantReviewRow } from '@/types';

function maskName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Loyal customer';
  if (parts.length === 1) return parts[0].slice(0, 24);
  return `${parts[0].slice(0, 24)} ${parts.slice(1).map((part) => `${part.charAt(0)}.`).join('')}`;
}

export async function GET(request: NextRequest) {
  const merchantId = new URL(request.url).searchParams.get('merchantId');
  if (!merchantId) return NextResponse.json({ success: false, message: 'merchantId is required.' }, { status: 400 });

  const summary = await getMerchantRatingSummary(merchantId);
  // Customer IDs are not returned to public callers.
  const reviews = summary.reviews.map(({ customer_id: _customerId, ...review }) => review);
  return NextResponse.json({ success: true, ...summary, reviews });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { merchantId?: unknown; rating?: unknown; comment?: unknown };
    const merchantId = typeof body.merchantId === 'string' ? body.merchantId : '';
    const rating = Number(body.rating);
    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 500) : '';

    if (!merchantId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: 'Choose a rating between 1 and 5 stars.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: 'Please sign in before leaving a review.' }, { status: 401 });

    const admin = await createSupabaseAdminClient();
    const { data: customer } = await admin
      .from('customers')
      .select('id, full_name')
      .eq('auth_uid', user.id)
      .single();
    if (!customer) return NextResponse.json({ success: false, message: 'Customer profile not found.' }, { status: 403 });

    // Only members of this merchant's loyalty program can submit a review.
    const { data: card } = await admin
      .from('loyalty_cards')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('customer_id', customer.id)
      .maybeSingle();
    if (!card) return NextResponse.json({ success: false, message: 'Only loyalty members can review this shop.' }, { status: 403 });

    const { data: review, error } = await admin
      .from('merchant_reviews')
      .upsert({
        merchant_id: merchantId,
        customer_id: customer.id,
        display_name: maskName(customer.full_name),
        rating,
        comment: comment || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'merchant_id,customer_id' })
      .select('*')
      .single();
    if (error || !review) return NextResponse.json({ success: false, message: error?.message ?? 'Unable to save your review.' }, { status: 400 });

    const summary = await getMerchantRatingSummary(merchantId);
    const publicReview = (() => {
      const { customer_id: _customerId, ...safeReview } = review as MerchantReviewRow;
      return safeReview;
    })();
    return NextResponse.json({ success: true, review: publicReview, ...summary, reviews: summary.reviews.map(({ customer_id: _customerId, ...item }) => item) });
  } catch (error) {
    console.error('[POST /api/reviews]', error);
    return NextResponse.json({ success: false, message: 'Unable to save your review.' }, { status: 500 });
  }
}
