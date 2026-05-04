# ArtKey Builder Prototype Resume Notes

Branch:
feature/artkey-builder-generic-prototype

Preview route:
http://127.0.0.1:3026/preview/artkey-builder

Purpose:
Generic ArtKey Portal Builder prototype only. Local/preview work. Not live portal wiring.

---

## Current canonical tabs (source of truth)

The running prototype uses **three** top-level tabs only. **Do not** change this to Design / Content / Features / Preview / Publish.

- **Design**
- **Features**
- **Save**

### Design tab

Visual styling, theme, background, typography, button style, portal appearance.

### Features tab

All portal modules, buttons, apps, and configuration.

### Save tab

Preview, readiness checklist, save/publish-style actions, portal URL/QR review.

**Note:** Preview and publish-style actions live **inside Save**, not as separate top-level tabs. There is **no** standalone Content tab for now.

---

## Product direction

**Do not trim modules** if doing so removes existing working live portal functionality. Preserve parity with live portals while adding new modules.

### Preferred grouping inside Features

**Core:**

- Welcome Message
- Stay Connected

**Media:**

- Image Gallery
- Video Gallery
- Playlist

**Interactive:**

- Guestbook
- Supporter Updates

**Links & Actions:**

- Add a Button
- Gift Button / Gift & Registry
- Favorites & Links

**Partners & Events:**

- Sponsors & Partners
- Events & Appearances

**Future:**

- Continuing Story

---

## Planning-only new concepts

These are product/planning concepts for future wiring—not necessarily implemented in code yet.

### Add a Button

Generic custom URL CTA button on the portal home screen. **Different from** Favorites & Links.

### Gift Button / Gift & Registry

Specialized external gift/registry/payment-link button. **MVP should only store/display external links.** Do not process payments inside ArtKey.

---

## Current prototype state (accurate)

- Tabs: **Design | Features | Save** (see `components/artkey/builder/BuilderTabs.tsx`)
- Feature library modules are defined in `components/artkey/builder/featureModules.ts` (full set; do not shrink to a “six module” subset if that drops live parity)
- No Kimber-specific copy intended
- No Behind the Scenes as a core builder feature
- No live database/API wiring in this prototype

---

## Tomorrow’s testing goals

1. Test what happens when a feature is added/enabled.
2. Test what happens when Configure is pressed.
3. Verify the configure drawer/modal content.
4. Verify the preview phone updates correctly (including Design tab and Features-enabled module list).
5. Review what the portal preview pages should look like.
6. Decide what is mockup-only vs Phase 2 wiring.

---

## Guardrails

- Do not touch live ArtKey routes (`app/art-key/**` unless explicitly approved for a future `/edit-v2` phase).
- Do not touch homepage Kimber.
- Do not touch APIs, DB, ArtKeyEditor, or server deployment files.
- Do not deploy or restart PM2.
- Do not implement `/edit-v2` until Dre approves that phase.

---

## Image Gallery icon visibility (checkpoint)

In `akBuilder.module.css`, feature library icon tiles use a **light** background so emoji (especially framed-picture on Windows) stay legible; phone module row icons use a subtle **drop-shadow** for contrast on lavender buttons. Details: `docs/working-notes/artkey-builder-wiring-audit-2026-05-03.md`.
