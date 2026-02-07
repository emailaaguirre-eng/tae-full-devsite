# ArtKey Portal Setup Instructions

## Environment Variables (Vercel)

Set these in your Vercel project settings:

1. **WP_API_BASE** or **NEXT_PUBLIC_WORDPRESS_URL**
   - Value: `https://theartfulexperience.com`
   - This is your WordPress site URL

2. **WP_APP_USER** (if needed for authenticated endpoints)
   - Your WordPress application username

3. **WP_APP_PASS** (if needed for authenticated endpoints)
   - Your WordPress application password

## Testing the Connection

After deployment, test the WordPress connection:

1. Visit: `https://your-vercel-site.vercel.app/api/artkey/test-connection`
   - This will show which WordPress REST API endpoints are accessible

## Demo URLs

1. **Sales Demo (Direct):**
   - `https://your-vercel-site.vercel.app/demo/artkey-691e3d09ef58e`

2. **Standard Portal:**
   - `https://your-vercel-site.vercel.app/art-key/691e3d09ef58e`

3. **Demo Entry Page:**
   - `https://your-vercel-site.vercel.app/demo`

## How It Works

The system will:

1. Extract the token from the URL (handles formats like `691e3d09ef58e` or `artkey-session-691e3d09ef58e`)
2. Query WordPress REST API at `https://theartfulexperience.com/wp-json/`
3. Try multiple endpoint patterns:
   - `/wp-json/artkey/v1/get/{token}`
   - `/wp-json/wp/v2/artkey/get/{token}`
   - `/wp-json/wp/v2/artkey/{token}`
   - Fallback: Fetch all artkey posts and filter by token
4. Return the ArtKey data to display in the portal

## WordPress Requirements

Your WordPress site needs:

1. **Custom Post Type:** `artkey` registered with REST API support
2. **Meta Fields Exposed:** 
   - `_artkey_token` - The unique token
   - `_artkey_json` - The ArtKey data (JSON string)

3. **REST API Access:** The endpoints should be publicly accessible (or use WP_APP_USER/WP_APP_PASS for authentication)

## Troubleshooting

If the portal doesn't load:

1. Check environment variables in Vercel
2. Visit `/api/artkey/test-connection` to see which endpoints work
3. Verify the token exists in WordPress with the correct format
4. Check browser console for API errors
5. Ensure WordPress REST API is enabled and accessible
