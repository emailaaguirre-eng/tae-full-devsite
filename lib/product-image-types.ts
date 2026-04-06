/**
 * Pure types for product images (safe for client bundles).
 * @copyright B&D Servicing LLC 2026
 */

export type ProductImagePublic = {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  sortOrder: number;
  isHero: boolean;
  isActive: boolean;
  sourceType: string;
  variantKey: string | null;
  variantId: string | null;
  size: string | null;
  frame: string | null;
  frameColor: string | null;
  material: string | null;
  orientation: string | null;
  format: string | null;
};

export type StorefrontProductImage = ProductImagePublic & { previewUrl: string };
