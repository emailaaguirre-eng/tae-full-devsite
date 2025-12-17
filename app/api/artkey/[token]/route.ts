import { NextResponse } from "next/server";
import { fetchArtKey } from "@/lib/wp";

export async function GET(_: Request, { params }: { params: { token: string } }) {
  try {
    const data = await fetchArtKey(params.token);
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
