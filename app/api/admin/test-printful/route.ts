import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function envOrThrow(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function getStoreId() {
  return process.env.PRINTFUL_STORE_ID || "17578870";
}

async function pfFetch(path: string) {
  const token = envOrThrow("PRINTFUL_TOKEN");
  const storeId = getStoreId();

  const res = await fetch(`https://api.printful.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-PF-Store-ID": storeId,
    },
    cache: "no-store",
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      statusText: res.statusText,
      body: json,
      path,
    };
  }

  return { ok: true, status: res.status, body: json, path };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = (searchParams.get("action") || "summary").toLowerCase();

  const productId = Number(searchParams.get("productId") || 0);
  const variantId = Number(searchParams.get("variantId") || 0);

  const orientation = (searchParams.get("orientation") || "").trim();
  const technique = (searchParams.get("technique") || "").trim();

  const startedAt = new Date().toISOString();
  const storeId = getStoreId();

  try {
    if (action === "stores") {
      const r = await pfFetch("/stores");
      return NextResponse.json({ startedAt, storeId, action, ...r });
    }

    if (action === "product") {
      if (!productId) {
        return NextResponse.json(
          { startedAt, action, error: "productId is required" },
          { status: 400 }
        );
      }
      const r = await pfFetch(`/products/${productId}`);
      return NextResponse.json({ startedAt, storeId, action, productId, ...r });
    }

    if (action === "variant") {
      if (!variantId) {
        return NextResponse.json(
          { startedAt, action, error: "variantId is required" },
          { status: 400 }
        );
      }
      const r = await pfFetch(`/products/variant/${variantId}`);
      return NextResponse.json({ startedAt, storeId, action, variantId, ...r });
    }

    if (action === "printfiles") {
      if (!productId) {
        return NextResponse.json(
          { startedAt, action, error: "productId is required" },
          { status: 400 }
        );
      }

      const qs = new URLSearchParams();
      if (orientation) qs.set("orientation", orientation);
      if (technique) qs.set("technique", technique);

      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const r = await pfFetch(`/mockup-generator/printfiles/${productId}${suffix}`);
      return NextResponse.json({
        startedAt,
        storeId,
        action,
        productId,
        orientation,
        technique,
        ...r,
      });
    }

    const stores = await pfFetch("/stores");
    const greetingCard = await pfFetch("/products/568");
    const poster = await pfFetch("/products/1");
    const postcard = await pfFetch("/products/433");
    const printfiles568 = await pfFetch("/mockup-generator/printfiles/568");

    return NextResponse.json({
      startedAt,
      storeId,
      action: "summary",
      checks: { stores, greetingCard, poster, postcard, printfiles568 },
      knownIds: {
        storeId: 17578870,
        greetingCard: { productId: 568, variants: [14457, 14458, 14460] },
        poster: {
          productId: 1,
          variants: [
            19527, 19528, 6239, 14125, 4464, 1349, 3876, 6240,
            4465, 3877, 6242, 1, 16365, 2, 16364, 4463,
          ],
        },
        postcard: { productId: 433, variants: [11513] },
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        startedAt,
        action,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
