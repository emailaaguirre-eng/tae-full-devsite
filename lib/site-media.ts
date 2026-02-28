/**
 * Site Media Override System
 *
 * Provides both server-side and client-side helpers for looking up
 * admin-managed image overrides by key. If no override exists the
 * component falls back to the hardcoded default URL.
 *
 * Server components: call getSiteMediaMap() directly (async, reads DB).
 * Client components: use the useSiteMedia() hook (fetches /api/site-media once).
 */

export async function ensureSiteMediaTable(): Promise<void> {
  const key = "__taeSiteMediaTableReady";
  const g = globalThis as typeof globalThis & { [key]?: boolean };
  if (g[key]) return;

  const { executeSql } = await import("@/db");
  await executeSql(`
    CREATE TABLE IF NOT EXISTS SiteMedia (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      alt TEXT,
      updatedAt TEXT
    )
  `);
  await executeSql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_site_media_key ON SiteMedia(key)`);
  g[key] = true;
}

// ---------------------------------------------------------------------------
// Server-side: direct DB lookup (for server components / API routes)
// ---------------------------------------------------------------------------

export async function getSiteMediaMap(): Promise<Record<string, { url: string; alt: string | null }>> {
  const { getDb, siteMedia } = await import("@/lib/db");
  await ensureSiteMediaTable();
  const db = await getDb();
  let rows: Array<{ key: string; url: string; alt: string | null }> = [];
  try {
    rows = await db.select().from(siteMedia).all();
  } catch (err: any) {
    const msg = String(err?.message || "");
    if (!msg.includes("no such table")) {
      throw err;
    }
    rows = [];
  }

  const map: Record<string, { url: string; alt: string | null }> = {};
  for (const r of rows) {
    map[r.key] = { url: r.url, alt: r.alt };
  }
  return map;
}

export async function getSiteMedia(key: string): Promise<string | null> {
  const map = await getSiteMediaMap();
  return map[key]?.url ?? null;
}

// ---------------------------------------------------------------------------
// Known site media keys — used by the admin Site Media page to render
// a predictable list with default previews.
// ---------------------------------------------------------------------------

export interface SiteMediaSlot {
  key: string;
  label: string;
  component: string;
  defaultUrl: string;
}

export const SITE_MEDIA_SLOTS: SiteMediaSlot[] = [
  // Hero
  { key: "hero.background", label: "Hero Background", component: "Hero", defaultUrl: "https://theartfulexperience.com/wp-content/uploads/2026/01/herowedding.png" },

  // HowItWorks
  { key: "howitworks.step1", label: "How It Works — Step 1", component: "HowItWorks", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/uploadyourimage.png" },
  { key: "howitworks.step2", label: "How It Works — Step 2", component: "HowItWorks", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/buyanexistingprint.jpg" },
  { key: "howitworks.step3", label: "How It Works — Step 3", component: "HowItWorks", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/uploadmedia.png" },
  { key: "howitworks.step4", label: "How It Works — Step 4", component: "HowItWorks", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/legacy-3.jpeg" },
  { key: "howitworks.step5", label: "How It Works — Step 5", component: "HowItWorks", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/couch.jpg" },

  // CollectorsSection
  { key: "collectors.image1", label: "Collectors — Image 1", component: "CollectorsSection", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/collectors_commissioned.jpeg" },
  { key: "collectors.image2", label: "Collectors — Image 2", component: "CollectorsSection", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/6021123e-401a-11f0-8abf-0242ac110002-unnamed-1-1.jpg" },

  // Testimonials
  { key: "testimonials.1", label: "Testimonial 1 — Portrait", component: "Testimonials", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/river-1.jpg" },
  { key: "testimonials.2", label: "Testimonial 2 — Portrait", component: "Testimonials", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/3125EEFB-C70A-4CF7-8DB3-1F4DB841E4B9-scaled.jpeg" },
  { key: "testimonials.3", label: "Testimonial 3 — Portrait", component: "Testimonials", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/IMG_0814.jpeg" },
  { key: "testimonials.4", label: "Testimonial 4 — Portrait", component: "Testimonials", defaultUrl: "https://theartfulexperience.com/wp-content/uploads/2025/12/IMG_7692-1-scaled.jpeg" },
  { key: "testimonials.5", label: "Testimonial 5 — Portrait", component: "Testimonials", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/photocuhtgg.png" },
  { key: "testimonials.6", label: "Testimonial 6 — Portrait", component: "Testimonials", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/9A91E9CB-3917-4204-9C30-B36EAC1BD4E2.jpeg" },
  { key: "testimonials.7", label: "Testimonial 7 — Portrait", component: "Testimonials", defaultUrl: "https://theartfulexperience.com/wp-content/uploads/2025/12/bctestimonial.png" },

  // AboutUs
  { key: "about.video", label: "About — Promo Video", component: "AboutUs", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/Hero-PROMO-VIDEO.mp4" },
  { key: "about.collage", label: "About — Collage Image", component: "AboutUs", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/10/collage.png" },

  // CardsSection
  { key: "cards.hero", label: "Cards Section — Hero", component: "CardsSection", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/tAE_Holiday_Hero.png" },

  // GiftIdeas
  { key: "giftideas.1", label: "Gift Idea 1 — Friend/Partner", component: "GiftIdeas", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/uploadyourprint.png" },
  { key: "giftideas.2", label: "Gift Idea 2 — Wedding", component: "GiftIdeas", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/forweddings.jpeg" },
  { key: "giftideas.3", label: "Gift Idea 3 — Client", component: "GiftIdeas", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/specialcustomer.png" },
  { key: "giftideas.4", label: "Gift Idea 4 — Legacy", component: "GiftIdeas", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/tae_legacy.png" },
  { key: "giftideas.5", label: "Gift Idea 5 — College", component: "GiftIdeas", defaultUrl: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/offtocollege.png" },
];
