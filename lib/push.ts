import webpush from 'web-push';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;
const CUSTOMER_PAGE_SIZE = 250;
const MAX_PARALLEL_PUSHES = 8;

export function isPushConfigured() { return Boolean(publicKey && privateKey && subject); }

async function sendWithConcurrency<T>(items: T[], task: (item: T) => Promise<void>) {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(MAX_PARALLEL_PUSHES, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      await task(item);
    }
  });
  await Promise.all(workers);
}

/**
 * Sends in pages with a small fixed concurrency. It intentionally never creates
 * one Promise per subscriber, preventing campaign sends from exhausting memory.
 */
export async function sendCampaignPushNotifications(merchantId: string, customerUrl: string, title: string, message: string) {
  if (!isPushConfigured()) return { attempted: 0, delivered: 0, failed: 0 };
  webpush.setVapidDetails(subject!, publicKey!, privateKey!);
  const supabase = await createSupabaseAdminClient();
  const payload = JSON.stringify({ title, body: message, url: customerUrl, tag: `campaign-${merchantId}` });
  let attempted = 0;
  let delivered = 0;
  let failed = 0;
  let offset = 0;

  while (true) {
    const { data: cards, error: cardsError } = await supabase
      .from('loyalty_cards')
      .select('customer_id')
      .eq('merchant_id', merchantId)
      .eq('is_blocked', false)
      .order('customer_id')
      .range(offset, offset + CUSTOMER_PAGE_SIZE - 1);
    if (cardsError) throw new Error('Unable to load campaign recipients.');
    if (!cards?.length) break;

    const customerIds = [...new Set(cards.map((card) => card.customer_id))];
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('customer_id', customerIds);
    if (subscriptionsError) throw new Error('Unable to load push subscriptions.');

    attempted += subscriptions?.length ?? 0;
    await sendWithConcurrency(subscriptions ?? [], async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          payload,
        );
        delivered += 1;
      } catch (error: unknown) {
        failed += 1;
        const status = typeof error === 'object' && error && 'statusCode' in error
          ? Number((error as { statusCode: number }).statusCode)
          : 0;
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
        } else {
          console.error('[web-push send]', status || 'unknown failure');
        }
      }
    });

    if (cards.length < CUSTOMER_PAGE_SIZE) break;
    offset += cards.length;
  }

  return { attempted, delivered, failed };
}
