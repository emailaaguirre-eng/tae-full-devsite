import { NextRequest, NextResponse } from 'next/server';
import { getDb, artKeys, artkeyGuestbookEntries, eq, and } from '@/lib/db';

/**
 * Guestbook Moderation API
 * Allows owner to delete guestbook entries
 * Only accessible with owner_token
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ owner_token: string }> }
) {
  try {
    const db = await getDb();
    const { owner_token } = await params;
    const body = await request.json();
    const { entry_id, action } = body;

    if (!entry_id || !action) {
      return NextResponse.json(
        { error: 'entry_id and action are required' },
        { status: 400 }
      );
    }

    if (!['delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be delete' },
        { status: 400 }
      );
    }

    // Find ArtKey by owner token
    const artKey = await db.select().from(artKeys).where(eq(artKeys.ownerToken, owner_token)).get();

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found or invalid owner token' },
        { status: 404 }
      );
    }

    // Find the guestbook entry and verify it belongs to this ArtKey
    const entry = await db
      .select()
      .from(artkeyGuestbookEntries)
      .where(
        and(
          eq(artkeyGuestbookEntries.id, entry_id),
          eq(artkeyGuestbookEntries.artkeyId, artKey.id)
        )
      )
      .get();

    if (!entry) {
      return NextResponse.json(
        { error: 'Guestbook entry not found' },
        { status: 404 }
      );
    }

    // Apply the action
    if (action === 'delete') {
      await db
        .delete(artkeyGuestbookEntries)
        .where(eq(artkeyGuestbookEntries.id, entry_id));
    }

    return NextResponse.json({
      success: true,
      action,
      entry_id,
      message: `Entry ${action}d successfully`,
    });
  } catch (error: any) {
    console.error('Error moderating guestbook entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to moderate entry' },
      { status: 500 }
    );
  }
}
