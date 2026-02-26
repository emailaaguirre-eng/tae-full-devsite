import { NextResponse } from 'next/server';
import { getDb, artKeys, guestbookEntries, mediaItems, generateId, eq } from '@/lib/db';
import { saveDatabase } from '@/db';
import { generateQRCode, getArtKeyPortalUrl } from '@/lib/qr';

export const dynamic = 'force-dynamic';
const DEMO_PREFIX = "tae_demokey_";

function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isAdminDemoPortal(portal: { publicToken: string; customizations: string }): boolean {
  if (portal.publicToken.toLowerCase().startsWith(DEMO_PREFIX)) return true;
  try {
    const parsed = JSON.parse(portal.customizations || "{}");
    return parsed?.adminDemo === true;
  } catch {
    return false;
  }
}

function nextRandomPublicToken(existing: Set<string>): string {
  for (let i = 0; i < 20; i++) {
    const token = generateToken(32);
    if (!existing.has(token)) return token;
  }
  throw new Error("Failed to generate unique public token");
}

export async function GET() {
  try {
    const db = await getDb();
    const allKeys = await db.select().from(artKeys).all();

    const demoKeys = allKeys.filter((k) => isAdminDemoPortal({
      publicToken: k.publicToken,
      customizations: k.customizations || "{}",
    }));
    demoKeys.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const domain = process.env.ARTKEY_DOMAIN || 'artkey.theartfulexperience.com';

    const mapped = demoKeys.map(k => ({
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
    const existingTokens = new Set((await db
      .select({ publicToken: artKeys.publicToken })
      .from(artKeys)
      .all()).map((r) => r.publicToken));
    const publicToken = nextRandomPublicToken(existingTokens);
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
        show_guestbook: false,
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
        order: ['links', 'gallery', 'video', 'spotify', 'guestbook'],
      }),
      links: JSON.stringify(links || []),
      spotify: JSON.stringify(spotify || { url: '', autoplay: false }),
      featuredVideo: JSON.stringify(featuredVideo || null),
      customizations: JSON.stringify({ adminDemo: true }),
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

export async function DELETE(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const publicToken =
      typeof body?.publicToken === "string" ? body.publicToken.trim() : "";

    if (!id && !publicToken) {
      return NextResponse.json(
        { success: false, error: "id or publicToken is required" },
        { status: 400 }
      );
    }

    const rows = id
      ? await db.select().from(artKeys).where(eq(artKeys.id, id)).all()
      : await db
          .select()
          .from(artKeys)
          .where(eq(artKeys.publicToken, publicToken))
          .all();

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Demo portal not found" },
        { status: 404 }
      );
    }

    const portal = rows[0];
    if (!isAdminDemoPortal({
      publicToken: portal.publicToken,
      customizations: portal.customizations || "{}",
    })) {
      return NextResponse.json(
        { success: false, error: "You can only delete admin demo keys from this page." },
        { status: 400 }
      );
    }

    await db.delete(mediaItems).where(eq(mediaItems.artkeyId, portal.id));
    await db
      .delete(guestbookEntries)
      .where(eq(guestbookEntries.artkeyId, portal.id));
    await db.delete(artKeys).where(eq(artKeys.id, portal.id));
    await saveDatabase();

    return NextResponse.json({
      success: true,
      data: { id: portal.id, publicToken: portal.publicToken },
    });
  } catch (err: any) {
    console.error("Failed to delete artkey demo:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete artkey demo" },
      { status: 500 }
    );
  }
}
