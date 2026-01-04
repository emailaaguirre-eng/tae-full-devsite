/**
 * Ornament Library
 * SPRINT 3: Local SVG ornaments (corners, dividers, frames)
 */

export interface Ornament {
  id: string;
  name: string;
  category: 'corner' | 'divider' | 'frame';
  svg: string; // SVG path data
  defaultWidth: number;
  defaultHeight: number;
  viewBox: string;
}

export const ORNAMENTS: Ornament[] = [
  // Corners
  {
    id: 'corner-floral-1',
    name: 'Floral Corner 1',
    category: 'corner',
    svg: 'M0,0 L0,40 Q0,50 10,50 L40,50 L50,50 L50,40 L40,40 L40,10 L10,10 L10,0 Z',
    defaultWidth: 50,
    defaultHeight: 50,
    viewBox: '0 0 50 50',
  },
  {
    id: 'corner-floral-2',
    name: 'Floral Corner 2',
    category: 'corner',
    svg: 'M0,0 L0,35 Q0,45 10,45 L35,45 Q45,45 45,35 L45,0 Z M10,10 L10,30 Q10,35 15,35 L30,35 Q35,35 35,30 L35,10 Z',
    defaultWidth: 45,
    defaultHeight: 45,
    viewBox: '0 0 45 45',
  },
  {
    id: 'corner-classic',
    name: 'Classic Corner',
    category: 'corner',
    svg: 'M0,0 L0,30 L30,0 Z M5,5 L5,25 L25,5 Z',
    defaultWidth: 30,
    defaultHeight: 30,
    viewBox: '0 0 30 30',
  },
  {
    id: 'corner-elegant',
    name: 'Elegant Corner',
    category: 'corner',
    svg: 'M0,0 L0,20 Q0,25 5,25 L20,25 Q25,25 25,20 L25,0 Z',
    defaultWidth: 25,
    defaultHeight: 25,
    viewBox: '0 0 25 25',
  },
  
  // Dividers
  {
    id: 'divider-floral',
    name: 'Floral Divider',
    category: 'divider',
    svg: 'M0,50 Q50,0 100,50 Q150,100 200,50',
    defaultWidth: 200,
    defaultHeight: 100,
    viewBox: '0 0 200 100',
  },
  {
    id: 'divider-swirl',
    name: 'Swirl Divider',
    category: 'divider',
    svg: 'M0,50 Q100,0 200,50 M0,50 Q100,100 200,50',
    defaultWidth: 200,
    defaultHeight: 100,
    viewBox: '0 0 200 100',
  },
  {
    id: 'divider-dotted',
    name: 'Dotted Divider',
    category: 'divider',
    svg: 'M0,50 L200,50 M50,40 L50,60 M100,40 L100,60 M150,40 L150,60',
    defaultWidth: 200,
    defaultHeight: 100,
    viewBox: '0 0 200 100',
  },
  {
    id: 'divider-elegant',
    name: 'Elegant Divider',
    category: 'divider',
    svg: 'M0,50 L80,50 M120,50 L200,50 M100,30 Q100,50 100,70',
    defaultWidth: 200,
    defaultHeight: 100,
    viewBox: '0 0 200 100',
  },
  
  // Frames
  {
    id: 'frame-ornate-1',
    name: 'Ornate Frame 1',
    category: 'frame',
    svg: 'M0,0 L0,400 L400,400 L400,0 Z M20,20 L20,380 L380,380 L380,20 Z M40,40 Q40,60 60,60 L340,60 Q360,60 360,40 L360,360 Q360,340 340,340 L60,340 Q40,340 40,360 Z',
    defaultWidth: 400,
    defaultHeight: 400,
    viewBox: '0 0 400 400',
  },
  {
    id: 'frame-ornate-2',
    name: 'Ornate Frame 2',
    category: 'frame',
    svg: 'M0,0 L0,400 L400,400 L400,0 Z M30,30 L30,370 L370,370 L370,30 Z M50,50 L50,100 L100,50 Z M300,50 L350,50 L350,100 Z M50,350 L50,300 L100,350 Z M300,350 L350,350 L350,300 Z',
    defaultWidth: 400,
    defaultHeight: 400,
    viewBox: '0 0 400 400',
  },
  {
    id: 'frame-classic',
    name: 'Classic Frame',
    category: 'frame',
    svg: 'M0,0 L0,400 L400,400 L400,0 Z M25,25 L25,375 L375,375 L375,25 Z',
    defaultWidth: 400,
    defaultHeight: 400,
    viewBox: '0 0 400 400',
  },
  {
    id: 'frame-wedding-1',
    name: 'Wedding Frame 1',
    category: 'frame',
    svg: 'M0,0 L0,400 L400,400 L400,0 Z M15,15 Q15,25 25,25 L375,25 Q385,25 385,15 L385,385 Q385,375 375,375 L25,375 Q15,375 15,385 Z',
    defaultWidth: 400,
    defaultHeight: 400,
    viewBox: '0 0 400 400',
  },
];

/**
 * Get ornaments by category
 */
export function getOrnamentsByCategory(category: Ornament['category']): Ornament[] {
  return ORNAMENTS.filter(o => o.category === category);
}

/**
 * Get ornament by ID
 */
export function getOrnamentById(id: string): Ornament | undefined {
  return ORNAMENTS.find(o => o.id === id);
}

