"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { X, Save, Building2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  vat: string;
  status: boolean;
  created_at: string;
  user: {
    id: string;
    email: string;
    nicename: string | null;
  };
  sites: Array<{
    id: string;
    domain: string;
    site_name: string;
    status: boolean;
  }>;
  _count: {
    sites: number;
  };
}

interface EditCompanyModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedCompany: Company) => void;
}

export default function EditCompanyModal({
  company,
  isOpen,
  onClose,
  onUpdate,
}: EditCompanyModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    vat: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    vat: "",
  });

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation function
  const validatePhone = (phone: string) => {
    if (!phone || phone.trim() === "") {
      return "Please enter your phone number";
    }
    // Remove any spaces, dashes, or parentheses for validation
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, "");

    // Check if it contains only digits after removing country code prefix
    const phoneWithoutCountryCode = cleanedPhone.replace(/^\+\d{1,4}/, "");

    if (!/^\d{7,15}$/.test(phoneWithoutCountryCode)) {
      return "Please enter a valid phone number (7-15 digits)";
    }

    return "";
  };

  // Reset form when company changes
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        phone: company.phone,
        email: company.email,
        address: company.address,
        vat: company.vat || "",
      });
      setError(null);
      setFieldErrors({
        name: "",
        phone: "",
        email: "",
        address: "",
        vat: "",
      });
    }
  }, [company]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear general error when user starts typing
    if (error) {
      setError(null);
    }

    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Real-time validation
    if (name === "name" && !value.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        name: "Company name field is required",
      }));
    } else if (name === "email") {
      if (!value.trim()) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "Email field is required",
        }));
      } else if (!isValidEmail(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address",
        }));
      }
    } else if (name === "phone") {
      const phoneError = validatePhone(value);
      setFieldErrors((prev) => ({
        ...prev,
        phone: phoneError,
      }));
    } else if (name === "address" && !value.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        address: "Address field is required",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company) return;

    // Clear all errors
    setError(null);
    setFieldErrors({
      name: "",
      phone: "",
      email: "",
      address: "",
      vat: "",
    });

    // Validate all required fields
    let hasError = false;
    const newFieldErrors = {
      name: "",
      phone: "",
      email: "",
      address: "",
      vat: "",
    };

    if (!formData.name.trim()) {
      newFieldErrors.name = "Company name field is required";
      hasError = true;
    }

    if (!formData.email.trim()) {
      newFieldErrors.email = "Email field is required";
      hasError = true;
    } else if (!isValidEmail(formData.email)) {
      newFieldErrors.email = "Please enter a valid email address";
      hasError = true;
    }

    if (!formData.phone.trim()) {
      newFieldErrors.phone = "Please enter your phone number.";
      hasError = true;
    } else {
      const phoneError = validatePhone(formData.phone);
      if (phoneError) {
        newFieldErrors.phone = phoneError;
        hasError = true;
      }
    }

    if (!formData.address.trim()) {
      newFieldErrors.address = "Address field is required";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/companies/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: company.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onUpdate(data.data);
        onClose();
      } else {
        setError(data.error || "Failed to update company");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating the company");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="mb-6">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Edit Company
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Company Name */}
          <div className="space-y-2  relative">
            <Label htmlFor="name" className="flex items-center gap-1">
              Company Name <span className="text-red-700">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter company name"
            />
            {fieldErrors.name && (
              <p className="text-red-700 text-xs validation-error">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2 relative">
            <Label htmlFor="email" className="flex items-center gap-1">
              Email <span className="text-red-700">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="text"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
            />
            {fieldErrors.email && (
              <p className="text-red-700 text-xs validation-error">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2 relative">
            <Label htmlFor="phone" className="flex items-center gap-1">
              Phone <span className="text-red-700">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                // Only allow digits, spaces, dashes, parentheses, and plus sign
                const value = e.target.value.replace(/[^0-9\s\-\(\)\+]/g, "");
                setFormData((prev) => ({
                  ...prev,
                  phone: value,
                }));

                // Clear errors when user starts typing
                if (fieldErrors.phone) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    phone: "",
                  }));
                }
                if (error) {
                  setError(null);
                }
              }}
              onBlur={(e) => {
                const phoneError = validatePhone(e.target.value);
                setFieldErrors((prev) => ({
                  ...prev,
                  phone: phoneError,
                }));
              }}
              placeholder="Enter phone number"
            />
            {fieldErrors.phone && (
              <p className="text-red-700 text-xs validation-error">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2 relative">
            <Label htmlFor="address" className="flex items-center gap-1">
              Address <span className="text-red-700">*</span>
            </Label>
            <Input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter company address"
            />
            {fieldErrors.address && (
              <p className="text-red-700 text-xs validation-error">
                {fieldErrors.address}
              </p>
            )}
          </div>

          {/* VAT */}
          <div className="space-y-2 relative">
            <Label htmlFor="vat" className="flex items-center gap-1">
              VAT Number
            </Label>
            <Input
              id="vat"
              name="vat"
              type="text"
              value={formData.vat}
              onChange={handleInputChange}
              placeholder="Enter VAT number (optional)"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-700 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button className="text-white" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="h-4 w-4 mr-1 animate-spin rounded-full border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>Save Changes</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
