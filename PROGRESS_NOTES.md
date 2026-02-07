# tAE Full Devsite - Progress Notes
**Last Updated:** December 16, 2025 (Session before battery died)
**Repository:** https://github.com/emailaaguirre-eng/tae-full-devsite

---

## ✅ Completed

### 1. Project Scaffolding
- ✅ Next.js 14.1.0 app initialized with TypeScript
- ✅ Tailwind CSS configured with custom brand palette
- ✅ Basic app structure with layout and globals

### 2. Routes Created (Placeholders)
- ✅ `/art-key/[token]` - Public portal page (placeholder)
- ✅ `/art-key/edit/[token]` - Editor page (placeholder)
- ✅ `/art-key` - Landing/index page

### 3. API Routes (Stubs)
- ✅ `/api/artkey/[token]` - GET endpoint stub (calls `fetchArtKey`)
- ✅ `/api/artkey/compose` - POST endpoint stub for QR + composite generation

### 4. Components
- ✅ `ArtKeyEditor.tsx` - Basic editor UI with template selector (placeholder)
- ✅ `ArtKeyPortalPlaceholder` - Portal placeholder component

### 5. Libraries
- ✅ `lib/theme.ts` - Brand color palette derived from site
- ✅ `lib/templates.ts` - All 40 templates imported (light, gradients, pastels, dark, AZ teams)
- ✅ `lib/wp.ts` - WordPress REST API helpers (stubs):
  - `fetchArtKey()` - TODO: implement token lookup
  - `saveArtKeyMeta()` - TODO: implement meta save
  - `uploadMedia()` - Basic structure for media uploads

### 6. Dependencies
- ✅ `qrcode` (^1.5.3) - For QR code generation
- ✅ `sharp` (^0.33.2) - For image compositing
- ✅ Environment variables structure (`.env.example`)

---

## 🚧 In Progress / Stubs

### API Routes
1. **`/api/artkey/[token]`** - Currently returns stub data
   - Needs: Implement `fetchArtKey()` to query WordPress by token
   - Needs: Custom WP endpoint or meta query to find post by `_artkey_token`

2. **`/api/artkey/compose`** - Currently returns stub response
   - Needs: QR code generation using `qrcode` library
   - Needs: Composite QR onto design/template using `sharp`
   - Needs: Upload generated images to WP media library
   - Needs: Save `qr_url` and `print_url` to post meta
   - Expected input: `{ token, designUrl, template, qrTargetUrl }`

### WordPress Integration
1. **`lib/wp.ts` - `fetchArtKey()`**
   - TODO: Query WordPress to find post by `_artkey_token` meta
   - May need custom REST endpoint or meta query

2. **`lib/wp.ts` - `saveArtKeyMeta()`**
   - TODO: Verify endpoint `/wp/v2/artkey/` exists or create custom endpoint
   - Needs to save: `_artkey_token`, `_artkey_json`, `_artkey_qr_url`, `_artkey_print_url`, `_artkey_design_url`, `_artkey_template`

3. **WordPress Helper Plugin/Snippet**
   - TODO: Create WP helper to expose ArtKey meta fields via REST API
   - Needs: Register custom post type or extend existing with `show_in_rest`
   - Needs: Register meta fields: `token`, `json`, `qr_url`, `print_url`, `design_url`, `template`

### Editor Component
1. **`ArtKeyEditor.tsx`** - Currently shows template selector only
   - ✅ Template selection UI (40 templates)
   - ❌ Color palette selector
   - ❌ Background options
   - ❌ Font selection
   - ❌ Button/link editor
   - ❌ Guestbook functionality
   - ❌ Media uploads
   - ❌ Spotify integration
   - ❌ Message editor
   - ❌ Save/load functionality
   - ❌ Live preview (currently placeholder)
   - ❌ QR + composite trigger

### Portal Component
1. **`ArtKeyPortalPlaceholder`** - Currently just shows token
   - ❌ Load and render ArtKey data from WordPress
   - ❌ Display design with QR code
   - ❌ Mobile fullscreen view
   - ❌ Desktop phone-frame view

---

## 📋 Next Steps (Priority Order)

### High Priority
1. **WordPress Helper Plugin**
   - Create PHP snippet/plugin to register ArtKey meta fields
   - Expose via REST API with `show_in_rest`
   - Test endpoints with Postman/curl

2. **Implement `fetchArtKey()` in `lib/wp.ts`**
   - Query WordPress REST API for post by token
   - Return full ArtKey data structure

3. **Implement QR + Composite API (`/api/artkey/compose`)**
   - Generate QR code from `qrTargetUrl`
   - Composite QR onto design using `sharp`
   - Upload both QR and composite to WP media
   - Save URLs to post meta
   - Return URLs to frontend

4. **Editor Save/Load**
   - Connect editor to save ArtKey JSON to WordPress
   - Load existing ArtKey data when editing
   - Auto-save functionality

### Medium Priority
5. **Complete Editor UI**
   - Color palette selector
   - Background options
   - Font selection
   - Button/link editor
   - Media upload component
   - Spotify integration
   - Message/guestbook editor

6. **Portal Implementation**
   - Load ArtKey data from API
   - Render design with all elements
   - Mobile fullscreen styling
   - Desktop phone-frame styling

7. **Authentication/Authorization**
   - Magic link authentication for editor
   - Password protection option
   - Public portal access

### Low Priority
8. **Styling Refinements**
   - Match site palette exactly
   - Responsive design polish
   - Loading states
   - Error handling UI

9. **Testing & Deployment**
   - Test all flows end-to-end
   - Vercel deployment configuration
   - Environment variables setup
   - Error logging

---

## 🔧 Technical Details

### Environment Variables Needed
```env
WP_API_BASE=https://your-wordpress-site.com/wp-json
WP_APP_USER=application_username
WP_APP_PASS=application_password
# Optional:
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=...
```

### WordPress REST Endpoints Needed
- Custom endpoint or meta query to find post by `_artkey_token`
- Endpoint to save ArtKey meta: `/wp/v2/artkey/` (or custom)
- Media upload endpoint: `/wp/v2/media` (already exists)

### ArtKey Data Structure
```typescript
{
  token: string;
  template: string;
  json: {
    // Design data: colors, backgrounds, fonts, elements, etc.
  };
  qr_url: string;
  print_url: string;
  design_url: string;
}
```

---

## 📝 Notes from Last Session

- Last commit: `f0a9dcd` - "chore: add env example and api artkey token route stub"
- All basic scaffolding is complete
- Ready to start implementing WordPress integration
- QR/composite functionality is the next major milestone
- Editor UI needs to be built out with all customization options

---

## 🐛 Known Issues / Questions

1. **WordPress Endpoint**: Need to verify if `/wp/v2/artkey/` endpoint exists or needs to be created
2. **Token Lookup**: Best approach for finding posts by `_artkey_token` meta?
3. **Media Upload**: Should we use WP media library or S3?
4. **Authentication**: Magic link vs password - which to implement first?

---

**Resume from here:** Start with WordPress helper plugin/snippet, then implement `fetchArtKey()`, then QR/composite API.
