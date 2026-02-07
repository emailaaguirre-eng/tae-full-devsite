import { NextRequest, NextResponse } from 'next/server';
import { getDb, artKeys, artkeyGuestbookEntries, eq, desc } from '@/lib/db';

/**
 * Owner Guestbook Management API
 * Returns ALL guestbook entries for owner moderation
 * Only accessible with owner_token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner_token: string }> }
) {
  try {
    const db = await getDb();
    const { owner_token } = await params;

    // Find ArtKey by owner token
    const artKey = await db.select().from(artKeys).where(eq(artKeys.ownerToken, owner_token)).get();

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found or invalid owner token' },
        { status: 404 }
      );
    }

    // Get all guestbook entries for this artkey
    const guestbookEntries = await db
      .select()
      .from(artkeyGuestbookEntries)
      .where(eq(artkeyGuestbookEntries.artkeyId, artKey.id))
      .orderBy(desc(artkeyGuestbookEntries.createdAt))
      .all();

    // Format entries for the response
    const formattedEntries = guestbookEntries.map((entry) => ({
      id: entry.id,
      name: entry.senderName,
      message: entry.message,
      createdAt: entry.createdAt,
      children: [],
      media: [],
    }));

    return NextResponse.json({
      artkey_id: artKey.id,
      artkey_title: artKey.title,
      public_token: artKey.publicToken,
      entries: formattedEntries,
      stats: {
        total: guestbookEntries.length,
        approved: guestbookEntries.length, // All entries are visible in simplified schema
        pending: 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching guestbook entries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch guestbook entries' },
      { status: 500 }
    );
  }
}
