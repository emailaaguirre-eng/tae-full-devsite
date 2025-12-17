import { NextResponse } from "next/server";
import crypto from 'crypto';

// Generate a simple token (in production, use JWT)
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Parse admin users from environment variable
// Format: "username1:password1,username2:password2" or JSON array
function getAdminUsers() {
  const adminsEnv = process.env.ADMIN_USERS;
  
  // If ADMIN_USERS is set, parse it
  if (adminsEnv) {
    try {
      // Try parsing as JSON first
      const jsonAdmins = JSON.parse(adminsEnv);
      if (Array.isArray(jsonAdmins)) {
        return jsonAdmins;
      }
    } catch {
      // If not JSON, try comma-separated format: "user1:pass1,user2:pass2"
      const admins: Array<{ username: string; password: string }> = [];
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
  
  // Fallback to single admin from separate env vars (backward compatibility)
  const singleUsername = process.env.ADMIN_USERNAME || 'admin';
  const singlePassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  return [{ username: singleUsername, password: singlePassword }];
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const adminUsers = getAdminUsers();
    
    // Check if credentials match any admin
    const admin = adminUsers.find(
      (admin) => admin.username === username && admin.password === password
    );
    
    if (admin) {
      const token = generateToken();
      
      // In production, store token in database or use sessions
      // For now, return token (client should store it)
      
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
    return NextResponse.json(
      { error: err.message || 'Login failed' },
      { status: 500 }
    );
  }
}
