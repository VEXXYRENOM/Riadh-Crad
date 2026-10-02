import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { MerchantRow } from '@/types';

export type MerchantAccessRole = 'OWNER' | 'MANAGER' | 'CASHIER';

export type MerchantAccess = {
  merchant: MerchantRow;
  role: MerchantAccessRole;
};

/** Trusted server-side access resolution for dashboard and API routes. */
export async function getMerchantAccessByUserId(userId: string): Promise<MerchantAccess | null> {
  const admin = await createSupabaseAdminClient();
  const { data: ownedMerchant } = await admin
    .from('merchants')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();
  if (ownedMerchant) return { merchant: ownedMerchant as MerchantRow, role: 'OWNER' };

  const { data: staff } = await admin
    .from('merchant_staff')
    .select('merchant_id, role')
    .eq('auth_uid', userId)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  if (!staff || (staff.role !== 'CASHIER' && staff.role !== 'MANAGER')) return null;
  const { data: merchant } = await admin.from('merchants').select('*').eq('id', staff.merchant_id).maybeSingle();
  if (!merchant) return null;
  return { merchant: merchant as MerchantRow, role: staff.role };
}

export async function canAwardPoints(merchantId: string, userId: string) {
  const admin = await createSupabaseAdminClient();
  const { data: merchant } = await admin
    .from('merchants')
    .select('id, owner_id')
    .eq('id', merchantId)
    .maybeSingle();
  if (!merchant) return false;
  if (merchant.owner_id === userId) return true;

  const { data: staff } = await admin
    .from('merchant_staff')
    .select('id')
    .eq('merchant_id', merchantId)
    .eq('auth_uid', userId)
    .eq('status', 'ACTIVE')
    .in('role', ['CASHIER', 'MANAGER'])
    .maybeSingle();
  return Boolean(staff);
}
