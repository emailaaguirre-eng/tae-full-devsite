# ArtKey Plugin Integration Analysis

## Overview
This document outlines how the WordPress MU plugins integrate with the Next.js site and what's needed for full functionality.

## WordPress MU Plugins Overview

### 1. **artkey-core.php** (Core Functionality)
**Purpose**: Foundation for all ArtKey operations
- **Custom Post Type**: `artkey_portal` - Stores ArtKey portal data
- **REST Endpoints**:
  - `GET /wp-json/artkey/v1/ping` - Health check
  - `POST /wp-json/artkey/v1/create` - Create ArtKey (requires auth)
  - `GET /wp-json/artkey/v1/get/{token}` - Get ArtKey by token (public)
  - `GET /wp-json/artkey/v1/list` - List all ArtKeys (admin only)
- **URL Routing**: `/a/{token}` - Portal display route
- **QR Code Generation**: Generates QR codes using Endroid QR Code library
- **Portal URL Function**: `artkey_get_portal_url($token)` returns canonical URL

**Impact on Next.js Site**:
- ✅ Next.js already calls `/wp-json/artkey/v1/get/{token}` (see `app/api/artkey/[token]/route.ts`)
- ⚠️ Need to ensure WordPress has the `artkey_portal` CPT registered
- ⚠️ Need Endroid QR Code library installed on WordPress

### 2. **artkey-woo.php** (WooCommerce Integration)
**Purpose**: Integrates ArtKey with WooCommerce checkout flow
- **Cart Integration**: Stores ArtKey payload in cart item data
- **Checkout**: Copies payload from cart to order item meta
- **Order Processing**: Automatically creates ArtKey portals when order is paid/completed
- **Token Generation**: Creates unique tokens per order item
- **Email Integration**: Adds portal links to order emails
- **Admin Display**: Shows portal links in order details

**Impact on Next.js Site**:
- ✅ Works automatically when products are purchased through WooCommerce
- ⚠️ Next.js checkout flow needs to pass `artkey_payload` in POST data
- ⚠️ Need to ensure checkout completion triggers portal creation
- ✅ Portal URLs will be available in order emails automatically

### 3. **artkey-admin-demo.php** (Admin Interface)
**Purpose**: WordPress admin interface for creating demo ArtKeys
- **Admin Menu**: "ArtKey" menu in WordPress admin
- **List Page**: View all demo ArtKeys
- **Editor**: Create/edit demo ArtKeys with JSON payload
- **QR Regeneration**: Manually regenerate QR codes

**Impact on Next.js Site**:
- ✅ Allows WordPress admins to create test portals
- ✅ Useful for testing and demos
- ⚠️ Not required for production checkout flow

### 4. **artkey-security.php** (Security & Rate Limiting)
**Purpose**: Security functions and rate limiting
- **Secure Token Generation**: `artkey_generate_secure_token()` - Cryptographically secure
- **URL Validation**: `artkey_validate_url()` - Blocks dangerous schemes
- **Rate Limiting**: `artkey_check_rate_limit()` - Prevents abuse
- **IP Detection**: `artkey_get_client_ip()` - Respects proxies/Cloudflare

**Impact on Next.js Site**:
- ✅ Protects WordPress backend from abuse
- ✅ Ensures secure token generation
- ⚠️ Rate limiting may affect high-volume operations (adjust limits if needed)

### 5. **artkey-logging.php** (Centralized Logging)
**Purpose**: Structured logging across all ArtKey operations
- **Log Function**: `artkey_log($level, $message, $context, $source)`
- **Error Logging**: `artkey_log_error()` - Logs exceptions safely
- **Multiple Outputs**: debug.log, WooCommerce logs, internal log

**Impact on Next.js Site**:
- ✅ Helps debug issues
- ✅ No direct impact on functionality

### 6. **artkey-debug.php** (Debug Admin Page)
**Purpose**: Admin debug page for troubleshooting
- **Environment Info**: PHP version, WordPress version, plugin status
- **System Status**: Portal routes, REST endpoints, ArtKey count
- **Recent Logs**: Last 50 log entries
- **Actions**: Clear logs, test ping endpoint

**Impact on Next.js Site**:
- ✅ Useful for troubleshooting integration issues
- ⚠️ Admin-only, not visible to end users

### 7. **artkey-ping.php** (Ping Endpoint)
**Purpose**: Simple health check endpoint
- **Endpoint**: `GET /wp-json/artkey/v1/ping`
- **Response**: `{ ok: true, time: "...", php: "..." }`
- **Shortcode**: `[artkey_ping]` outputs "OK"

**Impact on Next.js Site**:
- ✅ Can be used for health checks
- ✅ Useful for diagnostics page

### 8. **portal.php** (Portal Template)
**Purpose**: Mobile-first template for displaying ArtKey portals
- **Location**: Should be at `wp-content/mu-plugins/artkey-templates/portal.php`
- **Features**:
  - Mobile-optimized layout
  - Image/video galleries with overlay
  - Links section (collapsible)
  - "Share Your Interests" PDF viewer
  - Interests links page
  - iPhone Safari optimizations

**Impact on Next.js Site**:
- ⚠️ **Important**: This is a WordPress template, but Next.js has its own portal component
- ✅ Next.js uses `components/ArtKeyPortal.tsx` instead
- ⚠️ Need to ensure feature parity between PHP template and React component

## Current Next.js Integration Status

### ✅ Already Implemented:
1. **Portal Display**: `/art-key/[token]` route exists
2. **API Route**: `/api/artkey/[token]` fetches from WordPress
3. **WordPress API Client**: `lib/wp.ts` has authentication
4. **ArtKey Portal Component**: `components/ArtKeyPortal.tsx` exists
5. **Environment Variables**: Configured for WordPress connection

### ⚠️ Needs Implementation/Verification:

1. **WordPress Plugin Installation**:
   - [ ] Install all MU plugins to `wp-content/mu-plugins/`
   - [ ] Install Endroid QR Code library (Composer: `composer require endroid/qr-code`)
   - [ ] Place `portal.php` template in `wp-content/mu-plugins/artkey-templates/`
   - [ ] Verify `artkey_portal` CPT is registered
   - [ ] Test REST endpoints are accessible

2. **Checkout Integration**:
   - [ ] Ensure checkout form includes `artkey_payload` field
   - [ ] Verify payload is passed to WooCommerce cart
   - [ ] Test order completion triggers portal creation
   - [ ] Verify portal URLs appear in order emails

3. **Portal Component Parity**:
   - [ ] Compare `components/ArtKeyPortal.tsx` with `portal.php` features
   - [ ] Ensure all features are implemented:
     - [ ] Image/video galleries
     - [ ] Links section
     - [ ] "Share Your Interests" PDF viewer
     - [ ] Interests links page
     - [ ] Mobile optimizations

4. **QR Code Generation**:
   - [ ] Verify QR codes are generated on WordPress
   - [ ] Ensure QR code URLs are accessible
   - [ ] Test QR code display in Next.js

5. **Token Format Compatibility**:
   - [ ] Verify token formats match between WordPress and Next.js
   - [ ] Test token lookup works correctly
   - [ ] Handle token variations (e.g., `artkey-session-*`)

## Integration Checklist

### Phase 1: WordPress Setup
- [ ] Copy all MU plugins to WordPress `wp-content/mu-plugins/`
- [ ] Create `artkey-templates` directory and copy `portal.php`
- [ ] Install Endroid QR Code library via Composer
- [ ] Verify REST API endpoints are accessible
- [ ] Test ping endpoint: `GET /wp-json/artkey/v1/ping`
- [ ] Create test ArtKey via admin interface
- [ ] Verify portal URL works: `/a/{token}`

### Phase 2: Next.js Integration
- [ ] Verify environment variables are set in Vercel
- [ ] Test ArtKey fetch: `/api/artkey/{token}`
- [ ] Test portal display: `/art-key/{token}`
- [ ] Compare React portal component with PHP template
- [ ] Ensure all portal features work in Next.js

### Phase 3: WooCommerce Integration
- [ ] Add `artkey_payload` field to product pages
- [ ] Ensure payload is included in add-to-cart requests
- [ ] Test checkout flow with ArtKey payload
- [ ] Verify portal is created after order completion
- [ ] Test portal URL in order email
- [ ] Verify QR code is generated

### Phase 4: Testing
- [ ] Test portal creation from checkout
- [ ] Test portal display on mobile devices
- [ ] Test QR code scanning
- [ ] Test all portal features (images, videos, links, PDF)
- [ ] Test rate limiting doesn't break functionality
- [ ] Test error handling

## Key Integration Points

### 1. Portal URL Format
- **WordPress**: `/a/{token}` (handled by rewrite rule)
- **Next.js**: `/art-key/{token}` (handled by Next.js routing)
- **Recommendation**: Use WordPress URL format for consistency, or redirect

### 2. Token Format
- **WordPress generates**: `ak-{order}-{item}-{hash}` or `demo-{hash}-{hash}`
- **Next.js expects**: Any token format
- **Status**: ✅ Compatible (Next.js handles variations)

### 3. Data Structure
- **WordPress stores**: JSON payload in `artkey_payload` meta
- **Next.js expects**: `{ ok: true, json: {...} }` from REST API
- **Status**: ✅ Compatible (plugin returns correct format)

### 4. QR Code URLs
- **WordPress generates**: QR code image, stores URL in meta
- **Next.js needs**: QR code URL to display
- **Status**: ⚠️ Need to verify QR URLs are accessible

## Potential Issues & Solutions

### Issue 1: Portal URL Mismatch
**Problem**: WordPress uses `/a/{token}`, Next.js uses `/art-key/{token}`
**Solution**: 
- Option A: Update Next.js to use `/a/{token}` route
- Option B: Add redirect from WordPress URL to Next.js URL
- Option C: Use WordPress URL for portals (requires WordPress site to be accessible)

### Issue 2: QR Code Library Missing
**Problem**: Endroid QR Code library not installed
**Solution**: Install via Composer: `composer require endroid/qr-code`

### Issue 3: Portal Features Missing
**Problem**: React component doesn't match PHP template features
**Solution**: Compare both and implement missing features in React

### Issue 4: Checkout Payload Not Passed
**Problem**: ArtKey payload not included in WooCommerce cart
**Solution**: Ensure Next.js checkout form includes hidden `artkey_payload` field

### Issue 5: Rate Limiting Too Strict
**Problem**: Rate limiting blocks legitimate requests
**Solution**: Adjust limits in `artkey-security.php` or whitelist Next.js server IPs

## Next Steps

1. **Install WordPress Plugins**: Copy all MU plugins to WordPress site
2. **Test REST Endpoints**: Verify all endpoints are accessible
3. **Create Test Portal**: Use admin interface to create test ArtKey
4. **Verify Integration**: Test Next.js can fetch and display portals
5. **Test Checkout Flow**: Complete test purchase and verify portal creation
6. **Compare Components**: Ensure React portal matches PHP template
7. **Production Testing**: Test all features end-to-end

## Environment Variables Needed

### WordPress (for plugins):
- None required (plugins use WordPress defaults)

### Next.js (for integration):
- `WP_API_BASE` or `NEXT_PUBLIC_WORDPRESS_URL` - WordPress site URL
- `WP_APP_USER` - WordPress application user
- `WP_APP_PASS` - WordPress application password
- `NEXT_PUBLIC_SITE_URL` - Next.js site URL (for absolute URLs)

## Summary

The WordPress MU plugins provide:
- ✅ Backend storage and management
- ✅ WooCommerce integration
- ✅ QR code generation
- ✅ Security and rate limiting
- ✅ Admin interface

The Next.js site provides:
- ✅ Frontend portal display
- ✅ ArtKey editor interface
- ✅ Product browsing
- ✅ Checkout flow

**For full functionality, you need**:
1. All plugins installed on WordPress
2. Endroid QR Code library installed
3. Portal template file in place
4. Next.js checkout to pass ArtKey payload
5. Portal component feature parity
6. Testing of complete flow

The integration is **mostly compatible** - the main work is ensuring all pieces are in place and tested.

