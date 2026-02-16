/**
 * POST /api/portal/auth
 *
 * Two actions:
 *
 * 1. { action: "validate", publicToken, ownerToken }
 *    — Validates that the owner token is correct for the portal
 *
 * 2. { action: "lookup", email }
 *    — Returns portal titles + edit links for all portals owned by this email
 *    — In production this should send an email instead of returning tokens directly
 */
import { NextResponse } from "next/server";
import { validateOwnerToken, getPortalsByEmail } from "@/lib/portal-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "validate") {
      const { publicToken, ownerToken } = body;
      if (!publicToken || !ownerToken) {
        return NextResponse.json(
          { success: false, error: "Missing tokens" },
          { status: 400 }
        );
      }
      const result = await validateOwnerToken(publicToken, ownerToken);
      if (!result.valid) {
        return NextResponse.json(
          { success: false, error: "Invalid owner token" },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: true, portalId: result.portalId });
    }

    if (body.action === "lookup") {
      const { email } = body;
      if (!email) {
        return NextResponse.json(
          { success: false, error: "Email is required" },
          { status: 400 }
        );
      }
      const portals = await getPortalsByEmail(email);
      if (portals.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No portals found for this email",
          portals: [],
        });
      }
      // In production, send an email with these links instead of returning tokens
      const domain =
        process.env.ARTKEY_DOMAIN || "artkey.theartfulexperience.com";
      return NextResponse.json({
        success: true,
        portals: portals.map((p) => ({
          title: p.title,
          portalUrl: `https://${domain}/${p.publicToken}`,
          editUrl: `/art-key/${p.publicToken}/edit?owner=${p.ownerToken}`,
          createdAt: p.createdAt,
        })),
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Portal auth error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Auth failed" },
      { status: 500 }
    );
  }
}
