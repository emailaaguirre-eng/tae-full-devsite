import { NextResponse } from "next/server";
import crypto from 'crypto';

// Simple admin authentication
// In production, use proper authentication (NextAuth.js, etc.)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Generate a simple token (in production, use JWT)
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = generateToken();
      
      // In production, store token in database or use sessions
      // For now, return token (client should store it)
      
      return NextResponse.json({
        success: true,
        token,
        message: 'Login successful',
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
