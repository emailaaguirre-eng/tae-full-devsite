# TAE Full Dev Site — POC Architecture Spec

---

## Source of Truth

Edits happen in the **dev clone repo folder** (local `C:\Users\email\tae-full-devsite-dev` OR server `/home/artful/apps/tae-full-devsite-dev`). The only deploy target is `https://dev.theartfulexperience.com` (port 3002). **Do not touch production.**

Deploy workflow: push to `dev/portal-wiring` branch, then `git pull` on the server + `npm run build` + restart PM2/process on port 3002.

---

## First-Task Checklist (Cursor: work through these in order)

- [ ] Find portal routes + auth middleware — map every `/artkey/*`, `/manage/*`, `/b_d_admn_tae/*` route and how auth gates each one
- [ ] Trace "My ArtKeys" data flow — editor save -> `/api/artkey/save` -> SQLite -> list fetch -> `/api/admin/artkeys` — confirm schema columns match API code, list every env var required
- [ ] Trace checkout -> proof generation -> slug -> QR generation -> QR swap — follow `draftId` from design editor through `/api/orders/create`, `/api/artkey/qr`, to print-ready file
- [ ] Confirm Printful integration points + pricing builder inputs — find `/api/gelato/*` routes (Gelato = print partner), map `gelatoBasePrice + taeAddOnFee + artistRoyalty` math, verify env vars
- [ ] List missing wiring items — schema mismatches, missing DB tables, broken env vars, stub endpoints — then implement fixes on dev only
- [ ] Verify every fix by browsing `https://dev.theartfulexperience.com`

> **Hard rule:** Only work in `/home/artful/apps/tae-full-devsite-dev`. Never modify production. If unsure, stop and ask.

---

## 0. Existing Infrastructure — DO NOT REBUILD

### QR Code Generation — Endroid/QR (server-side) + `qrcode` npm (Next.js)

Endroid/QR is already installed and available on the server. The `qrcode` npm package is already in `package.json` and used in:
- `lib/qr.ts` — client-side QR generation (data URLs for Konva editor preview)
- `app/api/artkey/qr/route.ts` — server-side QR generation (GET/POST, returns data URL or uploads to WordPress)

**Use these for:**
- Generating ArtKey QR codes (portal URL embedded in QR)
- Replacing placeholder QR codes in proof images during checkout (the `compose` route)
- Generating QR codes for Admin-created ArtKeys (Demo tool)

**Do NOT introduce a new QR library** unless the existing ones are proven insufficient. QR generation is a solved dependency — focus on wiring it into the flow.

**What's missing:** `app/api/artkey/compose/route.ts` is a **stub**. It needs to:
1. Accept `{ token, designUrl, template, qrTargetUrl }`
2. Generate QR via existing `qrcode` library
3. Composite QR onto design image using `sharp` (already in `package.json`)
4. Upload final print-ready file (to WordPress or local storage)
5. Return URLs for both QR image and composited print file

### SQLite Database — Already exists, reuse it

An SQLite database is available in the dev app (`prisma/dev.db`). Drizzle ORM + sql.js are already configured in `db/index.ts` and `db/schema.ts`.

**Use it to store:**
- Minimal non-PII metadata for wiring the flow
- `artkey_slug` + portal config JSON
- Product config and pricing add-ons
- Mappings like `theAE_order_id -> printful_order_id`
- Expiration timestamps (14-day draft cleanup)

**Do NOT store:**
- Full customer records (fetch on-demand from Printful instead)
- Sensitive PII beyond what's needed for order routing

**If migrations or ORM setup is needed**, reuse what's already in the codebase:
- `drizzle-kit push` for schema changes
- `drizzle-kit generate` + `drizzle-kit migrate` for versioned migrations
- Scripts: `npm run db:push`, `npm run db:generate`, `npm run db:migrate`

**Do NOT introduce a new database or ORM.** Stick with Drizzle + sql.js + SQLite.

### ArtKey SVG Template — QR placement coordinates

The ArtKey template is at `public/templates/theAE_ArtKey.svg`. It's a key-shaped graphic with a square region ("the box part of the key") where the QR code is composited.

**Template dimensions:**
- ViewBox: `0 0 224.88 225`
- Render size: 300 x 300 px

**QR target box (viewBox coordinates):**
- **x:** 150.09, **y:** 58.00
- **width:** 74.67, **height:** 74.70 (square)
- Located in the **upper-right** of the key shape

**QR target box (pixel coordinates at 300x300):**
- **x:** ~200, **y:** ~77
- **size:** ~100 x 100 px

**Compose workflow** (`app/api/artkey/compose/route.ts` — currently a stub):
1. Load `theAE_ArtKey.svg` template
2. Generate QR code PNG via existing `qrcode` library (target URL: `/artkey/{public_token}`)
3. Use `sharp` to composite QR PNG into the target box region of the rendered SVG
4. Output final print-ready PNG/PDF
5. Optionally upload to WordPress media library or save to local storage

The clip path `id="33c638393f"` in the SVG defines the exact bounds: `M 150.09375 58 L 224.761719 58 L 224.761719 132.695312 L 150.09375 132.695312`.

### Print Partner — Gelato (code) / Printful (business direction)

The codebase currently references **Gelato** everywhere (`/api/gelato/*`, `GelatoProductCache`, `gelatoBasePrice`, etc.). The business is evaluating/transitioning to **Printful**. When wiring:
- Existing Gelato integration code provides the pattern for Printful
- Env vars: `GELATO_API_KEY`, `GELATO_API_URL`, `GELATO_PRODUCT_API_URL` — will need Printful equivalents
- Prefer abstracting the print provider behind a service layer so swapping is easy

---

## 1. System Map

```
Guest visits site
       |
       v
 +--------------+     +-----------------+     +------------------+
 | Customization |---->| Proof / Checkout |---->| Order Created    |
 | Studio/Editor |     | (draft -> order) |     | (SQLite + slug)  |
 +--------------+     +-----------------+     +------------------+
                                                      |
                                              +-------+-------+
                                              |               |
                                              v               v
                                     +-------------+   +-----------+
                                     | ArtKey URL  |   | Printful  |
                                     | + QR swap   |   | (Gelato)  |
                                     +-------------+   +-----------+
                                              |               |
                                              v               v
                                     +-------------+   +-----------+
                                     | Public       |   | Fulfillment|
                                     | Portal Page  |   | + Shipping |
                                     +-------------+   +-----------+
                                                              |
                                                              v
                                                      +-----------+
                                                      | Admin Dash |
                                                      | + ARI Bot  |
                                                      +-----------+
```

### Flow in plain English

1. **Customization** — Customer picks a product (card, print, etc.), uploads art or picks from gallery, customizes in the design editor.
2. **Proof / Checkout** — Design saved as a `DesignDraft`. Customer reviews proof, enters shipping, pays.
3. **Order Created** — `Order` + `OrderItem` rows written to SQLite. A unique ArtKey slug is generated. QR code is generated pointing to `/artkey/{public_token}`.
4. **QR Swap** — The QR code image is composited onto the print-ready file (replacing the placeholder). This file is submitted to Gelato/Printful for production.
5. **ArtKey Portal** — The URL embedded in the QR code leads to a mobile-app-style portal page. Guests can view guestbook, gallery, links, Spotify, videos.
6. **Printful/Gelato** — Handles printing, packing, shipping. Tracking number flows back to the order record.
7. **Admin Dashboard** — Internal panel at `/b_d_admn_tae/` for managing ArtKeys, orders, customers, products.
8. **ARI** — AI chatbot assistant (future integration).

---

## 2. Roles & Auth Model

### Three roles

| Role | Access | Auth mechanism |
|------|--------|----------------|
| **Guest** | Public ArtKey portal (`/artkey/{public_token}`), shop, gallery, guestbook signing | No auth — public URL |
| **Host / Owner** | Manage their own ArtKey (`/manage/artkey/{owner_token}`) — moderate guestbook, approve media | Secret `owner_token` URL (32-char alphanumeric), no login required |
| **Admin** | Full dashboard (`/b_d_admn_tae/*`) — all ArtKeys, orders, customers, products, settings | Username/password login -> localStorage token |

### Current admin auth implementation

- **Login endpoint:** `POST /api/admin/login`
- **Credential source:** Environment variables (`ADMIN_USERNAME` / `ADMIN_PASSWORD`, or `ADMIN_USERS`, or numbered `ADMIN1_*`)
- **Token:** 64-char random hex from `crypto.randomBytes(32)`, stored in `localStorage` as `admin_token`
- **Guard:** `AdminLayout` component checks `localStorage` on mount, redirects to `/b_d_admn_tae/login` if missing
- **Server-side protection:** NONE — admin API routes are currently unprotected. Any client can call `/api/admin/artkeys` etc. without a token.

### Known auth gaps

- No server-side token validation on admin API routes
- No token expiration
- No password hashing (plain text in env vars)
- No CSRF protection
- No rate limiting on login endpoint

---

## 3. Data Retention

### Principle: SQLite is a routing/metadata layer, NOT a customer database

| Data | Storage | Retention | Notes |
|------|---------|-----------|-------|
| Design drafts (`DesignDraft`) | SQLite | **14 days** | Temp storage for in-progress designs; purge after expiry |
| ArtKeys (`ArtKey`) | SQLite | **Permanent** | Minimal: slug, portal config JSON, tokens, timestamps |
| Guestbook entries | SQLite `GuestbookEntry` | Permanent | Tied to ArtKey lifecycle |
| Media uploads (images/video) | Local filesystem `public/uploads/artkey/{token}/` | Permanent | Tied to ArtKey lifecycle |
| Order routing metadata | SQLite `Order` | Permanent | Minimal: `theAE_order_id`, `printful_order_id`, status, timestamps |
| Customer/order details | **Printful** (source of truth) | Fetch on-demand | Do NOT store full customer records locally |
| Fulfilled order details | **Printful** (source of truth) | Per Printful retention | Tracking, shipping, etc. fetched via Printful API |
| Product config & pricing | SQLite (`ShopProduct`, `ShopCategory`) | Permanent | TAE add-on fees, base prices, category mappings |

### Cleanup (future)

- Design drafts older than 14 days with status `draft` should be purged (not yet implemented)
- Orphaned media uploads (ArtKey deleted) should be cleaned up (not yet implemented)

---

## 4. Pricing Builder Rules

The pricing formula is: **Customer pays = Gelato base price + TAE add-on fee + artist royalty**

### Data sources

| Component | Source | DB column |
|-----------|--------|-----------|
| Gelato base price | Gelato API (cached in `GelatoProductCache`) | `gelatoBasePrice` on `ShopProduct` |
| TAE add-on fee | Set per product by admin | `taeAddOnFee` on `ShopProduct` |
| Artist royalty | Set per artist | `royaltyFee` on `Artist` |
| Category base fee | Set per category by admin | `taeBaseFee` on `ShopCategory` |
| Shipping | Gelato shipping quote API | Calculated at checkout |

### Price calculation (per OrderItem)

```
unitPrice  = gelatoBasePrice + taeAddOnFee + artistRoyalty
lineTotal  = unitPrice * quantity
orderTotal = sum(lineTotals) + shippingCost
```

### Rounding

- All prices stored as `real` (float) in SQLite
- Display should round to 2 decimal places at the UI layer
- Gelato prices come in USD cents — verify conversion

### QR code pricing note

Products with `requiresQrCode = true` (on `ShopCategory`) include ArtKey QR generation in the flow. The QR is a value-add, not a separate line item.

---

## 5. Database — Current State & Known Issues

### Engine

- **SQLite** via `sql.js` (WASM) + Drizzle ORM
- DB file: `prisma/dev.db` (relative to project root)
- `db/index.ts` initializes via `sql.js`, reads/writes the file directly

### Critical schema mismatch

The Drizzle schema (`db/schema.ts`) and the API routes (`app/api/artkey/save/route.ts`, `app/api/artkey/[public_token]/route.ts`) use **different column names**:

| Schema column (db/schema.ts) | API route expects | Notes |
|------------------------------|-------------------|-------|
| `theme` (text) | `template` (string) | Save route writes `template`, schema has `theme` |
| `features` (text) | `guestbookEnabled` (bool) | Save route writes individual bools, schema stores JSON blob |
| `customizations` (text) | `customization` (singular) | Read route reads `artKey.customization` |
| `links` (text) | — | Stored inside customization JSON in routes |
| `spotify` (text) | — | Stored inside customization JSON in routes |
| — | `mediaEnabled` (bool) | Not in schema |
| — | `isDemo` (bool) | Not in schema |

**The guestbook read route** uses `entry.senderName` but the schema column is `name`.

**Impact:** Every ArtKey create and read will throw at runtime until the schema or routes are aligned.

### Resolution options

1. **Update the schema** to match what the API routes expect (add `template`, `customization`, `guestbookEnabled`, `mediaEnabled`, `isDemo` columns)
2. **Update the API routes** to match the existing schema (use `theme`, `features`, `customizations` columns)
3. **Option 2 is less invasive** — the schema stores richer data as JSON blobs, which is the right pattern for a flexible customization system

### Database file status

- No `prisma/dev.db` exists in the dev clone — needs to be created
- Tables need to be created via `drizzle-kit push` (after fixing schema alignment)

---

## 6. Environment Variables — Required for Dev

### Must be set (in `.env.local` of the dev clone)

| Variable | Purpose | Current status |
|----------|---------|----------------|
| `DATABASE_PATH` or `DATABASE_URL` | Path to SQLite file | **Broken** — points to production path |
| `NEXT_PUBLIC_SITE_URL` | Base URL for share links, QR codes | **Wrong** — set to `localhost:3000`, should be `https://dev.theartfulexperience.com` |
| `ADMIN_USERNAME` | Admin login | Set to `admin` |
| `ADMIN_PASSWORD` | Admin login | **Placeholder** — `your-secure-password-here` |
| `WP_API_BASE` | WordPress REST API | Set (points to production WP — may be intentional shared backend) |
| `WP_APP_USER` | WordPress app user | Set |
| `WP_APP_PASS` | WordPress app password | Set |
| `GELATO_API_KEY` | Gelato print API | Set |
| `GELATO_API_URL` | Gelato order API | Set |
| `GELATO_PRODUCT_API_URL` | Gelato product catalog API | Set |

### Optional / not yet configured

| Variable | Purpose | Status |
|----------|---------|--------|
| `RESEND_API_KEY` | Email (contact forms, notifications) | Commented out |
| `CLOUDINARY_UPLOAD_URL` | Cloud image hosting | Commented out |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Fallback email via Nodemailer | Not set |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | CDN for media files | Set to production WP |

---

## 7. API Route Map

### ArtKey CRUD

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/artkey/save` | Create or update ArtKey | None |
| GET | `/api/artkey/[public_token]` | Public portal data | None (public) |
| GET | `/api/artkey/config` | ArtKey feature config | None |
| POST | `/api/artkey/upload` | Proxy upload to WordPress | None |
| GET | `/api/artkey/get/[id]` | Proxy get from WordPress | None |
| POST | `/api/artkey/qr` | Generate QR code | None |
| POST | `/api/artkey/compose` | Compose final print file | None |

### Guestbook & Media

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/artkey/[public_token]/guestbook` | Post guestbook entry | None (public) |
| POST | `/api/artkey/[public_token]/media` | Upload media | None (public, feature-gated) |
| GET | `/api/manage/artkey/[owner_token]/guestbook` | All guestbook entries | owner_token in URL |
| GET | `/api/manage/artkey/[owner_token]/media` | All media items | owner_token in URL |
| POST | `/api/manage/artkey/[owner_token]/guestbook/moderate` | Approve/reject/delete | owner_token in URL |

### Admin

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/admin/login` | Login | Credentials in body |
| GET | `/api/admin/stats` | Dashboard stats | **None (should require token)** |
| GET | `/api/admin/artkeys` | List all ArtKeys | **None (should require token)** |
| GET | `/api/admin/customers` | List customers | **None (should require token)** |
| GET | `/api/admin/orders` | List orders | **None (should require token)** |

### Orders & Checkout

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/orders/create` | Create order | None |
| GET | `/api/orders/[orderId]` | Get order | None |
| POST | `/api/orders/[orderId]/submit-printful` | Submit to Printful | None |
| GET | `/api/orders/shipping-quote` | Shipping estimate | None |
| GET | `/api/order-status` | Track order | None |

### Shop & Products

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| GET | `/api/shop/products` | Product list | None (public) |
| GET | `/api/shop/categories` | Category list | None (public) |
| GET | `/api/shop/product-options` | Product options | None (public) |
| GET | `/api/gelato/catalog` | Gelato catalog (cached) | None |

---

## 8. Implementation Directives

### Database

- **Engine:** SQLite. **ORM:** Drizzle. **Driver:** sql.js (WASM, in-memory with file persistence).
- **Canonical env var:** `DATABASE_PATH` (read by `db/index.ts`). Falls back to `path.join(process.cwd(), 'prisma', 'dev.db')`. Ignore `DATABASE_URL` — that's a leftover from Prisma and is not read by the app.
- **No NextAuth, no AUTH_SECRET, no NEXTAUTH_URL** — auth is custom localStorage only.
- **JSON columns:** Always `JSON.stringify()` on write, always `JSON.parse()` with try/catch + defaults on read.
- **Persistence:** Call `saveDatabase()` after every write operation (sql.js is in-memory).

### QR Code Generation (Next.js compose route)

- **Use the `qrcode` npm package** already in `package.json`. Do NOT introduce new dependencies.
- **Endroid/QR is PHP server-side** — the Next.js compose route runs in Node, so it uses the Node `qrcode` lib.
- **QR target URL:** `https://dev.theartfulexperience.com/artkey/{public_token}` (uses `NEXT_PUBLIC_SITE_URL` + `/artkey/` + token).
- **Compose return format:** Store final image to `public/uploads/composed/{public_token}.png` and return the URL. Also return the raw QR image URL.

### Template & Icon IDs

- **Stable IDs are critical.** Built-in templates use their `value` field (e.g., `classic`, `modern-romance`). Custom templates get a generated ID (timestamp + random, like ArtKey IDs).
- **Disabled templates/icons still render** for existing ArtKeys that reference them. They are only hidden from the picker in the editor.
- **Graceful fallback:** If an ArtKey references a deleted/missing icon, render nothing (no crash). If it references a missing template, use the saved color values (templates are just presets — the actual colors are stored in the ArtKey's `theme` JSON).

### SVG Upload Safety

- **Sanitize uploaded SVGs:** Strip `<script>`, event handlers (`onload`, `onerror`, etc.), and `javascript:` URIs.
- **Size limit:** Max 100KB per SVG file, max 512x512 viewBox.

### Smoke Test (after Phase 1, before Phases 2-3)

After fixing wiring, verify:
1. `GET /` renders the home page
2. `GET /b_d_admn_tae/login` renders the login form
3. `POST /api/admin/login` returns a token with correct credentials
4. `GET /b_d_admn_tae/dashboard` renders after login
5. `POST /api/artkey/save` creates a row, `GET /api/artkey/{token}` returns parsed JSON objects
6. No "unknown column" Drizzle errors in server logs
7. Database file `prisma/dev.db` exists and contains tables

### Acceptance Criteria by Phase

**Phase 1:**
- `POST /api/artkey/save` creates/updates a row without Drizzle errors
- `GET /api/artkey/[public_token]` returns parsed `theme`, `features`, `links` etc. with correct guestbook `name` mapping
- `.env.local` points to dev DB, dev site URL, real admin password
- Dashboard Quick Links navigate to correct admin pages
- Compose route generates a PNG with QR composited onto the ArtKey SVG template

**Phase 2 (Templates):**
- Admin can toggle built-in templates on/off without deleting them
- Admin can create new templates via form (with live preview)
- Admin can clone an existing template and save as new
- Custom template CRUD persists across server restart
- Editor loads templates from API and renders identically to before
- Disabling a template hides it from picker but existing ArtKeys still render

**Phase 3 (Icons):**
- Admin can toggle built-in ElegantIcons on/off
- Admin can browse Lucide library and add icons to the set
- Admin can upload custom SVGs (sanitized, size-limited)
- Editor loads icons from API and renders in picker grid
- Disabling an icon hides it from picker but existing ArtKeys fall back gracefully

---

## 9. Stop and Ask List

**Stop and confirm** these with the project owner if unclear:

1. **Exact DB path** — App reads `DATABASE_PATH` env var, falls back to `prisma/dev.db`. Is this correct?
2. **QR generation in Next.js** — Using Node `qrcode` npm package (not Endroid/PHP). Confirmed?
3. **Compose output** — Store to `public/uploads/composed/` + return URL. Or stream `image/png` back directly?
4. **Template/icon ID format** — Built-ins keep their existing `value` string. Custom ones get generated IDs. OK?
5. **WordPress sharing** — Dev and production share the same WordPress backend. Intentional?
6. **Admin password** — What should the dev admin password be?
7. **Email service** — Which provider for dev? (Resend, SMTP, or WordPress wp_mail?)
8. **SSL/domain** — Is `dev.theartfulexperience.com` already configured with DNS + SSL?
9. **Port** — Dev runs on port 3002, confirmed?
10. **Printful API credentials** — Do we have Printful API keys ready for dev?
