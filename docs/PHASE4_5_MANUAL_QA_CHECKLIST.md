# Phase 4-5 Manual QA Checklist

Use this checklist to validate text-label behavior (Phase 4) and rotation UX/snapping (Phase 5) in `CustomizationStudio`.

## Test Setup

- [ ] Open the editor page that loads `customization-studio/CustomizationStudio.tsx`.
- [ ] Ensure at least one image/background is loaded so object movement is visible.
- [ ] Test on desktop (mouse + keyboard) and mobile/tablet (touch).
- [ ] Test in at least one Chromium browser and one Safari/WebKit browser.

## Phase 4 - Text Labels

### A) Insert + Default Styles

- [ ] Add a standard text item; verify no unexpected border/background appears.
- [ ] Add label shapes via dropdown: Rectangle, Square, Circle, Rounded.
- [ ] Confirm each new item starts selectable and transformable.

### B) Resize + Reflow

- [ ] Resize text wider/narrower and confirm text reflows instead of scaling to unreadable size.
- [ ] Resize vertically and confirm label box height updates correctly.
- [ ] For Square/Circle, verify aspect ratio remains constrained.
- [ ] For Rectangle/Rounded, verify free resize works.

### C) Inline Editing

- [ ] Double-click text to enter inline edit mode.
- [ ] Type multiline text and verify live textarea placement matches canvas object.
- [ ] Press `Ctrl+Enter` (or `Cmd+Enter`) to commit changes.
- [ ] Press `Escape` to cancel edit and keep prior value.
- [ ] Click outside to commit current inline edit and clear edit mode.

### D) Typography Controls

- [ ] Change line height and verify line spacing updates.
- [ ] Change letter spacing and verify glyph spacing updates.
- [ ] Change alignment (left/center/right) and verify rendered anchor behavior.

### E) Label Fill/Border Controls

- [ ] Toggle label fill on/off; verify fill is shown/hidden correctly.
- [ ] Change fill color and verify immediate update.
- [ ] Toggle border on/off; verify border appears/disappears.
- [ ] Change border color and width; verify update and persistence.
- [ ] For Rounded shape, change corner radius and verify smooth rounded corners.

### F) Persistence + Export

- [ ] Save design and reload; verify text, shape, fill/border, spacing, and corner radius persist.
- [ ] Export/output preview; verify visual result matches canvas state.

## Phase 5 - Rotation

### A) Rotation via Transformer

- [ ] Rotate objects freely; verify degree value updates continuously.
- [ ] Confirm snap behavior at 15-degree increments.
- [ ] Confirm stronger snap behavior near 0/90/180/270.

### B) Rotation Badge

- [ ] Verify badge always shows degree symbol (`°`).
- [ ] When snapped, verify badge shows `snap X°`.
- [ ] Verify snapped visual state (color/background) differs from unsnapped.

### C) Numeric Rotation Input

- [ ] Enter valid value (e.g. `33`) and blur; verify rotation updates.
- [ ] Enter out-of-range value (e.g. `725`) and verify normalization.
- [ ] Enter negative value (e.g. `-30`) and verify normalization.
- [ ] Press Enter to apply without blurring.

## Interaction/Accessibility Regression Checks

- [ ] Keyboard arrows still work for object nudge/movement where supported.
- [ ] Focus order remains usable through side panel controls.
- [ ] No stuck drag/transform state after switching selected objects.
- [ ] No console errors during add/edit/rotate workflows.

## Responsive Checks

- [ ] On narrow viewport, controls remain reachable and do not overlap canvas irreparably.
- [ ] Touch rotate/resize gestures still trigger snapping behavior.
- [ ] Inline edit textarea remains positioned correctly after viewport resize.

## Pass Criteria

- [ ] No data loss after save/reload.
- [ ] No visual mismatch between editor state and export/preview.
- [ ] No runtime errors in console for text/label/rotation interactions.
- [ ] Snapping and numeric normalization are consistent and predictable.
