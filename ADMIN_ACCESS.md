# Admin Access Information

## Admin URL

**Your admin panel is located at:**

```
https://your-vercel-site.vercel.app/manage/login
```

## Login Credentials

Set these environment variables in Vercel:

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
