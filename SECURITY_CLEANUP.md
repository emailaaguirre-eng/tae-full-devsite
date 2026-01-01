# Security Cleanup Guide

## If `.env.local` or `.env` Were Committed to GitHub

### Step 1: Change All Compromised Credentials

**Location of `.env.local`:**
```
C:\Users\email\tae-full-devsite\.env.local
```

**Immediate Actions:**

1. **WordPress Application Password:**
   - Go to: https://theartfulexperience.com/wp-admin
   - Navigate to: Users → Your Profile
   - Scroll to "Application Passwords"
   - **Revoke/Delete** the compromised password
   - Create a **new** application password
   - Update `WP_APP_PASS` in `.env.local`

2. **WooCommerce API Credentials:**
   - Go to: WooCommerce → Settings → Advanced → REST API
   - **Revoke/Delete** the compromised API key
   - Create a **new** API key/secret pair
   - Update `WOOCOMMERCE_CONSUMER_KEY` and `WOOCOMMERCE_CONSUMER_SECRET` in `.env.local`

3. **Admin Passwords:**
   - Change all admin passwords listed in `.env.local`
   - Update `ADMIN_PASSWORD`, `ADMIN1_PASSWORD`, `ADMIN2_PASSWORD`, etc.

4. **Other API Keys:**
   - Rotate any other API keys (Gelato, Cloudinary, Resend, etc.)
   - Update them in `.env.local`

### Step 2: Remove from Git History (If Already Committed)

If `.env.local` or `.env` were accidentally committed:

```bash
# Remove from git history (DANGEROUS - only do if necessary)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history)
git push origin --force --all
git push origin --force --tags
```

**⚠️ WARNING:** This rewrites git history. Coordinate with your team first!

### Step 3: Verify `.gitignore`

Ensure `.env.local` and `.env` are in `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

### Step 4: Add to GitHub Secrets (For Deployment)

If using Vercel or GitHub Actions, add environment variables as **secrets**:

- **Vercel:** Project Settings → Environment Variables
- **GitHub Actions:** Repository Settings → Secrets and variables → Actions

### Step 5: Verify No Credentials in Code

Search for hardcoded credentials:

```bash
# Search for potential secrets in tracked files
git grep -i "password\|secret\|api_key\|token" -- "*.ts" "*.tsx" "*.js" "*.jsx"
```

### Step 6: Audit Access

- Review GitHub repository access (who has access?)
- Check WordPress/WooCommerce logs for unauthorized access
- Monitor for suspicious activity

## Current Status

✅ `.env.local` is in `.gitignore` (not tracked)
✅ `.env` is in `.gitignore` (not tracked)
✅ Only `.env.example` is tracked (safe - contains placeholders)

## Prevention

1. **Never commit `.env.local` or `.env`**
2. **Use `.env.example`** for documentation (with placeholder values)
3. **Use GitHub Secrets** for CI/CD
4. **Use Vercel Environment Variables** for production
5. **Regular security audits** of repository

## Need Help?

If credentials were exposed:
1. Rotate ALL affected credentials immediately
2. Monitor for unauthorized access
3. Consider using a secrets manager (AWS Secrets Manager, etc.)

