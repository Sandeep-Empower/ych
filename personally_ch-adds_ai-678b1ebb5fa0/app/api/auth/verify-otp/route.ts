// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/otpStore';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 });
    }

    // Normalize email to match the format used in forgot-password
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`Verifying OTP for email: ${normalizedEmail}`);
    console.log(`Received OTP: ${otp}`);

    const validOtp = otpStore.get(normalizedEmail);
    console.log(`Stored OTP for ${normalizedEmail}:`, validOtp);

    if (!validOtp) {
      console.log(`No OTP found for email: ${normalizedEmail}`);
      return NextResponse.json({
        message: 'No OTP found for this email. Please request a new OTP.'
      }, { status: 400 });
    }

    // Convert both to strings and trim whitespace for comparison
    const receivedOtp = String(otp).trim();
    const storedOtp = String(validOtp).trim();

    console.log(`Comparing OTPs - Received: "${receivedOtp}", Stored: "${storedOtp}"`);

    if (receivedOtp === storedOtp) {
      otpStore.delete(normalizedEmail);
      console.log(`OTP verified successfully for ${normalizedEmail}`);
      return NextResponse.json({ message: 'OTP verified successfully' });
    }

    console.log(`OTP mismatch for ${normalizedEmail}`);
    return NextResponse.json({ message: 'Invalid OTP. Please try again.' }, { status: 400 });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({
      message: 'Failed to verify OTP. Please try again.'
    }, { status: 500 });
  }
}
