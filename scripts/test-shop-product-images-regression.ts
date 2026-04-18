/**
 * Regression checks for shop product image merge + matrix variant id coercion.
 * Run: npm run test:shop-product-images
 */
import { mergeLegacyAndDbImages } from "../lib/shop-product-images";
import type { shopProductImages } from "@/db/schema";

type ImgRow = typeof shopProductImages.$inferSelect;

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function matrixRowPrintfulVariantIdNum(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = Math.trunc(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const sharedUrl = "https://cdn.example.com/art.jpg";

const dbVariantRow: ImgRow = {
  id: "img-db-1",
  productId: "prod-1",
  imageUrl: sharedUrl,
  title: null,
  description: null,
  sortOrder: 0,
  isHero: true,
  isActive: true,
  sourceType: "variant",
  variantKey: "row-1776497206082-ykb8x",
  variantId: "3877",
  size: null,
  frame: null,
  frameColor: null,
  material: null,
  orientation: null,
  format: null,
  createdAt: "0",
  updatedAt: "0",
};

const libResolved = {
  hero: { assetId: "lib-hero-1", url: sharedUrl },
  gallery: [] as { assetId: string; url: string }[],
};

const merged = mergeLegacyAndDbImages("prod-1", null, "[]", [dbVariantRow], libResolved);
assert(merged.length === 1, `expected 1 merged row, got ${merged.length}`);
assert(merged[0].sourceType === "variant", `expected variant sourceType, got ${merged[0].sourceType}`);
assert(merged[0].variantKey === "row-1776497206082-ykb8x", "variantKey should survive library URL collision");
assert(merged[0].variantId === "3877", "variantId should survive");

assert(matrixRowPrintfulVariantIdNum("3877") === 3877, 'string "3877" should coerce');
assert(matrixRowPrintfulVariantIdNum(3877) === 3877, "number 3877 should pass");
assert(matrixRowPrintfulVariantIdNum("") === null, "empty string -> null");
assert(matrixRowPrintfulVariantIdNum(null) === null, "null -> null");

console.log("test-shop-product-images-regression: OK");
