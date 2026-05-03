/** 6-digit hex → `rgba(r,g,b,a)`. Falls back to navy tint if invalid. */
export function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6 || !/^[0-9a-fA-F]+$/i.test(h)) {
    return `rgba(30, 41, 59, ${a})`;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(30, 41, 59, ${a})`;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Light vs dark text on arbitrary solid fills (prototype contrast helper). */
export function contrastTextOnHex(hex: string): "#0f172a" | "#f8fafc" {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6 || !/^[0-9a-fA-F]+$/i.test(h)) return "#0f172a";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return "#0f172a";
  const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return y > 0.58 ? "#0f172a" : "#f8fafc";
}
