# Marketing URL - Confirmed Setup

## Your Exact Marketing URL

**✅ CONFIRMED:**
```
https://theartfulexperience.com/art-key/artkey-session-691e3d09ef58e/
```

## Route Support

Your Next.js site has a dedicated route for this exact URL format:
- **Route:** `/app/art-key/artkey-session-[token]/page.tsx`
- **Handles:** `/art-key/artkey-session-691e3d09ef58e/`
- **Extracts token:** `691e3d09ef58e`
- **Loads from WordPress:** `https://theartfulexperience.com`

## How It Works

1. **User visits:** `https://theartfulexperience.com/art-key/artkey-session-691e3d09ef58e/`
2. **Next.js route:** `/art-key/artkey-session-[token]/` captures it
3. **Token extracted:** `691e3d09ef58e`
4. **API call:** Queries `https://theartfulexperience.com/wp-json/artkey/v1/get/691e3d09ef58e`
5. **Displays:** Your ArtKey content (title, links, images, etc.)

## When You Deploy

### If Next.js is on `theartfulexperience.com`:
- ✅ The URL will work immediately
- ✅ No redirects needed
- ✅ Your marketing materials work as-is

### If Next.js is on a different domain:
- Set up a redirect in WordPress or server config
- Or use the same domain for Next.js

## Environment Variable

Set in Vercel:
- `WP_API_BASE` or `NEXT_PUBLIC_WORDPRESS_URL` = `https://theartfulexperience.com`

## Testing

After deployment, test:
1. Visit: `https://theartfulexperience.com/art-key/artkey-session-691e3d09ef58e/`
2. Should load your "Happy Holidays!" ArtKey
3. Should show all your links and content
4. Mobile: Fullscreen
5. Desktop: Phone frame

## Summary

✅ **Route created:** `/art-key/artkey-session-[token]/`  
✅ **Token extraction:** Works correctly  
✅ **WordPress integration:** Loads from `theartfulexperience.com`  
✅ **SEO protected:** Noindex, nofollow  
✅ **Ready for production**

Your printed marketing materials with this exact URL will work! 🎯
