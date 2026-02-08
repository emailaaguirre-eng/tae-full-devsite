import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

// Test endpoint to verify login API is accessible and check admin user configuration
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    // Check environment variables
    const hasAdminUsers = !!process.env.ADMIN_USERS;
    const hasAdmin1 = !!(process.env.ADMIN1_USERNAME && process.env.ADMIN1_PASSWORD);
    const hasAdminUsername = !!process.env.ADMIN_USERNAME;
    const hasAdminPassword = !!process.env.ADMIN_PASSWORD;
    
    // Get admin users (using the same logic as login route)
    const admins: Array<{ username: string; password: string }> = [];
    
    // Method 1: Check for ADMIN_USERS
    const adminsEnv = process.env.ADMIN_USERS;
    if (adminsEnv) {
      try {
        const jsonAdmins = JSON.parse(adminsEnv);
        if (Array.isArray(jsonAdmins)) {
          admins.push(...jsonAdmins);
        }
      } catch {
        const pairs = adminsEnv.split(',');
        for (const pair of pairs) {
          const [username, password] = pair.split(':').map(s => s.trim());
          if (username && password) {
            admins.push({ username, password: '***' }); // Hide password
          }
        }
      }
    }
    
    // Method 2: Check for numbered admin variables
    let adminIndex = 1;
    while (adminIndex <= 5) { // Check up to 5 admins
      const usernameKey = `ADMIN${adminIndex}_USERNAME`;
      const passwordKey = `ADMIN${adminIndex}_PASSWORD`;
      const username = process.env[usernameKey];
      const password = process.env[passwordKey];
      
      if (username && password) {
        admins.push({ username, password: '***' });
        adminIndex++;
      } else {
        break;
      }
    }
    
    // Method 3: Fallback
    if (admins.length === 0) {
      const singleUsername = process.env.ADMIN_USERNAME || 'admin';
      const singlePassword = process.env.ADMIN_PASSWORD || 'admin123';
      admins.push({ username: singleUsername, password: '***' });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Login API is accessible',
      adminConfig: {
        hasAdminUsers,
        hasAdmin1,
        hasAdminUsername,
        hasAdminPassword,
        adminCount: admins.length,
        admins: admins.map(a => ({ username: a.username })),
        defaultCredentials: admins.length > 0 ? {
          username: admins[0].username,
          note: 'Use the password you set in environment variables'
        } : null,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Test failed' },
      { status: 500 }
    );
  }
}
