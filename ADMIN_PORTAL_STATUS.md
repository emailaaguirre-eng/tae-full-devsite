# Admin Portal Status & Missing Functionality

## Current Status

The admin portal exists at `/manage` (moved from `/admin` for SEO protection). It includes:

### ✅ What's Working:
1. **Authentication** (`/manage/login`)
   - Login with admin credentials from environment variables
   - Token-based authentication
   - Multiple admin user support

2. **Dashboard** (`/manage/dashboard`)
   - Stats display (ArtKeys count, Demos count)
   - Quick links to manage demos and ArtKeys
   - **NEW**: Connection testing for WordPress, WooCommerce, and Gelato

3. **Demos Management** (`/manage/demos`)
   - Lists existing demos
   - Links to edit/view demos
   - **MISSING**: "Create New Demo" page (`/manage/demos/new`)

4. **ArtKeys Management** (`/manage/artkeys`)
   - Lists ArtKeys from WordPress
   - View and edit links

### ❌ Missing Functionality:

1. **Demo Creation Page** (`/manage/demos/new`)
   - Should allow creating new demo ArtKeys
   - Generate unique token
   - Create ArtKey with JSON data
   - Generate QR code
   - Save to WordPress or local storage
   - Display shareable URL and QR code

2. **Demo API Endpoints**
   - POST `/api/admin/demos` - Create new demo
   - GET `/api/admin/demos` - List all demos
   - DELETE `/api/admin/demos/[id]` - Delete demo

3. **QR Code Display**
   - Show QR code in demo list
   - Download QR code option
   - Print-ready QR code

## How to Access Admin Portal Locally

1. **Start the development server:**
   ```bash
   cd C:\Users\email\tae-full-devsite
   npm run dev
   ```

2. **Access the admin portal:**
   - Open browser to: `http://localhost:3000/manage/login`
   - Login with credentials from `.env.local`:
     - `ADMIN_USERNAME` and `ADMIN_PASSWORD`
     - Or `ADMIN1_USERNAME` and `ADMIN1_PASSWORD`
     - Or `ADMIN_USERS` (comma-separated: `user1:pass1,user2:pass2`)

3. **After login, you'll be redirected to:**
   - `/manage/dashboard` - Main dashboard with stats and connection testing

## Original Admin Portal (from commit e26bad1)

The original admin portal had:
- Same structure but at `/admin` route
- Same demos page with "Create New Demo" button
- The "Create New Demo" page was never implemented (404 when clicked)

## Next Steps

1. Create `/manage/demos/new` page for demo creation
2. Create API route `/api/admin/demos` for demo CRUD operations
3. Integrate with ArtKey store API (`/api/artkey/store`) to create ArtKeys
4. Generate QR codes using existing `/api/artkey/qr` endpoint
5. Save demos to WordPress or local storage
6. Display QR codes in demo list and detail views

