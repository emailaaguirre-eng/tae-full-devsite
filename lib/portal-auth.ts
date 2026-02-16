/**
 * Portal Host Authentication
 *
 * ArtKey portals use a token-based ownership model:
 * - publicToken: 32-char token used in the portal URL (visible to guests)
 * - ownerToken: 32-char token used by the host to edit the portal
 *
 * Authentication flows:
 * 1. Owner link: /art-key/{publicToken}/edit?owner={ownerToken}
 *    - Used when the host clicks their edit link from email / order confirmation
 *    - The owner token is stored in sessionStorage for the edit session
 *
 * 2. Email login: Host enters their email to receive their owner links
 *    - System looks up all portals associated with the email
 *    - Sends a list of edit links (containing ownerTokens)
 */

import { getDb, artKeys, eq } from "@/lib/db";

/**
 * Validate that an owner token matches the portal's actual owner token
 */
export async function validateOwnerToken(
  publicToken: string,
  ownerToken: string
): Promise<{ valid: boolean; portalId?: string }> {
  const db = await getDb();

  const portals = await db
    .select()
    .from(artKeys)
    .where(eq(artKeys.publicToken, publicToken))
    .all();

  if (portals.length === 0) {
    return { valid: false };
  }

  const portal = portals[0];

  if (portal.ownerToken !== ownerToken) {
    return { valid: false };
  }

  return { valid: true, portalId: portal.id };
}

/**
 * Look up all portals owned by a given email
 */
export async function getPortalsByEmail(
  email: string
): Promise<
  Array<{
    publicToken: string;
    ownerToken: string;
    title: string;
    createdAt: string | null;
  }>
> {
  const db = await getDb();

  const portals = await db
    .select({
      publicToken: artKeys.publicToken,
      ownerToken: artKeys.ownerToken,
      title: artKeys.title,
      createdAt: artKeys.createdAt,
    })
    .from(artKeys)
    .where(eq(artKeys.ownerEmail, email))
    .all();

  return portals;
}
