import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Fetch stats from WordPress or return mock data
  // In production, query WordPress for actual counts
  
  return NextResponse.json({
    totalArtKeys: 0, // Will be fetched from WordPress
    totalDemos: 1, // Hardcoded demo count
  });
}
