// Simple in-memory store for ArtKey data.
// Replace with your SQL persistence (Postgres/MySQL/etc) in production.

type ArtKeyRecord = {
  id: string;
  status: 'draft' | 'pending' | 'active';
  productId?: string;
  cartItemId?: string;
  artKeyData: any;
  createdAt: string;
  activatedAt?: string;
};

// Keep across hot reloads in dev
const globalAny = global as any;
if (!globalAny.__artKeyStore) {
  globalAny.__artKeyStore = new Map<string, ArtKeyRecord>();
}

export const artKeyStore: Map<string, ArtKeyRecord> = globalAny.__artKeyStore;

export type { ArtKeyRecord };

