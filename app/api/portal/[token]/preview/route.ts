import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";
import { getDb, artKeys, mediaItems, eq } from "@/lib/db";
import {
  consumePortalPreviewNonce,
  verifySignedPortalPreviewParams,
} from "@/lib/portal-preview-signing";
import { enforceRequestRateLimit } from "@/lib/request-rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HOTLINK_DENY = "Hotlink denied";

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function loadBuffer(src: string): Promise<Buffer> {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const res = await fetch(src, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch remote image (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  const normalized = src.startsWith("/") ? src.slice(1) : src;
  const full = path.join(process.cwd(), "public", normalized);
  return fs.readFile(full);
}

function hostFromUrl(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return "";
  }
}

function enforceHotlinkPolicy(req: NextRequest): boolean {
  const host = req.headers.get("host") || "";
  const referer = req.headers.get("referer");
  const origin = req.headers.get("origin");
  const allowedHosts = new Set([
    host,
    "theartfulexperience.com",
    "www.theartfulexperience.com",
    "dev.theartfulexperience.com",
    "app.theartfulexperience.com",
    "artkey.theartfulexperience.com",
  ]);

  if (origin) {
    const originHost = hostFromUrl(origin);
    if (originHost && !allowedHosts.has(originHost)) return false;
  }
  if (referer) {
    const refererHost = hostFromUrl(referer);
    if (refererHost && !allowedHosts.has(refererHost)) return false;
  }
  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const rate = enforceRequestRateLimit(req, {
      keyPrefix: "portal-preview",
      windowMs: 60_000,
      maxRequests: 90,
    });
    if (!rate.ok) return rate.response;

    if (!enforceHotlinkPolicy(req)) {
      return NextResponse.json({ success: false, error: HOTLINK_DENY }, { status: 403 });
    }

    const token = params.token;
    const src = req.nextUrl.searchParams.get("src");
    const widthRaw = Number.parseInt(req.nextUrl.searchParams.get("w") || "1400", 10);
    const width = Math.max(320, Math.min(2200, Number.isFinite(widthRaw) ? widthRaw : 1400));
    const nonce = req.nextUrl.searchParams.get("n");
    const expiresAt = req.nextUrl.searchParams.get("e");
    const signature = req.nextUrl.searchParams.get("s");

    if (!src) {
      return NextResponse.json({ success: false, error: "Missing src" }, { status: 400 });
    }

    const sig = verifySignedPortalPreviewParams({
      token,
      src,
      width,
      n: nonce,
      e: expiresAt,
      s: signature,
    });
    if (!sig.ok) {
      return NextResponse.json({ success: false, error: sig.reason }, { status: 403 });
    }
    if (!(await consumePortalPreviewNonce({ token, nonce: sig.nonce, expiresAt: sig.expiresAt }))) {
      return NextResponse.json({ success: false, error: "Signed URL replay limit reached" }, { status: 403 });
    }

    const db = await getDb();
    const portal = await db.select().from(artKeys).where(eq(artKeys.publicToken, token)).get();
    if (!portal) {
      return NextResponse.json({ success: false, error: "Portal not found" }, { status: 404 });
    }

    const uploadedImages = safeJsonParse<string[]>(portal.uploadedImages, []);
    const media = await db.select().from(mediaItems).where(eq(mediaItems.artkeyId, portal.id)).all();
    const theme = safeJsonParse<{ bg_image_url?: string }>(portal.theme, {});
    const approvedMediaUrls = media
      .filter((m) => m?.approved && m?.type === "image" && typeof m?.url === "string")
      .map((m) => m.url as string);
    const allowed = new Set<string>([
      ...uploadedImages.filter((u) => typeof u === "string"),
      ...approvedMediaUrls,
      ...(theme.bg_image_url ? [theme.bg_image_url] : []),
    ]);

    if (!allowed.has(src)) {
      return NextResponse.json({ success: false, error: "Image not available for this portal" }, { status: 403 });
    }

    const sourceBuffer = await loadBuffer(src);
    const image = await sharp(sourceBuffer)
      .rotate()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

    return new NextResponse(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=900",
      },
    });
  } catch (err: any) {
    console.error("[portal preview] failed:", err?.message || err);
    return NextResponse.json({ success: false, error: "Preview generation failed" }, { status: 500 });
  }
}
