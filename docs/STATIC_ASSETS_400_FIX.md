# Static Assets 400 Error - Diagnostic Report & Fix

**Date:** 2025-01-31  
**Issue:** Next.js static chunks returning 400 errors in production  
**Status:** Patch Applied

## Problem Summary

Production site is experiencing 400 Bad Request errors for Next.js static assets:
- `/_next/static/.../framework-*.js`
- `/_next/static/.../main-*.js`
- `/_next/static/.../_buildManifest.js`
- `/_next/static/.../_ssgManifest.js`

This prevents hydration and makes all routes appear down.

## Root Cause Analysis

### 1. Middleware Check
✅ **No middleware.ts/js found** - Middleware was not the issue.

### 2. Likely Causes (in order of probability)

#### A. Server/Proxy Configuration (Most Likely)
- **cPanel/WordPress Rewrite Rules**: If the site is hosted on cPanel with WordPress, `.htaccess` rewrite rules may be intercepting `/_next/*` paths and routing them to WordPress instead of Next.js.
- **Nginx Configuration**: If using Nginx as reverse proxy, missing location blocks for `/_next/*` paths.
- **PM2/Node Process**: Next.js server may not be properly handling static file requests.

#### B. Cloudflare/CDN/WAF
- **WAF Rules**: Cloudflare or other WAF may be blocking `/_next/*` paths as suspicious.
- **Cache Rules**: Incorrect cache rules may be serving stale/corrupted static files.

#### C. Build Issues
- **Corrupted Build**: `.next` directory may be corrupted or incomplete.
- **Missing Static Files**: Build process may not have generated all required static chunks.

## Solution Applied

### 1. Created Middleware (`middleware.ts`)
- **Purpose**: Explicitly allow all `/_next/*` paths to pass through
- **Matcher**: Excludes all Next.js internal paths, static assets, and API routes
- **Logging**: Added temporary logging in dev/preview mode to track requests

### 2. Middleware Configuration
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack|_next/data|api|favicon.ico|robots.txt|sitemap.xml|images|fonts|.*\\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)).*)',
  ],
};
```

This ensures middleware **never runs** on:
- `/_next/static/*` - Static chunks
- `/_next/image/*` - Image optimization
- `/_next/webpack/*` - Webpack chunks
- `/_next/data/*` - Data routes
- `/api/*` - API routes
- Static files (favicon, robots, sitemap, images, fonts)

## Additional Steps Required

### Step 1: Verify Middleware Works
1. Deploy the middleware.ts file
2. Check production logs for `[MW]` entries
3. Confirm `/_next/static/*` paths are **NOT** logged (they should bypass middleware)

### Step 2: Check Server Configuration

#### If using cPanel/WordPress:
Check `.htaccess` in the Next.js app directory:
```apache
# Ensure /_next/* paths are NOT rewritten to WordPress
# Add this BEFORE any WordPress rewrite rules:
RewriteCond %{REQUEST_URI} ^/_next/
RewriteRule ^(.*)$ - [L]
```

#### If using Nginx:
Add location block:
```nginx
location /_next/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Step 3: Check PM2/Node Process
1. Verify Next.js server is running: `pm2 list`
2. Check server logs: `pm2 logs tae-full-devsite`
3. Look for 400 errors in server logs (not just browser console)

### Step 4: Rebuild if Needed
If static files are corrupted:
```bash
rm -rf .next
npm run build
pm2 restart tae-full-devsite
```

### Step 5: Check Cloudflare/CDN
1. **WAF Rules**: Check if any WAF rules are blocking `/_next/*`
2. **Cache Settings**: Ensure `/_next/static/*` is cached but not blocked
3. **Page Rules**: Verify no page rules are interfering with static assets

## Testing

### Test 1: Direct Static Asset Access
```bash
curl -I https://yourdomain.com/_next/static/chunks/framework-*.js
```
**Expected:** 200 OK  
**If 400:** Server/proxy issue

### Test 2: Check Response Headers
```bash
curl -I https://yourdomain.com/_next/static/chunks/main-*.js
```
**Check for:**
- `Content-Type: application/javascript`
- `Cache-Control: public, max-age=31536000, immutable`
- **NOT** `X-Powered-By: WordPress` (indicates rewrite issue)

### Test 3: Server Logs
Check Next.js server logs for:
- 400 errors on `/_next/static/*` paths
- Any middleware processing of `/_next/*` paths (should be none)

## Expected Behavior After Fix

1. ✅ `/_next/static/*` files return 200 OK
2. ✅ No middleware logging for `/_next/*` paths
3. ✅ Hydration succeeds
4. ✅ All routes load correctly

## If Issue Persists

### Diagnostic Commands
```bash
# Check if Next.js server is running
pm2 list

# Check server logs
pm2 logs tae-full-devsite --lines 100

# Check for .htaccess in app directory
cat .htaccess

# Test static file directly
curl -v https://yourdomain.com/_next/static/chunks/framework-*.js
```

### Additional Checks
1. **File Permissions**: Ensure `.next/static` directory is readable
2. **Disk Space**: Check if disk is full (prevents file serving)
3. **Node Version**: Verify Node.js version matches build environment
4. **Build Output**: Check if `.next/static` directory exists and has files

## Files Changed

1. **`middleware.ts`** (NEW)
   - Explicitly allows `/_next/*` paths
   - Adds logging for debugging
   - Proper matcher configuration

2. **`docs/STATIC_ASSETS_400_FIX.md`** (NEW)
   - Diagnostic report
   - Troubleshooting guide
   - Server configuration examples

## Next Steps

1. **Deploy middleware.ts** to production
2. **Monitor logs** for `[MW]` entries (should NOT see `/_next/static/*`)
3. **Test static assets** directly via curl/browser
4. **If still 400**: Check server/proxy configuration (see Step 2 above)
5. **If resolved**: Remove temporary logging from middleware

## Notes

- Middleware is defensive - it ensures `/_next/*` paths are never blocked
- If the issue is server/proxy configuration, middleware alone won't fix it
- The real fix may require updating `.htaccess`, Nginx config, or Cloudflare rules
- This patch ensures Next.js can handle static assets correctly once server routing is fixed

