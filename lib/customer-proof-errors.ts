/**
 * Customer-facing copy for proof flows (avoid exposing API/provider internals in UI).
 */

const STUDIO_BY_CODE: Record<string, string> = {
  DESIGN_URL_NOT_PUBLIC:
    "We can’t create a preview from this address. Try again from your published site, or contact us for help.",
  PRINTFUL_FILE_UPLOAD_FAILED:
    "We couldn’t finish your preview just now. Please try again in a moment.",
  PRINTFUL_MOCKUP_TASK_FAILED:
    "We couldn’t finish your preview just now. Please try again in a moment.",
  PRINTFUL_MOCKUP_ERROR:
    "We couldn’t finish your preview just now. Please try again in a moment.",
  PRINTFUL_NO_MOCKUP_URL:
    "We couldn’t finish your preview just now. Please try again in a moment.",
  PRINTFUL_POLL_TIMEOUT:
    "The preview is taking longer than expected. Please try again in a moment.",
  PRINTFUL_NOT_CONFIGURED: "Print preview isn’t available in this environment right now.",
  UNEXPECTED_ERROR: "Something went wrong while creating your preview. Please try again.",
  URL_NOT_ALLOWED:
    "We couldn’t load the preview image. Please try generating your preview again.",
  PROXY_ERROR: "We couldn’t load the preview image. Please try again.",
  UPSTREAM_FAILED: "We couldn’t load the preview image. Please try again in a moment.",
  IMAGE_TOO_LARGE: "The preview image was too large to display. Please try again.",
  NOT_IMAGE: "We couldn’t load the preview image. Please try again.",
};

export function customerStudioProofMessageFromApi(
  data: { code?: string } | null | undefined,
  httpStatus: number
): string {
  const code = String(data?.code || "").toUpperCase();
  if (code && STUDIO_BY_CODE[code]) return STUDIO_BY_CODE[code];
  if (httpStatus === 429) return "Too many preview requests. Please wait a moment and try again.";
  if (httpStatus >= 500) return "Something went wrong on our side. Please try your preview again.";
  if (httpStatus === 400 || httpStatus === 404)
    return "We couldn’t start your preview for this product. Please try again or contact us.";
  return "We couldn’t load your print preview. Please try again.";
}

export const CUSTOMER_CHECKOUT_PROOF_SERVER =
  "We couldn’t prepare your final proof. Please go back to shipping and try again, or return to your cart to adjust your design.";

export const CUSTOMER_CHECKOUT_PROOF_NETWORK =
  "We couldn’t reach our servers to prepare your proof. Check your connection and try again from the shipping step.";
