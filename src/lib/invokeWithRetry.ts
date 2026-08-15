import { supabase } from "@/integrations/supabase/client";

export interface InvokeRetryOptions {
  /** Max attempts including the first try. Default 3 (so 2 retries). */
  maxAttempts?: number;
  /** Base delay ms for exponential backoff. Default 800. */
  baseDelayMs?: number;
  /** Called before each retry, useful for logging or UI hints. */
  onRetry?: (attempt: number, reason: string) => void;
  /** Custom validator. Return null if OK, or a string reason to retry. */
  validate?: (data: any) => string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Wraps supabase.functions.invoke with transparent retry for transient
 * failures (timeouts, 5xx, JSON parse errors, invalid AI response shape).
 *
 * Does NOT retry: 4xx auth errors, needApiKey, explicit quota/business errors.
 */
export async function invokeGenerateWithRetry<T = any>(
  body: Record<string, unknown>,
  opts: InvokeRetryOptions = {}
): Promise<{ data: any }> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 800;

  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body,
      });

      if (error) {
        const msg = String((error as any)?.message || error);
        const status = (error as any)?.status ?? (error as any)?.context?.status;
        const transient =
          (typeof status === "number" && status >= 500) ||
          /timeout|fetch failed|network|ETIMEDOUT|ECONNRESET|aborted/i.test(msg);
        if (transient && attempt < maxAttempts) {
          opts.onRetry?.(attempt, `invoke error: ${msg}`);
          await sleep(baseDelayMs * Math.pow(2, attempt - 1));
          continue;
        }
        throw error;
      }

      // Don't retry on these — they are deterministic business outcomes
      if (data?.needApiKey) return { data };
      if (data?.error) {
        const errStr = String(data.error);
        const transient =
          /timeout|overload|temporarily|try again|parse|JSON|invalid format|503|502|504/i.test(
            errStr
          ) || data?.transient === true;
        if (transient && attempt < maxAttempts) {
          opts.onRetry?.(attempt, `data.error: ${errStr}`);
          await sleep(baseDelayMs * Math.pow(2, attempt - 1));
          continue;
        }
        return { data };
      }

      // Custom shape validation (e.g. bankSoal must have daftar_soal)
      if (opts.validate) {
        const reason = opts.validate(data);
        if (reason) {
          if (attempt < maxAttempts) {
            opts.onRetry?.(attempt, `validation: ${reason}`);
            await sleep(baseDelayMs * Math.pow(2, attempt - 1));
            continue;
          }
          // out of retries — surface as error-shaped data so caller flows the same
          return { data: { ...data, error: reason, transient: false } };
        }
      }

      return { data };
    } catch (err) {
      lastErr = err;
      const msg = String((err as any)?.message || err);
      const transient =
        /timeout|fetch failed|network|ETIMEDOUT|ECONNRESET|aborted|503|502|504/i.test(msg);
      if (transient && attempt < maxAttempts) {
        opts.onRetry?.(attempt, `throw: ${msg}`);
        await sleep(baseDelayMs * Math.pow(2, attempt - 1));
        continue;
      }
      throw err;
    }
  }

  throw lastErr ?? new Error("Generate gagal setelah beberapa percobaan");
}
