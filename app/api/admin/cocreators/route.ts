/**
 * Admin: Manage cocreators
 *
 * GET    /api/admin/cocreators              — list all cocreators (sorted)
 * POST   /api/admin/cocreators              — create or update cocreator (JSON or multipart)
 * DELETE /api/admin/cocreators?id=x         — delete cocreator
 * PATCH  /api/admin/cocreators              — reorder { items: [{id, sortOrder}] }
 */
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getDb, coCreators, coCreatorProducts, eq, asc } from "@/lib/db";
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
  const dir = path.join(process.cwd(), "public", "uploads", "cocreators", slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const safeName = `${Date.now()}-${sanitizeFilename(file.name)}`;
  const filePath = path.join(dir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return `/uploads/cocreators/${slug}/${safeName}`;
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(coCreators).orderBy(asc(coCreators.sortOrder)).all();
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
      const heroFile = formData.get("heroImageFile") as File | null;
      const slug = body.slug || slugify(body.name || "cocreator");

      if (thumbFile && thumbFile.size > 0) {
        if (!ALLOWED_TYPES.includes(thumbFile.type)) {
          return NextResponse.json({ success: false, error: "Invalid image type" }, { status: 400 });
        }
        if (thumbFile.size > MAX_FILE_SIZE) {
          return NextResponse.json({ success: false, error: "File too large (max 15MB)" }, { status: 400 });
        }
        body.thumbnailImage = await saveUploadedFile(thumbFile, slug);
      }
      if (heroFile && heroFile.size > 0) {
        if (!ALLOWED_TYPES.includes(heroFile.type)) {
          return NextResponse.json({ success: false, error: "Invalid hero image type" }, { status: 400 });
        }
        if (heroFile.size > MAX_FILE_SIZE) {
          return NextResponse.json({ success: false, error: "Hero image too large (max 15MB)" }, { status: 400 });
        }
        body.heroImage = await saveUploadedFile(heroFile, slug);
      }
    } else {
      body = await req.json();
    }

    const db = await getDb();
    const now = new Date().toISOString();

    if (body.id) {
      await db.update(coCreators).set({
        name: body.name,
        slug: body.slug || slugify(body.name),
        title: body.title || null,
        bio: body.bio || null,
        description: body.description || null,
        thumbnailImage: body.thumbnailImage !== undefined ? body.thumbnailImage : undefined,
        heroImage: body.heroImage !== undefined ? body.heroImage : undefined,
        active: body.active !== undefined ? (body.active === "true" || body.active === true) : undefined,
        featured: body.featured !== undefined ? (body.featured === "true" || body.featured === true) : undefined,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        updatedAt: now,
      }).where(eq(coCreators.id, body.id));
      await saveDatabase();
      return NextResponse.json({ success: true, id: body.id });
    } else {
      const id = generateId();
      const slug = body.slug || slugify(body.name || "cocreator");
      await db.insert(coCreators).values({
        id,
        slug,
        name: body.name || "New CoCreator",
        title: body.title || null,
        bio: body.bio || null,
        description: body.description || null,
        thumbnailImage: body.thumbnailImage || null,
        heroImage: body.heroImage || null,
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
      await db.update(coCreators).set({ sortOrder: item.sortOrder, updatedAt: now }).where(eq(coCreators.id, item.id));
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
    await db.delete(coCreatorProducts).where(eq(coCreatorProducts.cocreatorId, id));
    await db.delete(coCreators).where(eq(coCreators.id, id));
    await saveDatabase();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
