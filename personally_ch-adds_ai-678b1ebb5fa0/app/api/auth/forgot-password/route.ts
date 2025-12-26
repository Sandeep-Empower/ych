// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import crypto from "crypto";
import { otpStore } from "@/lib/otpStore";
import { prisma } from "@/lib/prisma";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email)
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true }, // Only select necessary fields
    });

    if (!existingUser) {
      // Return a specific error for non-existent email
      // The frontend will show this message but not redirect
      console.log(
        `Password reset requested for non-existent email: ${normalizedEmail}`
      );
      return NextResponse.json(
        {
          message: "No account found with this email address.",
          emailNotFound: true,
        },
        { status: 404 }
      );
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(normalizedEmail, otp);

    console.log(`Generated OTP for ${normalizedEmail}: ${otp}`);

    // Check if SendGrid environment variables are set
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error("SendGrid credentials not configured");
      return NextResponse.json(
        { message: "Email service not configured" },
        { status: 500 }
      );
    }

    // Send email using SendGrid
    const msg = {
      to: normalizedEmail,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: "Password Reset - Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">Password Reset Request</h1>
            <p style="color: #666; font-size: 16px;">We received a request to reset your password</p>
          </div>

          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Your verification code is:</p>
            <div style="background-color: #007bff; color: white; padding: 15px 30px; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 8px; display: inline-block;">
              ${otp}
            </div>
          </div>

          <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Important:</strong> This code will expire in 10 minutes for security reasons.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't request this password reset, please ignore this email or contact support if you have concerns.
            </p>
          </div>
        </div>
      `,
      text: `
Password Reset Request

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this password reset, please ignore this email.
      `,
    };

    await sgMail.send(msg);
    console.log(`OTP sent successfully to ${normalizedEmail} via SendGrid`);

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      {
        message:
          "Failed to send OTP. Please check your email address and try again.",
      },
      { status: 500 }
    );
  }
}
