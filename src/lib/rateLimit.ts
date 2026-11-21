/**
 * Lightweight in-memory rate limiting and response caching for serverless API routes.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry<unknown>>();
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

/**
 * Checks and updates rate limit for a client IP.
 * @param ip Client IP address
 * @param limit Max requests allowed per window
 * @param windowMs Window duration in milliseconds (default: 60s)
 */
export function checkRateLimit(
  ip: string,
  limit: number = 30,
  windowMs: number = 60000,
): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

/**
 * Gets cached data if valid
 */
export function getCached<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Sets cache with TTL in milliseconds (default 30 mins)
 */
export function setCached<T>(
  key: string,
  data: T,
  ttlMs: number = 30 * 60 * 1000,
): void {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}
