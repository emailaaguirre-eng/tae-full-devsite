import { NextResponse } from 'next/server';

// TODO: Implement uploadImageToGelato function in @/lib/gelato
// This route is currently disabled until the function is implemented
export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'Image upload to Gelato is not yet implemented' },
    { status: 501 }
  );
}

