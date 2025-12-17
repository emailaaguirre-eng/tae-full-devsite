import { NextResponse } from 'next/server';
import { uploadImageToGelato } from '@/lib/gelato';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const result = await uploadImageToGelato(file);

    return NextResponse.json({
      success: true,
      fileUrl: result.url,
      fileId: result.id,
    });
  } catch (error) {
    console.error('Error uploading to Gelato:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

