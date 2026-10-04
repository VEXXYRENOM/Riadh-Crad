/**
 * fix-el-bay-login.mjs
 * Resets the El Bay Lounge password and confirms the email.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const USER_ID = 'bf2a6386-8ce8-409b-a311-eeda127a9ff7';
const NEW_PASSWORD = 'ElBay2026!';
const EMAIL = 'hagguianouer@gmail.com';

async function fix() {
  console.log('\n🔧 Fixing El Bay Lounge login...\n');

  // Force update password and confirm email
  const { data, error } = await admin.auth.admin.updateUserById(USER_ID, {
    password: NEW_PASSWORD,
    email_confirm: true,
    email: EMAIL,
  });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('✅ Password reset and email confirmed!');
  console.log('   Email:', data.user.email);
  console.log('   Email Confirmed:', data.user.email_confirmed_at ? 'YES ✅' : 'NO ❌');
  console.log('\n─────────────────────────────────');
  console.log('🔑 Login credentials:');
  console.log('   Email   :', EMAIL);
  console.log('   Password:', NEW_PASSWORD);
  console.log('─────────────────────────────────\n');
  console.log('👉 Try logging in at: http://localhost:3000/merchant/login');
}

fix();
