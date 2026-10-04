import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
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

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

console.log('Testing Nodemailer config...');
console.log('User:', user);
console.log('Pass:', pass ? '***' + pass.slice(-4) : 'MISSING');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: user,
    pass: pass,
  },
});

async function test() {
  try {
    const info = await transporter.sendMail({
      from: `"Riadh Card VIP" <${user}>`,
      to: 'hayouni.mariem8@gmail.com',
      subject: 'Nodemailer Plain Text Test',
      text: 'مرحباً مريم! هذا اختبار إرسال نصي للتأكد من وصول الإيميل بدون مشاكل التصميم (HTML).',
    });
    console.log('SUCCESS! Message ID:', info.messageId);
  } catch (err) {
    console.error('FAILED:', err);
  }
}

test();
