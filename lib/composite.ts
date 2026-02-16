/**
 * Image compositing utilities for proof generation.
 * Uses Sharp to swap the placeholder QR with a real QR code in the exported design.
 */
import sharp from "sharp";

/**
 * Decode a data URL to a raw Buffer.
 */
export function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",")[1];
  return Buffer.from(base64, "base64");
}

/**
 * Encode a Buffer to a PNG data URL.
 */
export function bufferToDataUrl(buf: Buffer, mime = "image/png"): string {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/**
 * Composite a QR code image onto a design image at the specified position.
 *
 * @param designDataUrl - The exported design as a data URL (PNG)
 * @param qrDataUrl     - The generated QR code as a data URL (PNG)
 * @param position      - Where to place the QR on the design (in print-space pixels)
 * @returns Data URL of the composited proof image
 */
export async function compositeQrOntoDesign(
  designDataUrl: string,
  qrDataUrl: string,
  position: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const designBuf = dataUrlToBuffer(designDataUrl);
  const qrBuf = dataUrlToBuffer(qrDataUrl);

  // Resize QR to match the target size
  const resizedQr = await sharp(qrBuf)
    .resize(position.width, position.height, { fit: "contain" })
    .png()
    .toBuffer();

  // Composite QR onto the design
  const result = await sharp(designBuf)
    .composite([
      {
        input: resizedQr,
        left: position.x,
        top: position.y,
      },
    ])
    .png()
    .toBuffer();

  return bufferToDataUrl(result);
}
