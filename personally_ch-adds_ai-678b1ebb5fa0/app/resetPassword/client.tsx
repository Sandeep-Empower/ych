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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Logo from "../assets/images/logo-white.svg";
import { useSimpleToast } from "@/app/components/ui/SimpleToaster";

export default function ResetPasswordClient() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useSimpleToast();

  useEffect(() => {
    if (searchParams) {
      const emailParam = searchParams.get("email");
      if (emailParam) {
        setEmail(emailParam);
      } else {
        // If no email parameter, redirect back to forgot password
        router.push("/forgotPassword");
      }
    } else {
      router.push("/forgotPassword");
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNewPasswordError("");
    setConfirmPasswordError("");
    setIsLoading(true);

    // Custom validation
    let hasError = false;

    if (!newPassword) {
      setNewPasswordError("New password field is required");
      hasError = true;
    } else if (newPassword.length < 6) {
      setNewPasswordError("Password must be at least 6 characters long");
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Confirm password field is required");
      hasError = true;
    } else if (
      newPassword &&
      confirmPassword &&
      newPassword !== confirmPassword
    ) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    }

    if (hasError) {
      setIsLoading(false);
      return;
    }

    try {
      // ✅ API call to reset password
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      // ✅ Show success toast
      showToast({
        message:
          "Password reset successfully! Please login with your new password.",
        type: "success",
        duration: 3,
      });

      // ✅ Redirect to sign-in after a short delay to show the toast
      setTimeout(() => {
        router.push("/?resetSuccess=true");
      }, 1500);
    } catch (error) {
      console.error("Error resetting password:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again."
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
          <CardHeader className="text-center p-0 mb-10">
            <CardTitle className="text-3xl font-semibold">
              Reset Password
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-2">
              Reset your password to access account
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-8 p-0">
            <div className="grid gap-2 text-left  relative">
              <Label htmlFor="new-password">
                New Password <span className="text-red-700">*</span>
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={newPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewPassword(value);

                    // Clear errors when user starts typing
                    if (newPasswordError) {
                      setNewPasswordError("");
                    }
                    if (error) {
                      setError("");
                    }

                    // Real-time validation
                    if (!value) {
                      setNewPasswordError("New password field is required");
                    } else if (value.length < 6) {
                      setNewPasswordError(
                        "Password must be at least 6 characters long"
                      );
                    } else {
                      setNewPasswordError("");
                    }

                    // Re-validate confirm password if it exists
                    if (confirmPassword && value !== confirmPassword) {
                      setConfirmPasswordError("Passwords do not match");
                    } else if (confirmPassword && value === confirmPassword) {
                      setConfirmPasswordError("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 text-gray-400 hover:text-gray-700"
                  tabIndex={-1}
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPasswordError && (
                <p className="text-red-700 text-xs validation-error">
                  {newPasswordError}
                </p>
              )}
            </div>

            <div className="grid gap-2 text-left  relative">
              <Label htmlFor="confirm-password">
                Confirm Password <span className="text-red-700">*</span>
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setConfirmPassword(value);

                    // Clear errors when user starts typing
                    if (confirmPasswordError) {
                      setConfirmPasswordError("");
                    }
                    if (error) {
                      setError("");
                    }

                    // Real-time validation
                    if (!value) {
                      setConfirmPasswordError(
                        "Confirm password field is required"
                      );
                    } else if (newPassword && value !== newPassword) {
                      setConfirmPasswordError("Passwords do not match");
                    } else {
                      setConfirmPasswordError("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 text-gray-400 hover:text-gray-700"
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-red-700 text-xs validation-error">
                  {confirmPasswordError}
                </p>
              )}
              {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-6 mt-8 p-0">
            <Button
              className="w-full text-white"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Submit"}
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
