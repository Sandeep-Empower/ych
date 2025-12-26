"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Logo from "../assets/images/logo-white.svg";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function VerifyOtpClient() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // If no email parameter, redirect back to forgot password
      router.push("/forgotPassword");
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit code.");
      setIsLoading(false);
      return;
    }

    try {
      // ✅ API call to verify OTP
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      // ✅ Navigate to reset password page with email
      router.push(`/resetPassword?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setError(error instanceof Error ? error.message : "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary px-4 relative overflow-hidden login-wrapper">
      <div className="flex flex-col items-center mb-16">
        <Image src={Logo} alt="logo" className="max-w-[200px]" />
      </div>

      <Card className="relative bg-white w-full max-w-[500px] mx-auto rounded-2xl shadow-lg border-none px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center p-0 mb-10">
            <CardTitle className="text-3xl font-semibold">Verify Your Account</CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-2">
              We've sent a 6-digit code to your registered email
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center mb-6">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value: string) => setOtp(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {error && (
              <p className="text-sm text-red-600 mt-3">{error}</p>
            )}
          </CardContent>

          <p className="text-center text-sm text-gray-500 mb-6">
            Didn't receive code?{" "}
            <span
              className="text-primary cursor-pointer hover:underline"
              onClick={async () => {
                if (email) {
                  try {
                    await fetch("/api/auth/forgot-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    });
                    setError(""); // Clear any previous errors
                  } catch (error) {
                    setError("Failed to resend code. Please try again.");
                  }
                }
              }}
            >
              Resend
            </span>
          </p>

          <CardFooter className="flex flex-col gap-6 p-0">
            <Button className="w-full text-white" type="submit" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Continue"}
            </Button>
            <Link
              href="/"
              className="text-sm text-primary font-medium hover:underline flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sign In
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 