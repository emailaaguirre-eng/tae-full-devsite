# Build Error Checklist - Common Issues Fixed

## ✅ Issues Already Fixed

1. **Removed `output: 'standalone'`** - Vercel doesn't need this
2. **Fixed `useSearchParams()` Suspense** - Wrapped in Suspense boundary
3. **Fixed API route params** - Updated to use `Promise<{...}>` for Next.js 15
4. **Removed leftover `components/page.tsx`** - Deleted duplicate file
5. **Fixed `fetchArtKey` function** - Updated to use absolute URL for server-side calls
6. **Added React import** - For React.ReactNode types

## Common Build Errors to Check

### 1. TypeScript Errors
- Check Vercel build logs for TypeScript compilation errors
- Look for: "Type error:", "Cannot find name", "Property does not exist"

### 2. Missing Dependencies
- Ensure all packages in `package.json` are installed
- Check for peer dependency warnings

### 3. Import Errors
- Verify all `@/` path aliases resolve correctly
- Check JSON imports from `@/content/`
- Verify all component imports exist

### 4. API Route Issues
- All route handlers should use `Promise<{...}>` for params in Next.js 15
- Check for missing `export async function GET/POST`

### 5. Client Component Issues
- Components using hooks must have `"use client"` directive
- `useSearchParams()` must be wrapped in Suspense

### 6. Environment Variables
- Build should work without env vars (they're only needed at runtime)
- But check if any code tries to access `process.env` at build time

## How to Get the Exact Error

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the failed deployment
3. Check the "Build Logs" tab
4. Look for the first error message (usually in red)
5. Share that error message for specific help

## Quick Test Commands

```bash
# Check TypeScript
npx tsc --noEmit

# Check for lint errors
npm run lint

# Try building locally (if you have dependencies installed)
npm run build
```
