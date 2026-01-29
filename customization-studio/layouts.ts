// customization-studio/layouts.ts

export type LayoutSlot = {
  x: number;      // 0-1 as percentage of canvas
  y: number;      // 0-1 as percentage of canvas
  width: number;  // 0-1 as percentage of canvas
  height: number; // 0-1 as percentage of canvas
};

export type CollageLayout = {
  id: string;
  name: string;
  slots: LayoutSlot[];
};

export const COLLAGE_LAYOUTS: CollageLayout[] = [
  {
    id: "single",
    name: "Single Image",
    slots: [{ x: 0, y: 0, width: 1, height: 1 }],
  },
  {
    id: "two-horizontal",
    name: "2 Horizontal",
    slots: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 1 },
    ],
  },
  {
    id: "two-vertical",
    name: "2 Vertical",
    slots: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 1, height: 0.5 },
    ],
  },
  {
    id: "three-top",
    name: "3 (1 Top, 2 Bottom)",
    slots: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  {
    id: "three-bottom",
    name: "3 (2 Top, 1 Bottom)",
    slots: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 1, height: 0.5 },
    ],
  },
  {
    id: "four-grid",
    name: "4 Grid",
    slots: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  {
    id: "four-left",
    name: "4 (1 Left, 3 Right)",
    slots: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 0.333 },
      { x: 0.5, y: 0.333, width: 0.5, height: 0.333 },
      { x: 0.5, y: 0.666, width: 0.5, height: 0.334 },
    ],
  },
  {
    id: "five-cross",
    name: "5 Cross",
    slots: [
      { x: 0.25, y: 0, width: 0.5, height: 0.333 },
      { x: 0, y: 0.333, width: 0.333, height: 0.333 },
      { x: 0.333, y: 0.333, width: 0.334, height: 0.333 },
      { x: 0.667, y: 0.333, width: 0.333, height: 0.333 },
      { x: 0.25, y: 0.666, width: 0.5, height: 0.334 },
    ],
  },
  {
    id: "six-grid",
    name: "6 Grid",
    slots: [
      { x: 0, y: 0, width: 0.333, height: 0.5 },
      { x: 0.333, y: 0, width: 0.334, height: 0.5 },
      { x: 0.667, y: 0, width: 0.333, height: 0.5 },
      { x: 0, y: 0.5, width: 0.333, height: 0.5 },
      { x: 0.333, y: 0.5, width: 0.334, height: 0.5 },
      { x: 0.667, y: 0.5, width: 0.333, height: 0.5 },
    ],
  },
  {
    id: "nine-grid",
    name: "9 Grid",
    slots: [
      { x: 0, y: 0, width: 0.333, height: 0.333 },
      { x: 0.333, y: 0, width: 0.334, height: 0.333 },
      { x: 0.667, y: 0, width: 0.333, height: 0.333 },
      { x: 0, y: 0.333, width: 0.333, height: 0.334 },
      { x: 0.333, y: 0.333, width: 0.334, height: 0.334 },
      { x: 0.667, y: 0.333, width: 0.333, height: 0.334 },
      { x: 0, y: 0.667, width: 0.333, height: 0.333 },
      { x: 0.333, y: 0.667, width: 0.334, height: 0.333 },
      { x: 0.667, y: 0.667, width: 0.333, height: 0.333 },
    ],
  },
];

export function getLayoutById(id: string): CollageLayout | undefined {
  return COLLAGE_LAYOUTS.find((layout) => layout.id === id);
}
