"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Logo from "../assets/images/logo-white.svg";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // ✅ Validation
    if (!email) {
      setError("Email field is required");
      setIsLoading(false);
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      // ✅ API call to send OTP
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific case where email is not found
        if (response.status === 404 && data.emailNotFound) {
          setError(data.message);
          return; // Don't redirect, just show the error
        }
        throw new Error(data.message || "Failed to send OTP");
      }

      // ✅ Navigate to verify OTP page with email (only if email exists and OTP was sent)
      router.push(`/verifyOtp?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error("Error sending OTP:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send OTP. Please try again."
      );
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
          <CardHeader className="text-center p-0 mb-12">
            <CardTitle className="text-3xl font-semibold">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              We’ll send you a 6-digit OTP to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6 p-0">
            <div className="grid gap-2 text-left  relative">
              <Label htmlFor="email">
                Email <span className="text-red-700">*</span>
              </Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);

                  // Clear error when user starts typing
                  if (error) {
                    setError("");
                  }

                  // Real-time validation
                  if (!value) {
                    setError("Email field is required");
                  } else if (!isValidEmail(value)) {
                    setError("Please enter a valid email address");
                  } else {
                    setError("");
                  }
                }}
                placeholder="Enter your email"
                autoComplete="username"
              />
              {error && (
                <p className="text-red-700 text-xs validation-error">{error}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-8 mt-8 p-0">
            <Button
              className="w-full text-white"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Reset Password"}
            </Button>

            <span className="text-sm text-center text-gray-500">
              <Link
                href="/"
                className="text-primary font-medium hover:underline flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sign In
              </Link>
            </span>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
