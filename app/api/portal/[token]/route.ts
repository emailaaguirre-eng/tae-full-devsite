/**
 * Portal CRUD API
 *
 * GET  /api/portal/[token] — Read portal data (public, anyone can view)
 * PUT  /api/portal/[token] — Update portal data (requires owner token in header)
 */
import { NextResponse } from "next/server";
import { getDb, artKeys, guestbookEntries, mediaItems, eq } from "@/lib/db";

export const dynamic = "force-dynamic";

// ─── GET: Public portal read ──────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const db = await getDb();
    const { token } = params;

    // Look up by publicToken (the 32-char token in the URL)
    const portals = await db
      .select()
      .from(artKeys)
      .where(eq(artKeys.publicToken, token))
      .all();

    if (portals.length === 0) {
      return NextResponse.json(
        { success: false, error: "Portal not found" },
        { status: 404 }
      );
    }

    const portal = portals[0];

    // Fetch approved guestbook entries
    const entries = await db
      .select()
      .from(guestbookEntries)
      .where(eq(guestbookEntries.artkeyId, portal.id))
      .all();

    const approvedEntries = entries.filter((e) => e.approved);

    // Fetch approved media
    const media = await db
      .select()
      .from(mediaItems)
      .where(eq(mediaItems.artkeyId, portal.id))
      .all();

    const approvedMedia = media.filter((m) => m.approved);

    return NextResponse.json({
      success: true,
      data: {
        id: portal.id,
        publicToken: portal.publicToken,
        title: portal.title,
        theme: safeJsonParse(portal.theme, {}),
        features: safeJsonParse(portal.features, {}),
        links: safeJsonParse(portal.links, []),
        spotify: safeJsonParse(portal.spotify, { url: "", autoplay: false }),
        featuredVideo: safeJsonParse(portal.featuredVideo, null),
        customizations: safeJsonParse(portal.customizations, {}),
        uploadedImages: safeJsonParse(portal.uploadedImages, []),
        uploadedVideos: safeJsonParse(portal.uploadedVideos, []),
        guestbook: approvedEntries.map((e) => ({
          id: e.id,
          name: e.name,
          message: e.message,
          role: e.role,
          createdAt: e.createdAt,
        })),
        media: approvedMedia.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          caption: m.caption,
        })),
      },
    });
  } catch (err: any) {
    console.error("Portal read failed:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load portal" },
      { status: 500 }
    );
  }
}

// ─── PUT: Owner portal update ─────────────────────────────────────────────

export async function PUT(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const db = await getDb();
    const { token } = params;

    // Owner auth: check X-Owner-Token header
    const ownerToken = req.headers.get("X-Owner-Token");
    if (!ownerToken) {
      return NextResponse.json(
        { success: false, error: "Missing owner token" },
        { status: 401 }
      );
    }

    const portals = await db
      .select()
      .from(artKeys)
      .where(eq(artKeys.publicToken, token))
      .all();

    if (portals.length === 0) {
      return NextResponse.json(
        { success: false, error: "Portal not found" },
        { status: 404 }
      );
    }

    const portal = portals[0];

    // Verify ownership
    if (portal.ownerToken !== ownerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const now = new Date().toISOString();

    const updates: Record<string, any> = { updatedAt: now };
    if (body.title !== undefined) updates.title = body.title;
    if (body.theme !== undefined) updates.theme = JSON.stringify(body.theme);
    if (body.features !== undefined) updates.features = JSON.stringify(body.features);
    if (body.links !== undefined) updates.links = JSON.stringify(body.links);
    if (body.spotify !== undefined) updates.spotify = JSON.stringify(body.spotify);
    if (body.featuredVideo !== undefined) updates.featuredVideo = JSON.stringify(body.featuredVideo);
    if (body.customizations !== undefined) updates.customizations = JSON.stringify(body.customizations);
    if (body.uploadedImages !== undefined) updates.uploadedImages = JSON.stringify(body.uploadedImages);
    if (body.uploadedVideos !== undefined) updates.uploadedVideos = JSON.stringify(body.uploadedVideos);

    await db.update(artKeys).set(updates).where(eq(artKeys.id, portal.id));

    const { saveDatabase } = await import("@/db");
    await saveDatabase();

    return NextResponse.json({ success: true, message: "Portal updated" });
  } catch (err: any) {
    console.error("Portal update failed:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update portal" },
      { status: 500 }
    );
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────

function safeJsonParse(str: string | null | undefined, fallback: any): any {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
