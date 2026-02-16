/**
 * POST /api/portal/[token]/moderate
 *
 * Moderate guestbook entries and media items (approve/reject).
 * Requires the owner token in the X-Owner-Token header.
 *
 * Body:
 * {
 *   type: "guestbook" | "media",
 *   entryId: string,
 *   action: "approve" | "reject"
 * }
 */
import { NextResponse } from "next/server";
import { getDb, artKeys, guestbookEntries, mediaItems, eq } from "@/lib/db";
import { saveDatabase } from "@/db";

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const db = await getDb();
    const { token } = params;

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
    if (portal.ownerToken !== ownerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { type, entryId, action } = body;

    if (!type || !entryId || !action) {
      return NextResponse.json(
        { success: false, error: "type, entryId, and action are required" },
        { status: 400 }
      );
    }

    if (type === "guestbook") {
      if (action === "approve") {
        await db
          .update(guestbookEntries)
          .set({ approved: true })
          .where(eq(guestbookEntries.id, entryId));
      } else if (action === "reject") {
        await db
          .delete(guestbookEntries)
          .where(eq(guestbookEntries.id, entryId));
      }
    } else if (type === "media") {
      if (action === "approve") {
        await db
          .update(mediaItems)
          .set({ approved: true })
          .where(eq(mediaItems.id, entryId));
      } else if (action === "reject") {
        await db.delete(mediaItems).where(eq(mediaItems.id, entryId));
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid type — must be guestbook or media" },
        { status: 400 }
      );
    }

    await saveDatabase();

    return NextResponse.json({
      success: true,
      message: `${type} entry ${action}d`,
    });
  } catch (err: any) {
    console.error("Moderation error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Moderation failed" },
      { status: 500 }
    );
  }
}
