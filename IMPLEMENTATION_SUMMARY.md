# ArtKey Portal Implementation Summary

This document summarizes the full end-to-end implementation of the ArtKey Portal system, including the database layer, API routes, and frontend pages.

## Database Schema (Prisma)

### Models Created

1. **ArtKey**
   - `id`: Unique identifier (CUID)
   - `publicToken`: Short, URL-friendly token (8 chars) for public access
   - `ownerToken`: Secret token (32 chars) for owner management
   - `ownerEmail`: Optional email for the owner
   - JSON fields: `title`, `theme`, `features`, `links`, `spotify`, `featuredVideo`, `customizations`, `uploadedImages`, `uploadedVideos`
   - Timestamps: `createdAt`, `updatedAt`

2. **GuestbookEntry**
   - `id`: Unique identifier
   - `artkeyId`: Foreign key to ArtKey
   - `parentId`: Optional foreign key for threaded replies
   - `name`, `message`: Entry content
   - `approved`: Boolean flag for moderation
   - `createdAt`: Timestamp
   - Relations: `artkey`, `parent`, `replies`, `mediaItems`

3. **MediaItem**
   - `id`: Unique identifier
   - `artkeyId`: Foreign key to ArtKey
   - `guestbookEntryId`: Optional foreign key if media is attached to a guestbook entry
   - `type`: "image" | "video" | "audio"
   - `url`: Public URL to the file
   - `caption`: Optional caption
   - `approved`: Boolean flag for moderation
   - `createdAt`: Timestamp
   - Relations: `artkey`, `guestbookEntry`

## API Routes

### Public Routes

1. **POST /api/artkey/save**
   - Saves or updates ArtKey data from the editor
   - Creates new ArtKey with `public_token` and `owner_token` if not exists
   - Updates existing ArtKey if `id`, `public_token`, or `owner_token` is provided
   - Returns: `id`, `public_token`, `owner_token`, `share_url`, `manage_url`

2. **GET /api/artkey/[public_token]**
   - Returns ArtKey data with approved guestbook entries and media
   - Nests guestbook replies under parent entries
   - Groups media by type
   - Includes signing status and approval requirements

3. **POST /api/artkey/[public_token]/guestbook**
   - Allows guests to post guestbook entries or replies
   - Validates signing status (open/closed/scheduled)
   - Sets `approved` based on `gb_require_approval` feature flag
   - Returns created entry with approval status

4. **GET /api/artkey/[public_token]/media**
   - Lists all approved media items for public display
   - Groups by type (images, videos, audio)

5. **POST /api/artkey/[public_token]/media**
   - Handles file uploads from guests
   - Validates file type and upload permissions
   - Saves files to `public/uploads/artkey/[public_token]/`
   - Creates MediaItem record with approval status based on feature flags
   - Returns created media item

### Owner/Management Routes

6. **GET /api/manage/artkey/[owner_token]/guestbook**
   - Returns ALL guestbook entries (approved and pending) for moderation
   - Includes nested replies
   - Returns statistics (total, approved, pending)
   - Includes `public_token` for sharing

7. **POST /api/manage/artkey/[owner_token]/guestbook/moderate**
   - Allows owner to approve, reject, or delete guestbook entries
   - Validates owner_token before allowing actions
   - Cascade deletes replies when parent is deleted

8. **GET /api/manage/artkey/[owner_token]/media**
   - Returns ALL media items (approved and pending) for moderation
   - Groups by type
   - Returns statistics

9. **POST /api/manage/artkey/[owner_token]/media**
   - Allows owner to approve, reject, or delete media items
   - Validates owner_token before allowing actions

## Frontend Pages

### Public Portal Page

**Location**: `app/artkey/[public_token]/page.tsx`

- Mobile-app-style layout matching ArtKeyEditor preview
- Displays title with gradient/solid styling
- Button list for enabled features (Guestbook, Gallery, Videos, Links, Spotify)
- Sections:
  - **Guestbook**: Shows approved entries with nested replies, form to post new entries/replies
  - **Image Gallery**: Grid of approved images
  - **Video Gallery**: List of approved videos with controls
  - **Spotify**: Embedded playlist iframe
  - **Featured Video**: Video player for featured video
- Respects feature flags and signing status
- Shows approval messages when posting requires approval

### Owner Management Page

**Location**: `app/manage/artkey/[owner_token]/page.tsx`

- Tabbed interface for Guestbook and Media moderation
- **Guestbook Tab**:
  - Lists all entries (approved and pending) with visual indicators
  - Shows nested replies
  - Action buttons: Approve, Reject, Delete
  - Statistics display
- **Media Tab**:
  - Grid view for images
  - List view for videos
  - Action buttons: Approve, Delete
  - Statistics display
- Displays public URL for sharing
- Only accessible with valid `owner_token`

## Key Features

### Token System
- **Public Token**: 8-character alphanumeric (lowercase + numbers) for public URLs
- **Owner Token**: 32-character alphanumeric (mixed case + numbers) for management
- Tokens are generated on ArtKey creation and never exposed in public responses

### Moderation System
- Guestbook entries and media items can require approval based on feature flags
- Owner can approve, reject, or delete items
- Pending items are clearly marked in the management interface

### Feature Flags
The system respects all feature flags from `ArtKeyData.features`:
- `show_guestbook`: Enable/disable guestbook
- `gb_signing_status`: "open" | "closed" | "scheduled"
- `gb_require_approval`: Require approval for guestbook entries
- `enable_gallery`: Enable image gallery
- `enable_video`: Enable video gallery
- `allow_img_uploads`: Allow guests to upload images
- `allow_vid_uploads`: Allow guests to upload videos
- `img_require_approval`: Require approval for image uploads
- `vid_require_approval`: Require approval for video uploads

### File Uploads
- Files are stored in `public/uploads/artkey/[public_token]/`
- Unique filenames: `[timestamp]-[random].ext`
- Public URLs: `/uploads/artkey/[public_token]/[filename]`
- Supports images, videos, and audio files

## Backward Compatibility

- The system maintains backward compatibility with localStorage demo mode
- ArtKeyEditor still works with the existing structure
- The save API can work with or without a database (falls back to demo mode)

## Setup Instructions

1. **Install Prisma dependencies**:
   ```bash
   npm install prisma @prisma/client
   ```

2. **Set up database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Configure environment**:
   - Add `DATABASE_URL="file:./dev.db"` to `.env` (or use PostgreSQL/MySQL)

4. **Run migrations** (if using migrations instead of db push):
   ```bash
   npx prisma migrate dev --name init
   ```

## Assumptions Made

1. **Database**: Used Prisma with SQLite for simplicity (can be easily switched to PostgreSQL/MySQL)
2. **File Storage**: Local filesystem storage in `public/uploads/` (can be migrated to S3/Cloudinary)
3. **Token Generation**: Simple random generation (can be enhanced with better uniqueness checks)
4. **Styling**: Reused color palette and helper functions from ArtKeyEditor for consistency
5. **Error Handling**: Basic error handling with user-friendly messages
6. **Security**: Owner tokens are treated as secrets and never exposed in public APIs

## Future Enhancements

- Add email notifications for new guestbook entries/media
- Implement file size limits and validation
- Add image/video processing (thumbnails, compression)
- Migrate file storage to cloud (S3, Cloudinary)
- Add analytics/statistics dashboard
- Implement rate limiting for uploads
- Add support for audio uploads in UI
- Enhance moderation with bulk actions

