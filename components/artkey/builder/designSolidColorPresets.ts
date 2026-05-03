/**
 * Shared solid presets: one row, “row 2” accents interleaved (amber omitted).
 * Used by Title font → Text Color and Background → Solid Color.
 */
export const SOLID_COLOR_PRESETS: readonly { hex: string; label: string }[] = [
  { hex: "#ffffff", label: "White" },
  { hex: "#2563eb", label: "Blue" },
  { hex: "#000000", label: "Black" },
  { hex: "#7c3aed", label: "Purple" },
  { hex: "#e53935", label: "Red" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#64748b", label: "Slate" },
  { hex: "#facc15", label: "Yellow" },
  { hex: "#06b6d4", label: "Cyan" },
  { hex: "#22c55e", label: "Green" },
];

/** Normalize to `#rrggbb` lowercase, or `""` if invalid. */
export function normalizeSolidHex(hex: string): string {
  const t = hex.trim();
  const m = t.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return "";
  let s = m[1].toLowerCase();
  if (s.length === 3) {
    s = `${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  }
  return `#${s}`;
}
