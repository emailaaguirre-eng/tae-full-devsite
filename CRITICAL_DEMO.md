# Critical Demo ArtKey Setup

## Your Demo ArtKey

**Token:** `691e3d09ef58e`  
**Source URL:** `https://theartfulexperience.com/art-key/artkey-session-691e3d09ef58e/`

## Customer-Facing Demo URL

**Use this URL for your demo:**

```
https://your-production-site.com/art-key/691e3d09ef58e
```

This URL:
- ✅ **NO "demo" in the URL** - completely professional
- ✅ **NO demo branding** - just your ArtKey content
- ✅ **Fullscreen on mobile** - app-like experience
- ✅ **Phone frame on desktop** - professional preview
- ✅ **All your content** - title, links, images, videos, Spotify, guestbook

## Quick Test Checklist

Before your demo, verify:

1. ✅ WordPress connection is working
   - Test: `/api/artkey/test-connection`
   - Should show WordPress endpoints are accessible

2. ✅ ArtKey loads correctly
   - Test: `/art-key/691e3d09ef58e`
   - Should display your ArtKey content

3. ✅ Mobile view works
   - Open on your phone: `/art-key/691e3d09ef58e`
   - Should be fullscreen (no phone frame)

4. ✅ Desktop view works
   - Open on desktop: `/art-key/691e3d09ef58e`
   - Should show in phone frame

## Environment Variables Required

Make sure these are set in Vercel:

- `WP_API_BASE` or `NEXT_PUBLIC_WORDPRESS_URL` = `https://theartfulexperience.com`

## Backup Options

If the main URL doesn't work, you can also use:
- `/demo/artkey-691e3d09ef58e` (has "demo" in URL, but works the same)

## What Customers Will See

- Your ArtKey title
- Your custom background
- All your links/buttons
- Your images and videos
- Spotify playlist (if enabled)
- Guestbook (if enabled)
- **Nothing that says "demo" or "test"**

The portal is production-ready and professional.
