# ArtKey Backend Implementation Notes

This document provides an overview of the ArtKey Portal system architecture, data shapes, API contracts, and implementation status for backend developers.

## Overview

The ArtKey Portal is a full-stack Next.js application that allows users to create personalized mobile-app-style portals. The system includes:

- **Public Portal**: Guest-facing view of an ArtKey (accessible via `/artkey/[public_token]`)
- **Owner Management**: Private management interface for ArtKey owners (accessible via `/manage/artkey/[owner_token]`)
- **Editor**: Full-featured editor for creating and customizing ArtKeys

## Data Models

### ArtKey

The core entity representing a personalized portal.

**Database Schema (Prisma):**
- `id`: String (CUID)
- `publicToken`: String (unique, 8 chars) - URL-friendly token for public access
- `ownerToken`: String (unique, 32 chars) - Secret token for owner management
- `ownerEmail`: String? - Optional email for the owner
- `title`: String
- `theme`: String (JSON) - Theme configuration
- `features`: String (JSON) - Feature flags
- `links`: String (JSON) - Array of custom links
- `spotify`: String (JSON) - Spotify integration settings
- `featuredVideo`: String? (JSON) - Featured video configuration
- `customizations`: String (JSON) - Additional customization options
- `uploadedImages`: String (JSON) - Array of image URLs (legacy)
- `uploadedVideos`: String (JSON) - Array of video URLs (legacy)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**TypeScript Interface:** `ArtKeyPublicData` / `ArtKeyOwnerData` (see `types/artkey.ts`)

### GuestbookEntry

Represents a guestbook entry or comment/reply.

**Database Schema (Prisma):**
- `id`: String (CUID)
- `artkeyId`: String (FK to ArtKey)
- `parentId`: String? (FK to GuestbookEntry for replies)
- `name`: String
- `email`: String? - Optional email (required if `features.require_email_for_guestbook === true`)
- `message`: String
- `role`: String (default: "guest") - "guest" | "host" - distinguishes guest entries from host replies
- `approved`: Boolean (default: false)
- `createdAt`: DateTime

**TypeScript Interface:** `GuestbookEntry` (see `types/artkey.ts`)

### MediaItem

Represents an uploaded image, video, or audio file.

**Database Schema (Prisma):**
- `id`: String (CUID)
- `artkeyId`: String (FK to ArtKey)
- `guestbookEntryId`: String? (FK to GuestbookEntry, if attached to a comment)
- `type`: String - "image" | "video" | "audio"
- `url`: String - Full URL or path to the file
- `caption`: String? - Optional caption
- `approved`: Boolean (default: false)
- `createdAt`: DateTime

**TypeScript Interface:** `MediaItem` (see `types/artkey.ts`)

## API Routes

### Public Routes

#### `GET /api/artkey/[public_token]`

Returns public ArtKey data with only approved content.

**Response Shape:** `ArtKeyPublicData`
- Core ArtKey settings (title, theme, features, etc.)
- `guestbook`: Array of approved `GuestbookEntry` (nested with `children` for replies)
- `media`: Array of approved `MediaItem`

**Implementation Status:** ✅ Fully implemented with Prisma

#### `POST /api/artkey/[public_token]/guestbook`

Creates a new guestbook entry or reply.

**Request Body:**
```typescript
{
  name: string;
  email?: string; // Required if features.require_email_for_guestbook === true
  message: string;
  parent_id?: string | null; // For replies
}
```

**Response:**
```typescript
{
  success: boolean;
  entry: GuestbookEntry;
}
```

**Implementation Status:** ✅ Fully implemented with Prisma
- Validates email if required by feature flag
- Sets `role: "guest"` for public posts
- Respects `gb_require_approval` feature flag

#### `GET /api/artkey/[public_token]/media`

Returns approved media items for the ArtKey.

**Response:** Array of approved `MediaItem`

**Implementation Status:** ✅ Fully implemented with Prisma

#### `POST /api/artkey/[public_token]/media`

Uploads a new media file (image/video/audio).

**Request:** FormData with file

**Response:** Created `MediaItem`

**Implementation Status:** ✅ Fully implemented with Prisma
- Respects `img_require_approval` and `vid_require_approval` feature flags

### Owner Routes

#### `GET /api/manage/artkey/[owner_token]`

Returns owner data including all content (approved + pending).

**Note:** This route doesn't exist as a single endpoint. Instead, use:
- `GET /api/manage/artkey/[owner_token]/guestbook` for guestbook data
- `GET /api/manage/artkey/[owner_token]/media` for media data

**Implementation Status:** ⚠️ Split into separate endpoints (see below)

#### `GET /api/manage/artkey/[owner_token]/guestbook`

Returns all guestbook entries (approved + pending) for moderation.

**Response:**
```typescript
{
  artkey_id: string;
  artkey_title: string;
  public_token: string;
  entries: GuestbookEntry[]; // Nested with children
  stats: {
    total: number;
    approved: number;
    pending: number;
  };
}
```

**Implementation Status:** ✅ Fully implemented with Prisma
- Includes `email` and `role` fields in responses

#### `POST /api/manage/artkey/[owner_token]/guestbook/moderate`

Moderates a guestbook entry.

**Request Body:**
```typescript
{
  entry_id: string;
  action: "approve" | "reject" | "delete";
}
```

**Implementation Status:** ✅ Fully implemented with Prisma

#### `GET /api/manage/artkey/[owner_token]/media`

Returns all media items (approved + pending) for moderation.

**Response:**
```typescript
{
  artkey_id: string;
  artkey_title: string;
  public_token: string;
  media: {
    all: MediaItem[];
    byType: {
      images: MediaItem[];
      videos: MediaItem[];
      audio: MediaItem[];
    };
  };
  stats: {
    total: number;
    approved: number;
    pending: number;
  };
}
```

**Implementation Status:** ✅ Fully implemented with Prisma

#### `POST /api/manage/artkey/[owner_token]/media`

Moderates a media item.

**Request Body:**
```typescript
{
  media_id: string;
  action: "approve" | "reject" | "delete";
}
```

**Implementation Status:** ✅ Fully implemented with Prisma

## Client-Side Helpers

All client-side API interactions should use the typed helpers in `lib/artkeyClient.ts`:

- `fetchArtKeyPublic(publicToken: string): Promise<ArtKeyPublicData>`
- `fetchArtKeyOwner(ownerToken: string): Promise<ArtKeyOwnerData>`
- `postGuestbookEntry(publicToken: string, payload: GuestbookPostPayload): Promise<GuestbookEntry>`
- `moderateGuestbookEntry(ownerToken: string, payload: GuestbookModerationPayload): Promise<void>`
- `fetchMediaPublic(publicToken: string): Promise<MediaItem[]>`
- `moderateMediaItem(ownerToken: string, payload: MediaModerationPayload): Promise<void>`

**Implementation Status:** ✅ All helpers implemented and typed

## Feature Flags

Feature flags are stored in `ArtKey.features` (JSON field). Key flags:

- `show_guestbook`: Enable guestbook section
- `enable_gallery`: Enable image gallery
- `enable_video`: Enable video gallery
- `enable_spotify`: Enable Spotify integration
- `enable_custom_links`: Enable custom link buttons
- `allow_img_uploads`: Allow guests to upload images
- `allow_vid_uploads`: Allow guests to upload videos
- `gb_require_approval`: Require approval for guestbook entries
- `require_email_for_guestbook`: Require email when posting to guestbook
- `img_require_approval`: Require approval for image uploads
- `vid_require_approval`: Require approval for video uploads
- `gb_signing_status`: "open" | "closed" | "scheduled"
- `gb_signing_start`: ISO date string (if scheduled)
- `gb_signing_end`: ISO date string (if scheduled)

## Authentication & Authorization

**Current Implementation:**
- Public routes: No authentication required (public tokens are URL-friendly but not secret)
- Owner routes: Validated via `owner_token` in URL (treated as a secret management link)

**Future Considerations:**
- Consider adding rate limiting for public routes
- Consider adding CSRF protection for POST routes
- Consider implementing proper user authentication for owners (instead of just token-based access)

## Database Migrations

When adding new fields to the schema:

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <migration_name>` to create migration
3. Run `npx prisma generate` to regenerate Prisma client

**Recent Changes:**
- Added `email` field to `GuestbookEntry` (optional)
- Added `role` field to `GuestbookEntry` (default: "guest")

## Testing

**Current Status:**
- All API routes are implemented and functional
- Frontend pages use typed client helpers
- Database schema is up to date

**Recommended Next Steps:**
- Add unit tests for API routes
- Add integration tests for full flows
- Add E2E tests for critical user paths

## Notes for Backend Developers

1. **Email Validation**: The `require_email_for_guestbook` feature flag controls whether email is required. When enabled, validate email format on the server.

2. **Role Field**: The `role` field distinguishes guest entries from host replies. Public posts always have `role: "guest"`. Host replies should be created with `role: "host"` (future feature).

3. **Nested Replies**: Guestbook entries support threaded replies via `parentId`. The API automatically nests replies in the `children` array for UI rendering.

4. **Approval Workflow**: Both guestbook entries and media items support approval workflows. The `approved` field controls visibility in public views.

5. **Backward Compatibility**: The system maintains backward compatibility with localStorage demo mode. Always check for localStorage data before falling back to API.

6. **Error Handling**: All API routes should return appropriate HTTP status codes and error messages. Client helpers will surface these errors to the UI.

## Questions or Issues?

If you encounter any issues or have questions about the implementation, refer to:
- Type definitions: `types/artkey.ts`
- Client helpers: `lib/artkeyClient.ts`
- API route implementations: `app/api/artkey/*` and `app/api/manage/artkey/*`

