# Skeleton Key & QR Code Workflow

## Overview
For cards, invitations, announcements, and postcards, customers need to:
1. Select a skeleton key template (the base card design)
2. Position their ArtKey portal content on the skeleton key
3. Choose where the QR code should be placed
4. When the order is sent to Gelato, receive a final composite image with everything in place

## Current Implementation Status

### ✅ Already Implemented
- Skeleton key template selection (5 templates available)
- QR code position selection (9 positions)
- QR code generation API (`/api/artkey/qr`)
- Customizations saved with `skeleton_key` and `qr_position`

### ❌ Missing/Needs Implementation
- ArtKey content positioning on skeleton key (drag & drop or coordinate selection)
- Skeleton key template images (actual image files for each template)
- Compose route implementation (composite QR + ArtKey content onto skeleton key)
- Integration with Gelato order flow

## Required Enhancements

### 1. ArtKey Content Positioning
**Location:** `components/ArtKeyEditor.tsx`

Add a visual editor that allows customers to:
- See a preview of the skeleton key template
- Position the ArtKey portal content (title, buttons, etc.) on the template
- Save position coordinates (x, y, width, height) in customizations

**Data Structure:**
```typescript
customizations: {
  skeleton_key: 'template-1',
  qr_position: 'bottom-right',
  artkey_content_position: {
    x: 50,      // pixels from left
    y: 100,     // pixels from top
    width: 400, // content width
    height: 600 // content height
  }
}
```

### 2. Skeleton Key Template Images
**Location:** `public/skeleton-keys/` or stored in WordPress media library

Each template needs an actual image file:
- `template-1.png` - Classic Corner layout
- `template-2.png` - Top Header layout
- `template-3.png` - Center Bottom layout
- `template-4.png` - Side Panel layout
- `template-5.png` - Back Cover layout

These should be the base card designs with space reserved for:
- ArtKey portal content
- QR code area

### 3. Compose Route Implementation
**Location:** `app/api/artkey/compose/route.ts`

**Input:**
```typescript
{
  public_token: string,        // ArtKey public token
  skeleton_key: string,         // Template ID (e.g., 'template-1')
  qr_position: string,          // QR position (e.g., 'bottom-right')
  artkey_content_position: {    // ArtKey content position
    x: number,
    y: number,
    width: number,
    height: number
  }
}
```

**Process:**
1. Load skeleton key template image
2. Generate QR code for ArtKey portal URL (`/artkey/[public_token]`)
3. Render ArtKey portal content as image (title, buttons, etc.)
4. Composite ArtKey content onto skeleton key at specified position
5. Composite QR code onto skeleton key at specified position
6. Upload final composite to WordPress media library
7. Return final image URL

**Output:**
```typescript
{
  success: true,
  composite_url: string,  // Final image URL for Gelato
  qr_code_url: string,   // QR code image URL (for reference)
  skeleton_key_url: string, // Skeleton key template URL
}
```

### 4. Integration with Gelato Order Flow
When an order is placed:
1. Check if product requires QR code (`productInfo.requiresQR`)
2. Call `/api/artkey/compose` with saved customizations
3. Use returned `composite_url` as the design file for Gelato
4. Gelato prints the card with QR code that links to the ArtKey portal

## Implementation Steps

### Step 1: Add ArtKey Content Positioning UI
- Add a visual positioning tool in the editor
- Allow drag-and-drop or manual coordinate input
- Save position to customizations

### Step 2: Create/Store Skeleton Key Templates
- Design or obtain skeleton key template images
- Store in `public/skeleton-keys/` or WordPress media
- Reference by template ID

### Step 3: Implement Compose Route
- Use `sharp` for image compositing
- Use `qrcode` for QR generation
- Composite in correct order: skeleton → ArtKey content → QR code
- Upload to WordPress media library

### Step 4: Test End-to-End Flow
- Create ArtKey with skeleton key
- Position content and QR code
- Generate composite
- Verify QR code links to correct portal
- Test with Gelato order

## Technical Notes

### Image Compositing Order
1. **Base Layer:** Skeleton key template (full card design)
2. **Content Layer:** ArtKey portal content (rendered as image)
3. **QR Layer:** QR code (generated PNG)

### QR Code Generation
- URL format: `https://yourdomain.com/artkey/[public_token]`
- Size: Configurable (typically 200-400px for cards)
- Error correction: Medium (M) for reliability

### ArtKey Content Rendering
Options for rendering ArtKey content as image:
1. **Server-side rendering:** Use Puppeteer/Playwright to render React component
2. **Canvas API:** Render to canvas and export as image
3. **SVG to PNG:** Convert React component to SVG, then to PNG

### File Storage
- Final composites should be uploaded to WordPress media library
- Store URLs in ArtKey record or order metadata
- Consider cleanup of old composites

## Questions to Resolve

1. **Skeleton Key Source:** Where do skeleton key templates come from?
   - Designed in-house?
   - Customer uploads?
   - Pre-designed templates?

2. **ArtKey Content Rendering:** How should we render the portal content as an image?
   - Server-side rendering (Puppeteer)?
   - Client-side canvas?
   - Pre-rendered templates?

3. **Content Positioning:** What level of control do customers need?
   - Simple drag-and-drop?
   - Precise coordinate input?
   - Preset positions?

4. **Template Customization:** Can customers customize skeleton keys?
   - Colors?
   - Text?
   - Layout modifications?

