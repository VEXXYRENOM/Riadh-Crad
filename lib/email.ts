/**
 * lib/email.ts
 *
 * High-level email service — wraps the EmailJS client and exposes
 * strongly-typed helpers for every transactional event in the app.
 */

import emailjs from '@emailjs/nodejs';
import {
  welcomeEmail,
  otpEmail,
  rewardEmail,
  campaignEmail,
} from './email-templates';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// Helper to send via EmailJS
async function sendEmailJSTemplate(to: string, subject: string, html: string): Promise<EmailResult> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.error('[email] Missing EmailJS environment variables');
    return { success: false, error: 'Missing EmailJS configuration' };
  }

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: to,
        subject: subject,
        // IMPORTANT: In your EmailJS dashboard, your template must have {{{html_content}}}
        html_content: html,
      },
      {
        publicKey: publicKey,
        privateKey: privateKey,
      }
    );

    return { success: true, id: response.text }; // EmailJS returns OK in text
  } catch (err: any) {
    console.error('[email] EmailJS Error:', err.text || err.message || err);
    return { success: false, error: err.text || 'Failed to send email' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  to: string;
  customerName: string;
  merchantName: string;
  cardUrl: string;
}): Promise<EmailResult> {
  const subject = `مرحباً بك في ${params.merchantName} 🎉`;
  const html = welcomeEmail(params);
  return sendEmailJSTemplate(params.to, subject, html);
}

export async function sendOtpEmail(params: {
  to: string;
  otp: string;
  expiresInMinutes?: number;
}): Promise<EmailResult> {
  const subject = `${params.otp} — رمز التحقق الخاص بك`;
  const html = otpEmail(params);
  return sendEmailJSTemplate(params.to, subject, html);
}

export async function sendRewardEmail(params: {
  to: string;
  customerName: string;
  merchantName: string;
  eventType: 'earned' | 'redeemed';
  points: number;
  totalPoints: number;
  cardUrl: string;
}): Promise<EmailResult> {
  const subjectMap = {
    earned: `🌟 لقد ربحت ${params.points} نقطة في ${params.merchantName}!`,
    redeemed: `🎁 تم استخدام ${params.points} نقطة في ${params.merchantName}`,
  };
  const subject = subjectMap[params.eventType];
  const html = rewardEmail(params);
  return sendEmailJSTemplate(params.to, subject, html);
}

export async function sendCampaignEmail(params: {
  to: string;
  customerName: string;
  merchantName: string;
  campaignTitle: string;
  campaignBody: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  unsubscribeUrl?: string;
}): Promise<EmailResult> {
  const subject = `${params.campaignTitle} — ${params.merchantName}`;
  const html = campaignEmail(params);
  return sendEmailJSTemplate(params.to, subject, html);
}
