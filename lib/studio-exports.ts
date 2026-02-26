import fs from "fs";
import path from "path";
import { generateId } from "@/lib/db";

type StudioExportFileInput = {
  placement: string;
  dataUrl: string;
};

export type StudioExportRecord = {
  exportId: string;
  source: "studio";
  shopProductId: string;
  productSlug?: string | null;
  productName?: string | null;
  studioRenderSignature?: string | null;
  placements: string[];
  files: Array<{ placement: string; relativeUrl: string }>;
  createdAt: string;
};

const EXPORTS_DIR = path.join(process.cwd(), "public", "uploads", "studio-exports");
const INDEX_DIR = path.join(process.cwd(), "data");
const INDEX_FILE = path.join(INDEX_DIR, "studio-exports-index.json");
const MAX_INDEX_RECORDS = 400;
const MAX_FILES_PER_EXPORT = 12;
const MAX_DATA_URL_LENGTH = 30 * 1024 * 1024;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizePlacement(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

function parseDataUrl(dataUrl: string): { buffer: Buffer; extension: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  const mime = match[1].toLowerCase();
  const base64 = match[2];
  const extension =
    mime === "image/png" ? "png" :
    mime === "image/jpeg" ? "jpg" :
    mime === "image/webp" ? "webp" : null;
  if (!extension) {
    throw new Error(`Unsupported image type: ${mime}`);
  }
  return { buffer: Buffer.from(base64, "base64"), extension };
}

function readIndex(): StudioExportRecord[] {
  if (!fs.existsSync(INDEX_FILE)) return [];
  try {
    const raw = fs.readFileSync(INDEX_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(records: StudioExportRecord[]) {
  ensureDir(INDEX_DIR);
  fs.writeFileSync(INDEX_FILE, JSON.stringify(records.slice(0, MAX_INDEX_RECORDS), null, 2), "utf8");
}

export function createStudioExport(input: {
  shopProductId: string;
  productSlug?: string | null;
  productName?: string | null;
  studioRenderSignature?: string | null;
  designFiles: StudioExportFileInput[];
}): StudioExportRecord {
  if (!input.shopProductId) {
    throw new Error("shopProductId is required");
  }
  if (!Array.isArray(input.designFiles) || input.designFiles.length === 0) {
    throw new Error("designFiles are required");
  }
  if (input.designFiles.length > MAX_FILES_PER_EXPORT) {
    throw new Error(`Too many design files (max ${MAX_FILES_PER_EXPORT})`);
  }

  const exportId = `studio_${generateId()}`;
  const createdAt = new Date().toISOString();
  const exportDir = path.join(EXPORTS_DIR, exportId);
  ensureDir(exportDir);

  const files: Array<{ placement: string; relativeUrl: string }> = [];
  for (const file of input.designFiles) {
    if (!file?.placement || !file?.dataUrl?.startsWith("data:image/")) {
      continue;
    }
    if (file.dataUrl.length > MAX_DATA_URL_LENGTH) {
      throw new Error(`Design file for placement "${file.placement}" exceeds max size`);
    }
    const placement = sanitizePlacement(file.placement);
    const parsed = parseDataUrl(file.dataUrl);
    const filename = `${placement}.${parsed.extension}`;
    const diskPath = path.join(exportDir, filename);
    fs.writeFileSync(diskPath, parsed.buffer);
    files.push({
      placement: file.placement,
      relativeUrl: `/uploads/studio-exports/${exportId}/${filename}`,
    });
  }

  if (files.length === 0) {
    throw new Error("No valid image files found in studio export");
  }

  const record: StudioExportRecord = {
    exportId,
    source: "studio",
    shopProductId: input.shopProductId,
    productSlug: input.productSlug || null,
    productName: input.productName || null,
    studioRenderSignature: input.studioRenderSignature || null,
    placements: files.map((f) => f.placement),
    files,
    createdAt,
  };

  const existing = readIndex();
  writeIndex([record, ...existing.filter((r) => r.exportId !== exportId)]);
  return record;
}

export function getStudioExportById(exportId: string): StudioExportRecord | null {
  if (!/^studio_[a-zA-Z0-9_-]+$/.test(exportId)) return null;
  const records = readIndex();
  return records.find((r) => r.exportId === exportId) || null;
}

export function listStudioExports(shopProductId?: string, limit = 20): StudioExportRecord[] {
  const records = readIndex();
  const filtered = shopProductId
    ? records.filter((r) => r.shopProductId === shopProductId)
    : records;
  return filtered.slice(0, Math.max(1, Math.min(100, limit)));
}
