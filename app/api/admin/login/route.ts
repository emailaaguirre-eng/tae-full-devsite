import { NextResponse } from "next/server";
import crypto from 'crypto';
import { storeAdminToken } from '@/lib/admin-auth';

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

// GET handler — minimal health check (does NOT expose admin config)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Login API is accessible',
  });
}

export async function POST(request: Request) {
  console.log('[LOGIN API] POST request received');
  try {
    // Parse request body with timeout protection
    let body;
    try {
      const bodyText = await request.text();
      console.log('[LOGIN API] Request body received, length:', bodyText.length);
      body = JSON.parse(bodyText);
    } catch (parseError: any) {
      console.error('[LOGIN API] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    const { username, password } = body;
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    const adminUsers = getAdminUsers();
    
    // Check if credentials match any admin
    const admin = adminUsers.find(
      (admin) => admin.username === username && admin.password === password
    );
    
    if (admin) {
      const token = generateToken();

      // Store token server-side so API routes can verify it
      storeAdminToken(token, admin.username);

      return NextResponse.json({
        success: true,
        token,
        message: 'Login successful',
        username: admin.username,
      });
    } else {
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
