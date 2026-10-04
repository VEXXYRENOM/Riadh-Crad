import emailjs from '@emailjs/nodejs';
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

const serviceId = process.env.EMAILJS_SERVICE_ID;
const templateId = process.env.EMAILJS_TEMPLATE_ID;
const publicKey = process.env.EMAILJS_PUBLIC_KEY;
const privateKey = process.env.EMAILJS_PRIVATE_KEY;

console.log('Testing EmailJS config...');
console.log('Service:', serviceId);
console.log('Template:', templateId);
console.log('PublicKey:', publicKey);

async function test() {
  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: 'israhichri56@gmail.com',
        subject: 'Test from Riadh Card ✅',
        html_content: '<h1 style="color:#D4AF37">Riadh Card</h1><p>If you received this, EmailJS is working correctly!</p>'
      },
      {
        publicKey: publicKey,
        privateKey: privateKey,
      }
    );
    console.log('SUCCESS! Status:', response.status, '| Text:', response.text);
  } catch (err) {
    console.error('FAILED:', JSON.stringify(err));
  }
}

test();
