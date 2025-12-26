// app/api/auth/send-registration-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import { otpStore } from '@/lib/otpStore';
import { prisma } from '@/lib/prisma';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { email, username } = await req.json();
    if (!email) return NextResponse.json({ message: 'Email is required' }, { status: 400 });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { nicename: username }
        ]
      },
      select: { id: true, email: true, nicename: true }
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return NextResponse.json({ message: 'Email is already registered' }, { status: 409 });
      }
      if (existingUser.nicename === username) {
        return NextResponse.json({ message: 'Username is already taken' }, { status: 409 });
      }
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Store OTP with a prefix to distinguish from password reset OTPs
    const otpKey = `registration_${normalizedEmail}`;
    otpStore.set(otpKey, otp);

    console.log(`Generated registration OTP for ${normalizedEmail}: ${otp}`);

    // Check if SendGrid environment variables are set
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('SendGrid credentials not configured');
      return NextResponse.json({ message: 'Email service not configured' }, { status: 500 });
    }

    // Send email using SendGrid
    const msg = {
      to: normalizedEmail,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: 'Email Verification - Complete Your Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">Welcome to Adds AI!</h1>
            <p style="color: #666; font-size: 16px;">Please verify your email to complete registration</p>
          </div>

          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Your verification code is:</p>
            <div style="background-color: #007bff; color: white; padding: 15px 30px; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 8px; display: inline-block;">
              ${otp}
            </div>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Important:</strong> This code will expire in 10 minutes for security reasons.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't request this verification, please ignore this email.
            </p>
          </div>
        </div>
      `,
      text: `
Welcome to Adds AI!

Please verify your email to complete registration.

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this verification, please ignore this email.
      `,
    };

    await sgMail.send(msg);
    console.log(`Registration OTP sent successfully to ${normalizedEmail} via SendGrid`);

    return NextResponse.json({ message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Error sending registration OTP:', error);
    return NextResponse.json({
      message: 'Failed to send verification code. Please try again.'
    }, { status: 500 });
  }
}
