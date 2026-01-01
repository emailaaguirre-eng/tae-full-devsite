# WordPress as Media Host (Temporary)

## Overview

WordPress is currently used **only as a media repository** for The Artful Experience Next.js application. All existing image URLs under `https://theartfulexperience.com/wp-content/uploads/...` must continue to work with zero changes.

## Current Setup

### Environment Variable

The media base URL is configured via environment variable:

```bash
NEXT_PUBLIC_MEDIA_BASE_URL=https://theartfulexperience.com
```

This is set in `.env.local` (for local development) and should be set in your deployment environment (Vercel, etc.).

### Media Helper

All media URLs should use the `mediaUrl()` helper from `lib/media.ts`:

```typescript
import { mediaUrl } from '@/lib/media';

// Absolute URLs (current format) - works as-is
const imageUrl = mediaUrl('https://theartfulexperience.com/wp-content/uploads/2024/01/image.jpg');
// → 'https://theartfulexperience.com/wp-content/uploads/2024/01/image.jpg'

// Relative paths (future format) - automatically prefixed
const imageUrl = mediaUrl('/wp-content/uploads/2024/01/image.jpg');
// → 'https://theartfulexperience.com/wp-content/uploads/2024/01/image.jpg'
```

### Next.js Image Configuration

The `next.config.js` is configured to allow images from `theartfulexperience.com`:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'theartfulexperience.com',
      pathname: '/wp-content/uploads/**',
    },
  ],
}
```

## Usage Guidelines

### When Adding New Images

1. **Prefer absolute URLs** (current reality):
   ```typescript
   const imageUrl = mediaUrl('https://theartfulexperience.com/wp-content/uploads/2024/01/image.jpg');
   ```

2. **Or use relative paths** (future-ready):
   ```typescript
   const imageUrl = mediaUrl('/wp-content/uploads/2024/01/image.jpg');
   ```

3. **Always use `mediaUrl()` helper** - even for absolute URLs. This ensures future migration compatibility.

### Using Next.js Image Component

When using `<Image>` from `next/image`, always use `mediaUrl()`:

```tsx
import Image from 'next/image';
import { mediaUrl } from '@/lib/media';

<Image
  src={mediaUrl('/wp-content/uploads/2024/01/image.jpg')}
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
/>
```

### Using Regular img Tags

If you must use `<img>` tags (e.g., for complex layouts), still use `mediaUrl()`:

```tsx
import { mediaUrl } from '@/lib/media';

<img
  src={mediaUrl('/wp-content/uploads/2024/01/image.jpg')}
  alt="Description"
  loading="lazy"
/>
```

## Future Migration Plan

When ready to migrate from WordPress to a CDN/storage provider (S3, R2, Cloudinary, etc.):

1. **Copy all uploads** from `/wp-content/uploads/` to the new storage location
2. **Set up redirects** on WordPress to redirect old URLs to new location (301 redirects)
3. **Update environment variable**:
   ```bash
   NEXT_PUBLIC_MEDIA_BASE_URL=https://cdn.yourdomain.com
   # or
   NEXT_PUBLIC_MEDIA_BASE_URL=https://your-bucket.s3.amazonaws.com
   ```
4. **No code changes needed** - the `mediaUrl()` helper will automatically use the new base URL

### Migration Checklist

- [ ] Copy all files from `/wp-content/uploads/` to new storage
- [ ] Set up redirects on WordPress (301 permanent redirects)
- [ ] Update `NEXT_PUBLIC_MEDIA_BASE_URL` in all environments
- [ ] Test image loading across the application
- [ ] Monitor redirect traffic to ensure all images are being accessed from new location
- [ ] After verification period, consider removing WordPress media hosting

## Important Notes

### What We're NOT Doing

- ❌ **NOT removing WordPress** - it stays online as media host
- ❌ **NOT implementing WooCommerce** - that's separate
- ❌ **NOT implementing new storage** (S3/R2/Cloudinary) - that's future work
- ❌ **NOT bulk-replacing existing URLs** - all existing URLs continue to work

### What We ARE Doing

- ✅ **Treating WordPress as external media host**
- ✅ **Adding abstraction layer** for future migration
- ✅ **Ensuring zero breaking changes** to existing image URLs
- ✅ **Configuring Next.js Image** for optimal performance
- ✅ **Documenting the approach** for future developers

## Performance & Safety

### Lazy Loading

Always use lazy loading for images:

```tsx
<Image
  src={mediaUrl('/wp-content/uploads/2024/01/image.jpg')}
  loading="lazy"  // Browser native lazy loading
  // or
  priority={false} // Next.js Image lazy loading
/>
```

### Width/Height

Always provide width and height for Next.js Image:

```tsx
<Image
  src={mediaUrl('/wp-content/uploads/2024/01/image.jpg')}
  width={800}
  height={600}
  alt="Description"
/>
```

### CORS & Hotlinking

CORS and hotlink protection are handled server-side (WordPress/CDN). The Next.js app does not need to add any special headers.

## Helper Functions

The `lib/media.ts` module provides:

- `mediaUrl(path: string)`: Build full media URL from path
- `isWordPressMedia(url: string)`: Check if URL is WordPress media
- `extractWpMediaPath(url: string)`: Extract relative path from WordPress URL

See `lib/media.ts` for full documentation.

## Examples

### Component Example

```tsx
import Image from 'next/image';
import { mediaUrl } from '@/lib/media';

export default function GalleryItem({ imagePath }: { imagePath: string }) {
  return (
    <Image
      src={mediaUrl(imagePath)}
      alt="Gallery item"
      width={400}
      height={300}
      loading="lazy"
    />
  );
}
```

### API Route Example

```typescript
import { mediaUrl } from '@/lib/media';

export async function GET() {
  const imageUrl = mediaUrl('/wp-content/uploads/2024/01/image.jpg');
  return Response.json({ imageUrl });
}
```

## Troubleshooting

### Images Not Loading

1. Check `NEXT_PUBLIC_MEDIA_BASE_URL` is set correctly
2. Verify image path is correct (check WordPress media library)
3. Check Next.js Image configuration in `next.config.js`
4. Verify CORS settings on WordPress (if accessing from different domain)

### Migration Issues

1. Ensure redirects are set up correctly (301 permanent)
2. Test image URLs in browser directly
3. Check CDN/storage provider configuration
4. Verify environment variables are set in all environments

## Questions?

For questions about media hosting or migration, refer to this document or contact the development team.

