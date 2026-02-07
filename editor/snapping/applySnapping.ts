// editor/snapping/applySnapping.ts
import Konva from "konva";

type Rect = { x: number; y: number; width: number; height: number };

function getEdges(rect: Rect) {
  return {
    left: rect.x,
    right: rect.x + rect.width,
    top: rect.y,
    bottom: rect.y + rect.height,
    centerX: rect.x + rect.width / 2,
    centerY: rect.y + rect.height / 2,
  };
}

export function applySnapping(opts: {
  node: Konva.Node;
  stage: Konva.Stage;
  guidesLayer: Konva.Layer;
  safeRect: Rect;
  snapThreshold: number;
}) {
  const { node, stage, guidesLayer, safeRect, snapThreshold } = opts;

  // Clear existing guide lines
  guidesLayer.destroyChildren();

  const nodeBox = node.getClientRect({ relativeTo: stage });
  const nodeEdges = getEdges(nodeBox);
  const safeEdges = getEdges(safeRect);

  const stageCenterX = stage.width() / 2;
  const stageCenterY = stage.height() / 2;

  const snaps: Array<{ type: "v" | "h"; guide: number; deltaX?: number; deltaY?: number }> = [];

  // Vertical snaps (X)
  const candidatesX = [safeEdges.left, safeEdges.right, safeEdges.centerX, stageCenterX];
  const nodeXTargets = [
    { edge: "left", value: nodeEdges.left },
    { edge: "right", value: nodeEdges.right },
    { edge: "centerX", value: nodeEdges.centerX },
  ] as const;

  for (const c of candidatesX) {
    for (const t of nodeXTargets) {
      const diff = c - t.value;
      if (Math.abs(diff) <= snapThreshold) {
        snaps.push({ type: "v", guide: c, deltaX: diff });
      }
    }
  }

  // Horizontal snaps (Y)
  const candidatesY = [safeEdges.top, safeEdges.bottom, safeEdges.centerY, stageCenterY];
  const nodeYTargets = [
    { edge: "top", value: nodeEdges.top },
    { edge: "bottom", value: nodeEdges.bottom },
    { edge: "centerY", value: nodeEdges.centerY },
  ] as const;

  for (const c of candidatesY) {
    for (const t of nodeYTargets) {
      const diff = c - t.value;
      if (Math.abs(diff) <= snapThreshold) {
        snaps.push({ type: "h", guide: c, deltaY: diff });
      }
    }
  }

  // Apply the closest snap on each axis
  const bestV = snaps.filter((s) => s.type === "v").sort((a, b) => Math.abs(a.deltaX!) - Math.abs(b.deltaX!))[0];
  const bestH = snaps.filter((s) => s.type === "h").sort((a, b) => Math.abs(a.deltaY!) - Math.abs(b.deltaY!))[0];

  if (bestV?.deltaX) node.x(node.x() + bestV.deltaX);
  if (bestH?.deltaY) node.y(node.y() + bestH.deltaY);

  // Draw guide lines
  if (bestV) {
    const line = new Konva.Line({
      points: [bestV.guide, 0, bestV.guide, stage.height()],
      stroke: "#2563eb",
      strokeWidth: 1,
      dash: [4, 4],
      listening: false,
    });
    guidesLayer.add(line);
  }

  if (bestH) {
    const line = new Konva.Line({
      points: [0, bestH.guide, stage.width(), bestH.guide],
      stroke: "#2563eb",
      strokeWidth: 1,
      dash: [4, 4],
      listening: false,
    });
    guidesLayer.add(line);
  }

  guidesLayer.batchDraw();
}
