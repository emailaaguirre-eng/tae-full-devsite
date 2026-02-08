import { NextRequest, NextResponse } from "next/server";
import { getDb, artKeys, desc } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Admin ArtKeys API
 * Lists all ArtKeys for admin management
 * Now uses Drizzle ORM instead of Prisma
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const db = await getDb();
    // Fetch all ArtKeys from database using Drizzle
    const artKeysList = await db
      .select()
      .from(artKeys)
      .orderBy(desc(artKeys.createdAt))
      .limit(100) // Limit to 100 most recent
      .all();

    // Format ArtKeys for admin display
    const formattedArtKeys = artKeysList.map((artKey) => ({
      id: artKey.id,
      token: artKey.publicToken,
      title: artKey.title,
      createdAt: artKey.createdAt,
      updatedAt: artKey.updatedAt,
    }));

    return NextResponse.json({
      artkeys: formattedArtKeys,
      total: artKeysList.length,
    });
  } catch (err: any) {
    console.error('Error fetching ArtKeys:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch ArtKeys' },
      { status: 500 }
    );
  }
}
