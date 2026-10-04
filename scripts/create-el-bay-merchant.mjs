/**
 * create-el-bay-merchant.mjs
 * Creates the "El Bay Lounge" merchant account in Supabase
 * Email: hagguianouer@gmail.com
 * Password: ElBay2026! (change later from dashboard)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase env vars');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const MERCHANT_EMAIL = 'hagguianouer@gmail.com';
const MERCHANT_PASSWORD = 'ElBay2026!';
const MERCHANT_NAME = 'El Bay Lounge';
const MERCHANT_SLUG = 'el-bay-lounge';

async function createMerchant() {
  console.log('\n🏪 Creating El Bay Lounge merchant account...\n');

  // 1. Create the auth user
  console.log('1️⃣  Creating auth user...');
  let { data: userResult, error: userError } = await admin.auth.admin.createUser({
    email: MERCHANT_EMAIL,
    password: MERCHANT_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: 'El Bay Lounge',
      role: 'merchant',
    }
  });

  if (userError) {
    // If user already exists, try to find them
    if (userError.message?.includes('already') || userError.code === 'email_exists') {
      console.log('   ⚠️  User already exists, fetching...');
      const { data: listData } = await admin.auth.admin.listUsers();
      const existing = listData?.users?.find(u => u.email === MERCHANT_EMAIL);
      if (!existing) {
        console.error('   ❌ Could not find existing user');
        process.exit(1);
      }
      userResult = { user: existing };
    } else {
      console.error('   ❌ Auth error:', userError.message);
      process.exit(1);
    }
  }

  let userId = userResult?.user?.id;
  if (!userId) {
    // Try listing users to find the one we just created
    const { data: listData } = await admin.auth.admin.listUsers();
    const found = listData?.users?.find(u => u.email === MERCHANT_EMAIL);
    userId = found?.id;
  }

  console.log('   ✅ User ID:', userId);

  // 2. Create the merchant profile
  console.log('\n2️⃣  Creating merchant profile...');
  const { data: merchant, error: merchantError } = await admin
    .from('merchants')
    .upsert({
      owner_id: userId,
      name: MERCHANT_NAME,
      slug: MERCHANT_SLUG,
      description: 'Lounge de luxe avec une ambiance unique et raffinée.',
      points_per_dinar: 1,
      welcome_message: 'Bienvenue au El Bay Lounge! Chaque visite vous rapproche de récompenses exclusives.',
    }, { onConflict: 'slug' })
    .select()
    .single();

  if (merchantError) {
    console.error('   ❌ Merchant error:', merchantError.message);
    process.exit(1);
  }

  console.log('   ✅ Merchant created:', merchant.id);

  // 3. Summary
  console.log('\n' + '═'.repeat(55));
  console.log('🎉  El Bay Lounge is ready!');
  console.log('═'.repeat(55));
  console.log(`📧  Email    : ${MERCHANT_EMAIL}`);
  console.log(`🔑  Password : ${MERCHANT_PASSWORD}`);
  console.log(`🏪  Store    : ${MERCHANT_NAME}`);
  console.log(`🔗  Slug     : ${MERCHANT_SLUG}`);
  console.log(`🆔  User ID  : ${userId}`);
  console.log(`🆔  Merchant : ${merchant.id}`);
  console.log('═'.repeat(55));
  console.log('\n👉  Login at: http://localhost:3000/merchant/login');
  console.log('💡  Change the password from Store Settings after login.\n');
}

createMerchant();
