/*
 * POC acceptance test:
 * 1) pick a product slug
 * 2) generate proof from studio-like design payload
 * 3) create order using proof payload
 * 4) verify success and output key IDs
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:3000 node scripts/e2e-studio-proof-fulfillment.mjs
 *   PRODUCT_SLUG=my-product-slug BASE_URL=http://127.0.0.1:3000 node scripts/e2e-studio-proof-fulfillment.mjs
 */

const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const PRODUCT_SLUG = process.env.PRODUCT_SLUG || "";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizePlacement(placement) {
  const raw = String(placement || "").trim().toLowerCase();
  if (!raw) return "default";
  if (raw === "front") return "default";
  if (raw === "inside1" || raw === "inside2") return "inside";
  return raw;
}

async function getJson(path, init) {
  const res = await fetch(`${BASE_URL}${path}`, init);
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

const TINY_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAACEN29AAAAADUlEQVR42mP8z8BQDwAFgwJ/lzGW1wAAAABJRU5ErkJggg==";

async function main() {
  console.log(`[E2E] Base URL: ${BASE_URL}`);
  let slug = PRODUCT_SLUG;

  if (!slug) {
    const { res, data } = await getJson("/api/products?limit=20");
    assert(res.ok && data.success, "Failed to load products list");
    const candidate = (data.data || []).find((p) => !!p?.slug) || (data.data || [])[0];
    assert(candidate?.slug, "No product slug available for E2E test");
    slug = candidate.slug;
  }
  console.log(`[E2E] Using product slug: ${slug}`);

  const productRes = await getJson(`/api/products/${encodeURIComponent(slug)}`);
  assert(productRes.res.ok && productRes.data.success, "Failed to load product detail");
  const product = productRes.data.data;
  assert(product?.id, "Invalid product detail payload");

  const requiredPlacements = (() => {
    try {
      const parsed = product?.requiredPlacements ? JSON.parse(product.requiredPlacements) : null;
      if (!Array.isArray(parsed) || parsed.length === 0) return ["front"];
      return parsed;
    } catch {
      return ["front"];
    }
  })();

  const designFiles = requiredPlacements.map((placement) => ({
    placement: normalizePlacement(placement),
    dataUrl: TINY_PNG_DATA_URL,
  }));

  const proofPayload = {
    customerEmail: `poc-e2e+${Date.now()}@example.com`,
    items: [
      {
        cartItemId: `e2e-${Date.now()}`,
        designFiles,
        artKeyData: {
          title: "POC E2E ArtKey",
          theme: {},
          features: {},
          links: [],
          spotify: { url: "", autoplay: false },
          featured_video: null,
          customizations: {},
          uploadedImages: [],
          uploadedVideos: [],
        },
        requiresQrCode: true,
      },
    ],
  };

  const proofRes = await getJson("/api/proof/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proofPayload),
  });

  assert(proofRes.res.ok && proofRes.data.success, `Proof generation failed: ${proofRes.data?.error || "unknown"}`);
  const proof = proofRes.data.proofs?.[0];
  assert(proof?.proofFiles?.length, "No proof files generated");
  assert(
    Array.isArray(proof.productionFiles) && proof.productionFiles.length > 0,
    "No productionFiles (clean) in proof response"
  );
  assert(
    typeof proof.proofSnapshotId === "string" && proof.proofSnapshotId.length > 0,
    "proofSnapshotId missing from proof response"
  );

  const approveRes = await getJson("/api/proof/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      proofSnapshotId: proof.proofSnapshotId,
      customerEmail: proofPayload.customerEmail,
    }),
  });
  assert(
    approveRes.res.ok && approveRes.data.success,
    `Proof approve failed: ${approveRes.data?.error || "unknown"}`
  );

  const inputPlacements = new Set(designFiles.map((f) => normalizePlacement(f.placement)));
  const outputPlacements = new Set(proof.proofFiles.map((f) => normalizePlacement(f.placement)));
  for (const p of inputPlacements) {
    assert(outputPlacements.has(p), `Proof missing placement "${p}" from studio payload`);
  }

  const orderPayload = {
    paypalOrderId: `DEMO-${Date.now()}`,
    paypalTransactionId: `DEMO-TXN-${Date.now()}`,
    customer: {
      name: "POC E2E",
      email: proofPayload.customerEmail,
      phone: "555-555-5555",
    },
    shipping: {
      line1: "123 Main St",
      line2: "",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "US",
    },
    items: [
      {
        cartItemId: proofPayload.items[0].cartItemId,
        name: product.name || "POC Item",
        price: Number(product.basePrice || 0),
        quantity: 1,
        printfulProductId: product.printfulProductId,
        printfulVariantId: product.printfulVariantId,
        productSlug: product.slug,
        designDraftId: null,
        designFiles: [],
        requiresQrCode: true,
        approvedProofSnapshotId: proof.proofSnapshotId,
        portalToken: proof.portalToken,
        portalUrl: proof.portalUrl,
        artKeyData: proofPayload.items[0].artKeyData,
      },
    ],
    subtotal: Number(product.basePrice || 0),
    shippingCost: 0,
    total: Number(product.basePrice || 0),
  };

  const orderRes = await getJson("/api/orders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload),
  });

  assert(orderRes.res.ok && orderRes.data.success, `Order creation failed: ${orderRes.data?.error || "unknown"}`);
  assert(orderRes.data.order?.orderNumber, "Order number missing in response");

  console.log("[E2E] PASS");
  console.log(
    JSON.stringify(
      {
        productSlug: slug,
        orderNumber: orderRes.data.order.orderNumber,
        printfulStatus: orderRes.data.order.printfulStatus || null,
        portalToken: proof.portalToken || null,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("[E2E] FAIL:", err.message);
  process.exit(1);
});

