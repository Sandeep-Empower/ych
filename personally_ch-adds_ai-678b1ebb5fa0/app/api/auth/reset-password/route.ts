// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    // Validate input
    if (!email || !newPassword) {
      return NextResponse.json({ message: 'Email and new password required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`Attempting to reset password for: ${normalizedEmail}`);

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!existingUser) {
      console.log(`User not found for email: ${normalizedEmail}`);
      // For security, don't reveal if user exists or not
      return NextResponse.json({ message: 'Password reset successful' });
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password in database
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        password: hashedPassword,
        // Note: refresh_token field no longer exists in new session system
      },
    });

    // Invalidate all existing sessions for the user
    await prisma.userSession.updateMany({
      where: { user_id: existingUser.id, is_active: true },
      data: { is_active: false }
    });

    console.log(`Password successfully reset for user: ${normalizedEmail}`);

    return NextResponse.json({
      message: 'Password reset successful. You can now sign in with your new password.'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({
      message: 'Failed to reset password. Please try again.'
    }, { status: 500 });
  }
}
