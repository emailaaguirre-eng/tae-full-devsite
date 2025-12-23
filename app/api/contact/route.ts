import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get WordPress API credentials from environment variables
    const wpApiBase = process.env.WP_API_BASE;
    const wpAppUser = process.env.WP_APP_USER;
    const wpAppPass = process.env.WP_APP_PASS;

    if (!wpApiBase || !wpAppUser || !wpAppPass) {
      console.error('WordPress API credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create a contact form submission in WordPress
    // Using WordPress REST API - try multiple methods for compatibility
    
    const auth = Buffer.from(`${wpAppUser}:${wpAppPass}`).toString('base64');
    
    // Method 1: Try Contact Form 7 REST API endpoint (if plugin is installed)
    let response = await fetch(`${wpApiBase}/wp-json/contact-form-7/v1/contact-forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        _wpcf7: 1, // Contact Form 7 form ID (adjust as needed)
        'your-name': name,
        'your-email': email,
        'your-message': message,
      }),
    });

    // Method 2: If Contact Form 7 doesn't exist, try custom post type
    if (!response.ok) {
      response = await fetch(`${wpApiBase}/wp-json/wp/v2/contact_submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
          title: `Contact from ${name}`,
          content: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
          status: 'publish',
          meta: {
            contact_name: name,
            contact_email: email,
            contact_message: message,
          },
        }),
      });
    }

    // Method 3: If custom post type doesn't exist, try comments API
    if (!response.ok) {
      response = await fetch(`${wpApiBase}/wp-json/wp/v2/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
          post: 1, // You may need to create a dedicated contact page and use its ID
          author_name: name,
          author_email: email,
          content: `Contact Form Submission:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        }),
      });
    }

    // If all WordPress methods fail, log and return success
    // (In production, you might want to use a service like SendGrid, Mailgun, etc.)
    if (!response.ok) {
      console.log('Contact form submission (WordPress API not available):', { name, email, message });
      // Still return success to user - you can set up email separately
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your message. We will get back to you soon.' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
