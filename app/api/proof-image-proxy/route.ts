/**
 * POST /api/proof-image-proxy
 * Fetches a provider mockup image server-side and returns bytes from this origin
 * so the browser never uses the provider URL as <img src>.
 *
 * Body: { url: string } — allowlisted hosts: Printful CDN / *.printful.com,
 * printfulusercontent.com, and mockup temp URLs on printful-upload.*.amazonaws.com.
 */
import { NextResponse } from "next/server";
import { enforceRequestRateLimit } from "@/lib/request-rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

/**
 * Printful mockup-generator returns temporary JPEG/PNG URLs on their S3 upload bucket
 * (e.g. printful-upload.s3-accelerate.amazonaws.com) — not on *.printful.com.
 * @see Printful API docs mockup task examples
 */
function isPrintfulMockupS3Host(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (!h.endsWith(".amazonaws.com")) return false;
  return h.startsWith("printful-upload.");
}

function isAllowedProofImageUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "files.cdn.printful.com") return true;
    if (h.endsWith(".printful.com")) return true;
    if (h.endsWith(".printfulusercontent.com")) return true;
    if (isPrintfulMockupS3Host(h)) return true;
    return false;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const rate = enforceRequestRateLimit(req, {
    keyPrefix: "proof-image-proxy",
    windowMs: 60_000,
    maxRequests: 40,
  });
  if (!rate.ok) return rate.response;

  try {
    const body = await req.json().catch(() => null);
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!url || !isAllowedProofImageUrl(url)) {
      let rejectedHost = "";
      let pathPrefix = "";
      try {
        const parsed = new URL(url);
        rejectedHost = parsed.hostname;
        pathPrefix = parsed.pathname.slice(0, 96);
      } catch {
        rejectedHost = "(unparseable)";
        pathPrefix = url.slice(0, 96);
      }
      console.warn("[proof-image-proxy] URL_NOT_ALLOWED", { host: rejectedHost, pathPrefix });
      return NextResponse.json({ success: false, code: "URL_NOT_ALLOWED" }, { status: 400 });
    }

    const upstream = await fetch(url, {
      headers: { Accept: "image/*,*/*" },
      next: { revalidate: 0 },
    });
    if (!upstream.ok) {
      return NextResponse.json({ success: false, code: "UPSTREAM_FAILED" }, { status: 502 });
    }

    const buf = await upstream.arrayBuffer();
    if (buf.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ success: false, code: "IMAGE_TOO_LARGE" }, { status: 413 });
    }

    const contentType =
      upstream.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ success: false, code: "NOT_IMAGE" }, { status: 502 });
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=120",
      },
    });
  } catch (e: unknown) {
    console.error("[proof-image-proxy]", e);
    return NextResponse.json({ success: false, code: "PROXY_ERROR" }, { status: 500 });
  }
}
