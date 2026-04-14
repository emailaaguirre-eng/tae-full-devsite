import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// =============================================================================
// Artists - Gallery artists
// =============================================================================
export const artists = sqliteTable('Artist', {
  id: text('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  title: text('title'),
  bio: text('bio'),
  description: text('description'),
  thumbnailImage: text('thumbnailImage'),
  bioImage: text('bioImage'),
  royaltyFee: real('royaltyFee').default(0),
  active: integer('active', { mode: 'boolean' }).default(true),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  sortOrder: integer('sortOrder').default(0),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// Artist Artworks - Gallery images for sale
// =============================================================================
export const artistArtworks = sqliteTable('ArtistArtwork', {
  id: text('id').primaryKey(),
  artistId: text('artistId').notNull().references(() => artists.id),
  taeId: text('taeId').unique().notNull(),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('imageUrl').notNull(),
  thumbnailUrl: text('thumbnailUrl'),
  forSale: integer('forSale', { mode: 'boolean' }).default(true),
  active: integer('active', { mode: 'boolean' }).default(true),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  sortOrder: integer('sortOrder').default(0),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// Shop Categories - Master product types
// =============================================================================
export const shopCategories = sqliteTable('ShopCategory', {
  id: text('id').primaryKey(),
  taeId: text('taeId').unique().notNull(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  parentId: text('parentId'),
  categoryType: text('categoryType').default('leaf'),
  description: text('description'),
  icon: text('icon'),
  taeBaseFee: real('taeBaseFee').default(0),
  requiresQrCode: integer('requiresQrCode', { mode: 'boolean' }).default(false),
  heroImage: text('heroImage'),
  active: integer('active', { mode: 'boolean' }).default(true),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  sortOrder: integer('sortOrder').default(0),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// Shop Products - Individual products within categories
// Fulfilled via Printful
// =============================================================================
export const shopProducts = sqliteTable('ShopProduct', {
  id: text('id').primaryKey(),
  taeId: text('taeId').unique().notNull(),
  categoryId: text('categoryId').notNull().references(() => shopCategories.id),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),

  // Print provider
  printProvider: text('printProvider'),

  // Printful fields
  printfulProductId: integer('printfulProductId'),
  printfulVariantId: integer('printfulVariantId'),
  printfulPrintfileId: integer('printfulPrintfileId'),
  printfulBasePrice: real('printfulBasePrice').default(0),

  // Print specifications
  printWidth: integer('printWidth'),
  printHeight: integer('printHeight'),
  printDpi: integer('printDpi').default(300),
  printFillMode: text('printFillMode'),

  // Product configuration
  requiredPlacements: text('requiredPlacements'),
  qrDefaultPosition: text('qrDefaultPosition'),

  // Pricing
  taeAddOnFee: real('taeAddOnFee').default(0),

  // Product details
  sizeLabel: text('sizeLabel'),
  paperType: text('paperType'),
  finishType: text('finishType'),
  orientation: text('orientation'),
  heroImage: text('heroImage'),
  galleryImages: text('galleryImages'),
  artworkSourceUrl: text('artworkSourceUrl'),

  /** Optional FK to Artist — preferred linkage for gallery pages vs meta artistSlug alone. */
  artistId: text('artistId').references(() => artists.id),
  /** Optional FK to CoCreator — preferred linkage vs meta coCreatorSlug alone. */
  coCreatorId: text('coCreatorId').references(() => coCreators.id),

  // Status
  active: integer('active', { mode: 'boolean' }).default(true),
  sortOrder: integer('sortOrder').default(0),

  // Raw API data
  printfulDataJson: text('printfulDataJson'),

  // Timestamps
  lastSyncedAt: text('lastSyncedAt'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// Shop Product Images - gallery rows (admin-managed; legacy hero + JSON still synced)
// =============================================================================
export const shopProductImages = sqliteTable(
  'ShopProductImage',
  {
    id: text('id').primaryKey(),
    productId: text('productId')
      .notNull()
      .references(() => shopProducts.id),
    imageUrl: text('imageUrl').notNull(),
    title: text('title'),
    description: text('description'),
    sortOrder: integer('sortOrder').default(0),
    isHero: integer('isHero', { mode: 'boolean' }).default(false),
    isActive: integer('isActive', { mode: 'boolean' }).default(true),
    /** general | variant | api */
    sourceType: text('sourceType').default('general'),
    variantKey: text('variantKey'),
    variantId: text('variantId'),
    size: text('size'),
    frame: text('frame'),
    frameColor: text('frameColor'),
    material: text('material'),
    orientation: text('orientation'),
    format: text('format'),
    createdAt: text('createdAt'),
    updatedAt: text('updatedAt'),
  },
  (table) => ({
    productIdx: index('ix_shop_product_image_product').on(table.productId),
  })
);

// =============================================================================
// Product Media Library — reusable shopper-facing product images (Phase 1)
// Not production artwork; not proof/mockup storage.
// =============================================================================
export const productMediaLibrary = sqliteTable(
  'ProductMediaLibrary',
  {
    id: text('id').primaryKey(),
    imageUrl: text('imageUrl').notNull(),
    originalFilename: text('originalFilename'),
    mimeType: text('mimeType'),
    byteSize: integer('byteSize'),
    width: integer('width'),
    height: integer('height'),
    title: text('title'),
    keywords: text('keywords'),
    /** uploaded | printful_import (reserved for later) */
    sourceType: text('sourceType').default('uploaded'),
    createdAt: text('createdAt'),
    updatedAt: text('updatedAt'),
  },
  (table) => ({
    createdIdx: index('ix_product_media_library_created').on(table.createdAt),
  })
);

// =============================================================================
// Artwork to Category Links - Which products can artworks be sold as
// =============================================================================
export const artworkProductLinks = sqliteTable('ArtworkProductLink', {
  id: text('id').primaryKey(),
  artworkId: text('artworkId').notNull().references(() => artistArtworks.id),
  categoryId: text('categoryId').notNull().references(() => shopCategories.id),
  createdAt: text('createdAt'),
});

// =============================================================================
// Customers
// =============================================================================
export const customers = sqliteTable('Customer', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  phone: text('phone'),
  printfulCustomerId: text('gelatoCustomerId').unique(), // legacy column name
  notes: text('notes'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// Orders
// =============================================================================
export const orders = sqliteTable('Order', {
  id: text('id').primaryKey(),
  orderNumber: text('orderNumber').unique().notNull(),
  status: text('status').default('pending'),
  customerId: text('customerId').references(() => customers.id),
  customerEmail: text('customerEmail'),
  customerName: text('customerName'),
  subtotal: real('subtotal').default(0),
  shippingCost: real('shippingCost').default(0),
  totalRoyalties: real('totalRoyalties').default(0),
  total: real('total').default(0),
  paypalOrderId: text('paypalOrderId'),
  paypalTransactionId: text('paypalTransactionId'),
  paypalStatus: text('paypalStatus'),
  paypalPayerEmail: text('paypalPayerEmail'),
  printfulOrderId: text('gelatoOrderId').unique(), // legacy column name
  printfulStatus: text('gelatoStatus'), // legacy column name
  trackingNumber: text('trackingNumber'),
  trackingUrl: text('trackingUrl'),
  carrier: text('carrier'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// Order Items
// =============================================================================
export const orderItems = sqliteTable('OrderItem', {
  id: text('id').primaryKey(),
  orderId: text('orderId').notNull().references(() => orders.id),
  shopProductId: text('shopProductId').references(() => shopProducts.id),
  artworkId: text('artworkId').references(() => artistArtworks.id),
  itemType: text('itemType').notNull(),
  itemName: text('itemName').notNull(),
  itemTaeId: text('itemTaeId').notNull(),
  quantity: integer('quantity').default(1),
  basePrice: real('basePrice').default(0),
  taeAddOnFee: real('taeAddOnFee').default(0),
  artistRoyalty: real('artistRoyalty').default(0),
  unitPrice: real('unitPrice').default(0),
  artKeyId: text('artKeyId'),
  qrCodeUrl: text('qrCodeUrl'),
  designDraftId: text('designDraftId'),
  createdAt: text('createdAt'),
});

// =============================================================================
// ArtKey Portal
// =============================================================================
export const artKeys = sqliteTable('ArtKey', {
  id: text('id').primaryKey(),
  publicToken: text('publicToken').unique().notNull(),
  ownerToken: text('ownerToken').unique().notNull(),
  ownerEmail: text('ownerEmail'),
  title: text('title').notNull(),
  theme: text('theme').notNull(),
  features: text('features').notNull(),
  links: text('links').notNull(),
  spotify: text('spotify').notNull(),
  featuredVideo: text('featuredVideo'),
  customizations: text('customizations').notNull(),
  uploadedImages: text('uploadedImages').notNull(),
  uploadedVideos: text('uploadedVideos').notNull(),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// Checkout QR proof snapshots — server authority for approval + fulfillment
// =============================================================================
export const checkoutProofSnapshots = sqliteTable('CheckoutProofSnapshot', {
  id: text('id').primaryKey(),
  cartItemId: text('cartItemId').notNull(),
  artKeyId: text('artKeyId'),
  publicToken: text('publicToken'),
  /** Normalized lowercase email captured at proof generation (approve must match). */
  customerEmail: text('customerEmail'),
  displayProofFilesJson: text('displayProofFilesJson').notNull(),
  productionFilesJson: text('productionFilesJson').notNull(),
  /** portalToken, ownerToken, portalUrl, editUrl, reusedPortal, qrCodeDataUrl */
  metaJson: text('metaJson').notNull(),
  createdAt: text('createdAt').notNull(),
  approvedAt: text('approvedAt'),
});

// =============================================================================
// Portal Preview Nonces - replay protection tracking
// =============================================================================
export const portalPreviewNonces = sqliteTable('PortalPreviewNonce', {
  token: text('token').notNull(),
  nonce: text('nonce').notNull(),
  expiresAt: integer('expiresAt').notNull(),
  uses: integer('uses').default(0).notNull(),
  updatedAt: integer('updatedAt').notNull(),
});

// =============================================================================
// Guestbook Entries
// =============================================================================
export const guestbookEntries = sqliteTable('GuestbookEntry', {
  id: text('id').primaryKey(),
  artkeyId: text('artkeyId').notNull().references(() => artKeys.id),
  parentId: text('parentId'),
  name: text('name').notNull(),
  email: text('email'),
  /** Guest opted in to let the host see their email; if false, email must not be exposed. */
  shareEmailWithHost: integer('shareEmailWithHost', { mode: 'boolean' }).default(false),
  message: text('message').notNull(),
  role: text('role').default('guest'),
  approved: integer('approved', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt'),
});

// =============================================================================
// Media Items
// =============================================================================
export const mediaItems = sqliteTable('MediaItem', {
  id: text('id').primaryKey(),
  artkeyId: text('artkeyId').notNull().references(() => artKeys.id),
  guestbookEntryId: text('guestbookEntryId'),
  type: text('type').notNull(),
  url: text('url').notNull(),
  caption: text('caption'),
  approved: integer('approved', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt'),
});

// =============================================================================
// CoCreators
// =============================================================================
export const coCreators = sqliteTable('CoCreator', {
  id: text('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  title: text('title'),
  bio: text('bio'),
  description: text('description'),
  thumbnailImage: text('thumbnailImage'),
  heroImage: text('heroImage'),
  royaltyFee: real('royaltyFee').default(0),
  active: integer('active', { mode: 'boolean' }).default(true),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  sortOrder: integer('sortOrder').default(0),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// CoCreator Products
// =============================================================================
export const coCreatorProducts = sqliteTable('CoCreatorProduct', {
  id: text('id').primaryKey(),
  cocreatorId: text('cocreatorId').notNull().references(() => coCreators.id),
  taeId: text('taeId').unique().notNull(),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('imageUrl').notNull(),
  thumbnailUrl: text('thumbnailUrl'),
  forSale: integer('forSale', { mode: 'boolean' }).default(true),
  active: integer('active', { mode: 'boolean' }).default(true),
  sortOrder: integer('sortOrder').default(0),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// Design Drafts
// =============================================================================
export const designDrafts = sqliteTable('DesignDraft', {
  id: text('id').primaryKey(),
  productId: text('productId'),
  variantId: text('variantId'),
  printSpecId: text('printSpecId').notNull(),
  dpi: integer('dpi').default(300),
  cornerStyle: text('cornerStyle').default('square'),
  cornerRadiusMm: real('cornerRadiusMm').default(0),
  designJsonFront: text('designJsonFront'),
  designJsonBack: text('designJsonBack'),
  previewPngFront: text('previewPngFront'),
  previewPngBack: text('previewPngBack'),
  artKeyData: text('artKeyData'),
  usedAssetIds: text('usedAssetIds'),
  premiumFees: real('premiumFees').default(0),
  status: text('status').default('draft'),
  sessionId: text('sessionId'),
  userId: text('userId'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// Surface Maps - Unified UX surface → Printful placement mapping
// =============================================================================
export const surfaceMaps = sqliteTable('SurfaceMap', {
  id: text('id').primaryKey(),
  printfulProductId: integer('printfulProductId').unique().notNull(),
  uxSurfacesJson: text('uxSurfacesJson').notNull(),
  exportRulesJson: text('exportRulesJson').notNull(),
  version: integer('version').default(1),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// Site Media - Admin-managed overrides for hardcoded site images
// =============================================================================
export const siteMedia = sqliteTable('SiteMedia', {
  id: text('id').primaryKey(),
  key: text('key').unique().notNull(),
  url: text('url').notNull(),
  alt: text('alt'),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// Print Area Specs - Printful printfile dimensions per product type
// =============================================================================
export const printAreaSpecs = sqliteTable('PrintAreaSpec', {
  id: text('id').primaryKey(),
  printfulProductId: integer('printfulProductId').unique().notNull(),
  availablePlacements: text('availablePlacements').notNull(),
  printfilesJson: text('printfilesJson').notNull(),
  variantPrintfilesJson: text('variantPrintfilesJson').notNull(),
  optionGroups: text('optionGroups'),
  options: text('options'),
  fetchedAt: text('fetchedAt'),
});

// =============================================================================
// Product Mockups - Generated mockup images from Printful
// =============================================================================
export const productMockups = sqliteTable('ProductMockup', {
  id: text('id').primaryKey(),
  shopProductId: text('shopProductId').references(() => shopProducts.id),
  designDraftId: text('designDraftId'),
  placement: text('placement'),
  mockupUrl: text('mockupUrl').notNull(),
  printfulTaskKey: text('printfulTaskKey'),
  status: text('status').default('pending'),
  extraMockups: text('extraMockups'),
  createdAt: text('createdAt'),
});


// =============================================================================
// Catalog V2 - Customer-facing listings shown once in shop
// =============================================================================
export const productListings = sqliteTable('ProductListing', {
  id: text('id').primaryKey(),
  listingCode: text('listingCode').notNull(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  heroImage: text('heroImage'),
  galleryImages: text('galleryImages'),
  categoryId: text('categoryId').references(() => shopCategories.id),
  customizable: integer('customizable', { mode: 'boolean' }).default(true),
  requiresQrCode: integer('requiresQrCode', { mode: 'boolean' }).default(false),
  active: integer('active', { mode: 'boolean' }).default(true),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  sortOrder: integer('sortOrder').default(0),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => ({
  listingCodeUnique: uniqueIndex('ux_productlisting_listingcode').on(table.listingCode),
  slugUnique: uniqueIndex('ux_productlisting_slug').on(table.slug),
  categoryIdx: index('ix_productlisting_category').on(table.categoryId),
  activeIdx: index('ix_productlisting_active').on(table.active),
}));


export const listingSlugAliases = sqliteTable('ProductListingSlugAlias', {
  id: text('id').primaryKey(),
  listingId: text('listingId').notNull().references(() => productListings.id),
  slug: text('slug').notNull(),
  isPrimary: integer('isPrimary', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt'),
}, (table) => ({
  slugUnique: uniqueIndex('ux_listing_slugalias_slug').on(table.slug),
  listingIdx: index('ix_listing_slugalias_listing').on(table.listingId),
}));


export const mediumTemplates = sqliteTable('MediumTemplate', {
  id: text('id').primaryKey(),
  mediumCode: text('mediumCode').notNull(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  customizableDefault: integer('customizableDefault', { mode: 'boolean' }).default(true),
  requiresQrCodeDefault: integer('requiresQrCodeDefault', { mode: 'boolean' }).default(false),
  active: integer('active', { mode: 'boolean' }).default(true),
  sortOrder: integer('sortOrder').default(0),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => ({
  mediumCodeUnique: uniqueIndex('ux_mediumtemplate_code').on(table.mediumCode),
  slugUnique: uniqueIndex('ux_mediumtemplate_slug').on(table.slug),
  activeIdx: index('ix_mediumtemplate_active').on(table.active),
}));


export const mediumTemplateVariants = sqliteTable('MediumTemplateVariant', {
  id: text('id').primaryKey(),
  mediumTemplateId: text('mediumTemplateId').notNull().references(() => mediumTemplates.id),
  variantCode: text('variantCode').notNull(),
  variantSku: text('variantSku').notNull(),
  name: text('name'),
  sizeLabel: text('sizeLabel'),
  paperType: text('paperType'),
  finishType: text('finishType'),
  frameType: text('frameType'),
  orientation: text('orientation'),
  colorName: text('colorName'),
  colorCode: text('colorCode'),
  optionsJson: text('optionsJson'),
  basePrice: real('basePrice').default(0),
  printWidth: integer('printWidth'),
  printHeight: integer('printHeight'),
  printDpi: integer('printDpi').default(300),
  printFillMode: text('printFillMode'),
  requiredPlacements: text('requiredPlacements'),
  qrDefaultPosition: text('qrDefaultPosition'),
  active: integer('active', { mode: 'boolean' }).default(true),
  sortOrder: integer('sortOrder').default(0),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => ({
  variantSkuUnique: uniqueIndex('ux_mediumvariant_sku').on(table.variantSku),
  templateVariantCodeUnique: uniqueIndex('ux_mediumvariant_template_code').on(table.mediumTemplateId, table.variantCode),
  templateIdx: index('ix_mediumvariant_template').on(table.mediumTemplateId),
}));


export const listingMediaAssignments = sqliteTable('ListingMediaAssignment', {
  id: text('id').primaryKey(),
  listingId: text('listingId').notNull().references(() => productListings.id),
  mediumTemplateId: text('mediumTemplateId').notNull().references(() => mediumTemplates.id),
  mediumTemplateVariantId: text('mediumTemplateVariantId').notNull().references(() => mediumTemplateVariants.id),
  legacyShopProductId: text('legacyShopProductId').references(() => shopProducts.id),
  assignmentSku: text('assignmentSku').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  priceOverride: real('priceOverride'),
  heroImageOverride: text('heroImageOverride'),
  proofTermsOverride: text('proofTermsOverride'),
  customizable: integer('customizable', { mode: 'boolean' }),
  requiresQrCode: integer('requiresQrCode', { mode: 'boolean' }),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => ({
  listingVariantUnique: uniqueIndex('ux_listing_media_listing_variant').on(table.listingId, table.mediumTemplateVariantId),
  listingSkuUnique: uniqueIndex('ux_listing_media_listing_sku').on(table.listingId, table.assignmentSku),
  legacyShopProductUnique: uniqueIndex('ux_listing_media_legacy_shop_product').on(table.legacyShopProductId),
  listingIdx: index('ix_listing_media_listing').on(table.listingId),
  variantIdx: index('ix_listing_media_variant').on(table.mediumTemplateVariantId),
}));


export const variantFulfillmentMappings = sqliteTable('VariantFulfillmentMapping', {
  id: text('id').primaryKey(),
  mediumTemplateVariantId: text('mediumTemplateVariantId').notNull().references(() => mediumTemplateVariants.id),
  provider: text('provider').notNull(),
  printfulProductId: integer('printfulProductId'),
  printfulVariantId: integer('printfulVariantId'),
  printfulPrintfileId: integer('printfulPrintfileId'),
  providerDataJson: text('providerDataJson'),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => ({
  variantProviderUnique: uniqueIndex('ux_variant_fulfillment_variant_provider').on(table.mediumTemplateVariantId, table.provider),
  printfulPairIdx: index('ix_variant_fulfillment_printful_pair').on(table.printfulProductId, table.printfulVariantId),
}));

// =============================================================================
// Aliases for backwards compatibility with existing routes
// =============================================================================
export const artkeyGuestbookEntries = guestbookEntries;
export const artkeyMedia = mediaItems;
