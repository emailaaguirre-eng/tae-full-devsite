# Going Live Checklist

## ✅ Your Setup is Already Correct!

Your demo ArtKey is **already tied to your WordPress URL** and will work when you go live.

## How It Works

1. **Your WordPress Site:**
   - URL: `https://theartfulexperience.com`
   - Contains ArtKey with token: `691e3d09ef58e`
   - This is your **source of truth** - all ArtKey data is stored here

2. **Your Next.js Site (when live):**
   - Will query: `https://theartfulexperience.com/wp-json/...`
   - Fetches ArtKey data by token
   - Displays it in the portal

3. **The Demo URL:**
   - `/art-key/691e3d09ef58e`
   - This will work on your live site
   - It loads content from `https://theartfulexperience.com`

## Environment Variable Setup (Required)

When you deploy to production, set this in Vercel:

**`WP_API_BASE`** or **`NEXT_PUBLIC_WORDPRESS_URL`** = `https://theartfulexperience.com`

That's it! Once this is set, your Next.js site will:
- ✅ Query your WordPress site
- ✅ Load the ArtKey with token `691e3d09ef58e`
- ✅ Display all your content
- ✅ Work exactly as it does now

## Your Live URLs Will Be

- **Demo ArtKey:** `https://your-production-domain.com/art-key/691e3d09ef58e`
- **Admin Panel:** `https://your-production-domain.com/manage/login`
- **ArtKey Editor:** `https://your-production-domain.com/art-key/edit/691e3d09ef58e`

## What Happens When You Go Live

1. Deploy your Next.js site to production (Vercel, etc.)
2. Set `WP_API_BASE` = `https://theartfulexperience.com` in environment variables
3. Your demo ArtKey will automatically load from WordPress
4. Any changes you make in WordPress will appear in the Next.js portal
5. The URL `/art-key/691e3d09ef58e` will work on your live site

## Important Notes

- ✅ **No changes needed** to your WordPress site
- ✅ **No changes needed** to your ArtKey data
- ✅ The token `691e3d09ef58e` already exists in WordPress
- ✅ Just set the environment variable and deploy

## Testing Before Going Live

1. Set `WP_API_BASE` = `https://theartfulexperience.com` in Vercel
2. Test: `/api/artkey/test-connection` - should show WordPress is accessible
3. Test: `/art-key/691e3d09ef58e` - should load your ArtKey content
4. Test on mobile - should be fullscreen

Once these work, you're ready to go live! 🚀
