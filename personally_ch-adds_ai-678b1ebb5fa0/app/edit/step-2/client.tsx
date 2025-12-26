"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/components/ui/SimpleToaster";
import SiteStepper2 from "@/app/components/ui/SiteStepper2";
import ArticleGenerator from "@/app/components/ArticleGenerator";

type SiteArticle = {
  id: string;
  title: string;
  slug: string;
  meta_description: string;
  image_url: string;
  article_tags: Array<{
    tag: {
      name: string;
      slug: string;
    };
  }>;
};

export default function Step2Client() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [siteId, setSiteId] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [siteArticles, setSiteArticles] = useState<SiteArticle[]>([]);
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
        router.back();
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
          window.sessionStorage.setItem("siteDomainName", site.domain);
          window.dispatchEvent(new Event("siteDomainNameChanged"));
          fetchSiteArticles();
        } else {
          const data = await res.json();
          setValidationError(data.error || "Invalid site ID");
          showToast({
            message: data.error || "Invalid site ID",
            color: "error",
          });
          router.push("/manageSite");
          return;
        }
        setIsValidating(false);
      } catch (error) {
        setValidationError("Failed to validate site");
        showToast({ message: "Failed to validate site", color: "error" });
        router.push("/manageSite");
      }
    };

    if (siteId) {
      validateSiteId();
    }
  }, [siteId, router]);

  const fetchSiteArticles = async () => {
    if (!siteId) {
      return;
    }
    try {
      const res = await fetch(
        `/api/articles/get?siteId=${siteId}&page=1&limit=100`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json();
      if (res.ok) {
        const articles = data.articles;
        setSiteArticles(articles);
      } else {
        setValidationError(data.error || "Invalid site ID");
        return;
      }
    } catch (error) {
      setValidationError("Failed to fetch articles");
      return;
    }
  };

  const handleDeleteSiteArticle = async (id: string) => {
    try {
      const res = await fetch(`/api/articles/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: id }),
      });
      if (!res.ok) {
        showToast({ message: "Failed to delete article.", color: "error" });
        return;
      }
      setSiteArticles((prev) => prev.filter((a) => a.id !== id));
      showToast({ message: "Article deleted successfully.", color: "success" });
    } catch (err) {
      showToast({
        message: "An error occurred while deleting.",
        color: "error",
      });
    }
  };

  const handleUpdateSiteArticle = async (
    id: string,
    updates: Partial<SiteArticle>
  ) => {
    // Update the local state immediately for better UX
    setSiteArticles((prev) =>
      prev.map((article) =>
        article.id === id ? { ...article, ...updates } : article
      )
    );

    // For image_url updates, we don't need to call the API since the image
    // generation already handles updating the database if needed
    if (updates.image_url) {
      return; // Just update the UI for image regeneration
    }

    // For other updates, you could add API calls here if needed
    try {
      // Future: Add API calls for other field updates
      showToast({ message: "Article updated successfully.", color: "success" });
    } catch (err) {
      showToast({
        message: "An error occurred while updating article.",
        color: "error",
      });
      // Refetch to ensure data consistency
      fetchSiteArticles();
    }
  };

  const handleSave = (articles: any[]) => {
    // Handle save if needed
    console.log("Articles saved:", articles);
  };

  const handleContinue = () => {
    router.push(`/edit/step-3?siteId=${siteId}`);
  };

  const handleBack = () => {
    router.push(`/edit/step-1?siteId=${siteId}`);
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
      mode="edit"
      siteId={siteId}
      onSave={handleSave}
      onContinue={handleContinue}
      onBack={handleBack}
      existingArticles={siteArticles}
      onDeleteSiteArticle={handleDeleteSiteArticle}
      onUpdateSiteArticle={handleUpdateSiteArticle}
      stepperComponent={<SiteStepper2 currentStep={2} />}
      headerTitle="Update articles"
      continueButtonText="Update/Continue"
      saveButtonText="Save"
    />
  );
}
