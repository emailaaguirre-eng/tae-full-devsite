/**
 * Label Shape Templates
 * Pre-designed shapes that can contain text for cards
 */

export interface LabelShape {
  id: string;
  name: string;
  description: string;
  type: 'rounded-rectangle' | 'circle' | 'oval' | 'rectangle' | 'speech-bubble' | 'ribbon';
  width: number; // Default width in pixels
  height: number; // Default height in pixels
  cornerRadius?: number; // For rounded rectangles
  previewColor: string;
}

export const LABEL_SHAPES: LabelShape[] = [
  {
    id: 'rounded-rect',
    name: 'Rounded Rectangle',
    description: 'Classic rounded corners',
    type: 'rounded-rectangle',
    width: 300,
    height: 150,
    cornerRadius: 20,
    previewColor: '#3b82f6',
  },
  {
    id: 'circle',
    name: 'Circle',
    description: 'Perfect circle shape',
    type: 'circle',
    width: 200,
    height: 200,
    previewColor: '#10b981',
  },
  {
    id: 'oval',
    name: 'Oval',
    description: 'Elliptical shape',
    type: 'oval',
    width: 300,
    height: 150,
    previewColor: '#8b5cf6',
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    description: 'Sharp corners',
    type: 'rectangle',
    width: 300,
    height: 150,
    previewColor: '#f59e0b',
  },
  {
    id: 'speech-bubble',
    name: 'Speech Bubble',
    description: 'Conversation style',
    type: 'speech-bubble',
    width: 280,
    height: 140,
    cornerRadius: 15,
    previewColor: '#ec4899',
  },
  {
    id: 'ribbon',
    name: 'Ribbon',
    description: 'Decorative ribbon banner',
    type: 'ribbon',
    width: 320,
    height: 120,
    previewColor: '#ef4444',
  },
];

export function getLabelShape(id: string): LabelShape | undefined {
  return LABEL_SHAPES.find(shape => shape.id === id);
}

