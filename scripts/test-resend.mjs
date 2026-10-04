/**
 * Quick connectivity test — run once with:
 *   node scripts/test-resend.mjs
 */
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Manually parse .env.local (no dotenv dependency needed)
const envPath = resolve(__dirname, '../.env.local');
const envLines = readFileSync(envPath, 'utf8').split('\n');
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,    // onboarding@resend.dev (shared domain)
  to:   'israhichri56@gmail.com',          // can be any email once using shared domain
  subject: '✅ Riadh Card — Resend test (shared domain)',
  html: '<h2 style="font-family:sans-serif">🎉 Resend يعمل بشكل مثالي!</h2><p>الـ shared domain <code>onboarding@resend.dev</code> يرسل لأي بريد بدون domain مخصص.</p>',
});

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log('✅ Email sent! ID:', data.id);
