import { NextResponse } from 'next/server';
import { getDb, artKeys, generateId } from '@/lib/db';
import { saveDatabase } from '@/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, product_id } = body;

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'No data provided' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date().toISOString();

    // If token provided, update existing portal
    if (data.token) {
      const existing = await db.select().from(artKeys).where(eq(artKeys.publicToken, data.token)).get();
      if (existing) {
        await db.update(artKeys).set({
          title: data.title || existing.title,
          theme: JSON.stringify(data.theme || {}),
          features: JSON.stringify(data.features || {}),
          links: JSON.stringify(data.links || []),
          spotify: JSON.stringify(data.spotify || { url: '', autoplay: false }),
          featuredVideo: JSON.stringify(data.featured_video || null),
          customizations: JSON.stringify(data.customizations || {}),
          uploadedImages: JSON.stringify(data.uploadedImages || []),
          uploadedVideos: JSON.stringify(data.uploadedVideos || []),
          updatedAt: now,
        }).where(eq(artKeys.id, existing.id));

        await saveDatabase();

        return NextResponse.json({
          success: true,
          token: existing.publicToken,
          share_url: `https://${process.env.ARTKEY_DOMAIN || 'artkey.theartfulexperience.com'}/${existing.publicToken}`,
        });
      }
    }

    // Create new portal
    const id = generateId();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let publicToken = '';
    let ownerToken = '';
    for (let i = 0; i < 32; i++) {
      publicToken += chars.charAt(Math.floor(Math.random() * chars.length));
      ownerToken += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    await db.insert(artKeys).values({
      id,
      publicToken,
      ownerToken,
      ownerEmail: null,
      title: data.title || 'My ArtKey Portal',
      theme: JSON.stringify(data.theme || {}),
      features: JSON.stringify(data.features || {}),
      links: JSON.stringify(data.links || []),
      spotify: JSON.stringify(data.spotify || { url: '', autoplay: false }),
      featuredVideo: JSON.stringify(data.featured_video || null),
      customizations: JSON.stringify(data.customizations || {}),
      uploadedImages: JSON.stringify(data.uploadedImages || []),
      uploadedVideos: JSON.stringify(data.uploadedVideos || []),
      createdAt: now,
      updatedAt: now,
    });

    await saveDatabase();

    const domain = process.env.ARTKEY_DOMAIN || 'artkey.theartfulexperience.com';

    return NextResponse.json({
      success: true,
      token: publicToken,
      owner_token: ownerToken,
      share_url: `https://${domain}/${publicToken}`,
      edit_url: `/art-key/${publicToken}/edit?owner=${ownerToken}`,
    });
  } catch (err: any) {
    console.error('ArtKey save failed:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Save failed', message: 'demo mode' },
      { status: 500 }
    );
  }
}
