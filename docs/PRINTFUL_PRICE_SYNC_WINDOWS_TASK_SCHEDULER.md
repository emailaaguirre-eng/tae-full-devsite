# Printful Price Sync (Windows Task Scheduler)

This setup runs the daily Printful price refresh without Redis, BullMQ, Vercel, or Netlify.

## What Runs

- Script: `scripts/run-price-sync.ps1`
- API endpoint called: `GET /api/cron/printful-price-sync`

## Required Environment Variables

- `CRON_SECRET`
- `PRINTFUL_TOKEN`
- `PRINTFUL_STORE_ID` (optional if default store is correct)

Optional:
- `PRICE_SYNC_TARGET_URL` (default is `http://127.0.0.1:3000`)

## Manual Test

From project root:

```powershell
npm run sync:printful-prices
```

## Create Daily 12:01 AM Schedule

Run in PowerShell as Administrator:

```powershell
schtasks /Create /TN "TAE_PrintfulPriceSync" /SC DAILY /ST 00:01 /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\email\tae-full-devsite\scripts\run-price-sync.ps1" /F
```

## Create 12:11 AM Retry-If-Failed Schedule

This second task only retries when the 12:01 run recorded a failure.

```powershell
schtasks /Create /TN "TAE_PrintfulPriceSyncRetryIfFailed" /SC DAILY /ST 00:11 /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\email\tae-full-devsite\scripts\run-price-sync-retry-if-failed.ps1" /F
```

## Verify Task

```powershell
schtasks /Query /TN "TAE_PrintfulPriceSync" /V /FO LIST
schtasks /Query /TN "TAE_PrintfulPriceSyncRetryIfFailed" /V /FO LIST
```

## Run Task Immediately (Smoke Test)

```powershell
schtasks /Run /TN "TAE_PrintfulPriceSync"
schtasks /Run /TN "TAE_PrintfulPriceSyncRetryIfFailed"
```

## Notes

- Ensure your app is running and reachable at `PRICE_SYNC_TARGET_URL` when the task executes.
- If you host this app remotely, point `PRICE_SYNC_TARGET_URL` to the deployed domain.
- First-run status is saved to `scripts/price-sync-last-result.json` and used by the retry task.

