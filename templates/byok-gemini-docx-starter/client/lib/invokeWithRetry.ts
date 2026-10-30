import { supabase } from '@/integrations/supabase/client';

export interface InvokeRetryOptions {
  /** Max attempts including the first try. Default: 3 (so 2 retries). */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff. Default: 800. */
  baseDelayMs?: number;
  /** Function name in Supabase Edge Functions. Default: "generate-content-core". */
  functionName?: string;
  /** Callback fired before each retry for toast or UI indicators. */
  onRetry?: (attempt: number, reason: string) => void;
  /** Optional custom validator. Return null if valid, or a string reason to retry. */
  validate?: (data: any) => string | null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps supabase.functions.invoke with transparent retries for transient
 * failures (timeouts, 502/503/504, temporary Gemini overload, or malformed JSON shapes).
 *
 * Does NOT retry deterministic outcomes (e.g. needApiKey, 401 unauthenticated).
 */
export async function invokeGenerateWithRetry<T = any>(
  body: Record<string, unknown>,
  opts: InvokeRetryOptions = {}
): Promise<{ data: T }> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 800;
  const fnName = opts.functionName ?? 'generate-content-core';

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke(fnName, {
        body,
      });

      if (error) {
        const msg = String((error as any)?.message || error);
        const status = (error as any)?.status ?? (error as any)?.context?.status;
        const isTransient =
          (typeof status === 'number' && status >= 500) ||
          /timeout|fetch failed|network|ETIMEDOUT|ECONNRESET|aborted/i.test(msg);

        if (isTransient && attempt < maxAttempts) {
          opts.onRetry?.(attempt, `Koneksi terganggu (${msg}), mencoba ulang...`);
          await sleep(baseDelayMs * Math.pow(2, attempt - 1));
          continue;
        }
        throw error;
      }

      // Check for business outcomes that should NOT retry
      if (data?.needApiKey) {
        return { data };
      }

      // Check for transient errors reported within payload
      if (data?.error) {
        const errStr = String(data.error);
        const isTransient =
          /timeout|overload|temporarily|try again|parse|JSON|invalid format|503|502|504/i.test(
            errStr
          ) || data?.transient === true;

        if (isTransient && attempt < maxAttempts) {
          opts.onRetry?.(attempt, `Layanan sibuk: ${errStr}, mencoba ulang...`);
          await sleep(baseDelayMs * Math.pow(2, attempt - 1));
          continue;
        }
        return { data };
      }

      // Custom shape validation (e.g. ensuring expected arrays or properties exist)
      if (opts.validate) {
        const validationReason = opts.validate(data?.data ?? data);
        if (validationReason) {
          if (attempt < maxAttempts) {
            opts.onRetry?.(attempt, `Format data belum lengkap (${validationReason}), regenerasi...`);
            await sleep(baseDelayMs * Math.pow(2, attempt - 1));
            continue;
          }
        }
      }

      return { data: (data?.data ?? data) as T };
    } catch (err) {
      lastError = err;
      if (attempt >= maxAttempts) break;
      await sleep(baseDelayMs * Math.pow(2, attempt - 1));
    }
  }

  throw lastError ?? new Error('Gagal memproses setelah beberapa kali percobaan.');
}
