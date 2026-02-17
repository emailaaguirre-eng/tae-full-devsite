import { NextResponse } from 'next/server';
import { getDb, artKeys, generateId } from '@/lib/db';
import { saveDatabase } from '@/db';
import { generateQRCode, getArtKeyPortalUrl } from '@/lib/qr';

export const dynamic = 'force-dynamic';

function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET() {
  try {
    const db = await getDb();
    const allKeys = await db.select().from(artKeys).all();

    allKeys.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const domain = process.env.ARTKEY_DOMAIN || 'artkey.theartfulexperience.com';

    const mapped = allKeys.map(k => ({
      id: k.id,
      publicToken: k.publicToken,
      ownerToken: k.ownerToken,
      ownerEmail: k.ownerEmail,
      title: k.title,
      portalUrl: `https://${domain}/${k.publicToken}`,
      editUrl: `/art-key/${k.publicToken}/edit?owner=${k.ownerToken}`,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: any) {
    console.error('Failed to fetch artkey demos:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch artkey demos' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();

    const { title, ownerEmail, theme, features, links, spotify, featuredVideo } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = new Date().toISOString();
    const publicToken = generateToken(32);
    const ownerToken = generateToken(32);

    await db.insert(artKeys).values({
      id,
      publicToken,
      ownerToken,
      ownerEmail: ownerEmail || null,
      title,
      theme: JSON.stringify(theme || {}),
      features: JSON.stringify(features || {
        enable_gallery: true,
        enable_video: false,
        show_guestbook: true,
        enable_custom_links: true,
        enable_spotify: false,
        allow_img_uploads: true,
        allow_vid_uploads: false,
        gb_btn_view: true,
        gb_signing_status: 'open',
        gb_signing_start: '',
        gb_signing_end: '',
        gb_require_approval: true,
        img_require_approval: true,
        vid_require_approval: true,
        order: ['gallery', 'guestbook', 'links'],
      }),
      links: JSON.stringify(links || []),
      spotify: JSON.stringify(spotify || { url: '', autoplay: false }),
      featuredVideo: JSON.stringify(featuredVideo || null),
      customizations: JSON.stringify({}),
      uploadedImages: JSON.stringify([]),
      uploadedVideos: JSON.stringify([]),
      createdAt: now,
      updatedAt: now,
    });

    await saveDatabase();

    const domain = process.env.ARTKEY_DOMAIN || 'artkey.theartfulexperience.com';
    const portalUrl = `https://${domain}/${publicToken}`;

    let qrCodeDataUrl: string | null = null;
    try {
      qrCodeDataUrl = await generateQRCode(portalUrl, 300, 2);
    } catch (qrErr) {
      console.error('QR generation failed:', qrErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        publicToken,
        ownerToken,
        title,
        portalUrl,
        editUrl: `/art-key/${publicToken}/edit?owner=${ownerToken}`,
        qrCodeDataUrl,
      },
    });
  } catch (err: any) {
    console.error('Failed to create artkey demo:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create artkey demo' },
      { status: 500 }
    );
  }
}
