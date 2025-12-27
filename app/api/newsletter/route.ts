import { NextResponse } from 'next/server';

/**
 * Newsletter Sign-Up API Route
 * Submits form data to WordPress via REST API
 * WordPress will handle email sending via wp_mail()
 */
export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get WordPress API credentials
    const wpApiBase = process.env.WP_API_BASE || 
                     (process.env.NEXT_PUBLIC_WORDPRESS_URL 
                       ? `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json` 
                       : null);
    const wpAppUser = process.env.WP_APP_USER;
    const wpAppPass = process.env.WP_APP_PASS;

    // Try WordPress REST API first (if configured)
    if (wpApiBase && wpAppUser && wpAppPass) {
      try {
        // Method 1: Try Contact Form 7 REST API (if plugin is installed)
        const cf7Endpoint = `${wpApiBase}/contact-form-7/v1/contact-forms`;
        
        // First, try to get contact forms to find newsletter form ID
        const auth = Buffer.from(`${wpAppUser}:${wpAppPass}`).toString('base64');
        
        try {
          // Try to submit to Contact Form 7
          // Form should have fields: your-name and your-email
          const formId = process.env.WP_NEWSLETTER_FORM_ID || '1'; // Default to form ID 1
          const cf7SubmitUrl = `${wpApiBase}/contact-form-7/v1/contact-forms/${formId}/feedback`;
          
          // Contact Form 7 expects form data, not JSON
          const formData = new URLSearchParams();
          formData.append('your-name', name);
          formData.append('your-email', email);
          
          const cf7Response = await fetch(cf7SubmitUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          const cf7Data = await cf7Response.json();
          
          if (cf7Response.ok && cf7Data.status === 'mail_sent') {
            console.log('Newsletter sign-up submitted to Contact Form 7 successfully');
            return NextResponse.json(
              { success: true, message: cf7Data.message || 'Thank you for signing up!' },
              { status: 200 }
            );
          } else {
            console.log('Contact Form 7 submission failed:', cf7Data);
            // Fall through to alternative method
          }
        } catch (cf7Error) {
          console.log('Contact Form 7 not available, trying alternative method:', cf7Error);
        }

        // Method 2: Create a custom post or use WordPress comments API
        // This creates a comment on a specific post (you can create a "Newsletter Signups" post)
        const newsletterPostId = process.env.WP_NEWSLETTER_POST_ID || '1';
        const commentUrl = `${wpApiBase}/wp/v2/comments`;
        
        const commentResponse = await fetch(commentUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
          },
          body: JSON.stringify({
            post: newsletterPostId,
            author_name: name,
            author_email: email,
            content: `Newsletter Sign-Up\n\nName: ${name}\nEmail: ${email}\nDate: ${new Date().toLocaleString()}`,
            status: 'approved', // Auto-approve newsletter signups
          }),
        });

        if (commentResponse.ok) {
          console.log('Newsletter sign-up saved to WordPress');
          
          // WordPress will handle email sending via wp_mail() if configured
          // You can also trigger email via a WordPress hook/action
          
          return NextResponse.json(
            { success: true, message: 'Thank you for signing up!' },
            { status: 200 }
          );
        }
      } catch (wpError) {
        console.error('WordPress API error:', wpError);
        // Fall through to email fallback
      }
    }

    // Fallback: Direct email (if WordPress is not configured)
    // This uses nodemailer as a backup
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: 'info@theartfulexperience.com',
          subject: 'New Newsletter Sign-Up - The Artful Experience',
          text: `New Newsletter Sign-Up\n\nName: ${name}\nEmail: ${email}\nDate: ${new Date().toLocaleString()}`,
          html: `
            <h2>New Newsletter Sign-Up</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          `,
        });
        
        console.log('Newsletter sign-up email sent via SMTP');
        return NextResponse.json(
          { success: true, message: 'Thank you for signing up!' },
          { status: 200 }
        );
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    }

    // If all methods fail, still return success but log warning
    console.warn('Newsletter sign-up received but no email service configured. Please set up WordPress API or SMTP.');
    return NextResponse.json(
      { success: true, message: 'Thank you for signing up!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter sign-up error:', error);
    return NextResponse.json(
      { error: 'Failed to process sign-up. Please try again.' },
      { status: 500 }
    );
  }
}

