# Project Editor Templates

## Overview

The Project Editor supports **Template Mode** for creating collages quickly using predefined frame layouts. Templates allow users to:

- Choose from a library of pre-designed frame layouts
- Fill frames with images by clicking thumbnails
- Adjust images within frames (pan, zoom, rotate)
- Export collages exactly as seen

## Template Format

Templates are defined in `lib/collageTemplates.ts` using the following structure:

```typescript
interface CollageFrame {
  id: string;
  shape: 'rect' | 'circle' | 'polaroid';
  xPct: number;      // X position relative to safe zone (0-1)
  yPct: number;      // Y position relative to safe zone (0-1)
  wPct: number;      // Width relative to safe zone (0-1)
  hPct: number;      // Height relative to safe zone (0-1)
  rotation?: number;  // Rotation in degrees
  paddingPct?: number; // Padding inside frame (0-1, relative to frame size)
  stroke?: string;    // Frame border color
  strokeWidth?: number; // Frame border width
  cornerRadiusPct?: number; // For rounded rectangles (0-1)
}

interface CollageTemplate {
  id: string;
  name: string;
  description?: string;
  frames: CollageFrame[];
}
```

## Frame Shapes

### Rect
Standard rectangular frame. Supports:
- `cornerRadiusPct` for rounded corners
- `paddingPct` for internal padding

### Circle
Circular frame. The frame size is determined by the smaller of `wPct` and `hPct`.

### Polaroid
Rectangular frame with:
- White background (`fill: '#ffffff'`)
- Bottom margin area (15% of height) for "polaroid" effect
- Typically rotated slightly for visual interest

## Coordinate System

All frame positions and sizes are relative to the **safe zone** of the print area:

- Safe zone = `canvasPx - (safePx * 2)` on each dimension
- Frame position: `safePx + (safeWidth * xPct)`
- Frame size: `safeWidth * wPct`

This ensures frames stay within the safe printing area.

## Adding New Templates

1. Open `lib/collageTemplates.ts`
2. Add a new entry to `COLLAGE_TEMPLATES`:

```typescript
export const COLLAGE_TEMPLATES: Record<string, CollageTemplate> = {
  // ... existing templates ...
  
  my_new_template: {
    id: 'my_new_template',
    name: 'My Template',
    description: 'Description of the template',
    frames: [
      {
        id: 'frame_1',
        shape: 'rect',
        xPct: 0,
        yPct: 0,
        wPct: 0.5,
        hPct: 1,
        paddingPct: 0.02,
        stroke: '#e5e7eb',
        strokeWidth: 2,
      },
      // ... more frames ...
    ],
  },
};
```

3. The template will automatically appear in the Templates panel

## Frame Fill State

Each frame maintains its own fill state:

```typescript
interface FrameFillState {
  frameId: string;
  assetSrc?: string;  // Image source URL
  offsetX: number;    // Pan offset X
  offsetY: number;    // Pan offset Y
  zoom: number;       // Zoom level (0.8-3.0)
  rotation: number;   // Rotation in degrees
}
```

## Image Fitting

When an image is added to a frame:
1. Default zoom is calculated to **cover** the frame (maintain aspect ratio)
2. Image is centered initially (`offsetX: 0, offsetY: 0`)
3. User can pan by dragging the image within the frame
4. User can zoom using the slider (0.8x to 3.0x)
5. User can rotate using the "Rotate 90°" button

## Clipping

Images are clipped to frame boundaries using Konva's `clipFunc`:
- Rect frames: rectangular clipping
- Circle frames: circular clipping
- Polaroid frames: rectangular clipping (excluding bottom margin)

## Per-Side Templates

Templates are stored per-side in `SideState`:

```typescript
interface SideState {
  objects: EditorObject[];  // Freeform objects
  selectedId?: string;
  template?: TemplateState; // Template state (per side)
}
```

Each side can have:
- A different template
- No template (freeform mode)
- Template mode ON or OFF independently

## Template Mode Toggle

- **OFF**: Freeform mode - images added as independent objects
- **ON**: Template mode - images fill frames when clicked

When template mode is OFF, templates are hidden but not deleted (state preserved).

## Export

Templates export exactly as seen:
- Frames render with their borders
- Filled images are clipped to frame boundaries
- Pan/zoom/rotation are preserved
- Include-guides toggle works as normal

## Best Practices

1. **Frame Spacing**: Use `paddingPct` to add breathing room inside frames
2. **Safe Zone**: Always keep frames within safe zone (use percentages 0-1)
3. **Aspect Ratios**: Consider print spec aspect ratios when designing templates
4. **Frame Count**: Keep templates to 1-6 frames for usability
5. **Visual Hierarchy**: Use frame sizes to create visual hierarchy

## Example: Creating a 2x2 Grid

```typescript
grid_2x2: {
  id: 'grid_2x2',
  name: 'Grid 2x2',
  frames: [
    { id: 'frame_1', shape: 'rect', xPct: 0, yPct: 0, wPct: 0.5, hPct: 0.5, paddingPct: 0.02 },
    { id: 'frame_2', shape: 'rect', xPct: 0.5, yPct: 0, wPct: 0.5, hPct: 0.5, paddingPct: 0.02 },
    { id: 'frame_3', shape: 'rect', xPct: 0, yPct: 0.5, wPct: 0.5, hPct: 0.5, paddingPct: 0.02 },
    { id: 'frame_4', shape: 'rect', xPct: 0.5, yPct: 0.5, wPct: 0.5, hPct: 0.5, paddingPct: 0.02 },
  ],
}
```

