"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import Logo from "../assets/images/logo-white.svg";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "../components/ui/SimpleToaster";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

// Add this at the top for TypeScript
declare global {
  interface Window {
    grecaptcha?: any;
  }
}

const accountTypes = [
  { value: "advertiser", label: "Advertiser" },
  { value: "publisher", label: "Publisher" },
  { value: "agency", label: "Agency" },
];

const countries = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "in", label: "India" },
  // Add more countries as needed
];
//Forcountrycode
type Countrycode = {
  name: string;
  code: string;
  flag: string;
};
//end

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  // Step 1 fields
  const [accountType, setAccountType] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [teams, setTeams] = useState("");
  const [linkedin, setLinkedin] = useState("");
  // Step 2 fields
  const [company, setCompany] = useState("");
  const [vat, setVat] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [notRobot, setNotRobot] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [accountTypeError, setAccountTypeError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [companyError, setCompanyError] = useState("");
  const [countryError, setCountryError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const showToast = useToast();

  // OTP verification state
  const [otp, setOtp] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // Validation regexes
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //for country code
  const [countriescode, setCountries] = useState<Countrycode[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Countrycode | null>(
    null
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  //end
  useEffect(() => {
    if (step === 2 && typeof window !== "undefined") {
      if (!window.grecaptcha) {
        const script = document.createElement("script");
        script.src = "https://www.google.com/recaptcha/api.js";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        script.onload = () => {
          function renderCaptcha() {
            if (
              window.grecaptcha &&
              typeof window.grecaptcha.render === "function" &&
              recaptchaRef.current
            ) {
              window.grecaptcha.render(recaptchaRef.current, {
                sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
                callback: (token: string) => setCaptchaToken(token),
              });
            } else {
              setTimeout(renderCaptcha, 100);
            }
          }
          renderCaptcha();
        };
      } else if (window.grecaptcha && recaptchaRef.current) {
        window.grecaptcha.render(recaptchaRef.current, {
          sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
          callback: (token: string) => setCaptchaToken(token),
        });
      }
    }
  }, [step]);
  //for country code
  useEffect(() => {
    const fetchCountries = async () => {
      const res = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,idd,flags,cca2"
      );
      const data = await res.json();

      const formatted: Countrycode[] = data
        .filter((c: any) => c.idd?.root && c.idd?.suffixes?.length)
        .map((c: any) => ({
          name: c.name.common,
          code: `${c.idd.root}${c.idd.suffixes[0]}`,
          flag: `https://flagcdn.com/w40/${c.cca2.toLowerCase()}.png`,
        }))
        .sort((a: Countrycode, b: Countrycode) => a.name.localeCompare(b.name));

      setCountries(formatted);
      setSelectedCountry(
        formatted.find((c) => c.code === "+44") || formatted[0]
      );
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  //end

  // Validation functions
  const validateEmail = (email: string) => {
    if (email && !emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePhone = (phone: string) => {
    if (!phone || phone.trim() === "") {
      setPhoneError("Please enter your phone number");
      return false;
    }
    // Remove any spaces, dashes, or parentheses for validation
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, "");

    // Check if it contains only digits after removing country code prefix
    const phoneWithoutCountryCode = cleanedPhone.replace(/^\+\d{1,4}/, "");

    if (!/^\d{7,15}$/.test(phoneWithoutCountryCode)) {
      setPhoneError("Please enter a valid phone number (7-15 digits)");
      return false;
    }

    setPhoneError("");
    return true;
  };

  function validateStep1() {
    let isValid = true;

    // Clear all errors first
    setAccountTypeError("");
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setUsernameError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setPhoneError("");

    // Validate required fields
    if (!accountType) {
      setAccountTypeError("Please select an account type.");
      isValid = false;
    }

    if (!firstName) {
      setFirstNameError("Please enter your first name.");
      isValid = false;
    }

    if (!lastName) {
      setLastNameError("Please enter your last name.");
      isValid = false;
    }

    if (!email) {
      setEmailError("Please enter your email address.");
      isValid = false;
    } else if (!validateEmail(email)) {
      isValid = false;
    }

    if (!username) {
      setUsernameError("Please choose a username.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Please create a password.");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      isValid = false;
    } else {
      // Regex: min 8 chars, at least 1 uppercase, 1 number, 1 special char
      const passwordRegex =
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!passwordRegex.test(password)) {
        setPasswordError(
          "Password must contain at least one uppercase letter, one number, and one special character."
        );
        isValid = false;
      }
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      isValid = false;
    }

    // Validate phone (now required)
    if (!phone || phone.trim() === "") {
      setPhoneError("Please enter your phone number.");
      isValid = false;
    } else if (!validatePhone(phone)) {
      isValid = false;
    }

    return isValid;
  }

  function validateStep2() {
    let isValid = true;

    // Clear errors first
    setCompanyError("");
    setCountryError("");

    if (!company) {
      setCompanyError("Please enter your company name.");
      isValid = false;
    }

    if (!country) {
      setCountryError("Please select your country.");
      isValid = false;
    }

    if (!acceptTerms) {
      setError("Please accept the terms and conditions.");
      isValid = false;
    } else {
      setError("");
    }

    return isValid;
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1 && validateStep1()) {
      // Send OTP for email verification
      try {
        setIsOtpLoading(true);
        const res = await fetch("/api/auth/send-registration-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, username }),
        });

        const data = await res.json();

        if (!res.ok) {
          setEmailError(data.message || "Failed to send verification code.");
          return;
        }

        // Move to OTP verification step
        setStep(1.5); // OTP verification step
        setError("");
      } catch (err) {
        setError("Failed to send verification code. Please try again.");
      } finally {
        setIsOtpLoading(false);
      }
    } else if (step === 1.5 && emailVerified) {
      // Move to step 2 after email verification
      setStep(2);
    }
  }

  function handleBack() {
    if (step === 1.5) {
      setStep(1);
    } else if (step === 2) {
      setStep(1.5);
    }
  }

  // Function to verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsOtpLoading(true);

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit verification code.");
      setIsOtpLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid verification code.");
        return;
      }

      // Email verified successfully
      setEmailVerified(true);
      setError("");
      showToast({
        type: "success",
        message: "Email verified successfully!",
      });

      // Move to step 2
      setStep(2);
    } catch (err) {
      setError("Failed to verify code. Please try again.");
    } finally {
      setIsOtpLoading(false);
    }
  }

  // Function to resend OTP
  async function handleResendOtp() {
    try {
      setIsOtpLoading(true);
      const res = await fetch("/api/auth/send-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to resend verification code.");
        return;
      }

      setError("");
      showToast({
        type: "success",
        message: "Verification code sent again!",
      });
    } catch (err) {
      setError("Failed to resend verification code. Please try again.");
    } finally {
      setIsOtpLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (step === 2 && validateStep2()) {
      // Ensure email is verified before allowing registration
      if (!emailVerified) {
        setError("Please verify your email address first.");
        setStep(1.5);
        return;
      }
      // Check email and username availability before proceeding
      try {
        const params = new URLSearchParams({
          company,
        });
        const res = await fetch(
          `/api/auth/check-availability?${params.toString()}`
        );
        const data = await res.json();

        if (!data.companyAvailable) {
          setError("Company name already exist.");
          return;
        }
        setStep(2);
      } catch (err) {
        setError("Failed to check availability. Please try again.");
      }

      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password,
        confirm_password: confirmPassword,
        account_type: accountType,
        phone: phone,
        teams: teams,
        linkedin: linkedin,
        company: company,
        vat: vat,
        country: country,
        state: state,
        city: city,
        zip: zip,
        address: address,
        accept_terms: acceptTerms ? "true" : "false",
        username: username,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.user?.id && data?.user?.status === true) {
        showToast({
          message: "Registration Successful! Please login to continue.",
          type: "success",
        });
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        showToast({
          message: data.details || "Registration failed",
          type: "error",
        });
        setError(data.details || "Registration failed");
      }
    }
  }

  return (
    <div className="flex min-h-screen register-wrapper">
      {/* Left Panel */}
      <div className="left-panel hidden lg:flex flex-col justify-between bg-primary text-white w-full min-w-[360px] max-w-[630px] px-12 py-14  relative">
        <div>
          <div className="flex flex-col mb-28">
            <Image src={Logo} alt="logo" className="max-w-[200px]" />
          </div>
          <div className="mb-20 pl-6 border-l border-white">
            <h2 className="text-4xl font-[200] mb-2">Welcome!</h2>
            <p className="text-lg font-[200]">
              Let's Get Your Revenue Dashboard Set Up
            </p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border font-[500] ${
                  step === 1
                    ? "bg-white text-black border-white"
                    : step > 1
                    ? "bg-cyan-900 text-white border-cyan-900"
                    : "bg-white bg-opacity-70 text-black border-white"
                }`}
              >
                {step > 1 ? "✓" : "01"}
              </div>
              <span className="text-lg">Account Details</span>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border font-[500] ${
                  step === 1.5
                    ? "bg-white text-black border-white"
                    : step > 1.5
                    ? "bg-cyan-900 text-white border-cyan-900"
                    : "bg-white bg-opacity-70 text-black border-white"
                }`}
              >
                {step > 1.5 ? "✓" : "02"}
              </div>
              <span className="text-lg">Email Verification</span>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border font-[500] ${
                  step === 2
                    ? "bg-white text-black border-white"
                    : "bg-white bg-opacity-70 text-black border-white"
                }`}
              >
                03
              </div>
              <span className="text-lg">User/Company Details</span>
            </div>
          </div>
        </div>
      </div>
      {/* Right Panel */}
      <div className="w-full  flex items-center flex-col justify-center bg-white py-10 overflow-auto px-8">
        <div className="w-full max-w-[650px] flex-1">
          {step === 1 ? (
            <form onSubmit={handleNext}>
              <div className="mb-12 text-center">
                <div className="text-3xl mb-2 font-[600]">Account Details</div>
                <div className="text-sm text-gray-500">
                  Create Your Account to Access Revenue Insights
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="grid gap-2 md:col-span-2  relative">
                  <Label className="gap-1" htmlFor="accountType">
                    Account Type<span className="text-red-700">*</span>
                  </Label>
                  <div>
                    <Select
                      value={accountType}
                      onValueChange={(value) => {
                        setAccountType(value);
                        setAccountTypeError("");
                      }}
                    >
                      <SelectTrigger id="accountType" className="w-full">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white w-full">
                        {accountTypes.map((type) => (
                          <SelectItem
                            className="cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100"
                            key={type.value}
                            value={type.value}
                          >
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {accountTypeError && (
                      <span className="text-red-700 text-xs mt-1 validation-error mt-1 block">
                        {accountTypeError}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-2  relative">
                  <Label className="gap-1" htmlFor="firstName">
                    First Name<span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setFirstNameError("");
                    }}
                    placeholder="Enter your first name"
                  />
                  {firstNameError && (
                    <span className="text-red-700 text-xs mt-1 validation-error">
                      {firstNameError}
                    </span>
                  )}
                </div>
                <div className="grid gap-2  relative">
                  <Label className="gap-1" htmlFor="lastName">
                    Last Name<span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setLastNameError("");
                    }}
                    placeholder="Enter your last name"
                  />
                  {lastNameError && (
                    <span className="text-red-700 text-xs mt-1 validation-error">
                      {lastNameError}
                    </span>
                  )}
                </div>
                <div className="grid gap-2  relative">
                  <Label className="gap-1" htmlFor="email">
                    Email Address<span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    placeholder="Enter your email"
                  />
                  {emailError && (
                    <span className="text-red-700 text-xs mt-1 validation-error">
                      {emailError}
                    </span>
                  )}
                </div>
                <div className="grid gap-2  relative">
                  <Label className="gap-1" htmlFor="username">
                    Username<span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameError(""); // Clear error when user types
                    }}
                    placeholder="Choose a username"
                    autoComplete="false"
                  />
                  {usernameError && (
                    <span className="text-red-700 text-xs mt-1 validation-error">
                      {usernameError}
                    </span>
                  )}
                </div>
                <div className="grid gap-2 md:col-span-2  relative">
                  <Label className="gap-1" htmlFor="password">
                    Password<span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Create a password"
                    autoComplete="false"
                  />
                  {passwordError && (
                    <span className="text-red-700 text-xs mt-1 validation-error">
                      {passwordError}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </span>
                </div>
                <div className="grid gap-2 md:col-span-2  relative">
                  <Label className="gap-1" htmlFor="confirmPassword">
                    Confirm Password<span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmPasswordError("");
                    }}
                    placeholder="Confirm your password"
                  />
                  {confirmPasswordError && (
                    <span className="text-red-700 text-xs mt-1 validation-error">
                      {confirmPasswordError}
                    </span>
                  )}
                </div>
                <div className="grid gap-2 relative">
                  <Label htmlFor="phone" className="gap-1">
                    Phone<span className="text-red-700">*</span>
                  </Label>
                  <div className="flex items-center border border-input rounded-md px-2 h-[36px]">
                    {/* Custom Country Dropdown */}
                    <div
                      className="relative border-r mr-3 h-full flex"
                      ref={dropdownRef}
                    >
                      <div
                        className="flex items-center gap-2 cursor-pointer pr-6"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <img
                          src={selectedCountry?.flag}
                          alt="flag"
                          className="w-5 h-4 object-cover rounded-sm"
                        />
                        <span className="text-sm whitespace-nowrap">
                          {selectedCountry?.code}
                        </span>
                        <svg
                          className="min-w-[12px] w-3 h-3 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>

                      {isDropdownOpen && (
                        <div className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-auto w-60 mt-1">
                          {countriescode.map((countrycode) => (
                            <div
                              key={`${countrycode.code}-${countrycode.name}`} // <-- Make key unique
                              onClick={() => {
                                setSelectedCountry(countrycode);
                                setIsDropdownOpen(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                            >
                              <img
                                src={countrycode.flag}
                                alt={countrycode.name}
                                className="w-5 h-4 object-cover"
                              />
                              <span className="flex-1">{countrycode.name}</span>
                              <span className="ml-auto">
                                {countrycode.code}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Phone Input */}
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneError(""); // Clear error when user starts typing
                      }}
                      onBlur={(e) => {
                        validatePhone(e.target.value);
                      }}
                      placeholder="Phone number"
                      className="p-0 border-0 focus:ring-0 focus:border-0 w-full"
                    />
                  </div>
                  {phoneError && (
                    <span className="text-red-700 text-xs mt-1 validation-error">
                      {phoneError}
                    </span>
                  )}
                </div>
                {/* <div className="grid gap-2">
                    <Label className="gap-1" htmlFor="phone">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div> */}
                <div className="grid gap-2  relative">
                  <Label className="gap-1" htmlFor="teams">
                    Microsoft Teams username
                  </Label>
                  <Input
                    id="teams"
                    value={teams}
                    onChange={(e) => setTeams(e.target.value)}
                    placeholder="Enter your teams username"
                  />
                </div>
                <div className="grid gap-2 md:col-span-2  relative">
                  <Label className="gap-1" htmlFor="linkedin">
                    LinkedIn Profile
                  </Label>
                  <Input
                    id="linkedin"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="Enter your LinkedIn profile"
                  />
                </div>
              </div>
              {error && (
                <div className="text-red-700 text-xs mt-1 validation-error">
                  {error}
                </div>
              )}

              <div className="flex gap-2 justify-center mt-10">
                <Button
                  className="max-w-[300px] w-full text-white"
                  type="submit"
                  disabled={isOtpLoading}
                >
                  {isOtpLoading ? "Sending Code..." : "Send Verification Code"}
                </Button>
              </div>
            </form>
          ) : step === 1.5 ? (
            <form
              onSubmit={handleVerifyOtp}
              className="h-full flex justify-center flex-col"
            >
              <div className="mb-12 text-center">
                <div className="text-3xl mb-2 font-[600]">
                  Verify Your Email
                </div>
                <div className="text-sm text-gray-500">
                  We've sent a 6-digit verification code to{" "}
                  <strong>{email}</strong>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex justify-center mb-4">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value: any) => setOtp(value)}
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
                  </div>

                  <p className="text-center text-sm text-gray-500">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-primary cursor-pointer hover:underline"
                      disabled={isOtpLoading}
                    >
                      {isOtpLoading ? "Sending..." : "Resend Code"}
                    </button>
                  </p>
                </div>

                {error && (
                  <div className="text-red-700 text-xs mt-1 validation-error text-center">
                    {error}
                  </div>
                )}
              </div>

              <div className="mt-12">
                <div className="flex flex-col items-center gap-4 w-full">
                  <Button
                    className="flex-1 text-white max-w-[300px] w-full"
                    type="submit"
                    disabled={isOtpLoading || otp.length !== 6}
                  >
                    {isOtpLoading ? "Verifying..." : "Verify Email"}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleBack}
                    className="flex-1 bg-white text-primary hover:bg-white"
                    disabled={isOtpLoading}
                  >
                    Back
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-12 text-center">
                <div className="text-3xl mb-2 font-[600]">
                  User/Company Details
                </div>
                <div className="text-sm text-gray-500">
                  Tell us about your organization
                </div>
              </div>
              <div className="grid">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="grid gap-2 md:col-span-2  relative">
                    <Label className="gap-1" htmlFor="company">
                      Company<span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value);
                        setCompanyError("");
                      }}
                      placeholder="Enter company name"
                    />
                    {companyError && (
                      <span className="text-red-700 text-xs mt-1 validation-error">
                        {companyError}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="vat">VAT Number</Label>
                    <Input
                      id="vat"
                      value={vat}
                      onChange={(e) => setVat(e.target.value)}
                      placeholder="Enter VAT number"
                    />
                  </div>
                  <div className="grid gap-2  relative">
                    <Label className="gap-1" htmlFor="country">
                      Country<span className="text-red-700">*</span>
                    </Label>
                    <Select
                      value={country}
                      onValueChange={(value) => {
                        setCountry(value);
                        setCountryError("");
                      }}
                    >
                      <SelectTrigger id="country" className="w-full">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent className="bg-white w-full">
                        {countries.map((c) => (
                          <SelectItem
                            className="cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100"
                            key={c.value}
                            value={c.value}
                          >
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {countryError && (
                      <span className="text-red-700 text-xs mt-1 validation-error">
                        {countryError}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Enter state or province"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="zip">ZIP / Postcode</Label>
                    <Input
                      id="zip"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="Enter ZIP or postcode"
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter street address"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Checkbox
                    className="accent-blue-600"
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                  />
                  <Label htmlFor="acceptTerms" className="text-sm">
                    Accept terms and condition
                  </Label>
                </div>
                <div className="text-xs text-gray-500 ml-6">
                  By creating an account, you agree to our{" "}
                  <a href="#" className="text-primary hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                  .
                </div>
                {/* <div ref={recaptchaRef} id="recaptcha-container" className="my-4" /> */}
                {error && (
                  <div className="text-red-700 text-xs mt-1 validation-error mt-2">
                    {error}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 mt-10">
                <div className="flex gap-2 w-full justify-center">
                  <Button
                    className="text-white w-full max-w-[300px]"
                    type="submit"
                    disabled={!acceptTerms}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
        <div className="text-sm text-center text-gray-500 mt-12">
          Already have an account?{" "}
          <Link href="/" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
