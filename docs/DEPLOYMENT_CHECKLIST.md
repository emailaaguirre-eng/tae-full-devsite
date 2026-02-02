# Deployment Checklist - Media Host Changes

## ⚠️ CRITICAL: Before Deploying

### Issue Found: Image Domain Mismatch

Your code uses **two different WordPress domains**:
- `dredev.theartfulexperience.com` (used in Hero.tsx)
- `theartfulexperience.com` (configured in next.config.js)

**This will cause images to fail loading after deployment!**

## Required Actions Before Deployment

### 1. Fix Image Domain Configuration

**Option A: Update next.config.js to allow both domains**

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'theartfulexperience.com',
      pathname: '/wp-content/uploads/**',
    },
    {
      protocol: 'https',
      hostname: 'dredev.theartfulexperience.com',
      pathname: '/wp-content/uploads/**',
    },
  ],
},
```

**Option B: Standardize on one domain** (recommended)
- Update all image URLs to use `theartfulexperience.com`
- Or update all to use `dredev.theartfulexperience.com`

### 2. Set Environment Variable in Deployment Platform

**For Vercel:**
1. Go to Project Settings → Environment Variables
2. Add: `NEXT_PUBLIC_MEDIA_BASE_URL`
3. Value: `https://theartfulexperience.com` (or `https://dredev.theartfulexperience.com` if that's your primary)
4. Apply to: Production, Preview, Development

**For Other Platforms:**
- Set `NEXT_PUBLIC_MEDIA_BASE_URL` in your platform's environment variables

### 3. Verify All Image Sources

Check for images from other domains that might break:

```bash
# Search for external image URLs
grep -r "https://" components/ app/ --include="*.tsx" --include="*.ts" | grep -i "image\|img\|src"
```

## What Will Happen If You Deploy Now

### ✅ What Will Work:
- Code will compile and deploy successfully
- Components using `mediaUrl()` helper will work
- Images from `theartfulexperience.com` will load (if using Next.js Image)
- All existing absolute URLs will continue to work

### ❌ What Will Break:
- **Images from `dredev.theartfulexperience.com` will fail to load** (Next.js Image component will block them)
- Any images using `<Image>` from `dredev.theartfulexperience.com` will show broken images
- Regular `<img>` tags will still work (not blocked by Next.js)

### ⚠️ Potential Issues:
- If `NEXT_PUBLIC_MEDIA_BASE_URL` is not set in deployment, it defaults to `https://theartfulexperience.com` (should be fine)
- Build might show warnings about unrecognized image domains

## Recommended Deployment Steps

1. **Fix next.config.js** to allow both domains (or standardize on one)
2. **Set environment variable** in deployment platform
3. **Test locally** with production-like settings
4. **Deploy to preview/staging** first
5. **Verify images load** correctly
6. **Deploy to production**

## Quick Fix Commands

```bash
# Check what domains are used
grep -r "theartfulexperience.com" components/ app/ --include="*.tsx" --include="*.ts"

# Update next.config.js to allow both domains (see above)
```

## After Deployment

1. Check browser console for image loading errors
2. Verify all images display correctly
3. Test on mobile devices
4. Monitor error logs for image-related issues

## Rollback Plan

If images break after deployment:

1. **Quick fix:** Revert `next.config.js` to allow all domains:
   ```javascript
   remotePatterns: [{ protocol: 'https', hostname: '**' }]
   ```

2. **Better fix:** Add the missing domain to remotePatterns

3. **Best fix:** Standardize on one domain and update all references

