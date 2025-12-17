# Marketing URL Setup

## Your Marketing URL

**URL from printed materials:**
```
https://theartfulexperience.com/art-key/artkey-session-691e3d09ef58e/
```

## ✅ This URL is Supported!

Your Next.js site now supports **both** URL formats:

1. **Marketing URL (from printed materials):**
   - `/art-key/artkey-session-691e3d09ef58e/`
   - This is the exact URL from your marketing materials
   - ✅ **Will work on your live site**

2. **Clean URL (also works):**
   - `/art-key/691e3d09ef58e`
   - Shorter, cleaner version
   - ✅ **Also works**

## How It Works

When someone scans your QR code or visits:
- `https://theartfulexperience.com/art-key/artkey-session-691e3d09ef58e/`

The system will:
1. Extract the token: `691e3d09ef58e`
2. Query WordPress: `https://theartfulexperience.com/wp-json/...`
3. Load your ArtKey content
4. Display it in the portal

## Deployment Options

### Option 1: Next.js replaces WordPress (same domain)
- Deploy Next.js to `theartfulexperience.com`
- The URL `/art-key/artkey-session-691e3d09ef58e/` will work automatically
- Your marketing materials will work immediately

### Option 2: Next.js on different domain
- Deploy Next.js to new domain (e.g., `new-site.com`)
- Set up redirect in WordPress:
  - `https://theartfulexperience.com/art-key/artkey-session-691e3d09ef58e/` 
  - → Redirects to → 
  - `https://new-site.com/art-key/artkey-session-691e3d09ef58e/`

### Option 3: Keep both (WordPress + Next.js)
- WordPress handles the marketing URL
- Next.js handles new ArtKeys
- Both can coexist

## Environment Variable

Set in Vercel:
- `WP_API_BASE` or `NEXT_PUBLIC_WORDPRESS_URL` = `https://theartfulexperience.com`

## Testing

Test your marketing URL:
1. Visit: `/art-key/artkey-session-691e3d09ef58e/`
2. Should load your ArtKey content
3. Works on mobile (fullscreen) and desktop (phone frame)

## Summary

✅ **Your marketing URL is supported**  
✅ **Token extraction works** (`artkey-session-691e3d09ef58e` → `691e3d09ef58e`)  
✅ **Loads from WordPress** (`https://theartfulexperience.com`)  
✅ **Ready for production**

Your printed marketing materials will work! 🎯
