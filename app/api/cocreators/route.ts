/**
 * Public: Get cocreators list
 * Returns DB data if available, otherwise signals to use static fallback.
 */
import { NextResponse } from "next/server";
import { getDb, coCreators, eq, asc } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const allCreators = await db
      .select()
      .from(coCreators)
      .where(eq(coCreators.active, true))
      .orderBy(asc(coCreators.sortOrder))
      .all();

    if (allCreators.length === 0) {
      return NextResponse.json({ source: "static", data: [] });
    }

    return NextResponse.json({ source: "db", data: allCreators });
  } catch {
    return NextResponse.json({ source: "static", data: [] });
  }
}
