import { createSupabaseAdminClient } from '@/lib/supabase/server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function boundedText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

/** Rejects oversized or malformed JSON before an API handler performs database work. */
export async function readJsonBody<T>(request: Request, maxBytes = 16_384): Promise<T> {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new ApiInputError('Request body is too large.');
  }
  try {
    return await request.json() as T;
  } catch {
    throw new ApiInputError('Invalid JSON request body.');
  }
}

export class ApiInputError extends Error {}

export async function consumeRateLimit(
  bucket: string,
  maxRequests: number,
  windowSeconds: number,
) {
  try {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase.rpc('consume_api_rate_limit', {
      p_bucket: bucket,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error('[rate-limit]', error.message);
      return { allowed: false, unavailable: true };
    }
    return { allowed: data === true, unavailable: false };
  } catch (error) {
    console.error('[rate-limit]', error instanceof Error ? error.message : 'Unknown error');
    return { allowed: false, unavailable: true };
  }
}
