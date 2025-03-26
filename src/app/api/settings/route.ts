import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { logError } from '@/lib/services/logger';

interface Settings {
  keyRotationRequestCount: number;
  maxFailureCount: number;
  rateLimitCooldown: number;
  logRetentionDays: number;
}

const DEFAULT_SETTINGS: Settings = {
  keyRotationRequestCount: 5,
  maxFailureCount: 5,
  rateLimitCooldown: 60,
  logRetentionDays: 14,
};

// Path to settings file
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// Function to read settings
async function readSettings(): Promise<Settings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error: any) {
    // If file doesn't exist, create it with default settings
    if (error.code === 'ENOENT') {
      await writeSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    throw error;
  }
}

// Function to write settings
async function writeSettings(settings: Settings): Promise<void> {
  // Ensure data directory exists
  const dataDir = path.dirname(SETTINGS_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory already exists, ignore
  }
  
  // Write settings to file
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// GET /api/settings - Get application settings
export async function GET() {
  try {
    const settings = await readSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    logError(error, { context: 'GET /api/settings' });
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings - Update application settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const currentSettings = await readSettings();
    
    // Validate and update settings
    const newSettings: Settings = {
      keyRotationRequestCount: validateNumber(body.keyRotationRequestCount, currentSettings.keyRotationRequestCount, 1, 100),
      maxFailureCount: validateNumber(body.maxFailureCount, currentSettings.maxFailureCount, 1, 20),
      rateLimitCooldown: validateNumber(body.rateLimitCooldown, currentSettings.rateLimitCooldown, 10, 3600),
      logRetentionDays: validateNumber(body.logRetentionDays, currentSettings.logRetentionDays, 1, 90),
    };
    
    await writeSettings(newSettings);
    
    // Update environment variables
    process.env.KEY_ROTATION_REQUEST_COUNT = newSettings.keyRotationRequestCount.toString();
    
    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: newSettings
    });
  } catch (error: any) {
    logError(error, { context: 'POST /api/settings' });
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// Helper function to validate number settings
function validateNumber(value: any, defaultValue: number, min: number, max: number): number {
  const num = Number(value);
  if (isNaN(num)) return defaultValue;
  return Math.max(min, Math.min(max, num));
}