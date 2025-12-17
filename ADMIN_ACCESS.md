# Admin Access Information

## Admin URL

**Your admin panel is located at:**

```
https://your-vercel-site.vercel.app/manage/login
```

## Login Credentials

### Option 1: Numbered Admin Variables (Easiest)

Set numbered environment variables for each admin:

- **ADMIN1_USERNAME** - First admin username
- **ADMIN1_PASSWORD** - First admin password
- **ADMIN2_USERNAME** - Second admin username
- **ADMIN2_PASSWORD** - Second admin password
- **ADMIN3_USERNAME** - Third admin username
- **ADMIN3_PASSWORD** - Third admin password
- ... and so on

**Example:**
```
ADMIN1_USERNAME=admin1
ADMIN1_PASSWORD=secure-password-1
ADMIN2_USERNAME=admin2
ADMIN2_PASSWORD=secure-password-2
ADMIN3_USERNAME=sales
ADMIN3_PASSWORD=sales-password-123
```

### Option 2: ADMIN_USERS Variable

Set this environment variable in Vercel to support multiple admin users:

**ADMIN_USERS** - JSON array or comma-separated format:

**JSON Format:**
```json
[
  {"username": "admin1", "password": "secure-password-1"},
  {"username": "admin2", "password": "secure-password-2"},
  {"username": "sales", "password": "sales-password-123"}
]
```

**Comma-Separated Format:**
```
admin1:secure-password-1,admin2:secure-password-2,sales:sales-password-123
```

### Option 3: Single Admin (Backward Compatible)

Set these environment variables for a single admin:

- **ADMIN_USERNAME** - Your admin username (default: `admin`)
- **ADMIN_PASSWORD** - Your admin password (default: `admin123`)

**⚠️ IMPORTANT:** Change these from the defaults in production!

## Admin Routes

All admin routes are under `/manage/`:

- `/manage/login` - Login page
- `/manage/dashboard` - Admin dashboard
- `/manage/demos` - Demo management
- `/manage/artkeys` - ArtKey management

## SEO Protection

All `/manage/*` routes are:
- ✅ **Not indexed** by search engines (noindex)
- ✅ **Not followed** by search engines (nofollow)
- ✅ **Blocked** in robots.txt
- ✅ **Protected** with authentication

## Security Notes

1. The admin panel uses simple token-based authentication stored in localStorage
2. For production, consider upgrading to:
   - NextAuth.js for proper session management
   - JWT tokens with expiration
   - Database-backed user authentication
   - Role-based access control (RBAC)

## Quick Access

After logging in, you can access:
- Dashboard: `/manage/dashboard`
- Manage Demos: `/manage/demos`
- Manage ArtKeys: `/manage/artkeys`
