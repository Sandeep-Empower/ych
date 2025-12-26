"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useToast } from "../components/ui/SimpleToaster";

import { jwtVerify } from "jose";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/app/context/AuthContext"; // Add this at the top

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isCompanyEditing, setIsCompanyEditing] = useState(false);

  type PersonalInfo = {
    firstName: string;
    lastName: string;
    phone: string;
    teamsUsername: string;
    linkedin: string;
    type: string;
  };

  type CompanyInfo = {
    company: string;
    vat: string;
    country: string;
    state: string;
    city: string;
    postcode: string;
    address: string;
  };

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setNicename] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const showToast = useToast();
  const [originalPersonalInfo, setOriginalPersonalInfo] =
    useState<PersonalInfo | null>(null);
  const [originalCompanyInfo, setOriginalCompanyInfo] =
    useState<CompanyInfo | null>(null);
  const [personalErrors, setPersonalErrors] = useState<{
    [key: string]: string;
  }>({});
  const [companyErrors, setCompanyErrors] = useState<{ [key: string]: string }>(
    {}
  );
  const { refreshUser } = useAuth(); // Add this line

  const countries = [
    { value: "us", label: "United States" },
    { value: "uk", label: "United Kingdom" },
    { value: "in", label: "India" },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRes = await fetch("/api/auth/verify", {
          method: "POST",
          credentials: "include",
        });

        const userData = await userRes.json();

        if (!userRes.ok) {
          throw new Error(userData.error || "Unauthorized");
        }

        const id = userData.user.id;

        setUserId(id); // ✅ store once

        const res = await fetch(`api/profile?userId=${id}`);
        const data = await res.json();

        setNicename(data.username);
        setEmail(data.email);
        setPersonalInfo(data.personalInfo);
        setCompanyInfo(data.companyInfo);
        setOriginalPersonalInfo(data.personalInfo);
        setOriginalCompanyInfo(data.companyInfo);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (personalInfo) {
      setPersonalInfo({ ...personalInfo, [name]: value } as PersonalInfo);
      // Clear personal error for the field being edited
      setPersonalErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (companyInfo) {
      setCompanyInfo({ ...companyInfo, [name]: value } as CompanyInfo);
      // Clear company error for the field being edited
      setCompanyErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePersonalUpdate = async () => {
    const newPersonalErrors: { [key: string]: string } = {};

    if (!personalInfo?.firstName?.trim()) {
      newPersonalErrors.firstName = "First name is required.";
    }
    if (!personalInfo?.lastName?.trim()) {
      newPersonalErrors.lastName = "Last name is required.";
    }

    setPersonalErrors(newPersonalErrors);

    if (Object.keys(newPersonalErrors).length) return;

    try {
      if (!userId) return;

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, personalInfo }),
      });

      const result = await response.json();

      if (response.ok) {
        setOriginalPersonalInfo(personalInfo);
        setIsEditing(false);
        await refreshUser(); // <-- Add this line to refresh user in context
      } else {
        console.error("Personal info update failed:", result.error);
      }
    } catch (error) {
      console.error("Personal info update error:", error);
    }
  };

  const handleCompanyUpdate = async () => {
    const newCompanyErrors: { [key: string]: string } = {};

    if (!companyInfo?.company?.trim()) {
      newCompanyErrors.company = "Company name is required.";
    }
    if (!companyInfo?.country?.trim()) {
      newCompanyErrors.country = "Country is required.";
    }

    setCompanyErrors(newCompanyErrors);

    if (Object.keys(newCompanyErrors).length) return;

    try {
      if (!userId) return;

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, companyInfo }),
      });

      const result = await response.json();

      if (response.ok) {
        setOriginalCompanyInfo(companyInfo);
        setIsCompanyEditing(false);
      } else {
        console.error("Company info update failed:", result.error);
      }
    } catch (error) {
      console.error("Company info update error:", error);
    }
  };

  const hasPersonalInfoChanges = () => {
    return (
      JSON.stringify(personalInfo) !== JSON.stringify(originalPersonalInfo)
    );
  };

  const hasCompanyInfoChanges = () => {
    return JSON.stringify(companyInfo) !== JSON.stringify(originalCompanyInfo);
  };

  if (isLoading || !personalInfo || !companyInfo) {
    return <Loader className="min-h-screen" text="Loading" />;
  }
  let initials = `${originalPersonalInfo?.firstName?.[0] || ""}${
    originalPersonalInfo?.lastName?.[0] || ""
  }`.toUpperCase();

  let accounttype = personalInfo?.type
    ? personalInfo.type.charAt(0).toUpperCase() +
      personalInfo.type.slice(1).toLowerCase()
    : "";
  return (
    <div className="space-y-6 ">
      {/* Header */}
      <Card className="bg-white">
        <CardContent className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-r pr-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-cyan-600 text-white text-xl font-semibold">
              {initials}
            </div>
            <div>
              <div className="text-xl font-semibold">
                {(originalPersonalInfo?.firstName || "") +
                  " " +
                  (originalPersonalInfo?.lastName || "")}
              </div>
              <div className="text-sm text-muted-foreground">{accounttype}</div>
            </div>
          </div>
          <div className="flex">
            <div className="flex flex-col">
              <span className="font-medium">Username:</span>
              <div className="font-semibold">{username}</div>
            </div>
            <div className="flex flex-col ml-12">
              <span className="font-medium">Email:</span>
              <div className="font-semibold">{email}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="bg-white p-0 gap-0">
        <div className="flex justify-between items-center px-6 py-6 border-b">
          <h2 className="text-lg font-semibold">Personal Information</h2>
          {isEditing ? (
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (originalPersonalInfo)
                    setPersonalInfo(originalPersonalInfo);
                  setPersonalErrors({}); // ✅ Clear validation errors
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="text-white"
                onClick={handlePersonalUpdate}
                disabled={!hasPersonalInfoChanges()}
              >
                Update
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <Label className={isEditing ? "mb-2 block" : "mb-1 block"}>
                First Name
              </Label>
              {isEditing ? (
                <>
                  <Input
                    className="mb-1"
                    name="firstName"
                    value={personalInfo.firstName}
                    onChange={handleChange}
                  />
                  {personalErrors.firstName && (
                    <p className="text-red-700 text-xs">
                      {personalErrors.firstName}
                    </p>
                  )}
                </>
              ) : (
                <div className="font-semibold">
                  {personalInfo.firstName || "Not Provided"}
                </div>
              )}
            </div>

            <div>
              <Label className={isEditing ? "mb-2 block" : "mb-1 block"}>
                Last Name
              </Label>
              {isEditing ? (
                <>
                  <Input
                    className="mb-1"
                    name="lastName"
                    value={personalInfo.lastName}
                    onChange={handleChange}
                  />
                  {personalErrors.lastName && (
                    <p className="text-red-700 text-xs">
                      {personalErrors.lastName}
                    </p>
                  )}
                </>
              ) : (
                <div className="font-semibold">
                  {personalInfo.lastName || "Not Provided"}
                </div>
              )}
            </div>
            <div>
              <Label className={isEditing ? "mb-2 block" : ""}>
                Phone Number
              </Label>
              {isEditing ? (
                <>
                  <Input
                    className="mb-1"
                    name="phone"
                    value={personalInfo.phone}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, ""); // Remove non-digits
                      setPersonalInfo((prev) =>
                        prev ? { ...prev, phone: numericValue } : prev
                      );
                      setPersonalErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={15}
                  />
                  {personalErrors.phone && (
                    <p className="text-red-700 text-xs">
                      {personalErrors.phone}
                    </p>
                  )}
                </>
              ) : (
                <div className="font-semibold">
                  {personalInfo.phone || "Not Provided"}
                </div>
              )}
            </div>
            <div>
              <Label className={isEditing ? "mb-2 block" : "mb-1 block"}>
                Microsoft Teams Username
              </Label>
              {isEditing ? (
                <Input
                  name="teamsUsername"
                  value={personalInfo.teamsUsername}
                  onChange={handleChange}
                />
              ) : (
                <div className="font-semibold">
                  {personalInfo.teamsUsername || "Not Provided"}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <Label className={isEditing ? "mb-2 block" : "mb-1 block"}>
                LinkedIn Profile
              </Label>
              {isEditing ? (
                <Input
                  name="linkedin"
                  value={personalInfo.linkedin}
                  onChange={handleChange}
                />
              ) : personalInfo.linkedin?.trim() ? (
                <a
                  href={personalInfo.linkedin}
                  className="text-cyan-600 underline break-all font-semibold"
                  target="_blank"
                  rel="noreferrer"
                >
                  {personalInfo.linkedin}
                </a>
              ) : (
                <div className="text-muted-foreground font-semibold">
                  Not Provided
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="bg-white p-0 gap-0">
        <div className="flex justify-between items-center px-6 py-6 border-b">
          <h2 className="text-lg font-semibold">Company Information</h2>
          {isCompanyEditing ? (
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (originalCompanyInfo) setCompanyInfo(originalCompanyInfo);
                  setCompanyErrors({}); // ✅ Clear validation errors
                  setIsCompanyEditing(false);
                }}
              >
                Cancel
              </Button>

              <Button
                className="text-white"
                onClick={handleCompanyUpdate}
                disabled={!hasCompanyInfoChanges()}
              >
                Update
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCompanyEditing(true)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <Label className={isEditing ? "mb-2 block" : "mb-1 block"}>
                Company
              </Label>
              {isCompanyEditing ? (
                <>
                  <Input
                    className="mb-1"
                    name="company"
                    value={companyInfo.company}
                    onChange={handleCompanyChange}
                  />
                  {companyErrors.company && (
                    <p className="text-red-700 text-xs">
                      {companyErrors.company}
                    </p>
                  )}
                </>
              ) : (
                <div className="font-semibold">
                  {companyInfo.company || "Not Provided"}
                </div>
              )}
            </div>
            <div>
              <Label className={isEditing ? "mb-2 block" : "mb-1 block"}>
                VAT Number
              </Label>
              {isCompanyEditing ? (
                <Input
                  name="vat"
                  value={companyInfo.vat}
                  onChange={handleCompanyChange}
                />
              ) : (
                <div className="font-semibold">
                  {companyInfo.vat || "Not Provided"}
                </div>
              )}
            </div>
            <div>
              <Label className={isCompanyEditing ? "mb-2 block" : ""}>
                Country
              </Label>
              {isCompanyEditing ? (
                <>
                  <Select
                    value={companyInfo.country}
                    onValueChange={(value) => {
                      setCompanyInfo((prev) =>
                        prev ? { ...prev, country: value } : prev
                      );
                      setCompanyErrors((prev) => ({ ...prev, country: "" }));
                    }}
                  >
                    <SelectTrigger className="w-full h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {countries.map((country) => (
                        <SelectItem
                          className="cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100"
                          key={country.value}
                          value={country.value}
                        >
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {companyErrors.country && (
                    <p className="text-red-700 text-xs mt-1">
                      {companyErrors.country}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-sm font-semibold text-muted-foreground">
                  {countries.find((c) => c.value === companyInfo.country)
                    ?.label || "Not Provided"}
                </div>
              )}
            </div>

            <div>
              <Label className={isEditing ? "mb-2 block" : "mb-1 block"}>
                State / Province
              </Label>
              {isCompanyEditing ? (
                <Input
                  name="state"
                  value={companyInfo.state}
                  onChange={handleCompanyChange}
                />
              ) : (
                <div className="font-semibold">
                  {companyInfo.state || "Not Provided"}
                </div>
              )}
            </div>
            <div>
              <Label className={isEditing ? "mb-2 block" : "mb-1 block"}>
                City
              </Label>
              {isCompanyEditing ? (
                <Input
                  name="city"
                  value={companyInfo.city}
                  onChange={handleCompanyChange}
                />
              ) : (
                <div className="font-semibold">
                  {companyInfo.city || "Not Provided"}
                </div>
              )}
            </div>
            <div>
              <Label className={isEditing ? "mb-2 block" : "mb-1 block"}>
                ZIP / Postcode
              </Label>
              {isCompanyEditing ? (
                <Input
                  name="postcode"
                  value={companyInfo.postcode}
                  onChange={handleCompanyChange}
                />
              ) : (
                <div className="font-semibold">
                  {companyInfo.postcode || "Not Provided"}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <Label className={isEditing ? "mb-2 block" : "mb-1 block"}>
                Street Address
              </Label>
              {isCompanyEditing ? (
                <Input
                  name="address"
                  value={companyInfo.address}
                  onChange={handleCompanyChange}
                />
              ) : (
                <div className="font-semibold">
                  {companyInfo.address || "Not Provided"}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
