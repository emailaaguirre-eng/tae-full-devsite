/**
 * POST /api/portal/[token]/guestbook
 *
 * Submit a guestbook entry from a guest visiting the portal.
 * Entries are created with approved=false by default (requires host moderation).
 *
 * GET /api/portal/[token]/guestbook?owner={ownerToken}
 *
 * Returns ALL entries (including unapproved) for moderation by the host.
 */
import { NextResponse } from "next/server";
import { getDb, artKeys, guestbookEntries, eq, generateId } from "@/lib/db";
import { saveDatabase } from "@/db";

export const dynamic = "force-dynamic";

// ─── POST: Guest submits a guestbook entry ───────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const db = await getDb();
    const { token } = params;

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
    const features = safeJsonParse(portal.features, {});

    // Check if guestbook signing is open
    if (features.gb_signing_status === "closed") {
      return NextResponse.json(
        { success: false, error: "Guestbook signing is currently closed" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, message } = body;

    if (!name?.trim() || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Name and message are required" },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = new Date().toISOString();
    const requireApproval = features.gb_require_approval !== false;

    await db.insert(guestbookEntries).values({
      id,
      artkeyId: portal.id,
      name: name.trim(),
      email: email?.trim() || null,
      message: message.trim(),
      role: "guest",
      approved: requireApproval ? false : true,
      createdAt: now,
    });

    await saveDatabase();

    return NextResponse.json({
      success: true,
      message: requireApproval
        ? "Your message has been submitted for approval!"
        : "Your message has been posted!",
      entry: { id, name: name.trim(), approved: !requireApproval },
    });
  } catch (err: any) {
    console.error("Guestbook POST error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to submit entry" },
      { status: 500 }
    );
  }
}

// ─── GET: Host fetches all entries for moderation ─────────────────────────

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const db = await getDb();
    const { token } = params;
    const { searchParams } = new URL(req.url);
    const ownerToken = searchParams.get("owner");

    if (!ownerToken) {
      return NextResponse.json(
        { success: false, error: "Owner token required for moderation view" },
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

    const entries = await db
      .select()
      .from(guestbookEntries)
      .where(eq(guestbookEntries.artkeyId, portal.id))
      .all();

    return NextResponse.json({
      success: true,
      entries: entries.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        message: e.message,
        role: e.role,
        approved: e.approved,
        createdAt: e.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("Guestbook GET error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

function safeJsonParse(str: string | null | undefined, fallback: any): any {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
