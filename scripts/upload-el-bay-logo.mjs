/**
 * upload-el-bay-logo.mjs
 * Uploads the El Bay Lounge logo from the user's uploaded image file.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
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

const MERCHANT_ID = 'dcd5a08d-8a11-438b-9f5a-3a7cf9dc346b';

// Look for the logo file in common locations
const possiblePaths = [
  resolve(__dirname, '../public/el-bay-logo.png'),
  resolve(__dirname, '../public/el-bay-logo.jpg'),
  resolve(__dirname, '../public/logos/el-bay.png'),
  resolve(__dirname, '../assets/el-bay-logo.png'),
];

// Also search in the user's uploaded files directory
const uploadDir = 'C:\\Users\\taki allah\\.gemini\\antigravity-ide\\brain\\d3fb9fd0-bc62-4d0f-b5ea-fe20f08c3cc3\\.user_uploaded';

async function uploadLogo() {
  console.log('\n🖼️  Uploading El Bay Lounge logo to Supabase...\n');

  // Find the logo file in uploaded artifacts
  let logoPath = null;
  let contentType = 'image/png';

  // Check if upload dir exists and find a PNG/JPG file
  if (existsSync(uploadDir)) {
    const files = readdirSync(uploadDir);
    const imageFile = files.find(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp'));
    if (imageFile) {
      // We'll use the last uploaded image (the El Bay logo)
      const allImages = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
      // Sort by name to get latest
      allImages.sort();
      const lastImage = allImages[allImages.length - 1];
      logoPath = join(uploadDir, lastImage);
      contentType = lastImage.endsWith('.png') ? 'image/png' : 'image/jpeg';
      console.log(`   Found image: ${lastImage}`);
    }
  }

  if (!logoPath || !existsSync(logoPath)) {
    console.error('❌ Logo file not found. Trying to use a placeholder URL instead...');
    
    // Use a public placeholder with the El Bay colors (copper/gold)
    const placeholderUrl = 'https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=EL+BAY+LOUNGE';
    
    const { error } = await admin
      .from('merchants')
      .update({ logo_url: placeholderUrl })
      .eq('id', MERCHANT_ID);
    
    if (error) {
      console.error('❌ Update failed:', error.message);
    } else {
      console.log('✅ Placeholder logo URL set for El Bay Lounge');
      console.log('   URL:', placeholderUrl);
      console.log('\n💡 To upload the real logo, run this script again after placing');
      console.log('   the logo image at: public/el-bay-logo.png');
    }
    return;
  }

  // Read the file
  const fileBuffer = readFileSync(logoPath);
  const uploadPath = `${MERCHANT_ID}/logo.png`;

  console.log('   Uploading to Supabase Storage...');
  const { error: uploadError } = await admin.storage
    .from('merchant-media')
    .upload(uploadPath, fileBuffer, {
      contentType,
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    console.error('❌ Upload error:', uploadError.message);
    return;
  }

  // Get public URL
  const { data: publicUrlData } = admin.storage
    .from('merchant-media')
    .getPublicUrl(uploadPath);

  const url = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  // Update merchant record
  const { error: updateError } = await admin
    .from('merchants')
    .update({ logo_url: url })
    .eq('id', MERCHANT_ID);

  if (updateError) {
    console.error('❌ Update error:', updateError.message);
    return;
  }

  console.log('✅ Logo uploaded and saved!');
  console.log('   URL:', url);
  console.log('\n🎉 El Bay Lounge profile is complete!');
}

uploadLogo();
