import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('image');
    const kind = formData.get('kind') === 'logo' ? 'logo' : 'cover';

    if (!(file instanceof File) || !ACCEPTED_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ success: false, message: 'Choose a JPG, PNG, or WebP image smaller than 5 MB.' }, { status: 400 });
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    if (!merchant) return NextResponse.json({ success: false, message: 'Store profile was not found.' }, { status: 404 });

    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${merchant.id}/${kind}.${extension}`;
    const admin = await createSupabaseAdminClient();
    const { error: uploadError } = await admin.storage.from('merchant-media').upload(path, file, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600',
    });
    if (uploadError) return NextResponse.json({ success: false, message: uploadError.message }, { status: 400 });

    const { data: publicUrlData } = admin.storage.from('merchant-media').getPublicUrl(path);
    const url = `${publicUrlData.publicUrl}?v=${Date.now()}`;
    const column = kind === 'logo' ? 'logo_url' : 'cover_image_url';
    const { error: updateError } = await admin.from('merchants').update({ [column]: url }).eq('id', merchant.id);
    if (updateError) return NextResponse.json({ success: false, message: updateError.message }, { status: 400 });

    return NextResponse.json({ success: true, url, kind });
  } catch (error) {
    console.error('[POST /api/merchant/profile/image]', error);
    return NextResponse.json({ success: false, message: 'Unable to upload the image.' }, { status: 500 });
  }
}
