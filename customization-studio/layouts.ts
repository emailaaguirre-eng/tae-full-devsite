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
  const topH = half - g / 2;
  const bottomH = half - g / 2;

  // 4-grid uses 2x2 with gutters
  const qW = half - g / 2;
  const qH = half - g / 2;

  // Collage A: 1 hero + 4 small (2x2) on the side
  const heroW = 2 / 3 - g / 2;
  const sideX = heroW + g;
  const sideW = 1 - sideX;
  const sideH = half - g / 2;
  const sideCellW = sideW / 2 - g / 2;

  // Collage B: top hero + 3 bottom
  const topHeroH = 0.58;
  const bottomH3 = 1 - topHeroH - g;
  const thirdW = (1 - g * 2) / 3;

  // Collage C: center hero + four corners
  const centerW = 0.58;
  const centerH = 0.58;
  const centerX = (1 - centerW) / 2;
  const centerY = (1 - centerH) / 2;
  const cornerW = (1 - centerW - g) / 2;
  const cornerH = (1 - centerH - g) / 2;

  return [
    {
      id: "freeform",
      name: "Freeform (No Layout)",
      slots: [],
      category: "basic",
    },
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
      id: "three-hero",
      name: "3-Up (Hero + 2)",
      slots: [
        { x: 0, y: 0, width: leftW, height: 1 },
        { x: leftW + g, y: 0, width: rightW, height: topH },
        { x: leftW + g, y: topH + g, width: rightW, height: bottomH },
      ],
      category: "basic",
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
      category: "basic",
    },
    {
      id: "collage",
      name: "Collage A (Hero + 4)",
      slots: [
        { x: 0, y: 0, width: heroW, height: 1 },
        { x: sideX, y: 0, width: sideCellW, height: sideH },
        { x: sideX + sideCellW + g, y: 0, width: sideCellW, height: sideH },
        { x: sideX, y: sideH + g, width: sideCellW, height: sideH },
        { x: sideX + sideCellW + g, y: sideH + g, width: sideCellW, height: sideH },
      ],
      category: "collage",
    },
    {
      id: "collage-top-hero",
      name: "Collage B (Top Hero + 3)",
      slots: [
        { x: 0, y: 0, width: 1, height: topHeroH },
        { x: 0, y: topHeroH + g, width: thirdW, height: bottomH3 },
        { x: thirdW + g, y: topHeroH + g, width: thirdW, height: bottomH3 },
        { x: thirdW * 2 + g * 2, y: topHeroH + g, width: thirdW, height: bottomH3 },
      ],
      category: "collage",
    },
    {
      id: "collage-center-focus",
      name: "Collage C (Center Focus)",
      slots: [
        { x: centerX, y: centerY, width: centerW, height: centerH },
        { x: 0, y: 0, width: cornerW, height: cornerH },
        { x: 1 - cornerW, y: 0, width: cornerW, height: cornerH },
        { x: 0, y: 1 - cornerH, width: cornerW, height: cornerH },
        { x: 1 - cornerW, y: 1 - cornerH, width: cornerW, height: cornerH },
      ],
      category: "collage",
    },
  ];
})();

export function getLayoutById(id: string): CollageLayout | undefined {
  return COLLAGE_LAYOUTS.find((l) => l.id === id);
}
