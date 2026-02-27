import { NextResponse } from "next/server";

type RateLimitConfig = {
  keyPrefix: string;
  windowMs: number;
  maxRequests: number;
};

type Bucket = {
  resetAt: number;
  count: number;
};

function getStore(): Map<string, Bucket> {
  const key = "__taeRateLimitStore";
  const g = globalThis as typeof globalThis & {
    [key]?: Map<string, Bucket>;
  };
  if (!g[key]) {
    g[key] = new Map<string, Bucket>();
  }
  return g[key]!;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function cleanupExpired(now: number, store: Map<string, Bucket>) {
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export function enforceRequestRateLimit(
  req: Request,
  config: RateLimitConfig
): { ok: true; remaining: number } | { ok: false; response: NextResponse } {
  const now = Date.now();
  const store = getStore();
  cleanupExpired(now, store);

  const ip = getClientIp(req);
  const bucketKey = `${config.keyPrefix}:${ip}`;
  const existing = store.get(bucketKey);
  const resetAt = existing?.resetAt && existing.resetAt > now ? existing.resetAt : now + config.windowMs;
  const count = existing?.resetAt && existing.resetAt > now ? existing.count + 1 : 1;

  if (count > config.maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Too Many Requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
      ),
    };
  }

  store.set(bucketKey, { count, resetAt });
  return { ok: true, remaining: Math.max(0, config.maxRequests - count) };
}

