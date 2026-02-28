// customization-studio/layouts.ts
// Collage and grid layouts for the Customization Studio.
// Slots are normalized (0..1) relative to the print canvas.

export type LayoutSlot = {
  x: number; // 0..1
  y: number; // 0..1
  width: number; // 0..1
  height: number; // 0..1
};

export type CollageLayout = {
  id: string;
  name: string;
  slots: LayoutSlot[];
  category?: "basic" | "collage";
};

// Small, modern set: foundational + collage-oriented layouts
export const COLLAGE_LAYOUTS: CollageLayout[] = (() => {
  const g = 0.02; // gutter (2% of canvas)
  const half = 0.5;

  const leftW = half - g / 2;
  const rightW = half - g / 2;

  // 4-grid uses 2x2 with gutters
  const qW = half - g / 2;
  const qH = half - g / 2;

  return [
    {
      id: "single",
      name: "Single",
      slots: [{ x: 0, y: 0, width: 1, height: 1 }],
      category: "basic",
    },
    {
      id: "two",
      name: "2-Up",
      slots: [
        { x: 0, y: 0, width: leftW, height: 1 },
        { x: leftW + g, y: 0, width: rightW, height: 1 },
      ],
      category: "basic",
    },
    {
      id: "four-grid",
      name: "2x2 Grid",
      slots: [
        { x: 0, y: 0, width: qW, height: qH },
        { x: qW + g, y: 0, width: qW, height: qH },
        { x: 0, y: qH + g, width: qW, height: qH },
        { x: qW + g, y: qH + g, width: qW, height: qH },
      ],
      category: "basic",
    },
  ];
})();

export function getLayoutById(id: string): CollageLayout | undefined {
  return COLLAGE_LAYOUTS.find((l) => l.id === id);
}
