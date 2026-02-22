/**
 * Admin: Manage gallery artists
 *
 * GET    /api/admin/gallery              — list all artists (sorted)
 * POST   /api/admin/gallery              — create or update artist (JSON or multipart)
 * DELETE /api/admin/gallery?id=x         — delete artist
 * PATCH  /api/admin/gallery              — reorder artists { items: [{id, sortOrder}] }
 */
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getDb, artists, artistArtworks, eq, asc } from "@/lib/db";
import { generateId } from "@/lib/db";
import { saveDatabase } from "@/db";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_{2,}/g, "_").toLowerCase();
}

async function saveUploadedFile(file: File, slug: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", "gallery", slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const safeName = `${Date.now()}-${sanitizeFilename(file.name)}`;
  const filePath = path.join(dir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return `/uploads/gallery/${slug}/${safeName}`;
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(artists).orderBy(asc(artists.sortOrder)).all();
    return NextResponse.json({ success: true, data: rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let body: any;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
      const thumbFile = formData.get("thumbnailFile") as File | null;
      const bioFile = formData.get("bioImageFile") as File | null;
      const slug = body.slug || slugify(body.name || "artist");

      if (thumbFile && thumbFile.size > 0) {
        if (!ALLOWED_TYPES.includes(thumbFile.type)) {
          return NextResponse.json({ success: false, error: "Invalid image type" }, { status: 400 });
        }
        if (thumbFile.size > MAX_FILE_SIZE) {
          return NextResponse.json({ success: false, error: "File too large (max 15MB)" }, { status: 400 });
        }
        body.thumbnailImage = await saveUploadedFile(thumbFile, slug);
      }
      if (bioFile && bioFile.size > 0) {
        if (!ALLOWED_TYPES.includes(bioFile.type)) {
          return NextResponse.json({ success: false, error: "Invalid bio image type" }, { status: 400 });
        }
        if (bioFile.size > MAX_FILE_SIZE) {
          return NextResponse.json({ success: false, error: "Bio image too large (max 15MB)" }, { status: 400 });
        }
        body.bioImage = await saveUploadedFile(bioFile, slug);
      }
    } else {
      body = await req.json();
    }

    const db = await getDb();
    const now = new Date().toISOString();

    if (body.id) {
      // Update existing
      await db.update(artists).set({
        name: body.name,
        slug: body.slug || slugify(body.name),
        title: body.title || null,
        bio: body.bio || null,
        description: body.description || null,
        thumbnailImage: body.thumbnailImage !== undefined ? body.thumbnailImage : undefined,
        bioImage: body.bioImage !== undefined ? body.bioImage : undefined,
        active: body.active !== undefined ? (body.active === "true" || body.active === true) : undefined,
        featured: body.featured !== undefined ? (body.featured === "true" || body.featured === true) : undefined,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        updatedAt: now,
      }).where(eq(artists.id, body.id));
      await saveDatabase();
      return NextResponse.json({ success: true, id: body.id });
    } else {
      // Create new
      const id = generateId();
      const slug = body.slug || slugify(body.name || "artist");
      await db.insert(artists).values({
        id,
        slug,
        name: body.name || "New Artist",
        title: body.title || null,
        bio: body.bio || null,
        description: body.description || null,
        thumbnailImage: body.thumbnailImage || null,
        bioImage: body.bioImage || null,
        active: body.active !== undefined ? (body.active === "true" || body.active === true) : true,
        featured: body.featured !== undefined ? (body.featured === "true" || body.featured === true) : false,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
        createdAt: now,
        updatedAt: now,
      });
      await saveDatabase();
      return NextResponse.json({ success: true, id });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json({ success: false, error: "items required" }, { status: 400 });
    }
    const db = await getDb();
    const now = new Date().toISOString();
    for (const item of body.items) {
      await db.update(artists).set({ sortOrder: item.sortOrder, updatedAt: now }).where(eq(artists.id, item.id));
    }
    await saveDatabase();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    const db = await getDb();
    await db.delete(artistArtworks).where(eq(artistArtworks.artistId, id));
    await db.delete(artists).where(eq(artists.id, id));
    await saveDatabase();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
