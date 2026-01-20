import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

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
  description: text('description'),
  icon: text('icon'),
  gelatoCatalogUid: text('gelatoCatalogUid'),
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
// =============================================================================
export const shopProducts = sqliteTable('ShopProduct', {
  id: text('id').primaryKey(),
  taeId: text('taeId').unique().notNull(),
  categoryId: text('categoryId').notNull().references(() => shopCategories.id),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  gelatoProductUid: text('gelatoProductUid'),
  gelatoBasePrice: real('gelatoBasePrice').default(0),
  taeAddOnFee: real('taeAddOnFee').default(0),
  sizeLabel: text('sizeLabel'),
  paperType: text('paperType'),
  finishType: text('finishType'),
  orientation: text('orientation'),
  heroImage: text('heroImage'),
  active: integer('active', { mode: 'boolean' }).default(true),
  sortOrder: integer('sortOrder').default(0),
  gelatoDataJson: text('gelatoDataJson'),
  lastSyncedAt: text('lastSyncedAt'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

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
// Gelato Product Cache - Cached Gelato product data
// =============================================================================
export const gelatoProductCache = sqliteTable('GelatoProductCache', {
  id: text('id').primaryKey(),
  categorySlug: text('categorySlug').notNull(),
  gelatoCatalog: text('gelatoCatalog'),
  gelatoProductUid: text('gelatoProductUid').unique().notNull(),
  productName: text('productName'),
  size: text('size'),
  sizeLabel: text('sizeLabel'),
  paperType: text('paperType'),
  frameColor: text('frameColor'),
  orientation: text('orientation'),
  gelatoPrice: real('gelatoPrice').default(0),
  shippingEstimate: real('shippingEstimate').default(0),
  available: integer('available', { mode: 'boolean' }).default(true),
  supportedCountries: text('supportedCountries'),
  widthMm: real('widthMm'),
  heightMm: real('heightMm'),
  widthInches: real('widthInches'),
  heightInches: real('heightInches'),
  rawDataJson: text('rawDataJson'),
  lastSyncedAt: text('lastSyncedAt'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

// =============================================================================
// Gelato Sync Log - Track sync operations
// =============================================================================
export const gelatoSyncLog = sqliteTable('GelatoSyncLog', {
  id: text('id').primaryKey(),
  syncType: text('syncType'),
  status: text('status'),
  itemsProcessed: integer('itemsProcessed').default(0),
  itemsUpdated: integer('itemsUpdated').default(0),
  itemsFailed: integer('itemsFailed').default(0),
  errorMessage: text('errorMessage'),
  errorDetails: text('errorDetails'),
  startedAt: text('startedAt'),
  completedAt: text('completedAt'),
});

// =============================================================================
// Customers - Local customer data with Gelato reference
// =============================================================================
export const customers = sqliteTable('Customer', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  phone: text('phone'),
  gelatoCustomerId: text('gelatoCustomerId').unique(),
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
  gelatoOrderId: text('gelatoOrderId').unique(),
  gelatoStatus: text('gelatoStatus'),
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
// Guestbook Entries
// =============================================================================
export const guestbookEntries = sqliteTable('GuestbookEntry', {
  id: text('id').primaryKey(),
  artkeyId: text('artkeyId').notNull().references(() => artKeys.id),
  parentId: text('parentId'),
  name: text('name').notNull(),
  email: text('email'),
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
// Aliases for backwards compatibility with existing routes
// =============================================================================
export const artkeyGuestbookEntries = guestbookEntries;
export const artkeyMedia = mediaItems;
