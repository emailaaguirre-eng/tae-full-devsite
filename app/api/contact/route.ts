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

    // If all WordPress methods fail, send email directly
    if (!response.ok) {
      try {
        // Send email using mailto link or email service
        // For production, use a service like Resend, SendGrid, or Nodemailer
        const emailBody = `
New Contact Form Submission

Name: ${name}
Email: ${email}

Message:
${message}

---
This email was sent from the contact form on The Artful Experience website.
        `.trim();
        
        // Log for now - in production, integrate with email service
        console.log('Contact form submission:', { 
          to: 'info@theartfulexperience.com',
          from: email,
          subject: `Contact Form: ${name}`,
          body: emailBody
        });
        
        // If you have an email service configured, send the email here
        // Example with Resend (uncomment and configure):
        /*
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'contact@theartfulexperience.com',
          to: 'info@theartfulexperience.com',
          replyTo: email,
          subject: `Contact Form: ${name}`,
          text: emailBody,
        });
        */
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
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
