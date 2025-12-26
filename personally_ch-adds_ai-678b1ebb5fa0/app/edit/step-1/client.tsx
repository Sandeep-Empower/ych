"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "react-circular-progressbar/dist/styles.css";
import uploadIcon from "../../assets/images/icons/upload-icon.svg";
import Image from "next/image";
import SiteStepper2 from "@/app/components/ui/SiteStepper2";
import { useToast } from "@/app/components/ui/SimpleToaster";
import { ArrowRightIcon } from "lucide-react";
import LogoGeneratorModal from "@/app/components/ui/LogoGeneratorModal";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { cn } from "@/lib/utils";
import "@/app/assets/styles/ai-border.css";

export default function Step1() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [siteId, setSiteId] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(true);
  const [companyTab, setCompanyTab] = useState("existing");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [logoError, setLogoError] = useState("");
  const [faviconError, setFaviconError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    domain: "",
    siteName: "",
    tagline: "",
    company: "",
    companyName: "",
    companyId: "",
    phone: "",
    email: "",
    address: "",
    accentColor: "#000000",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<
    {
      id: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      _count: {
        sites: number;
      };
    }[]
  >([]);
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [logoMode, setLogoMode] = useState<"upload" | "generate">("upload");
  const showToast = useToast();

  const fetchCompanies = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/companies/get?${params}`);
      if (!response.ok) {
        showToast({ message: "Failed to fetch companies", color: "error" });
      }

      const data = await response.json();
      if (data.success) {
        setCompanies(data.data);
        // If site.meta.company is present, set the companyId in form
        if (
          form.company === "" &&
          form.companyName === "" &&
          data.data.length > 0
        ) {
          // Try to find the company by name (case-insensitive)
          const matched = data.data.find(
            (c: any) =>
              c.name.toLowerCase() === (form.company || "").toLowerCase()
          );
          if (matched) {
            setForm((f) => ({
              ...f,
              company: matched.name,
              companyId: matched.id,
              phone: matched.phone || f.phone,
              email: matched.email || f.email,
              address: matched.address || f.address,
            }));
          }
        }
      } else {
        showToast({
          message: data.error || "Failed to fetch companies",
          color: "error",
        });
      }
    } catch (err: any) {
      showToast({
        message: err.message || "An error occurred",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Seeting siteId
  useEffect(() => {
    const site_id = searchParams?.get("siteId");
    if (site_id) {
      setSiteId(site_id as string);
    }
  }, [searchParams]);

  //Validating website
  useEffect(() => {
    const validateSiteId = async () => {
      if (!siteId) {
        router.push("/manageSite");
        return;
      }
      try {
        const res = await fetch("/api/site/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId }),
        });
        if (res.ok) {
          const site = await res.json();
          setForm((f) => ({
            ...f,
            domain: site.domain,
            siteName: site.site_name,
            tagline: site.meta.tagline,
            company: site.company.name,
            companyName: site.company.name,
            companyId: site.company.id, // Add the company ID
            phone: site.company.phone,
            email: site.company.email,
            address: site.company.address,
            accentColor: site.meta.accent_color || "#000000",
          }));
          setLogoUrl(site.meta.logo_url);
          setFaviconUrl(site.meta.favicon_url);
          window.sessionStorage.setItem("siteDomainName", site.domain);
          window.dispatchEvent(new Event("siteDomainNameChanged"));
        } else {
          const data = await res.json();
          setValidationError(data.error || "Invalid site ID");
          router.push("/manageSite");
          return;
        }
        setIsValidating(false);
      } catch (error) {
        setValidationError("Failed to validate site");
        router.push("/manageSite");
      }
    };

    if (siteId) {
      validateSiteId();
    }
  }, [siteId, router]);

  // Setting company dropdown
  useEffect(() => {
    // ...existing token check...
    fetchCompanies();
  }, [router]);

  useEffect(() => {
    if (
      form.company &&
      companies.length > 0 &&
      !form.companyId // Only set if not already set
    ) {
      // Try to find the company by name (case-insensitive)
      const matched = companies.find(
        (c) => c.name.toLowerCase() === form.company.toLowerCase()
      );
      if (matched) {
        setForm((f) => ({
          ...f,
          company: matched.name,
          companyId: matched.id,
          phone: matched.phone || f.phone,
          email: matched.email || f.email,
          address: matched.address || f.address,
        }));
      }
    }
  }, [form.company, companies]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;

    // Validate hex format
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setForm((prev) => ({ ...prev, accentColor: hex }));
      return;
    }

    // Convert HEX to RGB
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);

    // Calculate brightness using luminance formula
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;

    // Threshold: reject too light colors (brightness > 160)
    if (brightness > 160) {
      showToast({
        message: "Please choose a darker color for better readability.",
        color: "error",
      });
      // Reset to black when color is too light
      setForm((prev) => ({ ...prev, accentColor: "#000000" }));
    } else {
      setForm((prev) => ({ ...prev, accentColor: hex }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setLogoError("");
    setFaviconError("");
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("siteId", siteId);
      fd.append("domain", form.domain.trim());
      fd.append("siteName", form.siteName.trim());
      fd.append("tagline", form.tagline.trim());
      fd.append("logo", logoFile!);
      fd.append("favicon", faviconFile!);
      fd.append("logoUrl", logoUrl!);
      fd.append("faviconUrl", faviconUrl!);
      if (companyTab === "existing") {
        fd.append("company", form.company);
      } else {
        fd.append("companyName", form.companyName.trim());
      }
      fd.append("phone", form.phone.trim());
      fd.append("email", form.email.trim());
      fd.append("address", form.address.trim());
      fd.append("accentColor", form.accentColor);
      const res = await fetch("/api/site/update", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error) {
          if (data.error.domain) {
            setFormErrors({ domain: data.error.domain });
          }
          Object.keys(data.error).forEach((key) => {
            showToast({ message: data.error[key], color: "error" });
          });
        }
        showToast({
          message: "Failed to update site details.",
          color: "error",
        });
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      showToast({
        message: "Site details updated successfully.",
        color: "success",
      });
      router.push(
        `/edit/step-2?${new URLSearchParams({ siteId: data.siteId })}`
      );
    } catch (err) {
      showToast({ message: "Failed to update site details.", color: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleFaviconClick = () => {
    faviconInputRef.current?.click();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/svg+xml",
      "image/gif",
    ];
    if (!validTypes.includes(file.type)) {
      setLogoError("Invalid file type. Allowed: JPG, PNG, SVG, GIF.");
      setLogoFile(null);
      return;
    }
    if (file.size > 1024 * 1024) {
      setLogoError("File too large. Max 1MB.");
      setLogoFile(null);
      return;
    }
    // Check dimensions
    const img = new window.Image();
    img.onload = function () {
      if (img.width > 720 || img.height > 720) {
        setLogoError("Image dimensions must not exceed 720px.");
        setLogoFile(null);
      } else {
        setLogoFile(file);
        setLogoUrl("");
      }
    };
    img.onerror = function () {
      setLogoError("Invalid image file.");
      setLogoFile(null);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFaviconError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/x-icon",
      "image/vnd.microsoft.icon",
    ];
    if (!validTypes.includes(file.type)) {
      setFaviconError("Invalid file type. Allowed: PNG, JPG, ICO.");
      setFaviconFile(null);
      return;
    }
    if (file.size > 100 * 1024) {
      setFaviconError("File too large. Max 100KB.");
      setFaviconFile(null);
      return;
    }
    // Check dimensions and squareness
    const img = new window.Image();
    img.onload = function () {
      if (img.width !== img.height) {
        setFaviconError("Favicon must be square.");
        setFaviconFile(null);
      } else if (!(img.width === 32 || img.width === 48)) {
        setFaviconError("Favicon must be 32x32 or 48x48.");
        setFaviconFile(null);
      } else {
        setFaviconFile(file);
        setFaviconUrl("");
      }
    };
    img.onerror = function () {
      setFaviconError("Invalid image file.");
      setFaviconFile(null);
    };
    img.src = URL.createObjectURL(file);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!form.domain.trim()) errors.domain = "Domain is required.";
    else if (!/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(form.domain.trim()))
      errors.domain = "Invalid domain format.";

    if (!form.siteName.trim()) errors.siteName = "Site Name is required.";
    if (!form.tagline.trim()) errors.tagline = "Tagline is required.";
    if (!logoFile && !logoUrl) errors.logo = "Logo is required.";
    if (logoError) errors.logo = logoError;
    if (!faviconFile && !faviconUrl) errors.favicon = "Favicon is required.";
    if (faviconError) errors.favicon = faviconError;

    if (companyTab === "existing" && !form.company)
      errors.company = "Company Name is required.";
    if (companyTab === "new" && !form.companyName.trim())
      errors.companyName = "Company Name is required.";

    if (form.phone.trim() && !/^\+?[0-9\-\s]{7,}$/.test(form.phone.trim()))
      errors.phone = "Invalid phone number.";

    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
      errors.email = "Invalid email.";

    if (!form.address.trim()) errors.address = "Address is required.";

    return errors;
  };

  return (
    <div>
      {/* Stepper */}
      <SiteStepper2 currentStep={1} />

      {/* Main Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white mx-auto p-0 gap-0">
          <div className="flex justify-between border-b border-gray-200 px-6 py-4 items-center">
            <h2 className="text-xl font-semibold">Update Site Details</h2>
            <Button
              type="submit"
              className="text-white flex items-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  Update/Continue
                  <ArrowRightIcon />
                </>
              )}
            </Button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 xl:grid-cols-12 gap-8 mb-6">
              <div className="grid gap-2 col-span-2 md:col-span-2 xl:col-span-6 relative">
                <Label className="gap-1" htmlFor="domain">
                  URL/Domain Name <span className="text-red-700">*</span>
                  <span className="text-xs text-gray-500">
                    (e.g. example.com)
                  </span>
                </Label>
                <Input
                  id="domain"
                  placeholder="URL/Domain"
                  value={form.domain}
                  onChange={handleInputChange}
                  disabled={true}
                />
                {formErrors.domain && (
                  <span className="text-xs text-red-700 mt-1 validation-error">
                    {formErrors.domain}
                  </span>
                )}
              </div>
              <div className="grid gap-2 col-span-2  md:col-span-1 xl:col-span-3 relative">
                <Label className="gap-1" htmlFor="siteName">
                  Site Name/Brand <span className="text-red-700">*</span>
                </Label>
                <Input
                  id="siteName"
                  placeholder="Site Name/Brand"
                  value={form.siteName}
                  onChange={handleInputChange}
                />
                {formErrors.siteName && (
                  <span className="text-xs text-red-700 mt-1 validation-error">
                    {formErrors.siteName}
                  </span>
                )}
              </div>
              <div className="grid gap-2 col-span-2  md:col-span-1 xl:col-span-3 relative">
                <Label className="gap-1" htmlFor="tagline">
                  Site Tagline <span className="text-red-700">*</span>
                </Label>
                <Input
                  id="tagline"
                  placeholder="Site Tagline"
                  value={form.tagline}
                  onChange={handleInputChange}
                />
                {formErrors.tagline && (
                  <span className="text-xs text-red-700 mt-1 validation-error">
                    {formErrors.tagline}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-8 items-start mt-8">
              {/* Logo/Favicon Mode Toggle */}
              <RadioGroup
                value={logoMode}
                onValueChange={(v) => setLogoMode(v as "upload" | "generate")}
                className="flex flex-row gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="generate"
                    id="generate-logo"
                    className={cn(
                      "focus:ring-0",
                      logoMode === "upload" &&
                        "bg-primary border-primary text-primary-foreground"
                    )}
                  />
                  <Label htmlFor="generate-logo">Generate Logo / Favicon</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="upload"
                    id="upload-logo"
                    className={cn(
                      "focus:ring-0",
                      logoMode === "generate" &&
                        "bg-primary border-primary text-primary-foreground"
                    )}
                  />
                  <Label htmlFor="upload-logo">Upload Logo / Favicon</Label>
                </div>
              </RadioGroup>
              {logoMode === "generate" && (
                <div className="relative">
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!form.domain.trim() && !form.siteName.trim()) {
                        showToast({
                          message: "Please enter a domain or site name",
                          color: "error",
                          duration: 10,
                        });
                      } else {
                        setLogoModalOpen(true);
                      }
                    }}
                    className="ai-animated-border cursor-pointer flex flex-col items-center justify-center gap-4 p-6 border-2 rounded-lg min-h-[140px] relative"
                  >
                    <span className="flex items-center flex-col gap-3 text-lg">
                      <Sparkles className="!w-8 !h-8 text-primary" />
                      Generate Logo / Favicon
                    </span>
                    <LogoGeneratorModal
                      open={logoModalOpen}
                      onClose={() => {
                        setLogoModalOpen(false);
                      }}
                      onInsert={(logo, favicon) => {
                        setLogoUrl(logo);
                        setFaviconUrl(favicon);
                        setLogoFile(null);
                        setFaviconFile(null);
                        setLogoMode("upload");
                      }}
                      domain={form.domain.split(".")[0]}
                      siteName={form.siteName}
                    />
                  </div>
                  {(formErrors.favicon || formErrors.logo) && (
                    <span className="text-xs text-red-700 mt-1 validation-error block">
                      {/* {formErrors.favicon} & {formErrors.logo} */}
                      Logo & Favicon are required.
                    </span>
                  )}
                  {/* {formErrors.logo && (
                    <span className="text-xs text-red-700 mt-1 validation-error">
                      {formErrors.logo}
                    </span>
                  )} */}
                </div>
              )}
              {logoMode === "upload" && (
                <div className="flex gap-8">
                  {/* Logo Upload/Preview */}
                  <div className="flex-1  relative">
                    {logoFile ? (
                      <div className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg min-h-[140px] relative">
                        <Image
                          src={URL.createObjectURL(logoFile)}
                          alt="Logo Preview"
                          width={200}
                          height={80}
                          className="object-contain max-h-[80px]"
                          onLoad={(e) =>
                            URL.revokeObjectURL(
                              (e.target as HTMLImageElement).src
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 rounded text-red-700 border-red-700 p-0 w-8 h-8 flex items-center justify-center"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLogoFile(null);
                          }}
                          aria-label="Remove logo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : logoUrl ? (
                      <div className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg min-h-[140px] relative">
                        <img
                          src={logoUrl}
                          alt="Logo Preview"
                          width={200}
                          height={80}
                          className="object-contain max-h-[80px]"
                          onLoad={(e) =>
                            URL.revokeObjectURL(
                              (e.target as HTMLImageElement).src
                            )
                          }
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 rounded text-red-700 border-red-700 p-0 w-8 h-8 flex items-center justify-center"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLogoUrl("");
                          }}
                          aria-label="Remove logo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center flex-1 min-h-[140px]">
                          <div className="w-full flex flex-col items-center">
                            <div className="font-semibold mb-3 flex items-center gap-3">
                              <span
                                className="text-cyan-600 cursor-pointer flex gap-2"
                                onClick={handleLogoClick}
                                onKeyDown={(e) =>
                                  (e.key === "Enter" || e.key === " ") &&
                                  handleLogoClick()
                                }
                              >
                                <Upload /> Upload Logo
                              </span>
                            </div>
                            <span className="text-xs mb-2 text-gray-500 leading-5 text-center w-full">
                              Supported: JPG, PNG, SVG, GIF, max 1MB, max 720px
                            </span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.svg,.gif"
                              style={{ display: "none" }}
                              ref={logoInputRef}
                              onChange={handleLogoChange}
                            />
                          </div>
                        </div>
                        {logoError && (
                          <span className="text-xs text-red-700 mt-1 validation-error">
                            {logoError}
                          </span>
                        )}
                        {formErrors.logo && (
                          <span className="text-xs text-red-700 mt-1 validation-error">
                            {formErrors.logo}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Favicon Upload/Preview */}
                  <div className="gap-2 flex flex-col h-full min-h-[140px] flex-1">
                    {faviconFile ? (
                      <div className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg min-h-[140px] relative">
                        <Image
                          src={URL.createObjectURL(faviconFile)}
                          alt="Favicon Preview"
                          width={48}
                          height={48}
                          className="object-contain"
                          onLoad={(e) =>
                            URL.revokeObjectURL(
                              (e.target as HTMLImageElement).src
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 rounded text-red-700 border-red-700 p-0 w-8 h-8 flex items-center justify-center"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFaviconFile(null);
                          }}
                          aria-label="Remove favicon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : faviconUrl ? (
                      <div className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg min-h-[140px] relative">
                        <img
                          src={faviconUrl}
                          alt="Favicon Preview"
                          width={48}
                          height={48}
                          className="object-contain"
                          onLoad={(e) =>
                            URL.revokeObjectURL(
                              (e.target as HTMLImageElement).src
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 rounded text-red-700 border-red-700 p-0 w-8 h-8 flex items-center justify-center"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFaviconUrl("");
                          }}
                          aria-label="Remove favicon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex-1 border-2 border-dashed rounded-lg p-6 flex flex-col items-center min-h-[140px]">
                          <div className="w-full flex flex-col items-center">
                            <div className="font-semibold mb-2 flex items-center gap-3">
                              <span
                                className="text-cyan-600 cursor-pointer flex gap-2"
                                onClick={handleFaviconClick}
                                onKeyDown={(e) =>
                                  (e.key === "Enter" || e.key === " ") &&
                                  handleFaviconClick()
                                }
                              >
                                <Upload /> Upload Favicon
                              </span>
                            </div>
                            <span className="text-xs mb-2 text-gray-500 leading-5 text-center w-full">
                              Supported: PNG, JPG, ICO (32×32 or 48×48), max
                              100KB
                            </span>
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg,.ico"
                              style={{ display: "none" }}
                              ref={faviconInputRef}
                              onChange={handleFaviconChange}
                            />
                          </div>
                        </div>
                        {faviconError && (
                          <span className="text-xs text-red-700 mt-1 validation-error">
                            {faviconError}
                          </span>
                        )}
                        {formErrors.favicon && (
                          <span className="text-xs text-red-700 mt-1 validation-error">
                            {formErrors.favicon}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Company Info */}
            <h3 className="text-lg font-bold mb-4">Company Information</h3>
            <Tabs
              value={companyTab}
              onValueChange={(value) => {
                setCompanyTab(value);
                // Clear form fields when switching between tabs
                if (value === "new") {
                  // Remove the old values
                  setForm((f) => ({
                    ...f,
                    company: "",
                    companyName: "",
                    phone: "",
                    email: "",
                    address: "",
                  }));
                } else if (value === "existing") {
                  // When switching to "existing", restore previous company info if any
                  setForm((f) => {
                    // If we have a last selected companyId, restore all its info
                    if (f.companyId) {
                      const selected = companies.find(
                        (c) => c.id === f.companyId
                      );
                      if (selected) {
                        return {
                          ...f,
                          company: selected.name,
                          companyId: selected.id,
                          phone: selected.phone || "",
                          email: selected.email || "",
                          address: selected.address || "",
                          companyName: "",
                        };
                      }
                    }
                    // Otherwise, just clear companyName
                    return {
                      ...f,
                      companyName: "",
                    };
                  });
                }
              }}
              className="mb-6"
            >
              <TabsList className="mb-4 companty-tabs border-gray-300">
                <TabsTrigger value="existing" className="w-[130px]">
                  Existing Company
                </TabsTrigger>
                <TabsTrigger value="new" className="w-[130px]">
                  New Company
                </TabsTrigger>
              </TabsList>
              {companyTab === "existing" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="grid gap-2 lg:col-span-6 xl:col-span-3 relative">
                    <Label className="gap-1" htmlFor="company">
                      Company <span className="text-red-700">*</span>
                    </Label>
                    <Select
                      value={form.companyId}
                      onValueChange={(selectedCompanyId) => {
                        const selected = companies.find(
                          (c) => c.id === selectedCompanyId
                        );
                        if (selected) {
                          setForm((f) => ({
                            ...f,
                            company: selected.name,
                            companyId: selected.id,
                            phone: selected.phone || "",
                            email: selected.email || "",
                            address: selected.address || "",
                          }));
                        }
                      }}
                    >
                      <SelectTrigger
                        id="company"
                        className="w-full overflow-hidden dropdown-text"
                      >
                        <SelectValue placeholder="Select Existing Company" />
                      </SelectTrigger>
                      <SelectContent className="w-full bg-white">
                        {companies.map((c) => (
                          <SelectItem
                            key={c.id}
                            className={`cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100 ${
                              c._count.sites === 0 ? "text-gray-400" : ""
                            }`}
                            value={c.id}
                          >
                            {c.name}
                            {c._count.sites === 0 && (
                              <span className="ml-2 text-xs text-gray-400">
                                (No sites)
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.company && (
                      <span className="text-xs text-red-700 mt-1 validation-error">
                        {formErrors.company}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2 lg:col-span-6 xl:col-span-3">
                    <Label className="gap-1" htmlFor="phone">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="number"
                      placeholder="Phone number"
                      value={form.phone}
                      onChange={handleInputChange}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {formErrors.phone && (
                      <span className="text-xs text-red-700 mt-1 validation-error">
                        {formErrors.phone}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2 lg:col-span-12 xl:col-span-6 relative">
                    <Label className="gap-1" htmlFor="email">
                      Email <span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="email"
                      placeholder="Email"
                      value={form.email}
                      onChange={handleInputChange}
                    />
                    {formErrors.email && (
                      <span className="text-xs text-red-700 mt-1 validation-error">
                        {formErrors.email}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2 lg:col-span-12 xl:col-span-12 relative">
                    <Label className="gap-1" htmlFor="address">
                      Address <span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="address"
                      placeholder="Address"
                      value={form.address}
                      onChange={handleInputChange}
                    />
                    {formErrors.address && (
                      <span className="text-xs text-red-700 mt-1 validation-error">
                        {formErrors.address}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="grid gap-2 lg:col-span-6 xl:col-span-3 relative">
                    <Label className="gap-1" htmlFor="companyName">
                      Company Name <span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="Company Name"
                      value={form.companyName}
                      onChange={handleInputChange}
                    />
                    {formErrors.companyName && (
                      <span className="text-xs text-red-700 mt-1 validation-error">
                        {formErrors.companyName}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2 lg:col-span-6 xl:col-span-3">
                    <Label className="gap-1" htmlFor="phone">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="number"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Phone number"
                      value={form.phone}
                      onChange={handleInputChange}
                    />
                    {formErrors.phone && (
                      <span className="text-xs text-red-700 mt-1 validation-error">
                        {formErrors.phone}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2 lg:col-span-12 xl:col-span-6 relative">
                    <Label className="gap-1" htmlFor="email">
                      Email <span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="email"
                      placeholder="Email"
                      value={form.email}
                      onChange={handleInputChange}
                    />
                    {formErrors.email && (
                      <span className="text-xs text-red-700 mt-1 validation-error">
                        {formErrors.email}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2 lg:col-span-12 xl:col-span-12 relative">
                    <Label className="gap-1" htmlFor="address">
                      Address <span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="address"
                      placeholder="Address"
                      value={form.address}
                      onChange={handleInputChange}
                    />
                    {formErrors.address && (
                      <span className="text-xs text-red-700 mt-1 validation-error">
                        {formErrors.address}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Tabs>
            {/* Theme settings */}
            <h3 className="text-lg font-bold mb-4 mt-8">Theme Settings</h3>
            <div className="grid grid-cols-2 xl:grid-cols-12 gap-8 mb-6">
              <div className="grid gap-2 lg:col-span-6 xl:col-span-3">
                <Label className="gap-1" htmlFor="accentColor">
                  Accent Color
                </Label>
                <Input
                  id="accentColor"
                  type="color"
                  value={form.accentColor}
                  onChange={handleColorChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>
          <div className="action-footer flex justify-end border-t border-gray-200 px-6 py-4">
            <div className=" flex justify-end gap-4">
              <Button
                type="submit"
                className="text-white flex items-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    Update/Continue
                    <ArrowRightIcon />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
