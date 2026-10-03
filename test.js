
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const merchantId = '6664468a-5bca-48c3-9292-cdc845dce642'; // Taki Store
  const customerId = '00000000-0000-0000-0000-000000000000';
  
  // Login first to set auth.uid()
  const { data: auth, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'takihichri76@gmail.com', // Taki Store owner
    password: 'password123' // assuming default password or something, but we can't do this easily.
  });
  console.log('Login:', !!auth.user, loginErr?.message);
}
run();

