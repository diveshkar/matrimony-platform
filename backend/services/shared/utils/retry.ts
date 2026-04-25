import { logger } from './logger.js';

interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  label?: string;
}

/**
 * Retry a thunk with exponential backoff. Returns the final result, or
 * throws after the last attempt fails.
 *
 * Use for best-effort side-effects (notifications, analytics) where the
 * caller wants a small chance to recover from transient DynamoDB blips
 * but does NOT want to fail the user-visible request.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const label = options.label ?? 'operation';

  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const delay = baseDelayMs * Math.pow(2, i);
        logger.warn(`${label} failed (attempt ${i + 1}/${attempts}), retrying in ${delay}ms`, {
          error: String(err),
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastErr;
}
