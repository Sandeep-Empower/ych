// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/otpStore';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Apply rate limiting to prevent brute force
    const rateLimitResponse = rateLimitMiddleware(req, RATE_LIMITS.otp, 'verify-otp');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { email, otp } = await req.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 });
    }

    // Normalize email to match the format used in forgot-password
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`Verifying OTP for email: ${normalizedEmail}`);

    // SECURITY: Use the verify method with built-in attempt limiting
    const result = otpStore.verify(normalizedEmail, otp);

    if (result.valid) {
      return NextResponse.json({ message: 'OTP verified successfully' });
    }

    return NextResponse.json({ message: result.error }, { status: 400 });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({
      message: 'Failed to verify OTP. Please try again.'
    }, { status: 500 });
  }
}
