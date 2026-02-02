# Server Setup - Catalog Sync Configuration

Todo list for setting up the daily Gelato catalog sync on your server.

## ✅ Pre-Setup Checklist

- [ ] Server has access to your application
- [ ] Environment variable `GELATO_API_KEY` is set on server
- [ ] Application is deployed and running
- [ ] API endpoint `/api/gelato/sync` is accessible

---

## 📋 Server Setup Tasks

### 1. Choose Sync Method

- [ ] **Option A: API Endpoint (Recommended)**
  - Use if: Your app is already running on the server
  - Pros: Simple, uses existing infrastructure
  - Cons: Requires app to be running
  
- [ ] **Option B: Direct Script**
  - Use if: You have Node.js CLI access on server
  - Pros: Doesn't require app to be running
  - Cons: Requires Node.js path configuration

---

### 2. Set Up Cron Job (Option A - API Endpoint)

**Task:** Configure cron job to call API endpoint at 1 AM daily

- [ ] Access server via SSH or cPanel Cron Jobs
- [ ] Determine your site URL (e.g., `https://yoursite.com`)
- [ ] Create cron job with schedule: `0 1 * * *`
- [ ] Set cron command to:
  ```bash
  curl -X POST https://yoursite.com/api/gelato/sync
  ```
- [ ] Test the command manually first:
  ```bash
  curl -X POST https://yoursite.com/api/gelato/sync
  ```
- [ ] Verify response shows success
- [ ] Set up cron job
- [ ] Wait for first run or test manually
- [ ] Check application logs to verify sync ran successfully

**Notes:**
- Replace `yoursite.com` with your actual domain
- If your API requires authentication, add headers:
  ```bash
  curl -X POST https://yoursite.com/api/gelato/sync \
    -H "Authorization: Bearer YOUR_API_KEY"
  ```
- Check cron logs: Usually in `/var/log/cron` or cPanel logs

---

### 3. Set Up Cron Job (Option B - Direct Script)

**Task:** Configure cron job to run Node.js script at 1 AM daily

- [ ] Find Node.js path on server:
  ```bash
  which node
  # or
  whereis node
  ```
- [ ] Find npm path:
  ```bash
  which npm
  ```
- [ ] Navigate to project directory
- [ ] Test sync script manually:
  ```bash
  /path/to/node /path/to/npm run sync-gelato-catalog
  # or if using npx:
  /path/to/node /path/to/npx tsx scripts/sync-gelato-catalog.ts
  ```
- [ ] Verify sync completes successfully
- [ ] Create cron job with schedule: `0 1 * * *`
- [ ] Set cron command to:
  ```bash
  cd /path/to/tae-full-devsite && /path/to/node /path/to/npm run sync-gelato-catalog >> /path/to/logs/sync.log 2>&1
  ```
- [ ] Create log directory if needed: `mkdir -p /path/to/logs`
- [ ] Test cron job manually
- [ ] Check log file to verify sync ran
- [ ] Monitor for first automatic run

**Notes:**
- Replace `/path/to/` with actual paths on your server
- The `>> /path/to/logs/sync.log 2>&1` part saves output to a log file
- Adjust paths based on your server setup

---

### 4. Verify Sync is Working

**Task:** Confirm the sync runs successfully

- [ ] Wait for first cron run OR trigger manually
- [ ] Check sync status via API:
  ```bash
  curl https://yoursite.com/api/gelato/sync
  ```
- [ ] Verify response shows:
  - `success: true`
  - Product counts > 0
  - Recent `lastSyncedAt` timestamp
- [ ] Check application logs for sync messages:
  - Look for `[GelatoSync]` log entries
  - Verify no error messages
- [ ] Check database to confirm products were synced:
  - Query `GelatoProduct` table
  - Verify product count matches expected range
  - Check `lastSyncedAt` timestamps are recent

---

### 5. Set Up Monitoring (Optional but Recommended)

**Task:** Monitor sync health

- [ ] Set up email alerts for cron failures (if available)
- [ ] Create monitoring script to check sync status daily
- [ ] Set up log rotation for sync logs (if using Option B)
- [ ] Document where logs are stored
- [ ] Schedule weekly review of sync logs

**Monitoring Options:**
- Server cron email notifications (if configured)
- Application monitoring (if you have monitoring service)
- Manual check: `GET /api/gelato/sync` endpoint

---

### 6. Error Handling Setup

**Task:** Prepare for sync failures

- [ ] Document how to manually trigger sync if cron fails:
  ```bash
  # Option A:
  curl -X POST https://yoursite.com/api/gelato/sync
  
  # Option B:
  npm run sync-gelato-catalog
  ```
- [ ] Document where to check for errors:
  - Application logs
  - Cron logs
  - Database sync status
- [ ] Test manual sync recovery process
- [ ] Document recovery steps for common failures

---

## 🔧 Server-Specific Notes

### cPanel Server
- [ ] Use cPanel Cron Jobs interface
- [ ] Cron schedule format: `0 1 * * *` (1 AM daily)
- [ ] Command: `curl -X POST https://yoursite.com/api/gelato/sync`
- [ ] Check cron job logs in cPanel
- [ ] Verify email notifications are set up (if desired)

### Linux Server (SSH Access)
- [ ] Edit crontab: `crontab -e`
- [ ] Add line: `0 1 * * * curl -X POST https://yoursite.com/api/gelato/sync >> /var/log/gelato-sync.log 2>&1`
- [ ] Save and exit
- [ ] Verify crontab: `crontab -l`
- [ ] Check logs: `tail -f /var/log/gelato-sync.log`

### Windows Server (Task Scheduler)
- [ ] Open Task Scheduler
- [ ] Create new task
- [ ] Set trigger: Daily at 1:00 AM
- [ ] Set action: Start a program
- [ ] Program: `curl.exe` (or `powershell.exe` with curl command)
- [ ] Arguments: `-X POST https://yoursite.com/api/gelato/sync`
- [ ] Test task manually
- [ ] Verify it runs successfully

---

## 📝 Testing Checklist

Before marking setup complete:

- [ ] Sync runs successfully at 1 AM (or test manually)
- [ ] Products are updated in database
- [ ] Sync status endpoint shows recent sync
- [ ] No errors in logs
- [ ] Sync completes in reasonable time (< 10 minutes)
- [ ] Only expected catalogs are synced (cards, postcards, etc.)
- [ ] Product counts are reasonable (not zero, not unexpectedly high)

---

## 🎯 Completion Criteria

Setup is complete when:

- ✅ Cron job is configured and running
- ✅ Sync executes successfully at scheduled time
- ✅ Products are being synced to database
- ✅ Monitoring/logging is in place
- ✅ Manual sync process is documented
- ✅ Error recovery process is documented

---

## 📚 Related Documentation

- `PRODUCT_AVAILABILITY_STRATEGY.md` - Overall strategy
- `CATALOG_SYNC_EXPLAINED.md` - How sync works
- `/api/gelato/sync` - API endpoint documentation

---

## ⚠️ Important Notes

1. **Time Zone**: Cron uses server timezone. Verify 1 AM is correct for your timezone.
2. **API Key**: Ensure `GELATO_API_KEY` environment variable is set on server.
3. **Database Access**: Sync needs database access - verify connection works.
4. **First Run**: First sync may take longer (10-30 minutes) as it syncs all products.
5. **Subsequent Runs**: Should be faster (2-5 minutes) as it only updates changed products.

---

**Last Updated:** 2026-01-12
