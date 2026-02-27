# Asset Protection Strategy (Baseline)

This document describes the current baseline protection for guest-visible portal and proof assets, and the planned next steps.

## Scope

- Protect online preview/proof experiences.
- Preserve full-quality originals for production/fulfillment workflows.
- Do **not** watermark print-ready production outputs unless explicitly enabled in a future phase.

## Current Baseline (Implemented)

1. **Preview-only image delivery for ArtKey portal gallery/background**
   - Route: `/api/portal/[token]/preview`
   - Portal UI uses preview URLs for gallery items and portal background image.
   - Returned images are web-optimized (`webp`, resized, compressed).
   - Signed URL parameters are issued by `/api/portal/[token]` and validated by preview route.

2. **Hotlink resistance (baseline)**
   - Preview route validates `Origin` / `Referer` against allowed hosts.
   - Disallowed cross-site requests are rejected.

3. **Signed URL + nonce replay control**
   - Signed params include token, source URL, width, expiry, and nonce.
   - Signature uses HMAC (server secret) and expires quickly.
   - Nonce reuse is bounded per signed URL to limit replay abuse.

4. **Proof watermarking before payment**
   - Route: `/api/proof/generate`
   - Returned proof images are stamped with a visible `PROOF` watermark.

5. **Soft-friction controls in guest gallery**
   - Context menu suppression on portal gallery images.
   - Drag-to-save friction (`draggable={false}`) on gallery images.

## Token Non-Reuse Policy

Public portal token behavior:

- Public token is generated once per portal.
- Owner token is separate and never exposed in guest routes.
- Owner-token actions are validated server-side only.

Current hardening:

- Signed preview URLs are short-lived and include nonce + signature.
- Nonce replay is bounded to reduce token/link reuse abuse.

Remaining hardening:

- Move nonce state to a fully shared cross-instance store (Redis) for multi-instance deployments.
- Add scheduled purge job for expired nonce records.

## Known Limitations (Current Phase)

- Nonce tracking now supports DB-backed persistence (`PORTAL_PREVIEW_NONCE_STORE=db`, default) and optional file-backed persistence (`PORTAL_PREVIEW_NONCE_STORE=file`), but cross-instance distribution still requires a shared external store (e.g. Redis).
- Rate-limiting is in-process (per runtime instance), not yet centralized.
- Watermark policy is fixed for proofs (`PROOF`), not yet per-brand/per-artist toggle.

## Next TODOs

1. Move nonce replay control to Redis for cross-instance enforcement.
2. Centralize rate limits (Redis/edge) for multi-instance enforcement.
3. Add configurable watermark policies:
   - Proof watermark required pre-payment.
   - Optional branded/creator watermark for guest previews.
4. Add periodic purge jobs for expired signed-token records.
