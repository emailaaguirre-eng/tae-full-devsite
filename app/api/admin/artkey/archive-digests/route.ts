import { NextResponse } from "next/server";
import { getDb, artKeys, guestbookEntries, mediaItems, eq } from "@/lib/db";
import { saveDatabase } from "@/db";
import { sendPortalArchiveDigest } from "@/lib/email";

export const dynamic = "force-dynamic";

function safeJsonParse(str: string | null | undefined, fallback: any): any {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const onlyToken = typeof body?.publicToken === "string" ? body.publicToken.trim() : "";
    const force = body?.force === true;
    const now = new Date();

    const lifetimeDays = Number.parseInt(process.env.ARTKEY_PORTAL_LIFETIME_DAYS || "365", 10);
    const noticeDays = Number.parseInt(process.env.ARTKEY_ARCHIVE_NOTICE_DAYS_BEFORE || "14", 10);
    const msPerDay = 24 * 60 * 60 * 1000;

    const db = await getDb();
    const portals = await db.select().from(artKeys).all();
    const candidates = onlyToken
      ? portals.filter((p) => p.publicToken === onlyToken)
      : portals;

    const sent: string[] = [];
    const skipped: Array<{ token: string; reason: string }> = [];
    const failed: Array<{ token: string; error: string }> = [];

    for (const portal of candidates) {
      if (!portal.ownerEmail) {
        skipped.push({ token: portal.publicToken, reason: "missing ownerEmail" });
        continue;
      }
      const createdAt = portal.createdAt ? new Date(portal.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) {
        skipped.push({ token: portal.publicToken, reason: "invalid createdAt" });
        continue;
      }

      const expiresAt = new Date(createdAt.getTime() + lifetimeDays * msPerDay);
      const notifyAt = new Date(expiresAt.getTime() - noticeDays * msPerDay);
      const customizations = safeJsonParse(portal.customizations, {});

      if (!force) {
        if (customizations.archiveDigestSentAt) {
          skipped.push({ token: portal.publicToken, reason: "already sent" });
          continue;
        }
        if (now < notifyAt) {
          skipped.push({ token: portal.publicToken, reason: "not in notice window yet" });
          continue;
        }
      }

      const entries = await db
        .select()
        .from(guestbookEntries)
        .where(eq(guestbookEntries.artkeyId, portal.id))
        .all();
      const approvedEntries = entries
        .filter((e) => !!e.approved)
        .map((e) => ({
          name: e.name,
          message: e.message,
          createdAt: e.createdAt,
        }));

      const media = await db
        .select()
        .from(mediaItems)
        .where(eq(mediaItems.artkeyId, portal.id))
        .all();
      const approvedMediaUrls = media.filter((m) => !!m.approved).map((m) => m.url);
      const uploadedImages = safeJsonParse(portal.uploadedImages, []) as string[];
      const uploadedVideos = safeJsonParse(portal.uploadedVideos, []) as string[];
      const mediaUrls = Array.from(new Set([...approvedMediaUrls, ...uploadedImages, ...uploadedVideos]));

      const domain = process.env.ARTKEY_DOMAIN || "artkey.theartfulexperience.com";
      const portalUrl = `https://${domain}/${portal.publicToken}`;

      const mailed = await sendPortalArchiveDigest({
        ownerEmail: portal.ownerEmail,
        portalTitle: portal.title || "ArtKey Portal",
        portalUrl,
        expiresAtIso: expiresAt.toISOString(),
        guestbookEntries: approvedEntries,
        mediaUrls,
      });

      if (!mailed) {
        failed.push({ token: portal.publicToken, error: "email send failed" });
        continue;
      }

      customizations.archiveDigestSentAt = now.toISOString();
      customizations.archiveDigestExpiresAt = expiresAt.toISOString();
      await db
        .update(artKeys)
        .set({
          customizations: JSON.stringify(customizations),
          updatedAt: now.toISOString(),
        })
        .where(eq(artKeys.id, portal.id));
      sent.push(portal.publicToken);
    }

    if (sent.length > 0) {
      await saveDatabase();
    }

    return NextResponse.json({
      success: true,
      summary: {
        scanned: candidates.length,
        sent: sent.length,
        skipped: skipped.length,
        failed: failed.length,
      },
      sent,
      skipped,
      failed,
      config: { lifetimeDays, noticeDays },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to send archive digests" },
      { status: 500 }
    );
  }
}
