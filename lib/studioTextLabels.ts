export type StudioTextLabelPreset = {
  id: string;
  name: string;
  text: string;
  category: string;
  style: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    letterSpacing?: number;
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
    fill: string;
    align: "left" | "center" | "right";
  };
};

export const STUDIO_TEXT_LABELS: StudioTextLabelPreset[] = [
  {
    id: "rectangle-label",
    name: "Rectangle",
    text: "Happy Birthday",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "pill-label",
    name: "Pill",
    text: "With Love",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "oval-label",
    name: "Oval",
    text: "Thank You",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "shield-label",
    name: "Shield",
    text: "Congratulations",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "hexagon-label",
    name: "Hexagon",
    text: "Season's Greetings",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "octagon-label",
    name: "Octagon",
    text: "Best Wishes",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "rhombus-label",
    name: "Rhombus",
    text: "Just for You",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "square-label",
    name: "Square",
    text: "From the Heart",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "diamond-label",
    name: "Diamond",
    text: "Thinking of You",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "starburst-label",
    name: "Starburst",
    text: "Celebrate!",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "banner-label",
    name: "Banner",
    text: "In Celebration",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "ribbon-label",
    name: "Ribbon",
    text: "With Gratitude",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "tag-label",
    name: "Tag",
    text: "For You",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "bookmark-label",
    name: "Bookmark",
    text: "With Care",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "pennant-label",
    name: "Pennant",
    text: "Cheers!",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "scallop-label",
    name: "Scallop",
    text: "Joy & Love",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
  {
    id: "cloud-label",
    name: "Cloud",
    text: "Sending Smiles",
    category: "greeting-label",
    style: {
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: 600,
      fill: "#141414",
      align: "center",
      textTransform: "none",
    },
  },
];
