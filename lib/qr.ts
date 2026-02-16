/**
 * QR Code Generator
 *
 * Generates QR codes as data URL images using the `qrcode` npm package.
 * Used server-side during proof generation to create real QR codes
 * that point to ArtKey portal URLs.
 */

/**
 * Generate a QR code as a PNG data URL.
 *
 * @param url    - The URL to encode in the QR code
 * @param size   - Width/height in pixels (default 300)
 * @param margin - Quiet-zone modules around the QR (default 2)
 * @returns      - PNG data URL string
 */
export async function generateQRCode(
  url: string,
  size: number = 300,
  margin: number = 2
): Promise<string> {
  const QRCode = await import("qrcode");
  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
  return dataUrl;
}

/**
 * Get the full ArtKey portal URL for a given public token.
 */
export function getArtKeyPortalUrl(publicToken: string): string {
  const domain =
    process.env.ARTKEY_DOMAIN || "artkey.theartfulexperience.com";
  return `https://${domain}/${publicToken}`;
}
