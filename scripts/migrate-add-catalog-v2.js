#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(__dirname, "..", "db", "drizzle-runtime.db");

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

  const backupPath = `${DB_PATH}.bak_catalog_v2_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`;

  fs.copyFileSync(DB_PATH, backupPath);
  console.log("Backup created:", backupPath);

  const db = new SQL.Database(fs.readFileSync(DB_PATH));

  const statements = [
    `
    CREATE TABLE IF NOT EXISTS ProductListing (
      id TEXT PRIMARY KEY,
      listingCode TEXT NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      heroImage TEXT,
      galleryImages TEXT,
      categoryId TEXT REFERENCES ShopCategory(id),
      customizable INTEGER DEFAULT 1,
      requiresQrCode INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    )
    `,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_productlisting_listingcode ON ProductListing(listingCode)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_productlisting_slug ON ProductListing(slug)`,
    `CREATE INDEX IF NOT EXISTS ix_productlisting_category ON ProductListing(categoryId)`,
    `CREATE INDEX IF NOT EXISTS ix_productlisting_active ON ProductListing(active)`,

    `
    CREATE TABLE IF NOT EXISTS ProductListingSlugAlias (
      id TEXT PRIMARY KEY,
      listingId TEXT NOT NULL REFERENCES ProductListing(id),
      slug TEXT NOT NULL,
      isPrimary INTEGER DEFAULT 0,
      createdAt TEXT
    )
    `,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_listing_slugalias_slug ON ProductListingSlugAlias(slug)`,
    `CREATE INDEX IF NOT EXISTS ix_listing_slugalias_listing ON ProductListingSlugAlias(listingId)`,

    `
    CREATE TABLE IF NOT EXISTS MediumTemplate (
      id TEXT PRIMARY KEY,
      mediumCode TEXT NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      customizableDefault INTEGER DEFAULT 1,
      requiresQrCodeDefault INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    )
    `,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_mediumtemplate_code ON MediumTemplate(mediumCode)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_mediumtemplate_slug ON MediumTemplate(slug)`,
    `CREATE INDEX IF NOT EXISTS ix_mediumtemplate_active ON MediumTemplate(active)`,

    `
    CREATE TABLE IF NOT EXISTS MediumTemplateVariant (
      id TEXT PRIMARY KEY,
      mediumTemplateId TEXT NOT NULL REFERENCES MediumTemplate(id),
      variantCode TEXT NOT NULL,
      variantSku TEXT NOT NULL,
      name TEXT,
      sizeLabel TEXT,
      paperType TEXT,
      finishType TEXT,
      frameType TEXT,
      orientation TEXT,
      colorName TEXT,
      colorCode TEXT,
      optionsJson TEXT,
      basePrice REAL DEFAULT 0,
      printWidth INTEGER,
      printHeight INTEGER,
      printDpi INTEGER DEFAULT 300,
      printFillMode TEXT,
      requiredPlacements TEXT,
      qrDefaultPosition TEXT,
      active INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    )
    `,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_mediumvariant_sku ON MediumTemplateVariant(variantSku)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_mediumvariant_template_code ON MediumTemplateVariant(mediumTemplateId, variantCode)`,
    `CREATE INDEX IF NOT EXISTS ix_mediumvariant_template ON MediumTemplateVariant(mediumTemplateId)`,

    `
    CREATE TABLE IF NOT EXISTS ListingMediaAssignment (
      id TEXT PRIMARY KEY,
      listingId TEXT NOT NULL REFERENCES ProductListing(id),
      mediumTemplateId TEXT NOT NULL REFERENCES MediumTemplate(id),
      mediumTemplateVariantId TEXT NOT NULL REFERENCES MediumTemplateVariant(id),
      legacyShopProductId TEXT REFERENCES ShopProduct(id),
      assignmentSku TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      priceOverride REAL,
      heroImageOverride TEXT,
      proofTermsOverride TEXT,
      customizable INTEGER,
      requiresQrCode INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    )
    `,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_listing_media_listing_variant ON ListingMediaAssignment(listingId, mediumTemplateVariantId)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_listing_media_listing_sku ON ListingMediaAssignment(listingId, assignmentSku)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_listing_media_legacy_shop_product ON ListingMediaAssignment(legacyShopProductId)`,
    `CREATE INDEX IF NOT EXISTS ix_listing_media_listing ON ListingMediaAssignment(listingId)`,
    `CREATE INDEX IF NOT EXISTS ix_listing_media_variant ON ListingMediaAssignment(mediumTemplateVariantId)`,

    `
    CREATE TABLE IF NOT EXISTS VariantFulfillmentMapping (
      id TEXT PRIMARY KEY,
      mediumTemplateVariantId TEXT NOT NULL REFERENCES MediumTemplateVariant(id),
      provider TEXT NOT NULL,
      printfulProductId INTEGER,
      printfulVariantId INTEGER,
      printfulPrintfileId INTEGER,
      providerDataJson TEXT,
      active INTEGER DEFAULT 1,
      createdAt TEXT,
      updatedAt TEXT
    )
    `,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_variant_fulfillment_variant_provider ON VariantFulfillmentMapping(mediumTemplateVariantId, provider)`,
    `CREATE INDEX IF NOT EXISTS ix_variant_fulfillment_printful_pair ON VariantFulfillmentMapping(printfulProductId, printfulVariantId)`,
  ];

  for (const sql of statements) {
    db.run(sql);
  }

  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();

  console.log("Catalog V2 migration complete.");
  console.log("DB path:", DB_PATH);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
