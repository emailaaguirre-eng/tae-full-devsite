/**
 * Admin Settings API
 * GET /api/admin/settings - Get all settings
 * PATCH /api/admin/settings - Update settings
 */

import { NextRequest, NextResponse } from 'next/server';
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

function saveSettings(settings: Record<string, any>): boolean {
  try {
    // Ensure directory exists
    const dir = path.dirname(SETTINGS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

export async function GET() {
  const settings = getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json();
    const currentSettings = getSettings();

    // Merge updates
    const newSettings = { ...currentSettings, ...updates };

    if (saveSettings(newSettings)) {
      return NextResponse.json({
        success: true,
        settings: newSettings,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save settings' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
