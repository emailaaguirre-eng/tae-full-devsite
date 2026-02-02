// QR Code Generator (Local)
// Generates QR codes as data URLs for use in Konva

/**
 * Generate a QR code as a data URL image
 * Uses a simple, lightweight QR code generation approach
 */
export async function generateQRCode(
  url: string,
  size: number = 200,
  margin: number = 4
): Promise<string> {
  // Use a lightweight QR code library
  // For now, we'll use a simple approach with qrcode library
  // If not available, we'll implement a minimal fallback
  
  // Use qrcode library (already installed)
  const QRCode = await import('qrcode');
  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: margin,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
  return dataUrl;
}

/**
 * Generate a placeholder QR code (simple pattern)
 * This is a minimal fallback if qrcode library is not installed
 */
function generatePlaceholderQR(url: string, size: number): string {
  if (typeof document === 'undefined') {
    // Return a simple data URL with error message for SSR
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    // Return a simple data URL with error message
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
  
  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  
  // Black border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);
  
  // Simple pattern (placeholder)
  ctx.fillStyle = '#000000';
  const cellSize = size / 10;
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if ((i + j) % 3 === 0) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }
  
  // Add text
  ctx.fillStyle = '#000000';
  ctx.font = `${size / 20}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('QR', size / 2, size / 2);
  
  return canvas.toDataURL('image/png');
}

/**
 * Get default ArtKey URL placeholder
 */
export function getDefaultArtKeyUrl(placeholder?: string): string {
  return placeholder || 'https://theartfulexperience.com/artkey/PLACEHOLDER';
}

