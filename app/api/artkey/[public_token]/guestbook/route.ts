import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Guestbook Posting API
 * Allows guests to post top-level entries or replies to the guestbook
 * Respects feature flags for approval requirements
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ public_token: string }> }
) {
  try {
    const { public_token } = await params;
    const body = await request.json();
    const { name, email, message, parent_id } = body;

    // Validate input
    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    // Find ArtKey by public token
    const artKey = await prisma.artKey.findUnique({
      where: { publicToken: public_token },
    });

    if (!artKey) {
      return NextResponse.json(
        { error: 'ArtKey not found' },
        { status: 404 }
      );
    }

    // Parse features to check signing status
    const features = JSON.parse(artKey.features);

    // Check if guestbook is enabled and signing is allowed
    if (!features.show_guestbook) {
      return NextResponse.json(
        { error: 'Guestbook is not enabled for this ArtKey' },
        { status: 403 }
      );
    }

    // Validate email if required
    if (features.require_email_for_guestbook && !email) {
      return NextResponse.json(
        { error: 'Email is required for guestbook entries' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
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

    // Validate parent_id if provided (must be a valid entry for this ArtKey)
    if (parent_id) {
      const parentEntry = await prisma.guestbookEntry.findFirst({
        where: {
          id: parent_id,
          artkeyId: artKey.id,
        },
      });

      if (!parentEntry) {
        return NextResponse.json(
          { error: 'Invalid parent entry' },
          { status: 400 }
        );
      }
    }

    // Determine approval status based on feature flag
    const approved = !features.gb_require_approval;

    // Create guestbook entry (role defaults to "guest" for public posts)
    const entry = await prisma.guestbookEntry.create({
      data: {
        artkeyId: artKey.id,
        parentId: parent_id || null,
        name: name.trim(),
        email: email ? email.trim() : null,
        message: message.trim(),
        role: 'guest', // Public posts are always from guests
        approved,
      },
      include: {
        mediaItems: true,
      },
    });

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        name: entry.name,
        email: entry.email,
        message: entry.message,
        parentId: entry.parentId,
        role: entry.role,
        approved: entry.approved,
        createdAt: entry.createdAt.toISOString(),
        requiresApproval: !approved,
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

