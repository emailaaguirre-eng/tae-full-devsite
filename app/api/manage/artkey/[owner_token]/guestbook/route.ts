import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Owner Guestbook Management API
 * Returns ALL guestbook entries (approved and pending) for owner moderation
 * Only accessible with owner_token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner_token: string }> }
) {
  try {
    const { owner_token } = await params;

    // Find ArtKey by owner token
    const artKey = await prisma.artKey.findUnique({
      where: { ownerToken: owner_token },
      include: {
        guestbookEntries: {
          orderBy: { createdAt: 'desc' },
          include: {
            replies: {
              orderBy: { createdAt: 'asc' },
              include: {
                mediaItems: true,
              },
            },
            mediaItems: true,
          },
        },
      },
    });

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found or invalid owner token' },
        { status: 404 }
      );
    }

    // Build nested structure with all entries (approved and pending)
    const guestbookMap = new Map();
    const guestbookEntries: any[] = [];

    // First pass: create map of all top-level entries
    artKey.guestbookEntries
      .filter((entry) => !entry.parentId)
      .forEach((entry) => {
        guestbookMap.set(entry.id, {
          id: entry.id,
          name: entry.name,
          email: entry.email || undefined, // Include email for owner view
          message: entry.message,
          role: entry.role || 'guest', // Include role
          approved: entry.approved,
          createdAt: entry.createdAt.toISOString(),
          children: [],
          media: entry.mediaItems.map((m) => ({
            id: m.id,
            type: m.type,
            url: m.url,
            caption: m.caption,
            approved: m.approved,
          })),
        });
        guestbookEntries.push(guestbookMap.get(entry.id));
      });

    // Second pass: add replies to their parents
    artKey.guestbookEntries
      .filter((entry) => entry.parentId)
      .forEach((entry) => {
        if (guestbookMap.has(entry.parentId)) {
          guestbookMap.get(entry.parentId).children.push({
            id: entry.id,
            name: entry.name,
            email: entry.email || undefined, // Include email for owner view
            message: entry.message,
            role: entry.role || 'guest', // Include role
            approved: entry.approved,
            createdAt: entry.createdAt.toISOString(),
            media: entry.mediaItems.map((m) => ({
              id: m.id,
              type: m.type,
              url: m.url,
              caption: m.caption,
              approved: m.approved,
            })),
          });
        }
      });

    // Count pending entries
    const pendingCount = artKey.guestbookEntries.filter((e) => !e.approved).length;

    return NextResponse.json({
      artkey_id: artKey.id,
      artkey_title: artKey.title,
      public_token: artKey.publicToken,
      entries: guestbookEntries,
      stats: {
        total: artKey.guestbookEntries.length,
        approved: artKey.guestbookEntries.filter((e) => e.approved).length,
        pending: pendingCount,
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

