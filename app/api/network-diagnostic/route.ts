import { NextResponse } from 'next/server';
import { testWordPressConnection } from '@/lib/network-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wpUrl = searchParams.get('url') || 
                  process.env.NEXT_PUBLIC_WORDPRESS_URL || 
                  process.env.NEXT_PUBLIC_WOOCOMMERCE_URL;
    
    if (!wpUrl) {
      return NextResponse.json({
        error: 'No WordPress URL configured',
        instructions: 'Set NEXT_PUBLIC_WORDPRESS_URL in .env.local or add ?url=https://your-site.com to the URL',
        envVars: {
          NEXT_PUBLIC_WORDPRESS_URL: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'NOT SET',
          NEXT_PUBLIC_WOOCOMMERCE_URL: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || 'NOT SET',
          WP_API_BASE: process.env.WP_API_BASE || 'NOT SET',
        },
      }, { status: 400 });
    }
    
    const result = await testWordPressConnection(wpUrl);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      wordpressUrl: wpUrl,
      testResult: result,
      recommendations: result.success ? [] : [
        'Check if WordPress site is accessible',
        'Verify CORS settings in WordPress',
        'Check if REST API is enabled',
        'Verify the URL is correct',
        'Check network connectivity',
      ],
    }, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Diagnostic test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
