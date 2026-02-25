export type ArtKeyTemplateDefinition = {
  id: string;
  name: string;
  assetUrl: string;
  displayAspectRatio?: number;
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
    name: "ArtKey",
    assetUrl: "/images/taeaktemp.svg",
    displayAspectRatio: 2.25,
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
