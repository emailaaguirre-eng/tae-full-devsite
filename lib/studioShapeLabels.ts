export type StudioShapeLabel = {
  id: string;
  name: string;
  text: string;
  fill: string;
  border: {
    enabled: boolean;
    color: string;
    width: number;
  };
  shape: {
    type: "path" | "rect" | "ellipse";
    pathData?: string;
    viewBox: string;
    canvasWidth: number;
    canvasHeight: number;
    textCenterX: number;
    textCenterY: number;
    cornerRadius?: number;
    radiusX?: number;
    radiusY?: number;
  };
};

export const STUDIO_SHAPE_LABELS: StudioShapeLabel[] = [
  {
    id: "rectangle-label",
    name: "Rectangle",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "rect",
      viewBox: "0 0 260 110",
      canvasWidth: 260,
      canvasHeight: 110,
      textCenterX: 130,
      textCenterY: 55,
      cornerRadius: 6,
    },
  },
  {
    id: "pill-label",
    name: "Pill",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M55,3 H205 A52,52 0 0 1 205,107 H55 A52,52 0 0 1 55,3 Z",
      viewBox: "0 0 260 110",
      canvasWidth: 260,
      canvasHeight: 110,
      textCenterX: 130,
      textCenterY: 55,
    },
  },
  {
    id: "oval-label",
    name: "Oval",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "ellipse",
      viewBox: "0 0 260 120",
      canvasWidth: 260,
      canvasHeight: 120,
      textCenterX: 130,
      textCenterY: 60,
      radiusX: 126,
      radiusY: 56,
    },
  },
  {
    id: "shield-label",
    name: "Shield",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M100,8 L192,44 L192,118 C192,172 140,206 100,216 C60,206 8,172 8,118 L8,44 Z",
      viewBox: "0 0 200 220",
      canvasWidth: 200,
      canvasHeight: 220,
      textCenterX: 100,
      textCenterY: 112,
    },
  },
  {
    id: "hexagon-label",
    name: "Hexagon",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M100,4 L193,52 L193,128 L100,176 L7,128 L7,52 Z",
      viewBox: "0 0 200 180",
      canvasWidth: 200,
      canvasHeight: 180,
      textCenterX: 100,
      textCenterY: 90,
    },
  },
  {
    id: "octagon-label",
    name: "Octagon",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M62,4 H138 L196,62 V138 L138,196 H62 L4,138 V62 Z",
      viewBox: "0 0 200 200",
      canvasWidth: 200,
      canvasHeight: 200,
      textCenterX: 100,
      textCenterY: 100,
    },
  },
  {
    id: "rhombus-label",
    name: "Rhombus",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M130,4 L256,75 L130,146 L4,75 Z",
      viewBox: "0 0 260 150",
      canvasWidth: 260,
      canvasHeight: 150,
      textCenterX: 130,
      textCenterY: 75,
    },
  },
  {
    id: "square-label",
    name: "Square",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "rect",
      viewBox: "0 0 180 180",
      canvasWidth: 180,
      canvasHeight: 180,
      textCenterX: 90,
      textCenterY: 90,
      cornerRadius: 4,
    },
  },
  {
    id: "diamond-label",
    name: "Diamond",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M100,4 L196,100 L100,196 L4,100 Z",
      viewBox: "0 0 200 200",
      canvasWidth: 200,
      canvasHeight: 200,
      textCenterX: 100,
      textCenterY: 100,
    },
  },
  {
    id: "starburst-label",
    name: "Starburst",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M100,8 L119,52 L164,34 L146,79 L192,100 L146,121 L164,166 L119,148 L100,192 L81,148 L36,166 L54,121 L8,100 L54,79 L36,34 L81,52 Z",
      viewBox: "0 0 200 200",
      canvasWidth: 200,
      canvasHeight: 200,
      textCenterX: 100,
      textCenterY: 100,
    },
  },
  {
    id: "banner-label",
    name: "Banner",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M4,4 H276 L248,50 L276,96 H4 L32,50 Z",
      viewBox: "0 0 280 100",
      canvasWidth: 280,
      canvasHeight: 100,
      textCenterX: 140,
      textCenterY: 50,
    },
  },
  {
    id: "ribbon-label",
    name: "Ribbon",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M20,4 H240 L256,50 L240,96 H20 L4,50 Z",
      viewBox: "0 0 260 100",
      canvasWidth: 260,
      canvasHeight: 100,
      textCenterX: 130,
      textCenterY: 50,
    },
  },
  {
    id: "tag-label",
    name: "Tag",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M100,4 L194,40 L194,136 L6,136 L6,40 Z",
      viewBox: "0 0 200 140",
      canvasWidth: 200,
      canvasHeight: 140,
      textCenterX: 100,
      textCenterY: 92,
    },
  },
  {
    id: "bookmark-label",
    name: "Bookmark",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M4,4 H146 V206 L75,170 L4,206 Z",
      viewBox: "0 0 150 210",
      canvasWidth: 150,
      canvasHeight: 210,
      textCenterX: 75,
      textCenterY: 100,
    },
  },
  {
    id: "pennant-label",
    name: "Pennant",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M4,4 H186 L226,60 L186,116 H4 Z",
      viewBox: "0 0 230 120",
      canvasWidth: 230,
      canvasHeight: 120,
      textCenterX: 115,
      textCenterY: 60,
    },
  },
  {
    id: "scallop-label",
    name: "Scallop",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M125,6 C125,6 143,2 160,6 C177,10 200,2 218,10 C236,18 246,18 246,42 C246,60 252,80 244,96 C236,112 222,110 202,112 C182,114 162,110 142,112 C122,114 103,114 84,112 C65,110 46,114 28,112 C10,110 2,98 4,82 C6,66 2,50 4,36 C6,22 4,18 22,10 C40,2 62,10 80,6 C98,2 125,6 125,6 Z",
      viewBox: "0 0 250 120",
      canvasWidth: 250,
      canvasHeight: 120,
      textCenterX: 125,
      textCenterY: 62,
    },
  },
  {
    id: "cloud-label",
    name: "Cloud",
    text: "",
    fill: "#ffffff",
    border: { enabled: true, color: "#111111", width: 4.5 },
    shape: {
      type: "path",
      pathData: "M80,130 Q40,130 30,100 Q10,98 8,76 Q6,54 28,48 Q30,22 58,18 Q74,4 98,14 Q112,2 134,8 Q158,2 174,18 Q200,12 214,34 Q240,34 248,56 Q268,60 268,84 Q268,108 244,114 Q242,132 214,134 Z",
      viewBox: "0 0 280 160",
      canvasWidth: 280,
      canvasHeight: 160,
      textCenterX: 140,
      textCenterY: 96,
    },
  },
];
