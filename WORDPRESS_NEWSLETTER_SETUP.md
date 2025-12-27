# WordPress Newsletter Form Setup Guide

## Quick Setup: Forminator (Current Setup)

### Your Form ID: 1708

Your form is already set up with Forminator! The shortcode is:
```
[forminator_form id="1708"]
```

### Step 1: Verify Form Fields
1. Go to WordPress Admin: `https://theartfulexperience.com/wp-admin`
2. Navigate to **Forminator → Forms**
3. Find form ID 1708 (or search for "Newsletter")
4. Make sure it has:
   - A **Name** field (field ID will be like `name-1` or `text-1`)
   - An **Email** field (field ID will be like `email-1` or `email-2`)

### Step 2: Configure Email Settings
1. Open your form (ID 1708)
2. Go to **Email Notifications** tab
3. Set **Send To:** to `info@theartfulexperience.com`
4. Set **Email Subject:** to `New Newsletter Sign-Up: {name-1}`
5. Include in email body:
   ```
   New Newsletter Sign-Up
   
   Name: {name-1}
   Email: {email-1}
   Date: {date}
   ```

### Step 3: Add to Environment Variables
Add to your `.env.local` or server environment:
```bash
WP_NEWSLETTER_FORM_ID=1708
```

### Step 4: Check Field IDs (if needed)
If the form doesn't work, you may need to check the actual field IDs:
1. In Forminator form editor, hover over each field
2. Note the field ID (e.g., `name-1`, `text-1`, `email-1`)
3. Update the API code if field IDs are different

---

## Alternative Setup: Contact Form 7

### Step 1: Install Contact Form 7
1. Go to WordPress Admin: `https://theartfulexperience.com/wp-admin`
2. Navigate to **Plugins → Add New**
3. Search for "Contact Form 7"
4. Install and activate the plugin

### Step 2: Create Newsletter Form
1. Go to **Contact → Contact Forms** in WordPress admin
2. Click **Add New**
3. Name it: "Newsletter Sign-Up"
4. In the form editor, use this simple form code:

```
<label> Your Name (required)
    [text* your-name] </label>

<label> Your Email (required)
    [email* your-email] </label>

[submit "Sign Up"]
```

### Step 3: Configure Email Settings
1. Scroll down to **Mail** tab
2. Set **To:** to `info@theartfulexperience.com`
3. Set **From:** to `[your-email] <noreply@theartfulexperience.com>`
4. Set **Subject:** to `New Newsletter Sign-Up: [your-name]`
5. Set **Message body:** to:
```
New Newsletter Sign-Up

Name: [your-name]
Email: [your-email]
Date: [_date]

This is an automated message from The Artful Experience website newsletter sign-up form.
```

### Step 4: Get Form ID
1. After saving, note the form ID from the URL or form shortcode
2. Example: `[contact-form-7 id="123" title="Newsletter Sign-Up"]`
3. The ID is `123` in this example

### Step 5: Add to Environment Variables
Add to your `.env.local` or server environment:
```bash
WP_NEWSLETTER_FORM_ID=123
```

Replace `123` with your actual form ID.

## Alternative: Simple WordPress Comments Method

If you don't want to use Contact Form 7:

### Step 1: Create a Post
1. Create a new WordPress post titled "Newsletter Signups"
2. Publish it (can be private/draft)
3. Note the post ID from the URL: `/wp-admin/post.php?post=456&action=edit`
4. The ID is `456` in this example

### Step 2: Enable Comments
1. Make sure comments are enabled on that post
2. Go to **Settings → Discussion** and ensure comments are enabled

### Step 3: Add to Environment Variables
```bash
WP_NEWSLETTER_POST_ID=456
```

Replace `456` with your actual post ID.

## Testing

After setup, test the form:
1. Go to your Next.js site
2. Click "Sign up for updates"
3. Fill in name and email
4. Submit
5. Check `info@theartfulexperience.com` for the email

## Troubleshooting

- **Form not submitting?** Check that `WP_NEWSLETTER_FORM_ID` matches your Contact Form 7 form ID
- **No email received?** Check WordPress email settings and spam folder
- **API error?** Verify `WP_API_BASE`, `WP_APP_USER`, and `WP_APP_PASS` are set correctly

