#!/bin/bash
# Daily Gelato Catalog Sync
# Run this via cron: 0 1 * * * /path/to/scripts/sync-gelato-daily.sh
#
# Or on Windows/cPanel, use the API endpoint in a scheduled task:
# curl -X POST https://yoursite.com/api/gelato/sync

cd "$(dirname "$0")/.."

echo "$(date): Starting Gelato catalog sync..."

# Run the sync via API endpoint (recommended for production)
# This requires your site to be running
curl -X POST https://yoursite.com/api/gelato/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  || echo "Sync failed - check API endpoint"

# Alternative: Run directly via Node (requires Node on server)
# npm run sync-gelato-catalog

echo "$(date): Sync complete"
