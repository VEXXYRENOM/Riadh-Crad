import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import type { MerchantRow } from '@/types';

export type MerchantAccessRole = 'OWNER' | 'MANAGER' | 'CASHIER';

export type MerchantAccess = {
  merchant: MerchantRow;
  role: MerchantAccessRole;
};

async function lookupOwnedMerchant(userId: string): Promise<MerchantRow | null> {
  // Prefer the logged-in session first — works when RLS allows owners to read their row
  // even if SUPABASE_SERVICE_ROLE_KEY is missing or wrong on Vercel.
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('owner_id', userId)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('[merchant-access] session owner lookup:', error.message);
    } else if (data) {
      return data as MerchantRow;
    }
  } catch (err) {
    console.error('[merchant-access] session owner lookup failed:', err);
  }

  try {
    const admin = await createSupabaseAdminClient();
    const { data, error } = await admin
      .from('merchants')
      .select('*')
      .eq('owner_id', userId)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('[merchant-access] admin owner lookup:', error.message);
      return null;
    }
    return (data as MerchantRow | null) ?? null;
  } catch (err) {
    console.error('[merchant-access] admin client unavailable:', err);
    return null;
  }
}

/** Trusted server-side access resolution for dashboard and API routes. */
export async function getMerchantAccessByUserId(userId: string): Promise<MerchantAccess | null> {
  const ownedMerchant = await lookupOwnedMerchant(userId);
  if (ownedMerchant) return { merchant: ownedMerchant, role: 'OWNER' };

  try {
    const admin = await createSupabaseAdminClient();
    const { data: staff, error: staffError } = await admin
      .from('merchant_staff')
      .select('merchant_id, role')
      .eq('auth_uid', userId)
      .eq('status', 'ACTIVE')
      .limit(1)
      .maybeSingle();
    if (staffError) {
      console.error('[merchant-access] staff lookup:', staffError.message);
      return null;
    }
    if (!staff || (staff.role !== 'CASHIER' && staff.role !== 'MANAGER')) return null;

    const { data: merchant, error: merchantError } = await admin
      .from('merchants')
      .select('*')
      .eq('id', staff.merchant_id)
      .maybeSingle();
    if (merchantError) {
      console.error('[merchant-access] staff merchant lookup:', merchantError.message);
      return null;
    }
    if (!merchant) return null;
    return { merchant: merchant as MerchantRow, role: staff.role };
  } catch (err) {
    console.error('[merchant-access] staff resolution failed:', err);
    return null;
  }
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
