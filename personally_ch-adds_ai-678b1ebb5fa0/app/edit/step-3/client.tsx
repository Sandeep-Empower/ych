"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "react-circular-progressbar/dist/styles.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronUp, ChevronDown } from "lucide-react";
import TiptapEditor from "@/app/components/TiptapEditor";
import { useToast } from "@/app/components/ui/SimpleToaster";
import SiteStepper2 from "@/app/components/ui/SiteStepper2";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

// const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), { ssr: false });

type PageKey = "about" | "privacy" | "advertise" | "terms";
const pageList = [
  // { key: 'home' as PageKey, label: 'Home Page', placeholder: 'Enter home page content' },
  {
    key: "about" as PageKey,
    label: "About Us Page",
    placeholder: "Enter about us content",
  },
  {
    key: "privacy" as PageKey,
    label: "Privacy & Cookies Page",
    placeholder: "Enter privacy & cookies content",
  },
  {
    key: "advertise" as PageKey,
    label: "For Advertisers Page",
    placeholder: "Enter for advertisers content",
  },
  // { key: 'contact' as PageKey, label: 'Contact Us Page', placeholder: 'Enter contact us content' },
  {
    key: "terms" as PageKey,
    label: "Terms and Conditions Page",
    placeholder: "Enter terms and conditions content",
  },
];

export default function Step3Client() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<PageKey>("about");
  const [pages, setPages] = useState<Record<PageKey, string>>({
    about: ``,
    privacy: ``,
    advertise: ``,
    terms: ``,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const [siteId, setSiteId] = useState("");
  const [siteData, setSiteData] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const showToast = useToast();

  useEffect(() => {
    const site_id = searchParams?.get("siteId");
    if (site_id) {
      setSiteId(site_id as string);
    }
  }, [searchParams]);

  useEffect(() => {
    const validateSiteId = async () => {
      if (!siteId) {
        showToast({
          message: "Site ID is missing. Please start from step 1.",
          color: "error",
        });
        router.push("/create/step-1");
        return;
      }
      try {
        const res = await fetch("/api/site/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId }),
        });
        const data = await res.json();
        if (res.ok) {
          setSiteData(data);
          getPageData();
        } else {
          setValidationError(data.error || "Invalid site ID");
          showToast({ message: "Invalid site ID", color: "error" });
          router.back();
          return;
        }
        setIsValidating(false);
      } catch (error) {
        setValidationError("Failed to validate site");
        showToast({ message: "Failed to validate site", color: "error" });
        router.back();
      }
    };

    if (siteId) {
      validateSiteId();
    }
  }, [siteId, router]);

  const getPageData = async () => {
    const res = await fetch(`/api/pages/getall?siteId=${siteId}`);
    const data = await res.json();
    setPages(
      data.pages.reduce(
        (
          acc: Record<PageKey, string>,
          page: { key: PageKey; content: string }
        ) => {
          acc[page.key] = page.content;
          return acc;
        },
        {} as Record<PageKey, string>
      )
    );
    return data;
  };

  const handleChange = (key: PageKey, value: string) => {
    setPages((prev) => ({ ...prev, [key]: value }));
  };

  const handleAccordion = (key: PageKey) => {
    setExpanded(expanded === key ? ("" as PageKey) : key);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      // Replace with actual siteId
      const res = await fetch("/api/pages/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, pages }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        showToast({ message: "Content saved successfully.", color: "success" });
        router.push(`/manageSite`);
      } else {
        setError("Failed to save content.");
        showToast({ message: "Failed to save content.", color: "error" });
      }
    } catch (err) {
      setError("Failed to save content.");
      showToast({ message: "Failed to save content.", color: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Validating site...</p>
        </div>
      </div>
    );
  }

  // Show error if validation failed
  if (validationError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-700 mb-4">{validationError}</p>
          <Button onClick={() => router.push("/manageSite")}>
            Return to Manage Site
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SiteStepper2 currentStep={3} />
      <div className="page-editor-container">
        <div className="action-footer my-6 flex justify-end">
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              className="bg-white"
              onClick={() => router.push(`/edit/step-2?siteId=${siteId}`)}
            >
              Back
            </Button>
            <Button
              className="text-white flex items-center gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
        {pageList.map((page) => (
          <Card
            key={page.key}
            className="bg-white mx-auto p-0 gap-0 mb-6 overflow-hidden"
          >
            <Button
              type="button"
              className="w-full flex justify-between items-center p-6 bg-white h-auto hover:bg-white"
              onClick={() => handleAccordion(page.key)}
            >
              <span className="font-semibold text-lg">{page.label}</span>
              <span>
                {expanded === page.key ? (
                  <ChevronUp className="!w-6 !h-6" />
                ) : (
                  <ChevronDown className="!w-6 !h-6" />
                )}
              </span>
            </Button>
            {expanded === page.key && (
              <div className="bg-white border-t p-6">
                <TiptapEditor
                  value={pages[page.key]}
                  onChange={(data: string) => handleChange(page.key, data)}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
      {error && <div className="text-red-700 mb-4">{error}</div>}
      {success && (
        <div className="text-emerald-600 mb-4">Content saved successfully!</div>
      )}
      {/* <div className="flex justify-between">
          <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded" onClick={() => router.back()}>Back</button>
          <div className="flex gap-2">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Next Step →'}
            </button>
          </div>
        </div> */}
      <div className="action-footer my-6 flex justify-end">
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            type="button"
            className="bg-white"
            onClick={() => router.push(`/edit/step-2?siteId=${siteId}`)}
          >
            Back
          </Button>
          <Button
            className="text-white flex items-center gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
