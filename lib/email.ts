/**
 * lib/email.ts
 *
 * High-level email service — wraps the EmailJS client and exposes
 * strongly-typed helpers for every transactional event in the app.
 */

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
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendNodemailerTemplate(to: string, subject: string, html: string): Promise<EmailResult> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.error('[email] Missing Gmail credentials in .env.local');
    return { success: false, error: 'Missing Gmail configuration' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Riadh Card" <${user}>`,
      to,
      subject,
      html,
    });

    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error('[email] Nodemailer Error:', err.message || err);
    return { success: false, error: err.message || 'Failed to send email' };
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
  return sendNodemailerTemplate(params.to, subject, html);
}

export async function sendOtpEmail(params: {
  to: string;
  otp: string;
  expiresInMinutes?: number;
}): Promise<EmailResult> {
  const subject = `${params.otp} — رمز التحقق الخاص بك`;
  const html = otpEmail(params);
  return sendNodemailerTemplate(params.to, subject, html);
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
  return sendNodemailerTemplate(params.to, subject, html);
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
  return sendNodemailerTemplate(params.to, subject, html);
}
