# Complete Merge Plan: tAE-Full-Site + Working ArtKeyEditor → tae-full-devsite

## ✅ Status: Configuration Files Updated
- [x] next.config.js
- [x] tsconfig.json  
- [x] tailwind.config.ts
- [x] app/globals.css
- [x] package.json
- [x] app/layout.tsx
- [x] app/page.tsx (home page structure)

## 📋 Merge Strategy

### Source Files:
1. **Website Components** → From `tAE-Full-Site/components/` (27 files)
2. **ArtKeyEditor** → From `tAE-Full-Site/wp-build/artkey-editor/ArtKeyEditorWP.jsx` (WORKING VERSION)
3. **App Routes** → From `tAE-Full-Site/app/`
4. **Lib Files** → From `tAE-Full-Site/lib/`
5. **Contexts** → From `tAE-Full-Site/contexts/`
6. **WordPress Plugin** → Create new REST API plugin

### Target:
- `tae-full-devsite` (Next.js, no front-end plugins, REST API only)

## 🔄 Next Steps (Priority Order)

1. **Copy all website components** (Navbar, Hero, Footer, all sections)
2. **Convert ArtKeyEditorWP.jsx to Next.js component** (use Next.js hooks, API routes)
3. **Copy app routes** (about, gallery, cocreators, contact, shop, customize, artkey)
4. **Copy lib files** (wordpress.ts, woocommerce.ts, artkey-config.ts, etc.)
5. **Copy contexts** (CartContext)
6. **Create WordPress REST API plugin** (expose ArtKey meta fields)
7. **Update lib/wp.ts** to use WordPress REST endpoints
8. **Create ArtKey Portal component** (full-screen, app-like, no website chrome)
9. **Implement QR code generation** with 5 skeleton key templates
10. **Test integration**

## 📝 Notes
- ArtKeyEditor from `wp-build/artkey-editor/ArtKeyEditorWP.jsx` is the WORKING version
- Need to convert from WordPress hooks to Next.js hooks
- REST API calls need to go through Next.js API routes
- WordPress plugin will expose data via REST only (no front-end)
