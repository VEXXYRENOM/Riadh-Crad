import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment variables.');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Default "from" address used across all transactional emails.
 *
 * ⚠️  Without a verified custom domain in Resend, you MUST use
 *    'onboarding@resend.dev' — Resend's shared sending domain.
 *    This works for all recipients on the free plan.
 *
 * Once you verify a domain (e.g. riadhcard.tn), set:
 *    RESEND_FROM_EMAIL=Riadh Card <noreply@riadhcard.tn>
 */
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
