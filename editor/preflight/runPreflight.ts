// editor/preflight/runPreflight.ts
import Konva from "konva";
import type { WarningItem } from "../editorState";
import { isInRoundedCornerDangerZone } from "./roundedCornerDanger";

type Rect = { x: number; y: number; width: number; height: number };

function rectContains(outer: Rect, inner: Rect) {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

export function runPreflight(opts: {
  designLayer: Konva.Layer;
  safeRect: Rect;
  trimRect: Rect;
  cornerStyle: "square" | "rounded";
  cornerRadiusPx: number;
  exportDpi: number;
}) {
  const { designLayer, safeRect, trimRect, cornerStyle, cornerRadiusPx } = opts;

  const warnings: WarningItem[] = [];
  const nodes = designLayer.getChildren((n) => n && n.visible() && n.id && n.id());

  nodes.forEach((node) => {
    const id = node.id();
    const box = node.getClientRect({ skipTransform: false });

    // Outside trim
    if (!rectContains(trimRect, box)) {
      warnings.push({
        id: `trim_${id}`,
        type: "OUTSIDE_TRIM",
        severity: "error",
        nodeId: id,
        message: "Object extends past trim area.",
        fix: "SCALE_TO_FIT_SAFE",
      });
    }

    // Outside safe
    if (!rectContains(safeRect, box)) {
      warnings.push({
        id: `safe_${id}`,
        type: "OUTSIDE_SAFE",
        severity: "warn",
        nodeId: id,
        message: "Object is outside safe area.",
        fix: "MOVE_INTO_SAFE",
      });
    }

    // Rounded corner danger
    if (cornerStyle === "rounded" && cornerRadiusPx > 0) {
      const danger = isInRoundedCornerDangerZone(
        { x: box.x, y: box.y, width: box.width, height: box.height },
        safeRect,
        cornerRadiusPx
      );
      if (danger) {
        warnings.push({
          id: `corner_${id}`,
          type: "ROUNDED_CORNER_DANGER",
          severity: "warn",
          nodeId: id,
          message: "Object is too close to rounded corner cut area.",
          fix: "MOVE_INTO_SAFE",
        });
      }
    }

    // Thin stroke check (for Line/Rect/etc.)
    const anyNode = node as any;
    if (typeof anyNode.strokeWidth === "function") {
      const sw = anyNode.strokeWidth();
      if (sw > 0 && sw < 2) {
        warnings.push({
          id: `stroke_${id}`,
          type: "THIN_STROKE",
          severity: "warn",
          nodeId: id,
          message: "Stroke may be too thin for print.",
        });
      }
    }

    // Small text check
    if (node.className === "Text") {
      const text = node as unknown as Konva.Text;
      const fs = text.fontSize();
      if (fs < 14) {
        warnings.push({
          id: `text_${id}`,
          type: "SMALL_TEXT",
          severity: "warn",
          nodeId: id,
          message: "Text may be too small for print.",
        });
      }
    }
  });

  return warnings;
}
