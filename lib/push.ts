import webpush from 'web-push';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

export function isPushConfigured() { return Boolean(publicKey && privateKey && subject); }

export async function sendCampaignPushNotifications(merchantId: string, customerUrl: string, title: string, message: string) {
  if (!isPushConfigured()) return { attempted: 0, delivered: 0 };
  webpush.setVapidDetails(subject!, publicKey!, privateKey!);
  const supabase = await createSupabaseAdminClient();
  const { data: cards } = await supabase.from('loyalty_cards').select('customer_id').eq('merchant_id', merchantId).eq('is_blocked', false);
  const customerIds = [...new Set((cards ?? []).map((card) => card.customer_id))];
  if (!customerIds.length) return { attempted: 0, delivered: 0 };
  const { data: subscriptions } = await supabase.from('push_subscriptions').select('endpoint, p256dh, auth').in('customer_id', customerIds);
  const payload = JSON.stringify({ title, body: message, url: customerUrl, tag: `campaign-${merchantId}` });
  let delivered = 0;
  await Promise.all((subscriptions ?? []).map(async (subscription) => {
    try { await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload); delivered += 1; }
    catch (error: unknown) {
      const status = typeof error === 'object' && error && 'statusCode' in error ? Number((error as { statusCode: number }).statusCode) : 0;
      if (status === 404 || status === 410) await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
      else console.error('[web-push send]', error);
    }
  }));
  return { attempted: subscriptions?.length ?? 0, delivered };
}
