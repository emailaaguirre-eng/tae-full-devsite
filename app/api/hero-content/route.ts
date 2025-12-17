import { getHeroContent } from '@/lib/wordpress';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const heroContent = await getHeroContent();
    return NextResponse.json(heroContent);
  } catch (error) {
    console.error('Error fetching hero content:', error);
    // Return defaults if error
    return NextResponse.json({
      headline1: 'Every image has a story.',
      headline2: 'Embedded within is a treasure.',
      subtitle: 'Where fine art, prints & images\nmeet your personal expression.',
      description: 'Upload an image or browse our gallery.',
    });
  }
}

