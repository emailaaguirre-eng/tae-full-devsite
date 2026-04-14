/**
 * Admin: Product Media Library (shopper-facing reusable assets; Phase 1)
 *
 * GET    /api/admin/product-media-library — list assets (newest first)
 * POST   /api/admin/product-media-library — multipart: file, title?, keywords?
 * DELETE /api/admin/product-media-library?id=… — remove DB row + file under product-media (if present)
 */
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { getDb, productMediaLibrary, generateId, desc, eq } from "@/lib/db";
import { saveDatabase } from "@/db";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_{2,}/g, "_").toLowerCase();
}

const LIBRARY_URL_PREFIX = "/uploads/product-media/";

/** Resolved absolute path inside public/uploads/product-media, or null if URL is not a safe library file. */
function resolveLibraryDiskPath(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || !imageUrl.startsWith(LIBRARY_URL_PREFIX) || imageUrl.includes("..")) {
    return null;
  }
  const name = imageUrl.slice(LIBRARY_URL_PREFIX.length);
  if (!name || name.includes("/") || name.includes("\\")) {
    return null;
  }
  const root = path.resolve(process.cwd(), "public", "uploads", "product-media");
  const abs = path.resolve(root, name);
  const rel = path.relative(root, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }
  return abs;
}

function unlinkLibraryFileIfPresent(imageUrl: string | null | undefined): { ok: true } | { ok: false; error: string } {
  const abs = resolveLibraryDiskPath(imageUrl);
  if (!abs) {
    return { ok: true };
  }
  try {
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
    }
    return { ok: true };
  } catch (e: any) {
    const code = e?.code;
    if (code === "ENOENT") {
      return { ok: true };
    }
    return { ok: false, error: e?.message || "Could not delete file on disk" };
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(productMediaLibrary)
      .orderBy(desc(productMediaLibrary.createdAt))
      .all();
    return NextResponse.json({ success: true, data: rows });
  } catch (err: any) {
    console.error("[admin/product-media-library] GET:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to list assets" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = ((formData.get("title") as string) || "").trim() || null;
    const keywords = ((formData.get("keywords") as string) || "").trim() || null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `File type ${file.type} not allowed. Use JPEG, PNG, or WebP.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024} MB.` },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "product-media");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now().toString(36);
    const safeName = sanitizeFilename(file.name);
    const filename = `${timestamp}-${safeName}`;
    const filepath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filepath, buffer);

    const imageUrl = `/uploads/product-media/${filename}`;
    const now = new Date().toISOString();

    let width: number | null = null;
    let height: number | null = null;
    try {
      const meta = await sharp(buffer).metadata();
      if (typeof meta.width === "number") width = meta.width;
      if (typeof meta.height === "number") height = meta.height;
    } catch {
      /* optional dimensions */
    }

    const id = generateId();
    const row = {
      id,
      imageUrl,
      originalFilename: file.name,
      mimeType: file.type,
      byteSize: file.size,
      width,
      height,
      title,
      keywords,
      sourceType: "uploaded" as const,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    await db.insert(productMediaLibrary).values(row);
    await saveDatabase();

    return NextResponse.json({ success: true, data: row });
  } catch (err: any) {
    console.error("[admin/product-media-library] POST:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ success: false, error: "id query parameter is required" }, { status: 400 });
    }

    const db = await getDb();
    const row = await db.select().from(productMediaLibrary).where(eq(productMediaLibrary.id, id)).get();
    if (!row) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    const unlinkResult = unlinkLibraryFileIfPresent(row.imageUrl);
    if (!unlinkResult.ok) {
      return NextResponse.json(
        { success: false, error: unlinkResult.error || "File delete failed" },
        { status: 500 }
      );
    }

    await db.delete(productMediaLibrary).where(eq(productMediaLibrary.id, id));
    await saveDatabase();

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("[admin/product-media-library] DELETE:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Delete failed" },
      { status: 500 }
    );
  }
}
