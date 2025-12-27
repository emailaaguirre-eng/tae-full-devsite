import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

    // Create email content
    const emailSubject = 'New Newsletter Sign-Up - The Artful Experience';
    const emailBody = `
New Newsletter Sign-Up

Name: ${name}
Email: ${email}
Date: ${new Date().toLocaleString()}

This is an automated message from The Artful Experience website newsletter sign-up form.
    `.trim();

    // Configure nodemailer transporter
    // You can use SMTP, Gmail, SendGrid, etc.
    // For now, we'll use a simple SMTP configuration
    // You'll need to set these environment variables:
    // SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
    
    let transporter;
    
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      // Use configured SMTP
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Fallback: Use Gmail OAuth or a test account
      // For production, you should configure proper SMTP settings
      console.warn('SMTP not configured. Using test mode. Please set SMTP_HOST, SMTP_USER, SMTP_PASS in environment variables.');
      
      // Create a test transporter (won't actually send emails)
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'test@example.com',
          pass: 'test',
        },
      });
      
      // Log the email for now (in production, configure SMTP)
      console.log('Newsletter Sign-Up (Email not sent - SMTP not configured):', {
        to: 'info@theartfulexperience.com',
        subject: emailSubject,
        body: emailBody,
      });
    }

    // Send email
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: 'info@theartfulexperience.com',
          subject: emailSubject,
          text: emailBody,
          html: `
            <h2>New Newsletter Sign-Up</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <p>This is an automated message from The Artful Experience website newsletter sign-up form.</p>
          `,
        });
        console.log('Newsletter sign-up email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Still return success to user, but log the error
      // In production, you might want to handle this differently
    }

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

