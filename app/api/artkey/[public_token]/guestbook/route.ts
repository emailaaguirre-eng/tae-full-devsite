import { NextRequest, NextResponse } from 'next/server';
import { getDb, artKeys, artkeyGuestbookEntries, eq, generateId } from '@/lib/db';

/**
 * Guestbook Posting API
 * Allows guests to post entries to the guestbook
 * Respects feature flags from customization JSON
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ public_token: string }> }
) {
  try {
    const db = await getDb();
    const { public_token } = await params;
    const body = await request.json();
    const { name, message } = body;

    // Validate input
    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    // Find ArtKey by public token
    const artKey = await db.select().from(artKeys).where(eq(artKeys.publicToken, public_token)).get();

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found' },
        { status: 404 }
      );
    }

    // Parse customization to check feature flags
    let customization: Record<string, any> = {};
    if (artKey.customization) {
      try {
        customization = JSON.parse(artKey.customization);
      } catch (e) {
        console.error('Error parsing customization JSON:', e);
      }
    }

    const features = customization.features || {
      show_guestbook: artKey.guestbookEnabled ?? true,
      gb_signing_status: 'open',
      gb_signing_start: '',
      gb_signing_end: '',
    };

    // Check if guestbook is enabled
    if (!features.show_guestbook && !artKey.guestbookEnabled) {
      return NextResponse.json(
        { error: 'Guestbook is not enabled for this ArtKey' },
        { status: 403 }
      );
    }

    // Check signing status
    if (features.gb_signing_status === 'closed') {
      return NextResponse.json(
        { error: 'Guestbook signing is currently closed' },
        { status: 403 }
      );
    }

    if (features.gb_signing_status === 'scheduled') {
      const now = new Date();
      const start = features.gb_signing_start ? new Date(features.gb_signing_start) : null;
      const end = features.gb_signing_end ? new Date(features.gb_signing_end) : null;

      if (start && end && (now < start || now > end)) {
        return NextResponse.json(
          { error: 'Guestbook signing is not currently available' },
          { status: 403 }
        );
      }
    }

    // Create guestbook entry
    const entryId = generateId();
    const now = new Date().toISOString();

    await db.insert(artkeyGuestbookEntries).values({
      id: entryId,
      artkeyId: artKey.id,
      senderName: name.trim(),
      message: message.trim(),
      createdAt: now,
    });

    // Get the created entry
    const entry = await db
      .select()
      .from(artkeyGuestbookEntries)
      .where(eq(artkeyGuestbookEntries.id, entryId))
      .get();

    return NextResponse.json({
      success: true,
      entry: {
        id: entry?.id,
        name: entry?.senderName,
        message: entry?.message,
        createdAt: entry?.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating guestbook entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create guestbook entry' },
      { status: 500 }
    );
  }
}
