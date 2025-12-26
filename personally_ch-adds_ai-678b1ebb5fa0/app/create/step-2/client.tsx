"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/components/ui/SimpleToaster";
import SiteStepper from "@/app/components/ui/SiteStepper";
import ArticleGenerator from "@/app/components/ArticleGenerator";

export default function Step2Client() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [siteId, setSiteId] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState("");
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
        router.push("/create/step-1");
        return;
      }
      try {
        const res = await fetch("/api/site/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId }),
        });
        if (!res.ok) {
          const data = await res.json();
          setValidationError(data.error || "Invalid site ID");
          router.push("/create/step-1");
          return;
        }
        setIsValidating(false);
      } catch (error) {
        setValidationError("Failed to validate site");
        router.push("/create/step-1");
      }
    };

    if (siteId) {
      validateSiteId();
    }
  }, [siteId, router]);

  const handleSave = (articles: any[]) => {
    // Handle save if needed
    console.log("Articles saved:", articles);
  };

  const handleContinue = () => {
    router.push(`/create/step-3?siteId=${siteId}`);
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
          <button
            onClick={() => router.push("/create/step-1")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Return to Step 1
          </button>
        </div>
      </div>
    );
  }

  return (
    <ArticleGenerator
      mode="create"
      siteId={siteId}
      onSave={handleSave}
      onContinue={handleContinue}
      stepperComponent={<SiteStepper currentStep={2} />}
      headerTitle="Generate Content"
      saveButtonText="Save & Continue"
    />
  );
}
