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
    console.log('Sending test email to israhichri56@gmail.com...');
    const response1 = await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: 'israhichri56@gmail.com',
        subject: 'TEST 1 - Plain Text',
        html_content: 'This is a simple plain text email without any HTML. Just testing delivery.'
      },
      { publicKey, privateKey }
    );
    console.log('Result 1:', response1.status, response1.text);

    console.log('Sending test email to htakiallah@gmail.com (Your personal email)...');
    const response2 = await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: 'htakiallah@gmail.com',
        subject: 'TEST 2 - Plain Text',
        html_content: 'Testing delivery to the main merchant account.'
      },
      { publicKey, privateKey }
    );
    console.log('Result 2:', response2.status, response2.text);

  } catch (err) {
    console.error('FAILED:', err.text || err.message || err);
  }
}

test();
