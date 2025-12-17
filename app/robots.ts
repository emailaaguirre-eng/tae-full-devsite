import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/art-key/', // Disallow all ArtKey portal URLs
          '/art-key/*', // Disallow all ArtKey portal URLs with tokens
          '/art-key/artkey-session-', // Disallow ArtKey session URLs (marketing materials)
          '/art-key/artkey-session-*', // Disallow all ArtKey session URLs
          '/art-key/edit/', // Disallow ArtKey editor URLs
          '/art-key/edit/*', // Disallow ArtKey editor URLs with tokens
          '/manage/', // Disallow admin/management URLs
          '/manage/*', // Disallow all admin/management URLs
        ],
      },
    ],
  };
}
