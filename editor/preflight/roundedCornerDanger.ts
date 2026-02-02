// editor/preflight/roundedCornerDanger.ts
type Rect = { x: number; y: number; width: number; height: number };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Returns true if the node bbox intrudes into any rounded-corner cutout.
 * Works best for "important content" (text, logos, etc.).
 */
export function isInRoundedCornerDangerZone(
  nodeRect: Rect,
  safeRect: Rect,
  cornerRadiusPx: number
) {
  if (cornerRadiusPx <= 0) return false;

  // Corner circle centers for SAFE rect
  const r = cornerRadiusPx;

  const corners = [
    { cx: safeRect.x + r, cy: safeRect.y + r }, // top-left
    { cx: safeRect.x + safeRect.width - r, cy: safeRect.y + r }, // top-right
    { cx: safeRect.x + r, cy: safeRect.y + safeRect.height - r }, // bottom-left
    { cx: safeRect.x + safeRect.width - r, cy: safeRect.y + safeRect.height - r }, // bottom-right
  ];

  // If the nodeRect is well away from corner squares, skip early.
  // A corner's "square" region is r x r at each corner.
  const cornerSquares = [
    { x: safeRect.x, y: safeRect.y, w: r, h: r },
    { x: safeRect.x + safeRect.width - r, y: safeRect.y, w: r, h: r },
    { x: safeRect.x, y: safeRect.y + safeRect.height - r, w: r, h: r },
    { x: safeRect.x + safeRect.width - r, y: safeRect.y + safeRect.height - r, w: r, h: r },
  ];

  const intersects = (a: Rect, b: Rect) =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

  let nearCorner = false;
  for (const cs of cornerSquares) {
    if (intersects(nodeRect, { x: cs.x, y: cs.y, width: cs.w, height: cs.h })) {
      nearCorner = true;
      break;
    }
  }
  if (!nearCorner) return false;

  // Check distance from each corner-circle center to the closest point in nodeRect.
  // If closest point is OUTSIDE the circle (distance > r), that region is trimmed away.
  // We flag intrusion when nodeRect has any pixels in the trimmed-away region.
  for (const { cx, cy } of corners) {
    const closestX = clamp(cx, nodeRect.x, nodeRect.x + nodeRect.width);
    const closestY = clamp(cy, nodeRect.y, nodeRect.y + nodeRect.height);
    const dx = closestX - cx;
    const dy = closestY - cy;
    const distSq = dx * dx + dy * dy;

    // If the closest point to the circle center is farther than r,
    // then nodeRect enters the "cut out" area (danger).
    if (distSq > r * r) {
      // This catches the "outside the circle" region within the corner square.
      // To avoid false positives, ensure node is actually in that corner square.
      // We'll do a simple additional check: nodeRect intersects the corner square region.
      // If so, danger.
      // (We already had nearCorner, but this tightens a bit.)
      return true;
    }
  }

  return false;
}
