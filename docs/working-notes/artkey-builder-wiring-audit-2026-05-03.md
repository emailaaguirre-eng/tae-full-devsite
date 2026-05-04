# ArtKey Builder — Wiring audit summary (2026-05-03)

Planning reference only. Prototype branch: `feature/artkey-builder-generic-prototype`.

---

## Live editor — preserve

The production ArtKey portal/editor path (not modified in this checkpoint) includes, among other things:

- Owner auth and edit flows, `ArtKeyEditor`, portal `GET`/`PUT`, `/api/artkey/save` and `/api/artkey/upload`
- Guest routes under `/art-key/[token]` (home, gallery, video, spotify, guestbook, favorites)
- Feature flags, `featureDefs` / customizations, uploads, guestbook moderation, favorites, Spotify, featured video, custom links

Any replacement UI must **not** drop behavior that already works for live portals unless Dre explicitly deprecates it.

---

## Prototype — what exists today

- **Preview route:** `/preview/artkey-builder` → `ArtKeyBuilderPrototype`
- **Tabs:** Design | Features | Save (canonical; see resume note)
- **Design:** Theme/appearance controls and design preview model (local state)
- **Features:** Feature library grid, configure modal, module toggles (local state)
- **Save:** Placeholder for checklist / save / URL–QR review (evolving)
- **No** persistence to portal APIs or DB from the prototype shell alone

---

## Design | Features | Save (clarification)

| Tab        | Role |
|-----------|------|
| Design    | Visual styling: theme, background, typography, button style, portal appearance. |
| Features  | All portal modules, buttons, apps, and their configuration (grouped inside this tab). |
| Save      | Preview, readiness checklist, save/publish-style actions, portal URL/QR review. |

There are **no** separate top-level Content, Preview, or Publish tabs. The older resume wording that listed five tabs was **wrong** and has been corrected in `artkey-builder-prototype-resume-2026-05-02.md`.

---

## Recommended `/edit-v2` phased approach (future — not implemented here)

1. **Phase 0:** Adapter mapping from live portal JSON ↔ builder view-model; Dre sign-off on module keys.
2. **Phase 1:** Read-only v2 route loads real portal data into the builder shell (when approved).
3. **Phase 2+:** Wire save, uploads, then parity modules; add new modules one at a time.
4. **Flip:** Default edit → new builder, keep legacy fallback until testing completes.

Until Dre approves implementation, **do not** add `/edit-v2`, change `app/art-key/**`, or touch APIs/DB/`ArtKeyEditor.tsx`.

---

## Planning-only features

### Add a Button

Generic custom URL CTA on the portal home. Distinct from Favorites & Links.

### Gift Button / Gift & Registry

External gift/registry/payment **link** only for MVP—store and display URLs; **no** in-ArtKey payment processing.

---

## Image Gallery icon visibility fix (this checkpoint)

**Files:** `components/artkey/builder/akBuilder.module.css` only.

**Change:** `.featureLibraryIcon` — light gradient tile + border + inset highlight + slightly larger emoji size so low-contrast glyphs (e.g. framed-picture emoji on Windows) read on white cards. `.phoneRefBtnIcon` — subtle `drop-shadow` for emoji on lavender module buttons.

**Scope:** Builder prototype CSS only; no TS/API/route/editor changes.
