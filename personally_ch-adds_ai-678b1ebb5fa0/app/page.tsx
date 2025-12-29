"use client";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Logo from "./assets/images/logo-white.svg";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function Login() {
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    // SECURITY: Only remember email, never password (XSS can steal localStorage)
    const remembered = localStorage.getItem("rememberMe") === "true";
    const savedEmail = localStorage.getItem("rememberedEmail") || "";
    setRemember(remembered);
    if (remembered) {
      setUserEmail(savedEmail);
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    // Custom validation
    let hasError = false;

    if (!userEmail) {
      setEmailError("Username or email field is required");
      hasError = true;
    } else if (userEmail.includes("@") && !isValidEmail(userEmail)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password field is required");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      // SECURITY: Only save email, never password (XSS can steal localStorage)
      if (remember) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("rememberedEmail", userEmail);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberedEmail");
      }
      // Clean up any previously stored password (security migration)
      localStorage.removeItem("rememberedPassword");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await login(data);
        router.push("/dashboard");
      } else {
        setError(data.error || "Login failed");
        console.error("Login failed:", data);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary px-4 relative overflow-hidden login-wrapper">
      <div className="flex flex-col items-center mb-16">
        <Image src={Logo} alt="logo" className="max-w-[200px]" />
      </div>

      {/* Card */}
      <Card className="relative bg-white w-full max-w-[500px] mx-auto rounded-2xl shadow-lg border-none px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center p-0 mb-12">
            <CardTitle className="text-3xl font-600">Welcome Back!</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Sign In to Continue Managing Your Earnings
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-7 p-0">
            <div className="grid gap-2 text-left  relative">
              <Label className="gap-1" htmlFor="email">
                Username or Email <span className="text-red-700">*</span>
              </Label>
              <Input
                id="email"
                type="text"
                value={userEmail}
                onChange={(e) => {
                  const value = e.target.value;
                  setUserEmail(value);

                  // Clear errors when user starts typing
                  if (emailError) {
                    setEmailError("");
                  }
                  if (error) {
                    setError("");
                  }

                  // Real-time validation
                  if (!value) {
                    setEmailError("Username or email field is required");
                  } else if (value.includes("@") && !isValidEmail(value)) {
                    setEmailError("Please enter a valid email address");
                  } else {
                    setEmailError("");
                  }
                }}
                placeholder="Username or email"
                autoComplete="username"
              />
              {emailError && (
                <p className="text-red-700 text-xs validation-error">
                  {emailError}
                </p>
              )}
            </div>
            <div className="grid gap-2 text-left relative">
              <Label className="gap-1" htmlFor="password">
                Password<span className="text-red-700">*</span>
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPassword(value);

                    // Clear errors when user starts typing
                    if (passwordError) {
                      setPasswordError("");
                    }
                    if (error) {
                      setError("");
                    }

                    // Real-time validation
                    if (!value) {
                      setPasswordError("Password field is required");
                    } else if (value.length < 6) {
                      setPasswordError(
                        "Password must be at least 6 characters"
                      );
                    } else {
                      setPasswordError("");
                    }
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 text-gray-400 hover:text-gray-700 "
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-700 text-xs validation-error">
                  {passwordError}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(!!checked)}
                />
                <Label htmlFor="remember" className="text-sm font-normal">
                  Remember me
                </Label>
              </div>
              <Link
                href="/forgotPassword"
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            {error && (
              <div className="text-red-700 text-sm mt-2 text-center">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-8 mt-8 p-0">
            <Button className="w-full text-white" type="submit">
              Sign In
            </Button>
            <span className="text-sm text-center text-gray-500">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline"
              >
                Sign Up
              </Link>
            </span>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
