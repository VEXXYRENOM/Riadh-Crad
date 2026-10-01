'use client';

import { FormEvent, useState } from 'react';
import { Loader2, MessageCircle, Star } from 'lucide-react';

export type PublicReview = {
  id: string;
  merchant_id: string;
  rating: number;
  comment: string | null;
  display_name: string;
  created_at: string;
  updated_at: string;
};

type Props = {
  merchantId: string;
  initialAverage: number;
  initialCount: number;
  initialReviews: PublicReview[];
  canReview: boolean;
};

export function MerchantReviews({ merchantId, initialAverage, initialCount, initialReviews, canReview }: Props) {
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating) {
      setFeedback('Choose a star rating first.');
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, rating, comment }),
      });
      const result = await response.json() as { success: boolean; message?: string; average?: number; count?: number; reviews?: PublicReview[] };
      if (!response.ok || !result.success) throw new Error(result.message ?? 'Unable to save your review.');
      setAverage(result.average ?? average);
      setCount(result.count ?? count);
      if (result.reviews) setReviews(result.reviews);
      setComment('');
      setFeedback('Thank you — your review was saved. You can submit again later to update it.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to save your review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-sm card-luxury p-5 animate-fade-up" style={{ animationDelay: '0.12s' }}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="label-gold mb-1">Customer reviews</p><h2 className="text-base font-bold text-obsidian-900">How members rate this shop</h2></div>
        <div className="rounded-xl bg-gold-50 px-3 py-2 text-right"><div className="flex items-center gap-1 text-sm font-bold text-obsidian-900"><Star className="h-4 w-4 fill-gold-500 text-gold-500" /> {average ? average.toFixed(1) : 'New'}</div><p className="text-[10px] text-obsidian-500">{count} {count === 1 ? 'review' : 'reviews'}</p></div>
      </div>

      <div className="mt-4 flex items-center gap-1" aria-label={average ? `${average} out of 5 stars` : 'No ratings yet'}>
        {[1, 2, 3, 4, 5].map((value) => <Star key={value} className={`h-4 w-4 ${value <= Math.round(average) ? 'fill-gold-500 text-gold-500' : 'text-obsidian-200'}`} />)}
      </div>

      {canReview && (
        <form onSubmit={submitReview} className="mt-5 border-t border-gold-100 pt-4">
          <p className="text-xs font-semibold text-obsidian-700">Rate your experience</p>
          <div className="mt-2 flex gap-1" aria-label="Choose rating">
            {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} className="rounded p-1 focus-gold" aria-label={`${value} stars`}><Star className={`h-6 w-6 transition ${value <= rating ? 'fill-gold-500 text-gold-500' : 'text-obsidian-200 hover:text-gold-300'}`} /></button>)}
          </div>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} className="input-gold mt-3 min-h-20 resize-none text-sm" placeholder="Optional: tell the shop how it can improve" />
          <p className="mt-1 text-[10px] text-obsidian-400">Your name is shown only in a shortened form to other customers.</p>
          <button disabled={submitting} className="btn-gold mt-3 w-full py-2.5 text-sm disabled:cursor-not-allowed">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}{submitting ? 'Saving…' : 'Publish review'}</button>
          {feedback && <p className="mt-2 text-xs text-obsidian-600" role="status">{feedback}</p>}
        </form>
      )}

      {reviews.length > 0 && (
        <div className="mt-5 flex flex-col gap-3 border-t border-gold-100 pt-4">
          {reviews.slice(0, 3).map((review) => <article key={review.id} className="rounded-xl bg-obsidian-50/70 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-obsidian-800">{review.display_name}</span><span className="flex items-center gap-0.5 text-[11px] font-semibold text-gold-700"><Star className="h-3 w-3 fill-gold-500 text-gold-500" /> {review.rating}/5</span></div>{review.comment && <p className="mt-1 text-xs leading-relaxed text-obsidian-600">{review.comment}</p>}</article>)}
        </div>
      )}
    </section>
  );
}
