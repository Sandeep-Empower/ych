"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Success() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [siteId, setSiteId] = useState("");
  const [siteDomain, setSiteDomain] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
  const port = process.env.NEXT_PUBLIC_PORT;
  const protocol = appEnv !== "production" && appEnv !== "staging" ? "http" : "https";
  const portPart = (appEnv !== "production" && appEnv !== "staging") && port ? `:${port}` : "";
  const siteUrl = `${protocol}://${siteDomain}${portPart}`;

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
        const data = await res.json();
        if (!res.ok) {
          setValidationError(data.error || "Invalid site ID");
          router.push("/create/step-1");
          return;
        }
        setIsValidating(false);
        setSiteDomain(data.domain);
      } catch (error) {
        setValidationError("Failed to validate site");
        router.push("/create/step-1");
      }
    };

    if (siteId) {
      validateSiteId();
    }
  }, [siteId, router]);

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
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Success!</h1>
      <p className="text-xl mb-8">
        Your site is live now and you can access it at {siteUrl}
      </p>
      <Button
        type="button"
        onClick={() => window.open(siteUrl, "_blank", "noopener,noreferrer")}
        className="text-white"
      >
        View My Website
      </Button>
    </div>
  );
}
