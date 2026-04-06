#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(__dirname, "..", "db", "drizzle-runtime.db");

function nowIso() {
  return new Date().toISOString();
}

function generateId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function tokenify(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function rows(db, sql, params = []) {
  const result = db.exec(sql, params);
  if (!result[0]) return [];
  const first = result[0];
  return first.values.map((row) => {
    const out = {};
    for (let i = 0; i < first.columns.length; i++) {
      out[first.columns[i]] = row[i];
    }
    return out;
  });
}

function first(db, sql, params = []) {
  return rows(db, sql, params)[0] || null;
}

function run(db, sql, params = []) {
  db.run(sql, params);
}

function parseMeta(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function inferPaperType(row) {
  if (row.paperType) return row.paperType;
  const name = String(row.name || "").toLowerCase();
  if (name.includes("luster")) return "Luster";
  if (name.includes("matte")) return "Matte";
  if (name.includes("canvas")) return "Canvas";
  return null;
}

function inferFrameType(row, categoryName) {
  const name = String(row.name || "").toLowerCase();
  const cat = String(categoryName || "").toLowerCase();
  if (row.finishType && /frame/i.test(String(row.finishType))) return "Framed";
  if (cat === "canvas prints" && Number(row.printfulProductId) === 614) return "Framed";
  if (cat === "canvas prints" && Number(row.printfulProductId) === 3) return "Unframed";
  if (cat === "framed prints") return "Framed";
  if (name.includes("framed")) return "Framed";
  return "Unframed";
}

function inferFinishType(row, categoryName) {
  if (row.finishType) return row.finishType;
  const frameType = inferFrameType(row, categoryName);
  if (frameType === "Framed") return "Framed";
  return null;
}

function computeVariantBasePrice(row) {
  const meta = parseMeta(row.printfulDataJson);
  const pricing = meta.pricing || {};
  const artistRoyalty = num(pricing.artistRoyalty, 0);
  return Number((num(row.printfulBasePrice, 0) + num(row.taeAddOnFee, 0) + artistRoyalty).toFixed(2));
}

function computePriceOverride(row) {
  const meta = parseMeta(row.printfulDataJson);
  const pricing = meta.pricing || {};
  const salePrice = num(pricing.salePrice, 0);
  return salePrice > 0 ? Number(salePrice.toFixed(2)) : null;
}

function requiresQr(row, category) {
  const meta = parseMeta(row.printfulDataJson);
  if (typeof meta.requiresQrCode === "boolean") return meta.requiresQrCode ? 1 : 0;
  return category && category.requiresQrCode ? 1 : 0;
}

function customizable(row) {
  const meta = parseMeta(row.printfulDataJson);
  if (typeof meta.customizable === "boolean") return meta.customizable ? 1 : 0;
  return 1;
}

function proofTerms(row) {
  const meta = parseMeta(row.printfulDataJson);
  return typeof meta.proofTerms === "string" ? meta.proofTerms : null;
}

function mergePlan(category) {
  const catName = String(category.name || "");
  const catSlug = String(category.slug || slugify(catName));
  const lower = catName.toLowerCase();

  if (lower === "canvas prints") {
    return {
      listingCode: "TAE-CANVAS-PRINTS",
      listingSlug: "canvas-prints",
      listingName: "Canvas Prints",
      mediumCode: "CANVAS_PRINTS",
      mediumSlug: "canvas-prints",
      mediumName: "Canvas Prints",
      mergeKey: "canvas-prints",
    };
  }

  if (lower === "wall art") {
    return {
      listingCode: "TAE-WALL-ART",
      listingSlug: "wall-art",
      listingName: "ArtPrint",
      mediumCode: "WALL_ART",
      mediumSlug: "wall-art",
      mediumName: "ArtPrint",
      mergeKey: "wall-art",
    };
  }

  if (lower === "framed prints") {
    return {
      listingCode: "TAE-FRAMED-PRINTS",
      listingSlug: "framed-prints",
      listingName: "Framed Prints",
      mediumCode: "FRAMED_PRINTS",
      mediumSlug: "framed-prints",
      mediumName: "Framed Prints",
      mergeKey: "framed-prints",
    };
  }

  if (lower === "greeting cards") {
    return {
      listingCode: "TAE-GREETING-CARDS",
      listingSlug: "greeting-cards",
      listingName: "Greeting Cards",
      mediumCode: "GREETING_CARDS",
      mediumSlug: "greeting-cards",
      mediumName: "Greeting Cards",
      mergeKey: "greeting-cards",
    };
  }

  const base = tokenify(catSlug || catName || "listing");
  return {
    listingCode: `TAE-${base}`,
    listingSlug: catSlug || slugify(catName),
    listingName: catName,
    mediumCode: base,
    mediumSlug: catSlug || slugify(catName),
    mediumName: catName,
    mergeKey: catSlug || slugify(catName),
  };
}

function buildVariantCode(row, categoryName) {
  const parts = [];

  const size = row.sizeLabel ? tokenify(row.sizeLabel).replace(/"/g, "") : null;
  if (size) parts.push(size);

  const paper = inferPaperType(row);
  if (paper) parts.push(tokenify(paper));

  const frame = inferFrameType(row, categoryName);
  if (frame) parts.push(tokenify(frame));

  if (row.orientation) parts.push(tokenify(row.orientation));

  if (Number(row.printfulVariantId)) parts.push(`PV${Number(row.printfulVariantId)}`);

  return parts.filter(Boolean).join("-") || `PV${Number(row.printfulVariantId) || "X"}`;
}

async function main() {
  const wasmPath = path.join(
    __dirname,
    "..",
    "node_modules",
    "sql.js",
    "dist",
    "sql-wasm.wasm"
  );

  const SQL = await initSqlJs({
    locateFile: (file) =>
      file === "sql-wasm.wasm" && fs.existsSync(wasmPath) ? wasmPath : file,
  });

  if (!fs.existsSync(DB_PATH)) {
    console.error("Database file not found:", DB_PATH);
    process.exit(1);
  }

  const backupPath = `${DB_PATH}.bak_backfill_catalog_v2_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`;

  fs.copyFileSync(DB_PATH, backupPath);
  console.log("Backup created:", backupPath);

  const db = new SQL.Database(fs.readFileSync(DB_PATH));

  const categories = rows(
    db,
    `SELECT id, slug, name, requiresQrCode FROM ShopCategory`
  );
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const products = rows(
    db,
    `SELECT
      id, taeId, categoryId, slug, name, description, heroImage, galleryImages,
      printProvider, printfulProductId, printfulVariantId, printfulPrintfileId,
      printfulBasePrice, taeAddOnFee, sizeLabel, paperType, finishType, orientation,
      printWidth, printHeight, printDpi, printFillMode, requiredPlacements, qrDefaultPosition,
      printfulDataJson, active, sortOrder, createdAt, updatedAt
     FROM ShopProduct
     ORDER BY active DESC, sortOrder DESC, name ASC`
  );

  const groups = new Map();

  for (const row of products) {
    const category = categoryMap.get(row.categoryId);
    if (!category) continue;
    const plan = mergePlan(category);
    const groupKey = `${row.categoryId}::${plan.mergeKey}`;
    const current = groups.get(groupKey) || { category, plan, rows: [] };
    current.rows.push(row);
    groups.set(groupKey, current);
  }

  const counts = {
    listingsInserted: 0,
    listingsUpdated: 0,
    aliasesInserted: 0,
    templatesInserted: 0,
    templatesUpdated: 0,
    variantsInserted: 0,
    variantsUpdated: 0,
    assignmentsInserted: 0,
    assignmentsUpdated: 0,
    mappingsInserted: 0,
    mappingsUpdated: 0,
  };

  for (const group of groups.values()) {
    const { category, plan } = group;
    const groupRows = group.rows;

    const canonical =
      groupRows.find((r) => r.heroImage) ||
      groupRows[0];

    const listingCreatedAt = canonical.createdAt || nowIso();
    const listingUpdatedAt = nowIso();

    const listingRequiresQr = groupRows.some((r) => requiresQr(r, category) === 1) ? 1 : 0;
    const listingCustomizable = groupRows.some((r) => customizable(r) === 1) ? 1 : 0;

    let listing = first(
      db,
      `SELECT id FROM ProductListing WHERE listingCode = ?`,
      [plan.listingCode]
    );

    if (!listing) {
      listing = { id: generateId() };
      run(
        db,
        `INSERT INTO ProductListing (
          id, listingCode, slug, name, description, heroImage, galleryImages, categoryId,
          customizable, requiresQrCode, active, featured, sortOrder, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          listing.id,
          plan.listingCode,
          plan.listingSlug,
          plan.listingName,
          canonical.description || null,
          canonical.heroImage || null,
          canonical.galleryImages || null,
          category.id,
          listingCustomizable,
          listingRequiresQr,
          1,
          0,
          0,
          listingCreatedAt,
          listingUpdatedAt,
        ]
      );
      counts.listingsInserted += 1;
    } else {
      run(
        db,
        `UPDATE ProductListing
         SET name = ?, description = ?, heroImage = ?, galleryImages = ?, categoryId = ?,
             customizable = ?, requiresQrCode = ?, updatedAt = ?
         WHERE id = ?`,
        [
          plan.listingName,
          canonical.description || null,
          canonical.heroImage || null,
          canonical.galleryImages || null,
          category.id,
          listingCustomizable,
          listingRequiresQr,
          listingUpdatedAt,
          listing.id,
        ]
      );
      counts.listingsUpdated += 1;
    }

    let mediumTemplate = first(
      db,
      `SELECT id FROM MediumTemplate WHERE mediumCode = ?`,
      [plan.mediumCode]
    );

    if (!mediumTemplate) {
      mediumTemplate = { id: generateId() };
      run(
        db,
        `INSERT INTO MediumTemplate (
          id, mediumCode, slug, name, description, customizableDefault, requiresQrCodeDefault,
          active, sortOrder, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mediumTemplate.id,
          plan.mediumCode,
          plan.mediumSlug,
          plan.mediumName,
          null,
          listingCustomizable,
          listingRequiresQr,
          1,
          0,
          listingCreatedAt,
          listingUpdatedAt,
        ]
      );
      counts.templatesInserted += 1;
    } else {
      run(
        db,
        `UPDATE MediumTemplate
         SET name = ?, customizableDefault = ?, requiresQrCodeDefault = ?, updatedAt = ?
         WHERE id = ?`,
        [
          plan.mediumName,
          listingCustomizable,
          listingRequiresQr,
          listingUpdatedAt,
          mediumTemplate.id,
        ]
      );
      counts.templatesUpdated += 1;
    }

    for (const row of groupRows) {
      const variantCode = buildVariantCode(row, category.name);
      const variantSku = `${plan.mediumCode}-${variantCode}`;
      const assignmentSku = `${plan.listingCode}-${variantCode}`;
      const currentTime = nowIso();

      const paperType = inferPaperType(row);
      const frameType = inferFrameType(row, category.name);
      const finishType = inferFinishType(row, category.name);

      let variant = first(
        db,
        `SELECT id FROM MediumTemplateVariant WHERE variantSku = ?`,
        [variantSku]
      );

      if (!variant) {
        variant = { id: generateId() };
        run(
          db,
          `INSERT INTO MediumTemplateVariant (
            id, mediumTemplateId, variantCode, variantSku, name, sizeLabel, paperType, finishType,
            frameType, orientation, colorName, colorCode, optionsJson, basePrice, printWidth,
            printHeight, printDpi, printFillMode, requiredPlacements, qrDefaultPosition,
            active, sortOrder, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            variant.id,
            mediumTemplate.id,
            variantCode,
            variantSku,
            row.name || null,
            row.sizeLabel || null,
            paperType,
            finishType,
            frameType,
            row.orientation || null,
            null,
            null,
            JSON.stringify({
              sizeLabel: row.sizeLabel || null,
              paperType,
              finishType,
              frameType,
              orientation: row.orientation || null,
            }),
            computeVariantBasePrice(row),
            row.printWidth || null,
            row.printHeight || null,
            row.printDpi || 300,
            row.printFillMode || null,
            row.requiredPlacements || null,
            row.qrDefaultPosition || null,
            row.active ? 1 : 0,
            row.sortOrder || 0,
            row.createdAt || currentTime,
            currentTime,
          ]
        );
        counts.variantsInserted += 1;
      } else {
        run(
          db,
          `UPDATE MediumTemplateVariant
           SET name = ?, sizeLabel = ?, paperType = ?, finishType = ?, frameType = ?, orientation = ?,
               optionsJson = ?, basePrice = ?, printWidth = ?, printHeight = ?, printDpi = ?,
               printFillMode = ?, requiredPlacements = ?, qrDefaultPosition = ?, active = ?,
               sortOrder = ?, updatedAt = ?
           WHERE id = ?`,
          [
            row.name || null,
            row.sizeLabel || null,
            paperType,
            finishType,
            frameType,
            row.orientation || null,
            JSON.stringify({
              sizeLabel: row.sizeLabel || null,
              paperType,
              finishType,
              frameType,
              orientation: row.orientation || null,
            }),
            computeVariantBasePrice(row),
            row.printWidth || null,
            row.printHeight || null,
            row.printDpi || 300,
            row.printFillMode || null,
            row.requiredPlacements || null,
            row.qrDefaultPosition || null,
            row.active ? 1 : 0,
            row.sortOrder || 0,
            currentTime,
            variant.id,
          ]
        );
        counts.variantsUpdated += 1;
      }

      let assignment = null;
      if (row.id) {
        assignment = first(
          db,
          `SELECT id FROM ListingMediaAssignment WHERE legacyShopProductId = ?`,
          [row.id]
        );
      }

      if (!assignment) {
        assignment = first(
          db,
          `SELECT id FROM ListingMediaAssignment WHERE listingId = ? AND assignmentSku = ?`,
          [listing.id, assignmentSku]
        );
      }

      if (!assignment) {
        assignment = { id: generateId() };
        run(
          db,
          `INSERT INTO ListingMediaAssignment (
            id, listingId, mediumTemplateId, mediumTemplateVariantId, legacyShopProductId,
            assignmentSku, enabled, priceOverride, heroImageOverride, proofTermsOverride,
            customizable, requiresQrCode, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            assignment.id,
            listing.id,
            mediumTemplate.id,
            variant.id,
            row.id || null,
            assignmentSku,
            row.active ? 1 : 0,
            computePriceOverride(row),
            row.heroImage || null,
            proofTerms(row),
            customizable(row),
            requiresQr(row, category),
            row.createdAt || currentTime,
            currentTime,
          ]
        );
        counts.assignmentsInserted += 1;
      } else {
        run(
          db,
          `UPDATE ListingMediaAssignment
           SET listingId = ?, mediumTemplateId = ?, mediumTemplateVariantId = ?, legacyShopProductId = ?,
               assignmentSku = ?, enabled = ?, priceOverride = ?, heroImageOverride = ?,
               proofTermsOverride = ?, customizable = ?, requiresQrCode = ?, updatedAt = ?
           WHERE id = ?`,
          [
            listing.id,
            mediumTemplate.id,
            variant.id,
            row.id || null,
            assignmentSku,
            row.active ? 1 : 0,
            computePriceOverride(row),
            row.heroImage || null,
            proofTerms(row),
            customizable(row),
            requiresQr(row, category),
            currentTime,
            assignment.id,
          ]
        );
        counts.assignmentsUpdated += 1;
      }

      let mapping = first(
        db,
        `SELECT id FROM VariantFulfillmentMapping WHERE mediumTemplateVariantId = ? AND provider = ?`,
        [variant.id, row.printProvider || "printful"]
      );

      if (!mapping) {
        mapping = { id: generateId() };
        run(
          db,
          `INSERT INTO VariantFulfillmentMapping (
            id, mediumTemplateVariantId, provider, printfulProductId, printfulVariantId,
            printfulPrintfileId, providerDataJson, active, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            mapping.id,
            variant.id,
            row.printProvider || "printful",
            row.printfulProductId || null,
            row.printfulVariantId || null,
            row.printfulPrintfileId || null,
            row.printfulDataJson || null,
            row.active ? 1 : 0,
            row.createdAt || currentTime,
            currentTime,
          ]
        );
        counts.mappingsInserted += 1;
      } else {
        run(
          db,
          `UPDATE VariantFulfillmentMapping
           SET printfulProductId = ?, printfulVariantId = ?, printfulPrintfileId = ?,
               providerDataJson = ?, active = ?, updatedAt = ?
           WHERE id = ?`,
          [
            row.printfulProductId || null,
            row.printfulVariantId || null,
            row.printfulPrintfileId || null,
            row.printfulDataJson || null,
            row.active ? 1 : 0,
            currentTime,
            mapping.id,
          ]
        );
        counts.mappingsUpdated += 1;
      }

      const aliasExists = first(
        db,
        `SELECT id FROM ProductListingSlugAlias WHERE slug = ?`,
        [row.slug]
      );

      if (!aliasExists && row.slug && row.slug !== plan.listingSlug) {
        run(
          db,
          `INSERT INTO ProductListingSlugAlias (id, listingId, slug, isPrimary, createdAt)
           VALUES (?, ?, ?, ?, ?)`,
          [generateId(), listing.id, row.slug, 0, currentTime]
        );
        counts.aliasesInserted += 1;
      }
    }
  }

  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();

  console.log("Catalog V2 backfill complete.");
  console.log(JSON.stringify(counts, null, 2));
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
