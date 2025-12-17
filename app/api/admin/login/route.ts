import { NextResponse } from "next/server";
import crypto from 'crypto';

// Generate a simple token (in production, use JWT)
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Parse admin users from environment variables
// Supports multiple formats:
// 1. ADMIN_USERS (JSON or comma-separated)
// 2. ADMIN1_USERNAME/ADMIN1_PASSWORD, ADMIN2_USERNAME/ADMIN2_PASSWORD, etc.
// 3. ADMIN_USERNAME/ADMIN_PASSWORD (single admin, backward compatible)
function getAdminUsers() {
  const admins: Array<{ username: string; password: string }> = [];
  
  // Method 1: Check for ADMIN_USERS (JSON or comma-separated)
  const adminsEnv = process.env.ADMIN_USERS;
  if (adminsEnv) {
    try {
      // Try parsing as JSON first
      const jsonAdmins = JSON.parse(adminsEnv);
      if (Array.isArray(jsonAdmins)) {
        return jsonAdmins;
      }
    } catch {
      // If not JSON, try comma-separated format: "user1:pass1,user2:pass2"
      const pairs = adminsEnv.split(',');
      for (const pair of pairs) {
        const [username, password] = pair.split(':').map(s => s.trim());
        if (username && password) {
          admins.push({ username, password });
        }
      }
      if (admins.length > 0) {
        return admins;
      }
    }
  }
  
  // Method 2: Check for numbered admin variables (ADMIN1_USERNAME, ADMIN2_USERNAME, etc.)
  let adminIndex = 1;
  while (true) {
    const usernameKey = `ADMIN${adminIndex}_USERNAME`;
    const passwordKey = `ADMIN${adminIndex}_PASSWORD`;
    const username = process.env[usernameKey];
    const password = process.env[passwordKey];
    
    if (username && password) {
      admins.push({ username, password });
      adminIndex++;
    } else {
      break; // Stop when we find a missing admin
    }
  }
  
  // Method 3: Fallback to single admin from separate env vars (backward compatibility)
  if (admins.length === 0) {
    const singleUsername = process.env.ADMIN_USERNAME || 'admin';
    const singlePassword = process.env.ADMIN_PASSWORD || 'admin123';
    return [{ username: singleUsername, password: singlePassword }];
  }
  
  return admins;
}

// GET handler for testing admin configuration
export async function GET() {
  console.log('[LOGIN API] GET request received');
  try {
    const adminUsers = getAdminUsers();
    console.log('[LOGIN API] GET - Admin users found:', adminUsers.length);
    return NextResponse.json({
      success: true,
      message: 'Login API is accessible',
      adminConfig: {
        adminCount: adminUsers.length,
        admins: adminUsers.map(a => ({ username: a.username })),
        defaultCredentials: adminUsers.length > 0 ? {
          username: adminUsers[0].username,
          note: 'Use the password you set in environment variables, or default: admin123'
        } : null,
      },
      environment: {
        hasAdminUsers: !!process.env.ADMIN_USERS,
        hasAdmin1: !!(process.env.ADMIN1_USERNAME && process.env.ADMIN1_PASSWORD),
        hasAdminUsername: !!process.env.ADMIN_USERNAME,
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (err: any) {
    console.error('[LOGIN API] GET Error:', err);
    return NextResponse.json(
      { error: err.message || 'Test failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('[LOGIN API] POST request received');
  try {
    const body = await request.json();
    const { username, password } = body;
    
    console.log('[LOGIN API] Username received:', username);
    console.log('[LOGIN API] Password length:', password?.length || 0);
    
    if (!username || !password) {
      console.log('[LOGIN API] Missing username or password');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    const adminUsers = getAdminUsers();
    console.log('[LOGIN API] Admin users found:', adminUsers.length);
    console.log('[LOGIN API] Admin usernames:', adminUsers.map(a => a.username));
    
    // Check if credentials match any admin
    const admin = adminUsers.find(
      (admin) => admin.username === username && admin.password === password
    );
    
    if (admin) {
      const token = generateToken();
      console.log('[LOGIN API] Login successful for:', admin.username);
      console.log('[LOGIN API] Token generated, length:', token.length);
      
      // In production, store token in database or use sessions
      // For now, return token (client should store it)
      
      return NextResponse.json({
        success: true,
        token,
        message: 'Login successful',
        username: admin.username,
      });
    } else {
      console.log('[LOGIN API] Invalid credentials');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (err: any) {
    console.error('[LOGIN API] Error:', err);
    console.error('[LOGIN API] Error stack:', err.stack);
    return NextResponse.json(
      { error: err.message || 'Login failed' },
      { status: 500 }
    );
  }
}
