import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";
import { getDb, eq, and, shopProducts, shopProductImages } from "@/lib/db";
import {
  parseWatermarkSettings,
  STOREFRONT_META_IMAGE_LIST_KEYS,
  type StorefrontMetaImageListKey,
} from "@/lib/product-watermark";
import { enforceRequestRateLimit } from "@/lib/request-rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadImageBuffer(src: string): Promise<Buffer> {
  if (!src) throw new Error("Missing source image");
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const res = await fetch(src, { cache: "no-store" });
    if (!res.ok) throw new Error(`Remote image fetch failed: ${res.status}`);
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  }

  const safePath = src.startsWith("/") ? src : `/${src}`;
  const absolute = path.join(process.cwd(), "public", safePath);
  return fs.readFile(absolute);
}

function getRequestedSource(product: any, kind: string, index: number): string | null {
  if (kind === "hero") return product.heroImage || null;
  if (kind === "gallery") {
    if (!product.galleryImages) return null;
    try {
      const parsed = JSON.parse(product.galleryImages);
      if (!Array.isArray(parsed) || parsed.length === 0) return null;
      return parsed[Math.max(0, Math.min(parsed.length - 1, index))] || null;
    } catch {
      return null;
    }
  }
  return null;
}

function parsePrintfulMetaObject(raw: string | null | undefined): Record<string, unknown> {
  try {
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function findStorefrontMetaRowImage(
  printfulDataJson: string | null | undefined,
  metaList: StorefrontMetaImageListKey,
  rowId: string
): string | null {
  const parsed = parsePrintfulMetaObject(printfulDataJson);
  const arr = Array.isArray(parsed[metaList]) ? (parsed[metaList] as unknown[]) : [];
  const want = rowId.trim();
  for (const item of arr) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    if (o.id == null) continue;
    if (String(o.id).trim() !== want) continue;
    const im = o.image;
    if (typeof im === "string" && im.trim()) return im.trim();
  }
  return null;
}

function svgWatermark(
  width: number,
  height: number,
  text: string,
  color: string,
  opacity: number,
  x: number,
  y: number,
  scale: number,
  rotation: number
) {
  const minDimension = Math.min(width, height);
  const fontSize = Math.max(18, Math.round(minDimension * scale));
  const tx = Math.round(width * x);
  const ty = Math.round(height * y);
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .wm { font-family: "Playfair Display", Georgia, serif; font-size: ${fontSize}px; font-weight: 600; fill: ${color}; opacity: ${opacity}; }
      </style>
      <g transform="translate(${tx}, ${ty}) rotate(${rotation})">
        <text class="wm" text-anchor="middle" dominant-baseline="middle">${text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</text>
      </g>
    </svg>`
  );
}

export async function GET(req: Request) {
  try {
    const rate = enforceRequestRateLimit(req, {
      keyPrefix: "product-preview",
      windowMs: 60_000,
      maxRequests: 90,
    });
    if (!rate.ok) return rate.response;

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const imageId = searchParams.get("imageId");
    const matrixRowId = (searchParams.get("matrixRowId") || "").trim();
    const metaListRaw = (searchParams.get("metaList") || "").trim();
    const metaRowId = (searchParams.get("metaRowId") || "").trim();
    const kind = searchParams.get("kind") || "hero";
    const index = Number(searchParams.get("index") || "0");
    if (!productId) {
      return NextResponse.json({ success: false, error: "Missing productId" }, { status: 400 });
    }

    const db = await getDb();
    const product = await db.select().from(shopProducts).where(eq(shopProducts.id, productId)).get();
    if (!product || !product.active) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    let src: string | null = null;
    if (imageId) {
      const row = await db
        .select()
        .from(shopProductImages)
        .where(and(eq(shopProductImages.id, imageId), eq(shopProductImages.productId, productId)))
        .get();
      if (row?.imageUrl) src = row.imageUrl;
    } else if (metaListRaw && metaRowId) {
      if (!STOREFRONT_META_IMAGE_LIST_KEYS.includes(metaListRaw as StorefrontMetaImageListKey)) {
        return NextResponse.json({ success: false, error: "Invalid metaList" }, { status: 400 });
      }
      src = findStorefrontMetaRowImage(
        product.printfulDataJson,
        metaListRaw as StorefrontMetaImageListKey,
        metaRowId
      );
    } else if (matrixRowId) {
      src = findStorefrontMetaRowImage(product.printfulDataJson, "variantMatrix", matrixRowId);
    } else {
      src = getRequestedSource(product, kind, index);
    }
    if (!src) {
      return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
    }

    const buffer = await loadImageBuffer(src);
    const watermark = parseWatermarkSettings(product.printfulDataJson);

    let pipeline = sharp(buffer).rotate();
    pipeline = pipeline.resize({
      width: 1400,
      height: 1400,
      fit: "inside",
      withoutEnlargement: true,
    });

    const metadata = await pipeline.metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    if (watermark.enabled) {
      pipeline = pipeline.composite([
        {
          input: svgWatermark(
            width,
            height,
            watermark.text,
            watermark.color,
            watermark.opacity,
            watermark.transform.x,
            watermark.transform.y,
            watermark.transform.scale,
            watermark.transform.rotation
          ),
          blend: "over",
        },
      ]);
    }

    const out = await pipeline.webp({ quality: 82 }).toBuffer();

    return new NextResponse(new Uint8Array(out), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=1800, s-maxage=1800",
      },
    });
  } catch (err: any) {
    console.error("[product-preview] failed:", err?.message || err);
    return NextResponse.json({ success: false, error: "Preview generation failed" }, { status: 500 });
  }
}
