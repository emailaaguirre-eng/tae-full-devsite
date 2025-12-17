import { NextResponse } from "next/server";
import { fetchArtKey } from "@/lib/wp";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const data = await fetchArtKey(token);
    
    // Add X-Robots-Tag header to prevent indexing
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      {
        status: 500,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  }
}
