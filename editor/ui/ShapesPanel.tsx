// editor/ui/ShapesPanel.tsx
import React from "react";
import Konva from "konva";

type Props = {
  safeRect: { x: number; y: number; width: number; height: number };
  onAdd: (node: Konva.Node) => void;
};

function centerInSafe(safeRect: Props["safeRect"], w: number, h: number) {
  return {
    x: safeRect.x + safeRect.width / 2 - w / 2,
    y: safeRect.y + safeRect.height / 2 - h / 2,
  };
}

export function ShapesPanel({ safeRect, onAdd }: Props) {
  return (
    <div className="p-4 space-y-3">
      <div className="font-semibold">Shapes</div>

      <div className="grid grid-cols-2 gap-2">
        <button
          className="border rounded-none p-2 text-sm"
          onClick={() => {
            const { x, y } = centerInSafe(safeRect, 240, 0);
            const line = new Konva.Line({
              id: `line_${Date.now()}`,
              x,
              y: safeRect.y + safeRect.height / 2,
              points: [0, 0, 240, 0],
              stroke: "#111827",
              strokeWidth: 4,
              draggable: true,
            });
            onAdd(line);
          }}
        >
          Line
        </button>

        <button
          className="border rounded-none p-2 text-sm"
          onClick={() => {
            const line = new Konva.Line({
              id: `dashed_${Date.now()}`,
              x: safeRect.x + 60,
              y: safeRect.y + safeRect.height / 2,
              points: [0, 0, 240, 0],
              stroke: "#111827",
              strokeWidth: 4,
              dash: [12, 8],
              draggable: true,
            });
            onAdd(line);
          }}
        >
          Dashed
        </button>

        <button
          className="border rounded-none p-2 text-sm"
          onClick={() => {
            const arrow = new Konva.Arrow({
              id: `arrow_${Date.now()}`,
              x: safeRect.x + 60,
              y: safeRect.y + safeRect.height / 2,
              points: [0, 0, 260, 0],
              stroke: "#111827",
              fill: "#111827",
              strokeWidth: 4,
              pointerLength: 14,
              pointerWidth: 14,
              draggable: true,
            });
            onAdd(arrow);
          }}
        >
          Arrow
        </button>

        <button
          className="border rounded-none p-2 text-sm"
          onClick={() => {
            const w = 220, h = 160;
            const { x, y } = centerInSafe(safeRect, w, h);
            const rect = new Konva.Rect({
              id: `rect_fill_${Date.now()}`,
              x, y,
              width: w,
              height: h,
              fill: "#9ca3af",
              stroke: "#111827",
              strokeWidth: 0,
              draggable: true,
            });
            onAdd(rect);
          }}
        >
          Filled Rect
        </button>

        <button
          className="border rounded-none p-2 text-sm col-span-2"
          onClick={() => {
            const w = 260, h = 180;
            const { x, y } = centerInSafe(safeRect, w, h);
            const rect = new Konva.Rect({
              id: `rect_outline_${Date.now()}`,
              x, y,
              width: w,
              height: h,
              fill: "transparent",
              stroke: "#111827",
              strokeWidth: 6,
              draggable: true,
            });
            onAdd(rect);
          }}
        >
          Outline Rect
        </button>
      </div>
    </div>
  );
}
