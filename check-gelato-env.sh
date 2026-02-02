#!/bin/bash
# Check Gelato environment variables on the server

cd /home/artful/apps/tae-full-devsite

# Source the .env.local file
set -a
source .env.local
set +a

# Check if variables are set
echo "Checking Gelato environment variables..."
echo ""
echo "GELATO_API_KEY: ${GELATO_API_KEY:+SET} ${GELATO_API_KEY:-NOT SET}"
echo "GELATO_API_URL: ${GELATO_API_URL:-NOT SET}"
echo "GELATO_PRODUCT_API_URL: ${GELATO_PRODUCT_API_URL:-NOT SET}"
echo ""

# Check with Node.js
node -e "console.log('GELATO_API_URL:', process.env.GELATO_API_URL ? 'SET' : 'NOT SET'); console.log('GELATO_PRODUCT_API_URL:', process.env.GELATO_PRODUCT_API_URL ? 'SET' : 'NOT SET');"

