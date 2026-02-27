import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";
import { getDb, artKeys, eq } from "@/lib/db";
import { ARTKEY_TEMPLATES, getArtKeyTemplateById } from "@/lib/artkeyTemplates";
import { getArtKeyPortalUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ExportFormat = "png" | "svg" | "pdf";
type PaperSize = "letter" | "a4";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function safeName(input: string): string {
  return (input || "artkey-demo")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "artkey-demo";
}

async function loadTemplateBuffer(assetUrl: string): Promise<Buffer> {
  const safeAssetPath = assetUrl.startsWith("/") ? assetUrl.slice(1) : assetUrl;
  const fullPath = path.join(process.cwd(), "public", safeAssetPath);
  return fs.readFile(fullPath);
}

async function buildPngBuffer({
  templateId,
  portalUrl,
  width,
}: {
  templateId: string;
  portalUrl: string;
  width: number;
}): Promise<{ buffer: Buffer; width: number; height: number }> {
  const template = getArtKeyTemplateById(templateId);
  const templateBuffer = await loadTemplateBuffer(template.assetUrl);
  const outWidth = clamp(width, 800, 5000);
  const outHeight = Math.round(outWidth / (template.displayAspectRatio || 2.25));
  const qrSize = Math.max(80, Math.round(outWidth * template.qr.sizeFraction));
  const left = Math.round(outWidth * template.qr.xFraction - qrSize / 2);
  const top = Math.round(outHeight * template.qr.yFraction - qrSize / 2);

  const QRCode = await import("qrcode");
  const qrBuffer = await QRCode.toBuffer(portalUrl, {
    width: qrSize,
    margin: 0,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });

  const image = await sharp(templateBuffer, { density: 300 })
    .resize(outWidth, outHeight, { fit: "fill" })
    .composite([
      {
        input: qrBuffer,
        left: clamp(left, 0, Math.max(0, outWidth - qrSize)),
        top: clamp(top, 0, Math.max(0, outHeight - qrSize)),
      },
    ])
    .png()
    .toBuffer();

  return { buffer: image, width: outWidth, height: outHeight };
}

async function buildSvg({
  templateId,
  portalUrl,
  width,
}: {
  templateId: string;
  portalUrl: string;
  width: number;
}): Promise<string> {
  const template = getArtKeyTemplateById(templateId);
  const templateBuffer = await loadTemplateBuffer(template.assetUrl);
  const outWidth = clamp(width, 800, 5000);
  const outHeight = Math.round(outWidth / (template.displayAspectRatio || 2.25));
  const qrSize = Math.max(80, Math.round(outWidth * template.qr.sizeFraction));
  const left = Math.round(outWidth * template.qr.xFraction - qrSize / 2);
  const top = Math.round(outHeight * template.qr.yFraction - qrSize / 2);

  const QRCode = await import("qrcode");
  const qrDataUrl = await QRCode.toDataURL(portalUrl, {
    width: qrSize,
    margin: 0,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });

  const baseDataUrl = `data:image/svg+xml;base64,${templateBuffer.toString("base64")}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${outWidth}" height="${outHeight}" viewBox="0 0 ${outWidth} ${outHeight}">
  <image href="${baseDataUrl}" x="0" y="0" width="${outWidth}" height="${outHeight}" preserveAspectRatio="none" />
  <image href="${qrDataUrl}" x="${clamp(left, 0, Math.max(0, outWidth - qrSize))}" y="${clamp(top, 0, Math.max(0, outHeight - qrSize))}" width="${qrSize}" height="${qrSize}" />
</svg>`;
}

async function buildPdfBuffer({
  title,
  templateId,
  portalUrl,
  paper,
}: {
  title: string;
  templateId: string;
  portalUrl: string;
  paper: PaperSize;
}): Promise<Buffer> {
  const PDFKitModule = await import("pdfkit");
  const PDFDocument = PDFKitModule.default;
  const doc = new PDFDocument({
    margin: 36,
    size: paper === "a4" ? "A4" : "LETTER",
    layout: "landscape",
  });
  const chunks: Buffer[] = [];
  const out = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const png = await buildPngBuffer({
    templateId,
    portalUrl,
    width: paper === "a4" ? 2600 : 2400,
  });

  const maxW = doc.page.width - 72;
  const maxH = doc.page.height - 108;
  const ratio = png.width / png.height;
  let drawW = maxW;
  let drawH = drawW / ratio;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = drawH * ratio;
  }
  const x = (doc.page.width - drawW) / 2;
  const y = 28 + (maxH - drawH) / 2;

  doc.fontSize(10).fillColor("#4b5563").text(`ArtKey Demo: ${title}`, 36, 18);
  doc.image(png.buffer, x, y, { width: drawW, height: drawH });
  doc.end();
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    const format = (req.nextUrl.searchParams.get("format") || "pdf").toLowerCase() as ExportFormat;
    const templateId = req.nextUrl.searchParams.get("templateId") || ARTKEY_TEMPLATES[0].id;
    const paper = (req.nextUrl.searchParams.get("paper") || "letter").toLowerCase() as PaperSize;
    const width = Number.parseInt(req.nextUrl.searchParams.get("width") || "1800", 10);

    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
    }
    if (!["png", "svg", "pdf"].includes(format)) {
      return NextResponse.json({ success: false, error: "Invalid format" }, { status: 400 });
    }
    if (!ARTKEY_TEMPLATES.some((t) => t.id === templateId)) {
      return NextResponse.json({ success: false, error: "Invalid templateId" }, { status: 400 });
    }
    if (format === "pdf" && !["letter", "a4"].includes(paper)) {
      return NextResponse.json({ success: false, error: "Invalid paper size" }, { status: 400 });
    }

    const db = await getDb();
    const demo = await db.select().from(artKeys).where(eq(artKeys.publicToken, token)).get();
    if (!demo) {
      return NextResponse.json({ success: false, error: "ArtKey demo not found" }, { status: 404 });
    }

    const title = demo.title || "ArtKey Demo";
    const portalUrl = getArtKeyPortalUrl(token);
    const filenameBase = `${safeName(title)}-${token.slice(0, 8)}-template`;

    if (format === "png") {
      const png = await buildPngBuffer({ templateId, portalUrl, width });
      return new NextResponse(new Uint8Array(png.buffer), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${filenameBase}.png"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (format === "svg") {
      const svg = await buildSvg({ templateId, portalUrl, width });
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filenameBase}.svg"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const pdf = await buildPdfBuffer({ title, templateId, portalUrl, paper });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[artkey-demos/export] failed:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to export ArtKey template" },
      { status: 500 }
    );
  }
}
