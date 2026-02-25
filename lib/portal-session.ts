"use server";

import crypto from "crypto";

export const PORTAL_SESSION_COOKIE = "tae_portal_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

type PortalSessionMode = "owner" | "admin_demo";

type PortalSessionPayload = {
  publicToken: string;
  mode: PortalSessionMode;
  iat: number;
  exp: number;
};

function base64UrlEncode(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function getSessionSecret(): string {
  return (
    process.env.PORTAL_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dev-portal-session-secret-change-me"
  );
}

function sign(data: string): string {
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(data)
    .digest();
  return base64UrlEncode(sig);
}

export function issuePortalSession(
  publicToken: string,
  mode: PortalSessionMode
): string {
  const now = Date.now();
  const payload: PortalSessionPayload = {
    publicToken,
    mode,
    iat: now,
    exp: now + SESSION_TTL_SECONDS * 1000,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function readCookie(req: Request, cookieName: string): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader) return null;
  const pair = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${cookieName}=`));
  if (!pair) return null;
  return decodeURIComponent(pair.slice(cookieName.length + 1));
}

export function validatePortalSession(
  req: Request,
  expectedPublicToken: string
): { valid: boolean; mode?: PortalSessionMode } {
  const token = readCookie(req, PORTAL_SESSION_COOKIE);
  if (!token) return { valid: false };

  const [encodedPayload, providedSig] = token.split(".");
  if (!encodedPayload || !providedSig) return { valid: false };

  const expectedSig = sign(encodedPayload);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false };
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(encodedPayload).toString("utf8")
    ) as PortalSessionPayload;
    if (!payload?.publicToken || !payload?.exp || !payload?.mode) {
      return { valid: false };
    }
    if (payload.publicToken !== expectedPublicToken) return { valid: false };
    if (Date.now() > payload.exp) return { valid: false };
    if (payload.mode !== "owner" && payload.mode !== "admin_demo") {
      return { valid: false };
    }
    return { valid: true, mode: payload.mode };
  } catch {
    return { valid: false };
  }
}

