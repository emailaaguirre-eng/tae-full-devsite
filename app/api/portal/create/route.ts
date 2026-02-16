/**
 * POST /api/portal/create
 *
 * Create a new ArtKey portal. Used by:
 * - Admin creating demo portals
 * - Artists creating portals linked to their works
 * - System creating portals during checkout (also done in /api/orders/create)
 *
 * Request body:
 * {
 *   title: string,
 *   ownerEmail?: string,
 *   theme?: object,
 *   features?: object,
 *   links?: array,
 *   spotify?: object,
 *   featuredVideo?: object,
 * }
 */
import { NextResponse } from "next/server";
import { getDb, artKeys, generateId, generateOwnerToken } from "@/lib/db";
import { saveDatabase } from "@/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, ownerEmail, theme, features, links, spotify, featuredVideo } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const id = generateId();
    const publicToken = generateOwnerToken(); // 32-char token for the public URL
    const ownerToken = generateOwnerToken(); // Separate 32-char token for owner access

    await db.insert(artKeys).values({
      id,
      publicToken,
      ownerToken,
      ownerEmail: ownerEmail || null,
      title,
      theme: JSON.stringify(theme || {}),
      features: JSON.stringify(
        features || {
          enable_gallery: true,
          enable_video: false,
          show_guestbook: true,
          enable_custom_links: true,
          enable_spotify: false,
          allow_img_uploads: true,
          allow_vid_uploads: false,
          gb_btn_view: true,
          gb_signing_status: "open",
          gb_signing_start: "",
          gb_signing_end: "",
          gb_require_approval: true,
          img_require_approval: true,
          vid_require_approval: true,
          order: ["gallery", "guestbook", "links"],
        }
      ),
      links: JSON.stringify(links || []),
      spotify: JSON.stringify(spotify || { url: "", autoplay: false }),
      featuredVideo: JSON.stringify(featuredVideo || null),
      customizations: JSON.stringify({}),
      uploadedImages: JSON.stringify([]),
      uploadedVideos: JSON.stringify([]),
      createdAt: now,
      updatedAt: now,
    });

    await saveDatabase();

    const domain = process.env.ARTKEY_DOMAIN || "artkey.theartfulexperience.com";

    return NextResponse.json({
      success: true,
      portal: {
        id,
        publicToken,
        ownerToken,
        portalUrl: `https://${domain}/${publicToken}`,
        editUrl: `/art-key/${publicToken}/edit?owner=${ownerToken}`,
        title,
      },
    });
  } catch (err: any) {
    console.error("Portal creation failed:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create portal" },
      { status: 500 }
    );
  }
}
