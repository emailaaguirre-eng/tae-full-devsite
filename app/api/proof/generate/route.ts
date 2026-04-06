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
 *     artKeyTemplatePosition: { placement, x, y, width, height, templateId },
 *     requiresQrCode: boolean,
 *   }],
 *   customerEmail?: string,
 * }
 *
 * Response (per item):
 * {
 *   cartItemId, portalToken, ownerToken, portalUrl, editUrl,
 *   displayProofFiles: [...],  // watermarked — customer review only
 *   productionFiles: [...],    // clean composited — fulfillment / Printful
 *   proofFiles: [...],          // alias of displayProofFiles (backward compatible)
 *   proofSnapshotId: string,    // persisted server snapshot (approve + orders)
 * }
 */
import { NextResponse } from "next/server";
import sharp from "sharp";
import { generateQRCode } from "@/lib/qr";
import { compositeQrOntoDesign } from "@/lib/composite";
import {
  getDb,
  artKeys,
  checkoutProofSnapshots,
  eq,
  and,
  generateId,
  generatePublicToken,
  generateOwnerToken,
} from "@/lib/db";
import { getArtKeyTemplateById } from "@/lib/artkeyTemplates";
import { saveDatabase } from "@/db";
import { enforceRequestRateLimit } from "@/lib/request-rate-limit";
import { normalizeCheckoutEmail } from "@/lib/checkout-proof-email";

const ARTKEY_DOMAIN =
  process.env.ARTKEY_DOMAIN || "artkey.theartfulexperience.com";

function dataUrlToBuffer(dataUrl: string): Buffer {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Invalid data URL");
  return Buffer.from(dataUrl.slice(comma + 1), "base64");
}

function bufferToDataUrl(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function isImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}

async function applyProofWatermark(dataUrl: string): Promise<string> {
  const source = dataUrlToBuffer(dataUrl);
  const base = sharp(source);
  const meta = await base.metadata();
  const width = meta.width || 1200;
  const height = meta.height || 1200;
  const fontSize = Math.max(28, Math.round(Math.min(width, height) * 0.08));
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${Math.round(width / 2)},${Math.round(height / 2)}) rotate(-22)">
        <text x="0" y="0" text-anchor="middle" dominant-baseline="middle"
          fill="rgba(255,255,255,0.22)"
          font-family="Inter, Arial, sans-serif"
          font-size="${fontSize}"
          font-weight="700"
          letter-spacing="2">PROOF</text>
      </g>
    </svg>`
  );
  const out = await base.composite([{ input: svg }]).png().toBuffer();
  return bufferToDataUrl(out, "image/png");
}

export async function POST(req: Request) {
  try {
    const rate = enforceRequestRateLimit(req, {
      keyPrefix: "proof-generate",
      windowMs: 5 * 60_000,
      maxRequests: 20,
    });
    if (!rate.ok) return rate.response;

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
    const customerEmailNorm = normalizeCheckoutEmail(customerEmail);
    const proofs = [];

    for (const item of items) {
      const {
        cartItemId,
        designFiles,
        artKeyData,
        artKeyTemplatePosition,
        existingPortal,
        requiresQrCode,
      } = item;

      if (!requiresQrCode || !designFiles || designFiles.length === 0) {
        const files = designFiles || [];
        proofs.push({
          cartItemId,
          portalToken: null,
          ownerToken: null,
          portalUrl: null,
          editUrl: null,
          productionFiles: files,
          displayProofFiles: files,
          proofFiles: files,
        });
        continue;
      }

      const payload = {
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
      };

      // Step 1: Reuse existing portal/tokens if available; otherwise create once.
      let portalId: string | null = null;
      let publicToken: string;
      let ownerToken: string;
      let reusedPortal = false;

      if (existingPortal?.portalToken && existingPortal?.ownerToken) {
        const matches = await db
          .select()
          .from(artKeys)
          .where(
            and(
              eq(artKeys.publicToken, String(existingPortal.portalToken)),
              eq(artKeys.ownerToken, String(existingPortal.ownerToken))
            )
          )
          .all();
        const existing = matches[0];
        if (existing) {
          reusedPortal = true;
          portalId = existing.id;
          publicToken = existing.publicToken;
          ownerToken = existing.ownerToken;
          await db
            .update(artKeys)
            .set({
              ownerEmail: customerEmail || existing.ownerEmail || null,
              ...payload,
              updatedAt: now,
            })
            .where(eq(artKeys.id, existing.id));
        } else {
          publicToken = generatePublicToken();
          ownerToken = generateOwnerToken();
        }
      } else {
        publicToken = generatePublicToken();
        ownerToken = generateOwnerToken();
      }

      if (!reusedPortal) {
        portalId = generateId();
        await db.insert(artKeys).values({
          id: portalId,
          publicToken,
          ownerToken,
          ownerEmail: customerEmail || null,
          ...payload,
          createdAt: now,
          updatedAt: now,
        });
      }

      const portalUrl = `https://${ARTKEY_DOMAIN}/${publicToken}`;
      const editUrl = `/art-key/${publicToken}/edit?owner=${ownerToken}`;

      // Step 2: Generate the real QR code
      // QR fraction constants are template-specific and must match studio rendering.
      const selectedTemplate = getArtKeyTemplateById(
        artKeyTemplatePosition?.templateId
      );
      const QR_SIZE_FRAC = selectedTemplate.qr.sizeFraction;
      const QR_X_FRAC = selectedTemplate.qr.xFraction;
      const QR_Y_FRAC = selectedTemplate.qr.yFraction;
      const MIN_QR_PX = 150;        // 0.5in @ 300 DPI

      const templateW = artKeyTemplatePosition?.width || 300;
      const designedQrSize = Math.round(templateW * QR_SIZE_FRAC);
      // Generate at high enough source resolution for quality, but keep final
      // composited dimensions exactly as designed in studio.
      const actualQrSize = Math.max(MIN_QR_PX, designedQrSize);
      let qrDataUrl = existingPortal?.qrCodeDataUrl
        ? String(existingPortal.qrCodeDataUrl)
        : "";
      if (!qrDataUrl) {
        qrDataUrl = await generateQRCode(portalUrl, actualQrSize, 2);
      }

      // Step 3: Composite QR onto each design file that has the template
      const proofFiles = [];
      for (const df of designFiles) {
        if (!df?.placement || !isImageDataUrl(df?.dataUrl)) {
          console.warn(
            `Skipping invalid design file for ${cartItemId}/${String(df?.placement || "unknown")}`
          );
          continue;
        }

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
          const qrSize = Math.round(artKeyTemplatePosition.width * QR_SIZE_FRAC);
          const qrW = qrSize;
          const qrH = qrSize;

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

      if (proofFiles.length === 0) {
        throw new Error(`No valid proof image files for cart item ${cartItemId}`);
      }

      const displayProofFiles = await Promise.all(
        proofFiles.map(async (file: { placement: string; dataUrl: string }) => ({
          ...file,
          dataUrl: await applyProofWatermark(file.dataUrl),
        }))
      );

      const productionFiles = proofFiles.map((f: { placement: string; dataUrl: string }) => ({
        placement: f.placement,
        dataUrl: f.dataUrl,
      }));

      const proofSnapshotId = generateId();
      const metaJson = JSON.stringify({
        portalToken: publicToken,
        ownerToken,
        portalUrl,
        editUrl,
        reusedPortal,
        qrCodeDataUrl: qrDataUrl,
      });

      await db.insert(checkoutProofSnapshots).values({
        id: proofSnapshotId,
        cartItemId: String(cartItemId),
        artKeyId: portalId,
        publicToken,
        customerEmail: customerEmailNorm,
        displayProofFilesJson: JSON.stringify(displayProofFiles),
        productionFilesJson: JSON.stringify(productionFiles),
        metaJson,
        createdAt: now,
        approvedAt: null,
      });

      proofs.push({
        cartItemId,
        portalId,
        portalToken: publicToken,
        ownerToken,
        portalUrl,
        editUrl,
        qrCodeDataUrl: qrDataUrl,
        reusedPortal,
        productionFiles,
        displayProofFiles,
        proofFiles: displayProofFiles,
        proofSnapshotId,
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
