import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Admin ArtKeys API
 * Lists all ArtKeys for admin management
 * Now uses Prisma database instead of WordPress
 */
export async function GET() {
  try {
    // Fetch all ArtKeys from database
    const artKeys = await prisma.artKey.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to 100 most recent
    });

    // Format ArtKeys for admin display
    const formattedArtKeys = artKeys.map((artKey) => ({
      id: artKey.id,
      token: artKey.publicToken,
      title: artKey.title,
      createdAt: artKey.createdAt.toISOString(),
      updatedAt: artKey.updatedAt.toISOString(),
    }));

    return NextResponse.json({ 
      artkeys: formattedArtKeys,
      total: artKeys.length,
    });
  } catch (err: any) {
    console.error('Error fetching ArtKeys:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch ArtKeys' },
      { status: 500 }
    );
  }
}
