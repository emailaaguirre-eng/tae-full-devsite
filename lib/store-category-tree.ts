import { executeSql, generateId, querySql, saveDatabase } from "@/lib/db";

type CategoryType = "root" | "group" | "leaf";

type SeedNode = {
  slug: string;
  name: string;
  icon: string;
  categoryType: CategoryType;
  parentSlug?: string;
  taeBaseFee?: number;
  requiresQrCode?: boolean;
  featured?: boolean;
  sortOrder: number;
};

const TREE_NODES: SeedNode[] = [
  { slug: "shop", name: "Shop", icon: "🛍️", categoryType: "root", sortOrder: 10 },
  { slug: "theae-gallery", name: "theAE Gallery", icon: "🖼️", categoryType: "root", sortOrder: 20 },
  { slug: "cocreators", name: "CoCreators", icon: "🤝", categoryType: "root", sortOrder: 30 },

  { slug: "artist", name: "Artist", icon: "🎨", categoryType: "group", parentSlug: "theae-gallery", sortOrder: 100 },
  { slug: "deanna-lankin", name: "Deanna Lankin", icon: "🧑‍🎨", categoryType: "leaf", parentSlug: "artist", sortOrder: 110 },
  { slug: "bryant-colman", name: "Bryant Colman", icon: "📷", categoryType: "leaf", parentSlug: "artist", sortOrder: 120 },

  { slug: "collaborations", name: "Collaborations", icon: "✨", categoryType: "group", parentSlug: "cocreators", sortOrder: 200 },
  { slug: "kimber-cross", name: "Kimber Cross", icon: "🏔️", categoryType: "leaf", parentSlug: "collaborations", sortOrder: 210 },
  { slug: "lance-jones", name: "Lance Jones", icon: "🎭", categoryType: "leaf", parentSlug: "collaborations", sortOrder: 220 },
];

const SHOP_LEAF_SLUGS = [
  "cards",
  "greeting-cards",
  "invitations",
  "announcements",
  "postcards",
  "wall-art",
  "canvas-prints",
  "framed-prints",
];

export async function ensureStoreCategoryHierarchy() {
  const cols = await querySql<{ name: string }>("PRAGMA table_info('ShopCategory')");
  const colSet = new Set(cols.map((c) => c.name));

  if (!colSet.has("parentId")) {
    await executeSql("ALTER TABLE ShopCategory ADD COLUMN parentId TEXT");
  }
  if (!colSet.has("categoryType")) {
    await executeSql("ALTER TABLE ShopCategory ADD COLUMN categoryType TEXT DEFAULT 'leaf'");
  }

  const existing = await querySql<{ id: string; slug: string }>(
    "SELECT id, slug FROM ShopCategory"
  );
  const bySlug = new Map(existing.map((r) => [r.slug, r.id]));
  const now = Date.now().toString();

  for (const node of TREE_NODES) {
    if (bySlug.has(node.slug)) continue;
    const id = generateId();
    const parentId = node.parentSlug ? bySlug.get(node.parentSlug) || null : null;
    await executeSql(
      `INSERT INTO ShopCategory
       (id, taeId, slug, name, description, icon, taeBaseFee, requiresQrCode, heroImage, active, featured, sortOrder, createdAt, updatedAt, parentId, categoryType)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        `TAE-CAT-${node.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`,
        node.slug,
        node.name,
        null,
        node.icon,
        node.taeBaseFee ?? 0,
        node.requiresQrCode ? 1 : 0,
        null,
        1,
        node.featured ? 1 : 0,
        node.sortOrder,
        now,
        now,
        parentId,
        node.categoryType,
      ]
    );
    bySlug.set(node.slug, id);
  }

  const shopId = bySlug.get("shop") || null;
  if (shopId) {
    for (const slug of SHOP_LEAF_SLUGS) {
      await executeSql(
        `UPDATE ShopCategory
         SET parentId = COALESCE(parentId, ?),
             categoryType = COALESCE(categoryType, 'leaf'),
             updatedAt = ?
         WHERE slug = ?`,
        [shopId, now, slug]
      );
    }
  }

  await saveDatabase();
}

