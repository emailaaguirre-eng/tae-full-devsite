/**
 * Backward-compatible admin route.
 * POST /api/admin/backfill-product-images
 *
 * Delegates to the canonical implementation:
 * POST /api/admin/products/backfill-images
 */
import { POST as backfillProductImagesPost } from "../products/backfill-images/route";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return backfillProductImagesPost(req);
}
