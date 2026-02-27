import crypto from "crypto";

const PREVIEW_SIGNING_VERSION = "v1";
const DEFAULT_TTL_SECONDS = 5 * 60;
const DEFAULT_MAX_NONCE_USES = 4;

type PreviewSignatureInput = {
  token: string;
  src: string;
  width: number;
  expiresAt: number;
  nonce: string;
};

type NonceEntry = {
  uses: number;
  expiresAt: number;
};

function getNonceStore(): Map<string, NonceEntry> {
  const key = "__taePortalPreviewNonceStore";
  const g = globalThis as typeof globalThis & {
    [key]?: Map<string, NonceEntry>;
  };
  if (!g[key]) {
    g[key] = new Map<string, NonceEntry>();
  }
  return g[key]!;
}

function getSigningSecret(): string {
  return (
    process.env.PORTAL_ASSET_SIGNING_SECRET ||
    process.env.PORTAL_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dev-portal-asset-signing-secret-change-me"
  );
}

function base64UrlEncode(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function toCanonical(input: PreviewSignatureInput): string {
  return [
    PREVIEW_SIGNING_VERSION,
    input.token,
    input.src,
    String(input.width),
    String(input.expiresAt),
    input.nonce,
  ].join("|");
}

function signCanonical(canonical: string): string {
  return base64UrlEncode(crypto.createHmac("sha256", getSigningSecret()).update(canonical).digest());
}

function secureCompare(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function getMaxNonceUses(): number {
  const raw = Number.parseInt(process.env.PORTAL_PREVIEW_NONCE_MAX_USES || "", 10);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_MAX_NONCE_USES;
  return Math.min(20, raw);
}

function cleanExpiredNonceEntries(now: number): void {
  const store = getNonceStore();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

export function issueSignedPortalPreviewParams(input: {
  token: string;
  src: string;
  width: number;
  ttlSeconds?: number;
}): { n: string; e: number; s: string } {
  const ttl = Math.max(15, Math.min(60 * 60, input.ttlSeconds || DEFAULT_TTL_SECONDS));
  const expiresAt = Date.now() + ttl * 1000;
  const nonce = base64UrlEncode(crypto.randomBytes(16));
  const canonical = toCanonical({
    token: input.token,
    src: input.src,
    width: input.width,
    expiresAt,
    nonce,
  });
  const signature = signCanonical(canonical);
  return { n: nonce, e: expiresAt, s: signature };
}

export function verifySignedPortalPreviewParams(input: {
  token: string;
  src: string;
  width: number;
  n?: string | null;
  e?: string | null;
  s?: string | null;
}): { ok: true; nonce: string; expiresAt: number } | { ok: false; reason: string } {
  if (!input.n || !input.e || !input.s) return { ok: false, reason: "Missing signature parameters" };
  const expiresAt = Number.parseInt(input.e, 10);
  if (!Number.isFinite(expiresAt)) return { ok: false, reason: "Invalid expiry" };
  if (Date.now() > expiresAt) return { ok: false, reason: "Signed URL expired" };

  const canonical = toCanonical({
    token: input.token,
    src: input.src,
    width: input.width,
    expiresAt,
    nonce: input.n,
  });
  const expected = signCanonical(canonical);
  if (!secureCompare(input.s, expected)) return { ok: false, reason: "Invalid signature" };
  return { ok: true, nonce: input.n, expiresAt };
}

export function consumePortalPreviewNonce(input: {
  token: string;
  nonce: string;
  expiresAt: number;
}): boolean {
  const now = Date.now();
  cleanExpiredNonceEntries(now);
  const store = getNonceStore();
  const key = `${input.token}:${input.nonce}`;
  const existing = store.get(key);
  const maxUses = getMaxNonceUses();
  if (existing && existing.expiresAt > now && existing.uses >= maxUses) {
    return false;
  }
  const uses = (existing?.uses || 0) + 1;
  store.set(key, { uses, expiresAt: input.expiresAt });
  return true;
}
