/**
 * Label Presets
 * SPRINT 3: Predefined label shapes and styles
 */

export interface LabelPreset {
  id: string;
  name: string;
  type: 'pill' | 'ribbon' | 'badge-circle' | 'tag' | 'arch' | 'rounded-rect';
  defaultWidth: number;
  defaultHeight: number;
  defaultPadding: number;
  defaultFill?: string;
  defaultStroke?: string;
  defaultStrokeWidth?: number;
  cornerRadius?: number; // For rounded shapes
}

export const LABEL_PRESETS: LabelPreset[] = [
  {
    id: 'pill',
    name: 'Pill',
    type: 'pill',
    defaultWidth: 200,
    defaultHeight: 60,
    defaultPadding: 12,
    defaultFill: '#ffffff',
    defaultStroke: '#e5e7eb',
    defaultStrokeWidth: 2,
    cornerRadius: 30, // Fully rounded (pill shape)
  },
  {
    id: 'ribbon',
    name: 'Ribbon',
    type: 'ribbon',
    defaultWidth: 250,
    defaultHeight: 50,
    defaultPadding: 10,
    defaultFill: '#fef3c7',
    defaultStroke: '#f59e0b',
    defaultStrokeWidth: 2,
    cornerRadius: 8,
  },
  {
    id: 'badge-circle',
    name: 'Badge (Circle)',
    type: 'badge-circle',
    defaultWidth: 120,
    defaultHeight: 120,
    defaultPadding: 15,
    defaultFill: '#dbeafe',
    defaultStroke: '#3b82f6',
    defaultStrokeWidth: 3,
    cornerRadius: 60, // Circle (half of width/height)
  },
  {
    id: 'tag',
    name: 'Tag',
    type: 'tag',
    defaultWidth: 180,
    defaultHeight: 80,
    defaultPadding: 12,
    defaultFill: '#ffffff',
    defaultStroke: '#6b7280',
    defaultStrokeWidth: 2,
    cornerRadius: 12,
  },
  {
    id: 'arch',
    name: 'Arch',
    type: 'arch',
    defaultWidth: 300,
    defaultHeight: 100,
    defaultPadding: 15,
    defaultFill: '#fce7f3',
    defaultStroke: '#ec4899',
    defaultStrokeWidth: 2,
    cornerRadius: 50, // Larger radius for arch effect
  },
  {
    id: 'rounded-rect',
    name: 'Rounded Rectangle',
    type: 'rounded-rect',
    defaultWidth: 220,
    defaultHeight: 70,
    defaultPadding: 12,
    defaultFill: '#ffffff',
    defaultStroke: '#d1d5db',
    defaultStrokeWidth: 2,
    cornerRadius: 16,
  },
];

/**
 * Get preset by ID
 */
export function getLabelPreset(id: string): LabelPreset | undefined {
  return LABEL_PRESETS.find(p => p.id === id);
}

