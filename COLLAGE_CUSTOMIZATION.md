# Collage Customization Feature

## Overview
Allow customers to fully customize their collage layouts in the design editor, including:
- Resizing individual slots
- Moving slots around
- Adding/removing slots
- Creating custom layouts from scratch
- Visual guides for slot placement

## Implementation Plan

### 1. Collage Slot System

**Slot Interface:**
```typescript
interface CollageSlot {
  id: string;
  x: number;        // Percentage (0-100)
  y: number;        // Percentage (0-100)
  width: number;    // Percentage (0-100)
  height: number;   // Percentage (0-100)
  imageId?: string; // ID of image placed in this slot
  locked?: boolean; // Prevent accidental changes
}
```

### 2. Template Application

When a template is selected:
- Create visual slot guides on canvas
- Slots are draggable and resizable
- Show slot numbers/indicators
- Allow images to be dropped into slots

### 3. Customization Features

**Slot Controls:**
- **Resize**: Drag corners/edges of slot
- **Move**: Drag slot to new position
- **Delete**: Remove slot (if not locked)
- **Add Slot**: Create new custom slot
- **Lock/Unlock**: Prevent accidental changes
- **Snap to Grid**: Optional alignment helper

**Layout Controls:**
- **Clear All**: Remove all slots
- **Reset to Template**: Restore original template
- **Save Custom Layout**: Save as new template
- **Grid Overlay**: Show alignment grid

### 4. Image-to-Slot Assignment

- Drag images from library into slots
- Auto-fit image to slot dimensions
- Maintain aspect ratio or crop to fit
- Replace image in slot
- Remove image from slot

### 5. Visual Feedback

- Highlight active slot
- Show slot boundaries
- Display slot dimensions
- Preview image in slot
- Show overlap warnings

## User Flow

1. **Select Template**: Choose from preset layouts
2. **Apply Template**: Slots appear on canvas
3. **Customize Slots**:
   - Resize by dragging corners
   - Move by dragging center
   - Add new slots
   - Delete unwanted slots
4. **Add Images**: Drag images into slots
5. **Fine-tune**: Adjust slot positions/sizes
6. **Lock Layout**: Prevent further changes (optional)

## Technical Implementation

### Slot Rendering
- Use Fabric.js Rect objects for slots
- Make them selectable and resizable
- Store slot data in component state
- Sync with canvas objects

### Slot Management
- Track slots in state array
- Update on drag/resize
- Validate slot positions (no overlaps, within bounds)
- Convert between percentage and pixel coordinates

### Image Placement
- When image added to slot, fit to slot dimensions
- Store image-slot relationship
- Update image when slot changes
- Handle image replacement

