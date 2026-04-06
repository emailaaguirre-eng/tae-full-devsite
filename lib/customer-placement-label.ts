/**
 * Customer-facing labels for print surfaces (avoid raw provider placement IDs in UI).
 */
export function customerPlacementLabel(placement: string): string {
  const raw = String(placement || "").trim().toLowerCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    front: "Front",
    default: "Front",
    back: "Back",
    inside: "Inside",
    inside1: "Inside left",
    inside2: "Inside right",
    inside_left: "Inside left",
    inside_right: "Inside right",
    insideleft: "Inside left",
    insideright: "Inside right",
  };
  if (map[raw]) return map[raw];
  return raw
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
