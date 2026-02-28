export type ArtKeyTemplateDefinition = {
  id: string;
  name: string;
  assetUrl: string;
  displayAspectRatio?: number;
  minCanvasFraction?: number;
  maxCanvasFraction?: number;
  contentCrop?: {
    xFraction: number;
    yFraction: number;
    widthFraction: number;
    heightFraction: number;
  };
  qr: {
    sizeFraction: number;
    xFraction: number;
    yFraction: number;
  };
};

export const ARTKEY_TEMPLATES: ArtKeyTemplateDefinition[] = [
  {
    id: "artkey-elegant",
    name: "Elegant ArtKey",
    assetUrl: "/images/taeaktemp.svg",
    displayAspectRatio: 2.25,
    // Allow full canvas-width usage when needed so the Elegant QR can always
    // reach the same target physical size as KeyCard on narrow/portrait surfaces.
    maxCanvasFraction: 1,
    // The uploaded SVG contains a large canvas with the key artwork centered
    // in a smaller region. Crop to the actual key area for studio display.
    contentCrop: {
      xFraction: 0.26,
      yFraction: 0.14,
      widthFraction: 0.48,
      heightFraction: 0.36,
    },
    qr: {
      // Derived from the SVG QR window geometry after crop mapping:
      // source window x=792.78, y=177.61, w=81.30 on viewBox 1440x810.
      // mapped into crop (x=.26,y=.14,w=.48,h=.36).
      sizeFraction: 0.118,
      xFraction: 0.605,
      yFraction: 0.22,
    },
  },
  {
    id: "keycard",
    name: "KeyCard",
    assetUrl: "/images/tae-keycard.svg",
    displayAspectRatio: 1,
    // Keep QR geometry true to the KeyCard artwork, then constrain template
    // size so the container hugs the QR area more closely.
    minCanvasFraction: 0.19,
    maxCanvasFraction: 0.26,
    qr: {
      // QR fit area inside template white window:
      // x=49, y=69, w=102 on a 200x200 viewBox.
      sizeFraction: 0.51,
      xFraction: 0.245,
      yFraction: 0.345,
    },
  },
];

export const DEFAULT_ARTKEY_TEMPLATE =
  ARTKEY_TEMPLATES.find((template) => template.id === "artkey-elegant") ||
  ARTKEY_TEMPLATES[0];

export function getArtKeyTemplateById(
  templateId?: string
): ArtKeyTemplateDefinition {
  if (!templateId) return DEFAULT_ARTKEY_TEMPLATE;
  return (
    ARTKEY_TEMPLATES.find((template) => template.id === templateId) ||
    DEFAULT_ARTKEY_TEMPLATE
  );
}
