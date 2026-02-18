import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function envOrThrow(key: string) {
  const v = process.env[key];
  if (!v) throw new Error("Missing env var: " + key);
  return v;
}

function getStoreId() {
  return process.env.PRINTFUL_STORE_ID || "17578870";
}

async function pfFetch(path: string) {
  const token = envOrThrow("PRINTFUL_TOKEN");
  const storeId = getStoreId();

  const res = await fetch("https://api.printful.com" + path, {
    headers: {
      Authorization: "Bearer " + token,
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
  const search = (searchParams.get("search") || "").trim().toLowerCase();

  const startedAt = new Date().toISOString();
  const storeId = getStoreId();

  try {
    // === ACTION: stores ===
    if (action === "stores") {
      const r = await pfFetch("/stores");
      return NextResponse.json({ startedAt, storeId, action, ...r });
    }

    // === ACTION: catalog (search/list all Printful products) ===
    if (action === "catalog") {
      const r = await pfFetch("/products");
      
      if (r.ok && r.body?.result) {
        let products = r.body.result;
        
        // Filter by search term if provided
        if (search) {
          products = products.filter((p: any) => 
            p.title?.toLowerCase().includes(search) ||
            p.type_name?.toLowerCase().includes(search)
          );
        }
        
        // Simplify the output
        const simplified = products.map((p: any) => ({
          id: p.id,
          type: p.type_name,
          title: p.title,
          variantCount: p.variant_count,
        }));
        
        return NextResponse.json({
          startedAt,
          storeId,
          action,
          search: search || "(none - showing all)",
          totalFound: simplified.length,
          products: simplified,
        });
      }
      
      return NextResponse.json({ startedAt, storeId, action, ...r });
    }

    // === ACTION: product ===
    if (action === "product") {
      if (!productId) {
        return NextResponse.json(
          { startedAt, action, error: "productId is required" },
          { status: 400 }
        );
      }
      const r = await pfFetch("/products/" + productId);
      return NextResponse.json({ startedAt, storeId, action, productId, ...r });
    }

    // === ACTION: variant ===
    if (action === "variant") {
      if (!variantId) {
        return NextResponse.json(
          { startedAt, action, error: "variantId is required" },
          { status: 400 }
        );
      }
      const r = await pfFetch("/products/variant/" + variantId);
      return NextResponse.json({ startedAt, storeId, action, variantId, ...r });
    }

    // === ACTION: printfiles ===
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

      const suffix = qs.toString() ? "?" + qs.toString() : "";
      const r = await pfFetch("/mockup-generator/printfiles/" + productId + suffix);
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

    // === DEFAULT: summary (fetch all your products) ===
    const stores = await pfFetch("/stores");
    
    // All 8 Printful product types for The Artful Experience
    const greetingCard = await pfFetch("/products/568");
    const postcard = await pfFetch("/products/433");
    const canvas = await pfFetch("/products/3");
    const framedCanvas = await pfFetch("/products/614");
    const enhancedMattePoster = await pfFetch("/products/1");
    const enhancedMatteFramedPoster = await pfFetch("/products/2");
    const premiumLusterPoster = await pfFetch("/products/171");
    const premiumLusterFramedPoster = await pfFetch("/products/172");
    
    // Printfiles for each product type
    const printfiles568 = await pfFetch("/mockup-generator/printfiles/568");
    const printfiles433 = await pfFetch("/mockup-generator/printfiles/433");
    const printfiles3 = await pfFetch("/mockup-generator/printfiles/3");
    const printfiles614 = await pfFetch("/mockup-generator/printfiles/614");
    const printfiles1 = await pfFetch("/mockup-generator/printfiles/1");
    const printfiles2 = await pfFetch("/mockup-generator/printfiles/2");
    const printfiles171 = await pfFetch("/mockup-generator/printfiles/171");
    const printfiles172 = await pfFetch("/mockup-generator/printfiles/172");

    return NextResponse.json({
      startedAt,
      storeId,
      action: "summary",
      stores,
      products: {
        greetingCard,
        postcard,
        canvas,
        framedCanvas,
        enhancedMattePoster,
        enhancedMatteFramedPoster,
        premiumLusterPoster,
        premiumLusterFramedPoster,
      },
      printfiles: {
        greetingCard: printfiles568,
        postcard: printfiles433,
        canvas: printfiles3,
        framedCanvas: printfiles614,
        enhancedMattePoster: printfiles1,
        enhancedMatteFramedPoster: printfiles2,
        premiumLusterPoster: printfiles171,
        premiumLusterFramedPoster: printfiles172,
      },
      knownIds: {
        storeId: 17578870,
        greetingCard: { 
          productId: 568, 
          variants: [14457, 14458, 14460],
          usedFor: ["Greeting Cards"]
        },
        postcard: { 
          productId: 433, 
          variants: [11513],
          usedFor: ["Postcards", "Invitations", "Announcements"]
        },
        canvas: { 
          productId: 3, 
          variants: "46 sizes - see product response",
          usedFor: ["Canvas Prints"]
        },
        framedCanvas: { 
          productId: 614, 
          variants: "39 sizes - see product response",
          usedFor: ["Framed Canvas Prints"]
        },
        enhancedMattePoster: { 
          productId: 1, 
          variants: "16 sizes - see product response",
          usedFor: ["Archival Posters", "Museum-Quality Prints"]
        },
        enhancedMatteFramedPoster: { 
          productId: 2, 
          variants: "39 variants (3 frame colors) - see product response",
          usedFor: ["Framed Prints", "Framed Posters"]
        },
        premiumLusterPoster: { 
          productId: 171, 
          variants: "14 sizes - see product response",
          usedFor: ["Photo Prints", "Glossy Prints"]
        },
        premiumLusterFramedPoster: { 
          productId: 172, 
          variants: "36 variants - see product response",
          usedFor: ["Framed Photo Prints"]
        },
      },
      helpText: {
        description: "Print Provider API Test Route for The Artful Experience",
        yourProducts: [
          "1. Greeting Cards (productId: 568)",
          "2. Postcards (productId: 433) - also Invitations & Announcements",
          "3. Canvas Prints (productId: 3)",
          "4. Framed Canvas (productId: 614)",
          "5. Enhanced Matte Poster (productId: 1) - Archival/Museum-Quality",
          "6. Enhanced Matte Framed Poster (productId: 2)",
          "7. Premium Luster Poster (productId: 171) - Photo Prints",
          "8. Premium Luster Framed Poster (productId: 172)",
        ],
        printOptions: {
          archivalMatte: "Products 1, 2 - thick acid-free matte paper, museum-quality",
          premiumLuster: "Products 171, 172 - slightly glossy photo paper",
          canvas: "Products 3, 614 - fade-resistant archival-grade inks on poly-cotton",
        },
        availableActions: [
          "?action=summary (default) - shows all your products",
          "?action=catalog - list ALL Printful products",
          "?action=catalog&search=canvas - search products by name",
          "?action=product&productId=568 - get specific product details",
          "?action=variant&variantId=14458 - get specific variant details",
          "?action=printfiles&productId=568 - get print specifications",
          "?action=stores - list your Printful stores",
        ],
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
