# Quick Start Guide

## Admin Access

**Admin URL:** `https://your-site.com/manage/login`

**Default Login (change in production!):**
- Username: `admin` (or set `ADMIN_USERNAME` env var)
- Password: `admin123` (or set `ADMIN_PASSWORD` env var)

Or use numbered admins:
- `ADMIN1_USERNAME` / `ADMIN1_PASSWORD`
- `ADMIN2_USERNAME` / `ADMIN2_PASSWORD`
- etc.

## Your Demo ArtKey

**Token:** `691e3d09ef58e`  
**Source:** `https://theartfulexperience.com/art-key/artkey-session-691e3d09ef58e/`

**✅ YES - It's already set up and tied to your WordPress URL!**

### How It Works

1. **The demo ArtKey loads from WordPress:**
   - When someone visits `/art-key/691e3d09ef58e`
   - The system queries: `https://theartfulexperience.com/wp-json/...`
   - Fetches the ArtKey data with token `691e3d09ef58e`
   - Displays all your content (title, links, images, etc.)

2. **To customize the demo ArtKey:**
   - **Option A:** Edit it in WordPress (where it's stored)
   - **Option B:** Use the ArtKey Editor at `/art-key/edit/691e3d09ef58e`
   - Changes will be saved to WordPress and appear in the demo

3. **The demo URL:**
   - Customer-facing: `/art-key/691e3d09ef58e` (clean, no "demo" in URL)
   - Internal: `/demo/artkey-691e3d09ef58e` (convenience link)

## Customizing Your Demo ArtKey

### Method 1: Edit in WordPress
- Go to your WordPress admin
- Find the ArtKey post with token `691e3d09ef58e`
- Edit the content, links, images, etc.
- Changes appear immediately in the Next.js portal

### Method 2: Use ArtKey Editor
- Visit: `/art-key/edit/691e3d09ef58e`
- Make your changes
- Click "Save & Continue" or "Save & Checkout"
- Changes are saved to WordPress

## Testing Your Demo

1. **Test WordPress Connection:**
   - Visit: `/api/artkey/test-connection`
   - Should show WordPress endpoints are accessible

2. **View Your Demo:**
   - Visit: `/art-key/691e3d09ef58e`
   - Should display your ArtKey content from WordPress

3. **Test on Mobile:**
   - Open `/art-key/691e3d09ef58e` on your phone
   - Should be fullscreen (no phone frame)

## Environment Variables Needed

Set in Vercel:
- `WP_API_BASE` or `NEXT_PUBLIC_WORDPRESS_URL` = `https://theartfulexperience.com`

## Summary

✅ **Admin:** `/manage/login`  
✅ **Demo ArtKey:** Already set up with token `691e3d09ef58e`  
✅ **Tied to your URL:** Yes, loads from `https://theartfulexperience.com`  
✅ **Customizable:** Edit in WordPress or use ArtKey Editor
