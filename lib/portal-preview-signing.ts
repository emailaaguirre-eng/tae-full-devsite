import crypto from "crypto";
import fs from "fs";
import path from "path";
import { executeSql, querySql, saveDatabase } from "@/db";

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

type NonceStoreBackend = "memory" | "file" | "db";

function getNonceStoreBackend(): NonceStoreBackend {
  const raw = (process.env.PORTAL_PREVIEW_NONCE_STORE || "db").toLowerCase();
  if (raw === "memory" || raw === "file" || raw === "db") return raw;
  return "db";
}

function getMemoryNonceStore(): Map<string, NonceEntry> {
  const key = "__taePortalPreviewNonceStore";
  const g = globalThis as typeof globalThis & {
    [key]?: Map<string, NonceEntry>;
  };
  if (!g[key]) {
    g[key] = new Map<string, NonceEntry>();
  }
  return g[key]!;
}

function getNonceStoreFilePath(): string {
  return (
    process.env.PORTAL_PREVIEW_NONCE_STORE_PATH ||
    path.join(process.cwd(), ".cache", "portal-preview-nonces.json")
  );
}

type DbNonceRow = {
  token: string;
  nonce: string;
  expiresAt: number;
  uses: number;
};

async function ensureDbNonceTable(): Promise<void> {
  const key = "__taePortalPreviewNonceTableReady";
  const g = globalThis as typeof globalThis & { [key]?: boolean };
  if (g[key]) return;

  await executeSql(`
    CREATE TABLE IF NOT EXISTS PortalPreviewNonce (
      token TEXT NOT NULL,
      nonce TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      uses INTEGER NOT NULL DEFAULT 0,
      updatedAt INTEGER NOT NULL,
      PRIMARY KEY (token, nonce)
    )
  `);
  await executeSql(
    `CREATE INDEX IF NOT EXISTS idx_portal_preview_nonce_expiresAt ON PortalPreviewNonce(expiresAt)`
  );
  g[key] = true;
}

async function getDbNonceRow(token: string, nonce: string): Promise<DbNonceRow | null> {
  await ensureDbNonceTable();
  const rows = await querySql<DbNonceRow>(
    `SELECT token, nonce, expiresAt, uses
     FROM PortalPreviewNonce
     WHERE token = ? AND nonce = ?
     LIMIT 1`,
    [token, nonce]
  );
  if (!rows[0]) return null;
  return {
    token: rows[0].token,
    nonce: rows[0].nonce,
    expiresAt: Number(rows[0].expiresAt),
    uses: Number(rows[0].uses),
  };
}

async function cleanExpiredDbNonces(now: number): Promise<void> {
  await ensureDbNonceTable();
  await executeSql(`DELETE FROM PortalPreviewNonce WHERE expiresAt <= ?`, [now]);
}

async function upsertDbNonce(input: {
  token: string;
  nonce: string;
  expiresAt: number;
  uses: number;
  updatedAt: number;
}): Promise<void> {
  await ensureDbNonceTable();
  await executeSql(
    `INSERT INTO PortalPreviewNonce(token, nonce, expiresAt, uses, updatedAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(token, nonce) DO UPDATE SET
       expiresAt = excluded.expiresAt,
       uses = excluded.uses,
       updatedAt = excluded.updatedAt`,
    [input.token, input.nonce, input.expiresAt, input.uses, input.updatedAt]
  );
}

function readFileNonceStore(): Map<string, NonceEntry> {
  const filePath = getNonceStoreFilePath();
  try {
    if (!fs.existsSync(filePath)) return new Map();
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, NonceEntry> | null;
    if (!parsed || typeof parsed !== "object") return new Map();
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

function writeFileNonceStore(store: Map<string, NonceEntry>): void {
  const filePath = getNonceStoreFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data = JSON.stringify(Object.fromEntries(store), null, 2);
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, data, "utf8");
  fs.renameSync(tempPath, filePath);
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

function cleanExpiredNonceEntries(now: number, store: Map<string, NonceEntry>): void {
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

export async function consumePortalPreviewNonce(input: {
  token: string;
  nonce: string;
  expiresAt: number;
}): boolean {
  const now = Date.now();
  const backend = getNonceStoreBackend();
  const maxUses = getMaxNonceUses();

  if (backend === "db") {
    try {
      await cleanExpiredDbNonces(now);
      const existing = await getDbNonceRow(input.token, input.nonce);
      if (existing && existing.expiresAt > now && existing.uses >= maxUses) {
        return false;
      }
      const uses = (existing?.uses || 0) + 1;
      await upsertDbNonce({
        token: input.token,
        nonce: input.nonce,
        expiresAt: input.expiresAt,
        uses,
        updatedAt: now,
      });
      await saveDatabase();
      return true;
    } catch (err) {
      console.error("[portal-preview-signing] db nonce store failed, falling back to memory:", err);
    }
  }

  const store = backend === "file" ? readFileNonceStore() : getMemoryNonceStore();
  cleanExpiredNonceEntries(now, store);
  const key = `${input.token}:${input.nonce}`;
  const existing = store.get(key);
  if (existing && existing.expiresAt > now && existing.uses >= maxUses) {
    return false;
  }
  const uses = (existing?.uses || 0) + 1;
  store.set(key, { uses, expiresAt: input.expiresAt });
  if (backend === "file") writeFileNonceStore(store);
  return true;
}
