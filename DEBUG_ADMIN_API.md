# Debugging Admin API Routes Timeout Issue

## Problem
All `/api/admin/*` routes are timing out (10+ seconds, no response).

## Steps to Debug

### 1. Check Vercel Deployment Logs
- Go to Vercel Dashboard → Your Project → Deployments
- Click on the latest deployment
- Check the "Build Logs" tab
- Look for:
  - Errors about `app/api/admin/` routes
  - TypeScript/build errors
  - Warnings about missing files

### 2. Test Other API Routes
Test if OTHER API routes work:
- `/api/hero-content` - Should return JSON immediately
- `/api/test-simple` - Simple test route
- `/api/artkey/test-connection` - ArtKey test route

**If these work but `/api/admin/*` don't:**
- There's something specific blocking admin routes
- Check if there's a middleware or config blocking `/api/admin/`

### 3. Verify Routes Are Deployed
Check if the route files exist in the build:
- Routes should be at: `app/api/admin/login/route.ts`
- Routes should be at: `app/api/admin/ping/route.ts`

### 4. Check Browser Network Tab
1. Open DevTools (F12) → Network tab
2. Try accessing `/api/admin/ping`
3. Check:
   - Status code (should be 200, not 404 or timeout)
   - Response time
   - Any error messages

### 5. Test Simple Route First
Try these in order:
1. `/api/test-simple` (simplest possible route)
2. `/api/admin/ping` (simple admin route)
3. `/api/admin/login` (GET request - should show config)

## Possible Causes

1. **Routes Not Deployed**: Build error preventing routes from being included
2. **Next.js 15 Issue**: Compatibility issue with API routes on Vercel
3. **Middleware Blocking**: Something blocking `/api/admin/` path
4. **Build Configuration**: Next.js config preventing route deployment

## Quick Fixes to Try

1. **Redeploy**: Trigger a new deployment in Vercel
2. **Check Environment Variables**: Make sure no env vars are causing build issues
3. **Clear Vercel Cache**: In Vercel dashboard, try clearing build cache
4. **Check Next.js Version**: Verify Next.js 15.5.9 is compatible with your setup

## Next Steps

After checking the above, share:
- What you see in Vercel build logs
- Whether other API routes work
- What status code appears in Network tab
