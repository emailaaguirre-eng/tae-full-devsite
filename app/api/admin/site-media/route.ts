/**
 * Admin: Manage site media overrides
 *
 * GET  /api/admin/site-media          — list all overrides
 * POST /api/admin/site-media          — upload/replace an override (multipart/form-data)
 * DELETE /api/admin/site-media?key=x  — remove an override (revert to default)
 */
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getDb, siteMedia, eq } from "@/lib/db";
import { generateId } from "@/lib/db";
import { saveDatabase } from "@/db";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
}
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_{2,}/g, "_").toLowerCase();
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(siteMedia).all();
    return NextResponse.json({ success: true, data: rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const key = formData.get("key") as string | null;
    const alt = (formData.get("alt") as string) || "";

    if (!key) {
      return NextResponse.json({ success: false, error: "key is required" }, { status: 400 });
    }
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
        { success: false, error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    const safeKey = sanitizeKey(key);
    const uploadDir = path.join(process.cwd(), "public", "uploads", "site", safeKey);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now().toString(36);
    const safeName = sanitizeFilename(file.name);
    const filename = `${timestamp}-${safeName}`;
    const filepath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(bytes));

    const url = `/uploads/site/${safeKey}/${filename}`;
    const now = new Date().toISOString();

    const db = await getDb();
    const existing = await db.select().from(siteMedia).where(eq(siteMedia.key, key)).all();

    if (existing.length > 0) {
      await db.update(siteMedia).set({ url, alt, updatedAt: now }).where(eq(siteMedia.key, key));
    } else {
      await db.insert(siteMedia).values({ id: generateId(), key, url, alt, updatedAt: now });
    }

    await saveDatabase();

    return NextResponse.json({ success: true, key, url, alt });
  } catch (err: any) {
    console.error("[admin/site-media] Upload error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) {
      return NextResponse.json({ success: false, error: "key query param required" }, { status: 400 });
    }

    const db = await getDb();
    await db.delete(siteMedia).where(eq(siteMedia.key, key));
    await saveDatabase();

    return NextResponse.json({ success: true, key });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Delete failed" }, { status: 500 });
  }
}
