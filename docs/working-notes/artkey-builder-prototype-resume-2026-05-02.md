# ArtKey Builder Prototype Resume Notes

Branch:
feature/artkey-builder-generic-prototype

Preview route:
http://127.0.0.1:3026/preview/artkey-builder

Purpose:
Generic ArtKey Portal Builder prototype only. Local/preview work. Not live portal wiring.

Current prototype state:
- Tabs: Design, Content, Features, Preview, Publish
- Feature modules:
  - Welcome Message
  - Sponsors & Partners
  - Events & Appearances
  - Supporter Updates
  - Stay Connected
  - Favorites & Links
- No Kimber-specific copy intended
- No Behind the Scenes as a core builder feature
- No live database/API wiring

Tomorrow’s testing goals:
1. Test what happens when a feature is added/enabled.
2. Test what happens when Configure is pressed.
3. Verify the configure drawer/modal content.
4. Verify the preview phone updates correctly.
5. Review what the portal preview pages should look like.
6. Decide what is mockup-only vs Phase 2 wiring.

Guardrails:
- Do not touch live ArtKey routes.
- Do not touch homepage Kimber.
- Do not touch APIs, DB, ArtKeyEditor, or server deployment files.
- Do not deploy or restart PM2.
