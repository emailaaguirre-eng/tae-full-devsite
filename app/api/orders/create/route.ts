/**
 * POST /api/orders/create
 *
 * Creates an order after PayPal payment is captured.
 * Saves the order + items to the local DB and creates ArtKey portal records.
 *
 * Request body:
 * {
 *   paypalOrderId: string,
 *   paypalTransactionId: string,
 *   customer: { name, email, phone? },
 *   shipping: { line1, line2?, city, state, zip, country },
 *   items: [{
 *     cartItemId, name, price, quantity,
 *     printfulProductId?, printfulVariantId?, productSlug?,
 *     designFiles?, requiresQrCode?,
 *     approvedProofSnapshotId?, // QR: server-approved snapshot (production art)
 *     portalToken?, portalUrl?,
 *     artKeyData?,
 *   }],
 *   subtotal: number,
 *   shippingCost: number,
 *   total: number,
 * }
 */
import { NextResponse } from "next/server";
import {
  getDb,
  generateId,
  orders,
  orderItems,
  artKeys,
  customers,
  shopProducts,
  listingMediaAssignments,
  checkoutProofSnapshots,
} from "@/lib/db";
import { and, eq } from "drizzle-orm";
import {
  computeLinePricing,
  getBasePricingComponents,
  normalizePriceAdjustments,
  roundCurrency,
  sanitizeQuantity,
} from "@/lib/pricing-engine";
import { parsePricingSettings } from "@/lib/product-pricing";
import { parseVariantMatrix } from "@/lib/product-watermark";

function generateOrderNumber(): string {
  const prefix = "TAE";
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${rand}`;
}

function numOr(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePlacementForPrintful(placement: unknown): string {
  const raw = String(placement || "").trim().toLowerCase();
  if (!raw) return "default";
  if (raw === "front") return "default";
  // Printful catalog 568 (and similar) expects inside1 / inside2 file types, not "inside".
  if (raw === "inside1" || raw === "inside2") return raw;
  return raw;
}

function resolveVariantPricingComponents(
  product: any,
  printfulVariantId: unknown
): {
  printfulBasePrice: number;
  taeAddOnFee: number;
  artistRoyalty: number;
  baseUnitPrice: number;
} | null {
  const variantId = Math.trunc(Number(printfulVariantId));
  if (!Number.isFinite(variantId) || variantId <= 0) return null;

  const rows = parseVariantMatrix(product?.printfulDataJson);
  const matched = rows.find(
    (row: any) =>
      row?.active !== false &&
      Math.trunc(Number(row?.printfulVariantId)) === variantId
  ) as any;
  if (!matched) return null;

  const pricingDefaults = parsePricingSettings(product?.printfulDataJson);
  const fallback = getBasePricingComponents(product);
  const defaultVariationUpcharge = numOr(pricingDefaults.variationUpcharge, 0);
  const defaultTaeAddOnFee = numOr(
    pricingDefaults.taePrice,
    Math.max(0, fallback.taeAddOnFee - defaultVariationUpcharge)
  );
  const printfulBasePrice = numOr(
    matched.providerCost ?? matched.printfulBasePrice,
    fallback.printfulBasePrice
  );
  const variationUpcharge = numOr(matched.variationUpcharge, defaultVariationUpcharge);
  const taeAddOnFee = numOr(matched.taeAddOnFee, defaultTaeAddOnFee);
  const artistRoyalty = numOr(matched.artistRoyalty, fallback.artistRoyalty);
  const explicitSellPrice = numOr(matched.sellPrice, 0);
  const baseUnitPrice =
    explicitSellPrice > 0
      ? explicitSellPrice
      : roundCurrency(printfulBasePrice + variationUpcharge + taeAddOnFee + artistRoyalty);
  return {
    printfulBasePrice,
    taeAddOnFee: roundCurrency(taeAddOnFee + variationUpcharge),
    artistRoyalty,
    baseUnitPrice,
  };
}

function parseRequiredPlacements(raw: unknown): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p) => normalizePlacementForPrintful(p)).filter(Boolean);
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      paypalOrderId,
      paypalTransactionId,
      customer,
      shipping,
      items,
      shippingCost,
    } = body;

    if (!customer?.email || !items?.length) {
      return NextResponse.json(
        { success: false, error: "Missing customer or items" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const productionByCartItemId = new Map<string, unknown[]>();

    for (const raw of items as any[]) {
      if (!raw?.requiresQrCode || !raw?.printfulVariantId) continue;

      const sid =
        typeof raw?.approvedProofSnapshotId === "string"
          ? raw.approvedProofSnapshotId.trim()
          : "";
      if (!sid) {
        return NextResponse.json(
          {
            success: false,
            error: `Approved proof snapshot is required for "${raw?.name || "QR item"}".`,
          },
          { status: 400 }
        );
      }

      const snapRows = await db
        .select()
        .from(checkoutProofSnapshots)
        .where(eq(checkoutProofSnapshots.id, sid))
        .limit(1)
        .all();
      const snap = snapRows[0];
      if (!snap) {
        return NextResponse.json(
          { success: false, error: `Invalid proof snapshot for "${raw?.name || "item"}".` },
          { status: 400 }
        );
      }
      if (!snap.approvedAt) {
        return NextResponse.json(
          {
            success: false,
            error: `Proof is not approved for "${raw?.name || "item"}".`,
          },
          { status: 400 }
        );
      }
      if (snap.cartItemId !== raw.cartItemId) {
        return NextResponse.json(
          { success: false, error: "Proof snapshot does not match cart line" },
          { status: 400 }
        );
      }
      if (
        raw.portalToken &&
        snap.publicToken &&
        String(raw.portalToken) !== String(snap.publicToken)
      ) {
        return NextResponse.json(
          { success: false, error: "Proof snapshot portal mismatch" },
          { status: 400 }
        );
      }

      let productionFiles: unknown[];
      try {
        productionFiles = JSON.parse(snap.productionFilesJson);
      } catch {
        return NextResponse.json(
          { success: false, error: "Corrupt proof snapshot (production art)" },
          { status: 500 }
        );
      }
      if (
        !Array.isArray(productionFiles) ||
        productionFiles.length === 0 ||
        productionFiles.some(
          (df: any) =>
            !df?.dataUrl || !String(df.dataUrl).startsWith("data:")
        )
      ) {
        return NextResponse.json(
          { success: false, error: "Invalid production art in proof snapshot" },
          { status: 400 }
        );
      }

      productionByCartItemId.set(String(raw.cartItemId), productionFiles);
    }

    const itemsResolved = (items as any[]).map((item) => {
      if (
        item?.requiresQrCode &&
        item?.printfulVariantId &&
        productionByCartItemId.has(String(item.cartItemId))
      ) {
        return {
          ...item,
          designFiles: productionByCartItemId.get(String(item.cartItemId)),
        };
      }
      return item;
    });

    // Design-file validation happens after product lookup and fallback file resolution.
    const now = new Date().toISOString();
    const orderNumber = generateOrderNumber();
    const orderId = generateId();

    // Upsert customer
    const existingCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.email, customer.email))
      .all();

    let customerId: string;
    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
    } else {
      customerId = generateId();
      await db.insert(customers).values({
        id: customerId,
        email: customer.email,
        name: customer.name || null,
        phone: customer.phone || null,
        createdAt: now,
        updatedAt: now,
      });
    }

    const normalizedItems: any[] = [];
    let computedSubtotal = 0;
    let computedRoyalties = 0;

    for (const item of itemsResolved as any[]) {
      const qty = sanitizeQuantity(item?.quantity);
      const adjustments = normalizePriceAdjustments(item?.priceAdjustments);

      let productForPricing: any | null = null;

      if (typeof item?.assignmentId === "string" && item.assignmentId.trim()) {
        const assignments = await db
          .select()
          .from(listingMediaAssignments)
          .where(eq(listingMediaAssignments.id, item.assignmentId.trim()))
          .limit(1)
          .all();

        const legacyShopProductId = assignments[0]?.legacyShopProductId;
        if (legacyShopProductId) {
          const rows = await db
            .select()
            .from(shopProducts)
            .where(and(eq(shopProducts.id, legacyShopProductId), eq(shopProducts.active, true)))
            .limit(1)
            .all();
          productForPricing = rows[0] || null;
        }
      }

      if (!productForPricing && typeof item?.productSlug === "string" && item.productSlug.trim()) {
        const rows = await db
          .select()
          .from(shopProducts)
          .where(and(eq(shopProducts.slug, item.productSlug.trim()), eq(shopProducts.active, true)))
          .limit(1)
          .all();
        productForPricing = rows[0] || null;
      }

      if (!productForPricing && Number.isFinite(Number(item?.printfulVariantId))) {
        const rows = await db
          .select()
          .from(shopProducts)
          .where(
            and(
              eq(shopProducts.printfulVariantId, Math.trunc(Number(item.printfulVariantId))),
              eq(shopProducts.active, true)
            )
          )
          .limit(1)
          .all();
        productForPricing = rows[0] || null;
      }

      if (productForPricing) {
        const base =
          resolveVariantPricingComponents(
            productForPricing,
            item?.printfulVariantId
          ) ?? getBasePricingComponents(productForPricing);
        const line = computeLinePricing({
          baseUnitPrice: base.baseUnitPrice,
          quantity: qty,
          adjustments,
        });
        computedSubtotal = roundCurrency(computedSubtotal + line.lineTotal);
        computedRoyalties = roundCurrency(computedRoyalties + base.artistRoyalty * line.quantity);
        normalizedItems.push({
          ...item,
          quantity: line.quantity,
          priceAdjustments: adjustments,
          price: line.unitPrice,
          designDraftId: item?.designDraftId || null,
          productForPricing,
          pricingBreakdown: {
            printfulBasePrice: base.printfulBasePrice,
            taeAddOnFee: base.taeAddOnFee,
            artistRoyalty: base.artistRoyalty,
            optionsTotal: line.adjustmentsTotal,
          },
        });
      } else {
        const fallbackUnit = numOr(item?.price, 0);
        const fallbackLine = roundCurrency(fallbackUnit * qty);
        computedSubtotal = roundCurrency(computedSubtotal + fallbackLine);
        normalizedItems.push({
          ...item,
          quantity: qty,
          priceAdjustments: adjustments,
          price: fallbackUnit,
          designDraftId: item?.designDraftId || null,
          productForPricing: null,
          pricingBreakdown: null,
        });
      }
    }

    const computedShipping = numOr(shippingCost, 0);
    const computedTotal = roundCurrency(computedSubtotal + computedShipping);

    // Create order
    await db.insert(orders).values({
      id: orderId,
      orderNumber,
      status: "paid",
      customerId,
      customerEmail: customer.email,
      customerName: customer.name || null,
      subtotal: computedSubtotal,
      shippingCost: computedShipping,
      totalRoyalties: computedRoyalties,
      total: computedTotal,
      paypalOrderId: paypalOrderId || null,
      paypalTransactionId: paypalTransactionId || null,
      paypalStatus: paypalOrderId?.startsWith("DEMO") ? "demo" : (paypalOrderId ? "captured" : null),
      createdAt: now,
      updatedAt: now,
    });

    // Create order items (portal records already created during proof generation)
    const createdItems: Array<{
      itemId: string;
      artKeyId: string | null;
      portalToken?: string;
      portalUrl?: string;
      editUrl: string | null;
    }> = [];
    for (const item of normalizedItems) {
      const itemId = generateId();

      // Look up existing portal record created during proof generation
      let artKeyId: string | null = null;
      let editUrl: string | null = null;
      if (item.requiresQrCode && item.portalToken) {
        const existingPortals = await db
          .select()
          .from(artKeys)
          .where(eq(artKeys.publicToken, item.portalToken))
          .all();

        if (existingPortals.length > 0) {
          const portal = existingPortals[0];
          artKeyId = portal.id;
          editUrl = `/art-key/${portal.publicToken}/edit?owner=${portal.ownerToken}`;

          // Update ownerEmail if not set during proof generation
          if (!portal.ownerEmail && customer.email) {
            await db
              .update(artKeys)
              .set({ ownerEmail: customer.email, updatedAt: now })
              .where(eq(artKeys.id, portal.id));
          }
        }
      }

      await db.insert(orderItems).values({
        id: itemId,
        orderId,
        shopProductId: item.productSlug || null,
        itemType: item.requiresQrCode ? "custom" : "standard",
        itemName: item.name,
        itemTaeId: item.cartItemId || itemId,
        quantity: item.quantity || 1,
        basePrice: item.pricingBreakdown?.printfulBasePrice || item.price || 0,
        taeAddOnFee:
          (item.pricingBreakdown?.taeAddOnFee || 0) +
          (item.pricingBreakdown?.optionsTotal || 0),
        artistRoyalty: item.pricingBreakdown?.artistRoyalty || 0,
        unitPrice: item.price || 0,
        artKeyId: artKeyId || null,
        qrCodeUrl: item.portalUrl || null,
        designDraftId: item.designDraftId || null,
        createdAt: now,
      });

      createdItems.push({
        itemId,
        artKeyId,
        portalToken: item.portalToken,
        portalUrl: item.portalUrl,
        editUrl,
      });
    }

    // Save database to disk
    const { saveDatabase } = await import("@/db");
    await saveDatabase();

    // Submit order to Printful (best-effort — don't block the response)
    let printfulOrderId: number | null = null;
    let printfulStatus: string | null = null;
    const isDemoPayment = paypalOrderId?.startsWith("DEMO");
    try {
      const {
        createOrder: pfCreateOrder,
        confirmOrder: pfConfirmOrder,
        uploadFileBase64,
      } = await import("@/lib/printful");

      // Build Printful order items from cart items that have variant IDs
      const pfItems = [];
      for (const i of normalizedItems.filter((x: any) => x.printfulVariantId)) {
        const files: { type?: string; url?: string; id?: number }[] = [];
        const requiredPlacements = new Set(
          parseRequiredPlacements(i?.productForPricing?.requiredPlacements)
        );
        if (requiredPlacements.size === 0) {
          ["default", "back", "inside", "inside1", "inside2", "inside_left", "inside_right"].forEach(
            (p) => requiredPlacements.add(p)
          );
        }

        if (i.designFiles?.length) {
          for (const df of i.designFiles) {
            const placementType = normalizePlacementForPrintful(df.placement);
            if (!requiredPlacements.has(placementType)) {
              throw new Error(
                `Invalid design placement "${placementType}" for product "${i.name}".`
              );
            }

            if (df.dataUrl?.startsWith("http")) {
              files.push({ type: placementType, url: df.dataUrl });
            } else if (df.dataUrl?.startsWith("data:")) {
              try {
                const uploaded = await uploadFileBase64(
                  df.dataUrl,
                  `${orderNumber}-${df.placement}.png`
                );
                files.push({ type: placementType, url: uploaded.url });
                console.log(`[Order] Uploaded ${df.placement} design to Printful: ${uploaded.url}`);
              } catch (uploadErr: any) {
                console.error(`[Order] Design upload failed for ${df.placement}:`, uploadErr?.message);
              }
            }
          }
        }

        const productMeta = (() => {
          try {
            return typeof i?.productForPricing?.printfulDataJson === "string"
              ? JSON.parse(i.productForPricing.printfulDataJson)
              : {};
          } catch {
            return {};
          }
        })();

        const isQrProduct =
          i?.requiresQrCode === true || productMeta?.requiresQrCode === true;
        const isNonCustomizable =
          i?.productForPricing?.customizable === false ||
          productMeta?.customizable === false;

        if (
          files.length === 0 &&
          !isQrProduct &&
          isNonCustomizable
        ) {
          const fallbackArtworkPath =
            typeof i?.productForPricing?.artworkSourceUrl === "string"
              ? i.productForPricing.artworkSourceUrl.trim()
              : "";
          const publicOrigin =
            String(
              process.env.STUDIO_PROOF_PUBLIC_ORIGIN ||
                process.env.NEXT_PUBLIC_APP_URL ||
                process.env.NEXT_PUBLIC_SITE_URL ||
                ""
            ).trim() || new URL(req.url).origin;
          const fallbackArtworkUrl = fallbackArtworkPath.startsWith("http")
            ? fallbackArtworkPath
            : fallbackArtworkPath.startsWith("/")
              ? `${publicOrigin}${fallbackArtworkPath}`
              : "";
          const fallbackPlacement = requiredPlacements.has("default")
            ? "default"
            : Array.from(requiredPlacements)[0] || "default";

          if (fallbackArtworkUrl.startsWith("http")) {
            files.push({ type: fallbackPlacement, url: fallbackArtworkUrl });
          }
        }

        if (files.length === 0) {
          throw new Error(`Missing rendered design files for product "${i.name}".`);
        }

        pfItems.push({
          variant_id: i.printfulVariantId,
          quantity: i.quantity || 1,
          name: i.name,
          retail_price: String(numOr(i.price, 0).toFixed(2)),
          files,
        });
      }

      if (pfItems.length > 0) {
        // Create order as draft first
        const pfOrder = await pfCreateOrder(
          {
            external_id: orderNumber,
            recipient: {
              name: shipping?.name || customer.name,
              address1: shipping?.line1 || "",
              address2: shipping?.line2 || "",
              city: shipping?.city || "",
              state_code: shipping?.state || "",
              zip: shipping?.zip || "",
              country_code: shipping?.country || "US",
              phone: customer.phone || "",
              email: customer.email,
            },
            items: pfItems,
          },
          false
        );

        printfulOrderId = pfOrder.id;
        printfulStatus = pfOrder.status;

        // Auto-confirm the order for fulfillment when payment is real (not demo)
        if (!isDemoPayment && pfOrder.id) {
          try {
            const confirmed = await pfConfirmOrder(pfOrder.id);
            printfulStatus = confirmed.status;
            console.log(`[Order] Printful order ${pfOrder.id} confirmed for fulfillment`);
          } catch (confirmErr: any) {
            console.error("[Order] Printful confirm failed:", confirmErr?.message);
            printfulStatus = `confirm_failed:${confirmErr?.message || "unknown"}`;
          }
        }

        // Update our order with the Printful order ID
        await db
          .update(orders)
          .set({
            printfulOrderId: String(pfOrder.id),
            printfulStatus: printfulStatus,
            updatedAt: now,
          })
          .where(eq(orders.id, orderId));
        await saveDatabase();
      }
    } catch (pfErr: any) {
      console.error("[Order] Printful submission failed:", pfErr?.message);
      printfulStatus = `submission_failed:${pfErr?.message || "unknown"}`;
      await db
        .update(orders)
        .set({
          printfulStatus,
          updatedAt: now,
        })
        .where(eq(orders.id, orderId));
      await saveDatabase();
    }

    // Send order confirmation email (best-effort, non-blocking)
    try {
      const { sendOrderConfirmation } = await import("@/lib/email");
      await sendOrderConfirmation({
        orderNumber,
        customerName: customer.name || "",
        customerEmail: customer.email,
        total: computedTotal || 0,
        items: normalizedItems.map((i: any) => {
          const ci = createdItems.find((c) => c.portalToken === i.portalToken);
          return {
            name: i.name,
            quantity: i.quantity || 1,
            price: i.price || 0,
            portalUrl: i.portalUrl || undefined,
            editUrl: ci?.editUrl || undefined,
          };
        }),
      });
    } catch (emailErr: any) {
      console.error("[Order] Email send failed:", emailErr?.message);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        status: "paid",
        total: computedTotal,
        customerEmail: customer.email,
        printfulOrderId,
        printfulStatus,
        items: createdItems,
        fulfillmentWarning:
          printfulStatus && printfulStatus.startsWith("submission_failed")
            ? "Order saved, but Printful submission failed. Review in admin orders."
            : undefined,
      },
    });
  } catch (err: any) {
    console.error("Order creation failed:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Order creation failed" },
      { status: 500 }
    );
  }
}
