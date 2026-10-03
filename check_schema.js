
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const lines = fs.readFileSync('.env.local','utf8').split('\n');
const env = {};
lines.forEach(l => { if (l.includes('=')) { const [k,...v]=l.split('='); env[k.trim()]=v.join('=').trim(); }});
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
s.from('customers').select('*').limit(1).then(r => {
  console.log('customers columns:', Object.keys(r.data[0] || {}));
  console.log('sample row:', JSON.stringify(r.data[0]));
});

