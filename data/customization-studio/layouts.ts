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
};

// Small, modern set: 1, 2, 3, 4 grid + collage
export const COLLAGE_LAYOUTS: CollageLayout[] = (() => {
  const g = 0.02; // gutter (2% of canvas)
  const half = 0.5;

  const leftW = half - g / 2;
  const rightW = half - g / 2;
  const topH = half - g / 2;
  const bottomH = half - g / 2;

  // 4-grid uses 2x2 with gutters
  const qW = half - g / 2;
  const qH = half - g / 2;

  // Collage: 1 hero + 4 small (2x2) on the side
  const heroW = 2 / 3 - g / 2;
  const sideX = heroW + g;
  const sideW = 1 - sideX;
  const sideH = half - g / 2;
  const sideCellW = sideW / 2 - g / 2;

  return [
    {
      id: "single",
      name: "Single",
      slots: [{ x: 0, y: 0, width: 1, height: 1 }],
    },
    {
      id: "two",
      name: "2-Up",
      slots: [
        { x: 0, y: 0, width: leftW, height: 1 },
        { x: leftW + g, y: 0, width: rightW, height: 1 },
      ],
    },
    {
      id: "three-hero",
      name: "3-Up (Hero + 2)",
      slots: [
        { x: 0, y: 0, width: leftW, height: 1 },
        { x: leftW + g, y: 0, width: rightW, height: topH },
        { x: leftW + g, y: topH + g, width: rightW, height: bottomH },
      ],
    },
    {
      id: "four-grid",
      name: "4 Grid",
      slots: [
        { x: 0, y: 0, width: qW, height: qH },
        { x: qW + g, y: 0, width: qW, height: qH },
        { x: 0, y: qH + g, width: qW, height: qH },
        { x: qW + g, y: qH + g, width: qW, height: qH },
      ],
    },
    {
      id: "collage",
      name: "Collage",
      slots: [
        { x: 0, y: 0, width: heroW, height: 1 },
        { x: sideX, y: 0, width: sideCellW, height: sideH },
        { x: sideX + sideCellW + g, y: 0, width: sideCellW, height: sideH },
        { x: sideX, y: sideH + g, width: sideCellW, height: sideH },
        { x: sideX + sideCellW + g, y: sideH + g, width: sideCellW, height: sideH },
      ],
    },
  ];
})();

export function getLayoutById(id: string): CollageLayout | undefined {
  return COLLAGE_LAYOUTS.find((l) => l.id === id);
}
