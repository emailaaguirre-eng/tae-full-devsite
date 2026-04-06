/**
 * Re-encode studio export images for POST /api/studio/exports only.
 * JPEG is much smaller than PNG data URLs in JSON, reducing 413 risk from proxies.
 * Full-resolution PNGs from the studio are unchanged elsewhere (sessionStorage, downloads).
 */

export type StudioDesignFile = { placement: string; dataUrl: string };

const DEFAULT_JPEG_QUALITY = 0.88;

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for register encoding"));
    img.src = dataUrl;
  });
}

/** PNG/WebP (etc.) → JPEG data URL at same pixel dimensions. */
async function toJpegDataUrl(dataUrl: string, quality: number): Promise<string> {
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) throw new Error("Invalid image dimensions");
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0);
  const out = canvas.toDataURL("image/jpeg", quality);
  if (!out.startsWith("data:image/jpeg")) throw new Error("JPEG encoding failed");
  return out;
}

function shouldReencode(dataUrl: string): boolean {
  if (!dataUrl.startsWith("data:image/")) return false;
  const head = dataUrl.slice(0, 40).toLowerCase();
  if (head.includes("image/jpeg") || head.includes("image/jpg")) return false;
  return true;
}

/**
 * Returns a copy of files with raster data URLs re-encoded as JPEG for smaller JSON bodies.
 * On failure for a file, the original entry is kept.
 */
export async function encodeDesignFilesForStudioRegister(
  files: StudioDesignFile[],
  options?: { quality?: number }
): Promise<StudioDesignFile[]> {
  if (typeof document === "undefined") return files;
  const quality = options?.quality ?? DEFAULT_JPEG_QUALITY;
  const out: StudioDesignFile[] = [];
  for (const f of files) {
    if (!f?.placement || !shouldReencode(f.dataUrl)) {
      out.push(f);
      continue;
    }
    try {
      const dataUrl = await toJpegDataUrl(f.dataUrl, quality);
      out.push({ placement: f.placement, dataUrl });
    } catch {
      out.push(f);
    }
  }
  return out;
}
