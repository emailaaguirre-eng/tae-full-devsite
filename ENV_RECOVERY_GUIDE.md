# Environment Variables Recovery Guide

Since your Vercel account was deleted, here's how to recover all your environment variables.

## 🔍 Where to Find Each Variable

### 1. WordPress URL (REQUIRED)
**Variable:** `WP_API_BASE` or `NEXT_PUBLIC_WORDPRESS_URL`

**Where to find it:**
- Your WordPress site URL: `https://theartfulexperience.com`
- Use either:
  - `WP_API_BASE=https://theartfulexperience.com/wp-json`
  - OR `NEXT_PUBLIC_WORDPRESS_URL=https://theartfulexperience.com`

**Test it:** Visit `https://theartfulexperience.com/wp-json` - you should see JSON output

---

### 2. WordPress Application Password (OPTIONAL - only if REST API requires auth)
**Variables:** `WP_APP_USER` and `WP_APP_PASS`

**Where to create it:**
1. Go to WordPress Admin: `https://theartfulexperience.com/wp-admin`
2. Navigate to: **Users → Your Profile** (or **Users → All Users → Edit User**)
3. Scroll to **Application Passwords** section
4. Enter a name: `Next.js Website`
5. Click **Add New Application Password**
6. Copy the password shown (you won't see it again!)
7. Use your WordPress username for `WP_APP_USER`
8. Use the generated password for `WP_APP_PASS`

**Note:** Only needed if your WordPress REST API requires authentication

---

### 3. WooCommerce API Keys (REQUIRED for products/orders)
**Variables:** `WOOCOMMERCE_CONSUMER_KEY` and `WOOCOMMERCE_CONSUMER_SECRET`

**Where to create them:**
1. Go to WordPress Admin: `https://theartfulexperience.com/wp-admin`
2. Navigate to: **WooCommerce → Settings → Advanced → REST API**
3. Click **Add Key**
4. Fill in:
   - **Description:** `Next.js Website Integration`
   - **User:** Select your admin user
   - **Permissions:** Select **Read/Write** (needed for orders)
5. Click **Generate API Key**
6. **IMMEDIATELY COPY:**
   - **Consumer Key:** `ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Consumer Secret:** `cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **The secret won't be shown again!**

**Alternative Variable:** `NEXT_PUBLIC_WOOCOMMERCE_URL` (if different from WordPress URL)
- Usually same as WordPress URL: `https://theartfulexperience.com`

---

### 4. Site URL (OPTIONAL - for absolute URLs)
**Variable:** `NEXT_PUBLIC_SITE_URL`

**For local development:**
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

**For production (when you redeploy):**
- `NEXT_PUBLIC_SITE_URL=https://your-new-vercel-url.vercel.app`
- Or leave it blank - Vercel auto-detects it

---

### 5. Email Service (OPTIONAL - for contact forms)
**Variable:** `RESEND_API_KEY`

**If you were using Resend:**
1. Go to https://resend.com
2. Sign in (or create account)
3. Go to **API Keys**
4. Create new key or use existing one
5. Copy the API key

**Alternative:** You can use WordPress to send emails instead (no API key needed)

---

### 6. Gelato Print API (OPTIONAL - only if using Gelato)
**Variables:** `GELATO_API_KEY` and `GELATO_API_URL`

**Where to find:**
1. Go to Gelato dashboard
2. Navigate to API settings
3. Generate or copy API key
4. `GELATO_API_URL` is usually: `https://order.gelatoapis.com/v4`

**Note:** Only needed if you're using Gelato for print fulfillment

---

### 7. Cloudinary (OPTIONAL - only if using Cloudinary for images)
**Variables:** `CLOUDINARY_UPLOAD_URL` and `CLOUDINARY_UPLOAD_PRESET`

**Where to find:**
1. Go to Cloudinary dashboard
2. Copy upload URL and preset name

**Note:** You might be using WordPress media library instead (no Cloudinary needed)

---

### 8. Admin Panel Access (OPTIONAL)
**Variables:** `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- OR `ADMIN_USERS=user1:pass1,user2:pass2` (multiple admins)

**Create your own:**
- Choose any username/password for the admin panel
- This is separate from WordPress credentials

---

## 📝 Quick Setup Checklist

### Minimum Required (to get site working):
- [ ] `WP_API_BASE` or `NEXT_PUBLIC_WORDPRESS_URL` - Your WordPress URL
- [ ] `WOOCOMMERCE_CONSUMER_KEY` - From WooCommerce settings
- [ ] `WOOCOMMERCE_CONSUMER_SECRET` - From WooCommerce settings

### Recommended:
- [ ] `WP_APP_USER` - WordPress username (if REST API needs auth)
- [ ] `WP_APP_PASS` - WordPress app password (if REST API needs auth)
- [ ] `NEXT_PUBLIC_SITE_URL` - Your site URL (for local: `http://localhost:3000`)

### Optional (only if you were using these):
- [ ] `RESEND_API_KEY` - For email sending
- [ ] `GELATO_API_KEY` - For print orders
- [ ] `CLOUDINARY_UPLOAD_URL` - For image hosting
- [ ] `ADMIN_USERNAME` / `ADMIN_PASSWORD` - For admin panel

---

## 🚀 Next Steps

1. **Open `.env.local`** in your project: `C:\Users\email\tae-full-devsite\.env.local`

2. **Fill in the values** you can retrieve from WordPress/WooCommerce

3. **Test the connection:**
   ```bash
   npm run dev
   # Then visit: http://localhost:3000/api/woocommerce/test
   ```

4. **If you need help finding any specific value**, let me know which one and I'll guide you!

---

## 💡 Pro Tip

**Save your environment variables in a secure password manager** (like 1Password, LastPass, or Bitwarden) so you don't lose them again!

---

## 🔐 Security Note

Never commit `.env.local` to Git (it's already in `.gitignore`). When you redeploy:
- If using Vercel: Add variables in Vercel dashboard
- If using another platform: Add them in that platform's environment variable settings

