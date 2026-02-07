/**
 * Site Settings API
 * GET /api/settings - Get public settings (chatbot enabled, etc.)
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json');

function getSettings(): Record<string, any> {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading settings:', error);
  }
  return { chatbotEnabled: false };
}

export async function GET() {
  const settings = getSettings();

  // Only expose public settings
  return NextResponse.json({
    chatbotEnabled: settings.chatbotEnabled ?? false,
    purchasingEnabled: settings.purchasingEnabled ?? false,
  });
}
