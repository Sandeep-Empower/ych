// app/api/auth/verify-registration-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/otpStore';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 });
    }

    // Normalize email to match the format used in send-registration-otp
    const normalizedEmail = email.toLowerCase().trim();
    const otpKey = `registration_${normalizedEmail}`;

    console.log(`Verifying registration OTP for email: ${normalizedEmail}`);
    console.log(`Received OTP: ${otp}`);

    const validOtp = otpStore.get(otpKey);
    console.log(`Stored OTP for ${normalizedEmail}:`, validOtp);

    if (!validOtp) {
      console.log(`No registration OTP found for email: ${normalizedEmail}`);
      return NextResponse.json({
        message: 'No verification code found for this email. Please request a new code.'
      }, { status: 400 });
    }

    // Convert both to strings and trim whitespace for comparison
    const receivedOtp = String(otp).trim();
    const storedOtp = String(validOtp).trim();

    console.log(`Comparing OTPs - Received: "${receivedOtp}", Stored: "${storedOtp}"`);

    if (receivedOtp === storedOtp) {
      // Mark as verified but keep OTP until registration is complete
      console.log(`Registration OTP verified successfully for ${normalizedEmail}`);
      return NextResponse.json({
        message: 'Email verified successfully',
        verified: true
      });
    }

    console.log(`Registration OTP mismatch for ${normalizedEmail}`);
    return NextResponse.json({ message: 'Invalid verification code. Please try again.' }, { status: 400 });

  } catch (error) {
    console.error('Error verifying registration OTP:', error);
    return NextResponse.json({
      message: 'Failed to verify code. Please try again.'
    }, { status: 500 });
  }
}
