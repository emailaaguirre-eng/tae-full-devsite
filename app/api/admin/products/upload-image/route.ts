/**
 * Admin: Upload product image
 * POST /api/admin/products/upload-image
 *
 * multipart/form-data: file + productId + kind
 *   ("hero"|"gallery"|"artworkSource"|"variantSample")
 * Saves to public/uploads/products/{slug}/{timestamp}-{safeFilename}
 * Returns { success, url, kind }
 * Note: "variantSample" writes the file only (tAE-hosted URL); does not update galleryImages.
 */
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getDb, shopProducts, eq } from "@/lib/db";
import { saveDatabase } from "@/db";
import { reconcileImagesTableWithProductColumns } from "@/lib/shop-product-images";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_GALLERY = parseInt(process.env.MAX_GALLERY_IMAGES || "30", 10);
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_KINDS = ["hero", "gallery", "artworkSource", "variantSample"] as const;

function sanitize(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;
    const kind = (formData.get("kind") as string) || "hero";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    if (!productId) {
      return NextResponse.json({ success: false, error: "productId is required" }, { status: 400 });
    }
    if (!ALLOWED_KINDS.includes(kind as (typeof ALLOWED_KINDS)[number])) {
      return NextResponse.json({ success: false, error: "Invalid kind" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `File type ${file.type} not allowed. Use JPEG, PNG, or WebP.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    const db = await getDb();
    const product = await db.select().from(shopProducts).where(eq(shopProducts.id, productId)).get();
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    if (kind === "gallery") {
      let existing: string[] = [];
      try {
        existing = product.galleryImages ? JSON.parse(product.galleryImages) : [];
      } catch {
        /* ok */
      }
      if (existing.length >= MAX_GALLERY) {
        return NextResponse.json(
          { success: false, error: `Gallery limit reached (${MAX_GALLERY} images max)` },
          { status: 400 }
        );
      }
    }

    const slug = product.slug || productId;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products", slug);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now().toString(36);
    const safeName = sanitize(file.name);
    const filename = `${timestamp}-${safeName}`;
    const filepath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(bytes));

    const url = `/uploads/products/${slug}/${filename}`;

    if (kind === "hero") {
      await db
        .update(shopProducts)
        .set({ heroImage: url, updatedAt: new Date().toISOString() })
        .where(eq(shopProducts.id, productId));
      const p2 = await db.select().from(shopProducts).where(eq(shopProducts.id, productId)).get();
      await reconcileImagesTableWithProductColumns(db, productId, p2?.heroImage ?? null, p2?.galleryImages ?? null);
    } else if (kind === "gallery") {
      let gallery: string[] = [];
      try {
        gallery = product.galleryImages ? JSON.parse(product.galleryImages) : [];
      } catch {
        /* ok */
      }
      gallery.push(url);
      await db
        .update(shopProducts)
        .set({
          galleryImages: JSON.stringify(gallery),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(shopProducts.id, productId));
      const p2 = await db.select().from(shopProducts).where(eq(shopProducts.id, productId)).get();
      await reconcileImagesTableWithProductColumns(db, productId, p2?.heroImage ?? null, p2?.galleryImages ?? null);
    } else if (kind === "artworkSource") {
      await db
        .update(shopProducts)
        .set({
          artworkSourceUrl: url,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(shopProducts.id, productId));
    }
    // variantSample: file only; do not mutate galleryImages or other columns

    await saveDatabase();

    return NextResponse.json({ success: true, url, kind });
  } catch (err: any) {
    console.error("[upload-image] Error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Upload failed" }, { status: 500 });
  }
}
