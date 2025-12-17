import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/art-key/', // Disallow all ArtKey portal URLs
          '/art-key/*', // Disallow all ArtKey portal URLs with tokens
          '/art-key/edit/', // Disallow ArtKey editor URLs
          '/art-key/edit/*', // Disallow ArtKey editor URLs with tokens
        ],
      },
    ],
  };
}
