/**
 * Client-safe helpers for product image admin UI (no DB / Node imports).
 * @copyright B&D Servicing LLC 2026
 */

/** Ensures exactly one hero row after sortOrder sort; if none flagged, first row is hero. */
export function normalizeHeroFlags<T extends { sortOrder: number; isHero: boolean }>(rows: T[]): T[] {
  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
  const idx = sorted.findIndex((r) => r.isHero);
  return sorted.map((r, i) => ({
    ...r,
    isHero: idx >= 0 ? i === idx : i === 0 && sorted.length > 0,
  }));
}
