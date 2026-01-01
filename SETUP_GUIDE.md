# ArtKey Portal Setup Guide

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Prisma**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Configure environment**:
   Create a `.env` file with:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## Database Setup

The project uses Prisma with SQLite by default. To use PostgreSQL or MySQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // or "mysql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/artkey"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

## File Uploads

Uploads are stored in `public/uploads/artkey/[public_token]/`. For production, consider:

- Using cloud storage (S3, Cloudinary, etc.)
- Adding file size limits
- Implementing image/video processing
- Setting up CDN for media delivery

## Testing the Flow

1. **Create an ArtKey**:
   - Go to `/art-key/editor` or use the ArtKeyEditor component
   - Configure your ArtKey (title, theme, features, etc.)
   - Click "Save" - you'll receive `public_token` and `owner_token`

2. **View Public Portal**:
   - Visit `/artkey/[public_token]`
   - Test guestbook posting, media viewing, etc.

3. **Manage ArtKey**:
   - Visit `/manage/artkey/[owner_token]`
   - Moderate guestbook entries and media
   - Share the public URL with guests

## API Endpoints Summary

### Public Endpoints
- `POST /api/artkey/save` - Save/update ArtKey
- `GET /api/artkey/[public_token]` - Get public ArtKey data
- `POST /api/artkey/[public_token]/guestbook` - Post guestbook entry
- `GET /api/artkey/[public_token]/media` - List approved media
- `POST /api/artkey/[public_token]/media` - Upload media

### Owner Endpoints
- `GET /api/manage/artkey/[owner_token]/guestbook` - Get all entries
- `POST /api/manage/artkey/[owner_token]/guestbook/moderate` - Moderate entries
- `GET /api/manage/artkey/[owner_token]/media` - Get all media
- `POST /api/manage/artkey/[owner_token]/media` - Moderate media

## Troubleshooting

### Database errors
- Ensure Prisma client is generated: `npx prisma generate`
- Check DATABASE_URL in `.env`
- Try resetting database: `npx prisma db push --force-reset` (⚠️ deletes all data)

### Upload errors
- Ensure `public/uploads/` directory exists and is writable
- Check file size limits
- Verify file types are allowed

### Token errors
- Ensure tokens are being generated correctly
- Check that owner_token is never exposed in public APIs
- Verify token format matches expected length

