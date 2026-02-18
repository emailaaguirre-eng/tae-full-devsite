/**
 * POST /api/proof/generate
 *
 * The "magic moment" endpoint. For each cart item that requires a QR code:
 * 1. Creates the ArtKey portal record in the DB with unique public + owner tokens
 * 2. Generates a real QR code pointing to artkey.theartfulexperience.com/{publicToken}
 * 3. Composites the QR code onto the design proof, replacing the placeholder
 * 4. Returns the proof image(s) for customer approval, along with both tokens
 *
 * Request body:
 * {
 *   items: [{
 *     cartItemId: string,
 *     designFiles: [{ placement: string, dataUrl: string }],
 *     artKeyData: { title, theme, features, links, ... },
 *     artKeyTemplatePosition: { placement, x, y, width, height },
 *     requiresQrCode: boolean,
 *   }],
 *   customerEmail?: string,
 * }
 *
 * Response:
 * {
 *   proofs: [{
 *     cartItemId: string,
 *     portalToken: string,       // public token (in the QR URL)
 *     ownerToken: string,        // separate owner token for editing
 *     portalUrl: string,
 *     editUrl: string,
 *     proofFiles: [{ placement: string, dataUrl: string }],
 *   }]
 * }
 */
import { NextResponse } from "next/server";
import { generateQRCode } from "@/lib/qr";
import { compositeQrOntoDesign } from "@/lib/composite";
import {
  getDb,
  artKeys,
  generateId,
  generatePublicToken,
  generateOwnerToken,
} from "@/lib/db";
import { saveDatabase } from "@/db";

const ARTKEY_DOMAIN =
  process.env.ARTKEY_DOMAIN || "artkey.theartfulexperience.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, customerEmail } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items provided" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const proofs = [];

    for (const item of items) {
      const {
        cartItemId,
        designFiles,
        artKeyData,
        artKeyTemplatePosition,
        requiresQrCode,
      } = item;

      if (!requiresQrCode || !designFiles || designFiles.length === 0) {
        proofs.push({
          cartItemId,
          portalToken: null,
          ownerToken: null,
          portalUrl: null,
          editUrl: null,
          proofFiles: designFiles || [],
        });
        continue;
      }

      // Step 1: Generate unique tokens and create portal in the DB
      const portalId = generateId();
      const publicToken = generatePublicToken();
      const ownerToken = generateOwnerToken();
      const portalUrl = `https://${ARTKEY_DOMAIN}/${publicToken}`;
      const editUrl = `/art-key/${publicToken}/edit?owner=${ownerToken}`;

      await db.insert(artKeys).values({
        id: portalId,
        publicToken,
        ownerToken,
        ownerEmail: customerEmail || null,
        title: artKeyData?.title || "My ArtKey Portal",
        theme: JSON.stringify(artKeyData?.theme || {}),
        features: JSON.stringify(
          artKeyData?.features || {
            enable_gallery: true,
            enable_video: false,
            show_guestbook: true,
            enable_custom_links: true,
            enable_spotify: false,
            allow_img_uploads: true,
            allow_vid_uploads: false,
            gb_btn_view: true,
            gb_signing_status: "open",
            gb_require_approval: true,
            order: ["links", "gallery", "guestbook"],
          }
        ),
        links: JSON.stringify(artKeyData?.links || []),
        spotify: JSON.stringify(
          artKeyData?.spotify || { url: "", autoplay: false }
        ),
        featuredVideo: JSON.stringify(artKeyData?.featured_video || null),
        customizations: JSON.stringify(artKeyData?.customizations || {}),
        uploadedImages: JSON.stringify(artKeyData?.uploadedImages || []),
        uploadedVideos: JSON.stringify(artKeyData?.uploadedVideos || []),
        createdAt: now,
        updatedAt: now,
      });

      // Step 2: Generate the real QR code
      // QR fraction constants must match the studio (CustomizationStudio.tsx)
      // These represent where the QR sits inside the compact ArtKey template SVG
      const QR_SIZE_FRAC = 0.55;    // QR is 55% of template size
      const QR_X_FRAC = 0.225;      // QR top-left x offset within template
      const QR_Y_FRAC = 0.30;       // QR top-left y offset within template

      const templateW = artKeyTemplatePosition?.width || 300;
      const actualQrSize = Math.round(templateW * QR_SIZE_FRAC);
      const qrDataUrl = await generateQRCode(portalUrl, actualQrSize, 2);

      // Step 3: Composite QR onto each design file that has the template
      const proofFiles = [];
      for (const df of designFiles) {
        if (
          artKeyTemplatePosition &&
          df.placement === artKeyTemplatePosition.placement
        ) {
          const qrX = Math.round(
            artKeyTemplatePosition.x +
              artKeyTemplatePosition.width * QR_X_FRAC
          );
          const qrY = Math.round(
            artKeyTemplatePosition.y +
              artKeyTemplatePosition.height * QR_Y_FRAC
          );
          const qrW = Math.round(
            artKeyTemplatePosition.width * QR_SIZE_FRAC
          );
          const qrH = Math.round(
            artKeyTemplatePosition.height * QR_SIZE_FRAC
          );

          try {
            const composited = await compositeQrOntoDesign(
              df.dataUrl,
              qrDataUrl,
              { x: qrX, y: qrY, width: qrW, height: qrH }
            );
            proofFiles.push({ placement: df.placement, dataUrl: composited });
          } catch (err) {
            console.error(
              `Composite failed for ${cartItemId}/${df.placement}:`,
              err
            );
            proofFiles.push(df);
          }
        } else {
          proofFiles.push(df);
        }
      }

      proofs.push({
        cartItemId,
        portalId,
        portalToken: publicToken,
        ownerToken,
        portalUrl,
        editUrl,
        proofFiles,
      });
    }

    await saveDatabase();

    return NextResponse.json({ success: true, proofs });
  } catch (err: any) {
    console.error("Proof generation failed:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Proof generation failed" },
      { status: 500 }
    );
  }
}
