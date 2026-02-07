# Vercel Deployment Fixes Applied

## Issues Fixed

### 1. ✅ Removed `output: 'standalone'` from next.config.js
   - **Issue**: Vercel doesn't need standalone output and it can cause build issues
   - **Fix**: Commented out the standalone output setting

### 2. ✅ Fixed `useSearchParams()` Suspense Requirement
   - **Issue**: Next.js 15 requires `useSearchParams()` to be wrapped in a Suspense boundary
   - **Fix**: 
     - Renamed main component to `ArtKeyEditorContent`
     - Created wrapper `ArtKeyEditor` component with Suspense boundary
     - Added proper loading fallback

## Common Vercel Deployment Issues to Check

### Environment Variables
Make sure you've set these in Vercel dashboard:
- `WP_API_BASE` - Your WordPress REST API base URL
- `WP_APP_USER` - WordPress application username
- `WP_APP_PASS` - WordPress application password
- `NEXT_PUBLIC_SITE_URL` - Your site URL (optional, for share URLs)

### Build Settings
- Node.js version: Should be 18.x or 20.x
- Build command: `next build` (default)
- Output directory: `.next` (default)

### Potential Issues to Watch For

1. **API Route Errors**: Check that all API routes have proper error handling
2. **Missing Dependencies**: Ensure all packages in `package.json` are compatible
3. **TypeScript Errors**: Check build logs for any TypeScript compilation errors
4. **Image Optimization**: Verify `next.config.js` image settings are correct

## Testing Locally Before Deploy

Run these commands to test locally:
```bash
npm install
npm run build
npm start
```

If the build succeeds locally, it should work on Vercel.
