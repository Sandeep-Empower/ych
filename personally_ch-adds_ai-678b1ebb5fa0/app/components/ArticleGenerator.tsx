"use client";
import React, {
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import "react-circular-progressbar/dist/styles.css";
import deleteIcon from "../assets/images/icons/delete.svg";
import regenrateIcon from "../assets/images/icons/regenrate.svg";
import editIcon from "../assets/images/icons/edit.svg";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/app/components/ui/SimpleToaster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import TiptapEditor from "@/app/components/TiptapEditor";
import { Sparkles, Upload, Loader2, ArrowRight } from "lucide-react";
import TagsInput from "@/app/components/TagsInput";
import AILoader from "@/app/components/AILoader";

const contentStyles = ["Informative", "Conversational", "Formal", "Casual"];
const tones = ["Professional", "Friendly", "Serious", "Playful"];
const languages = ["English", "Spanish", "French"];
const refreshCycles = ["No Refresh", "Daily", "Weekly", "Monthly"];
const categories = ["Health", "Tech", "Education", "Science"];

type Article = {
  id: number;
  title: string;
  metaDescription: string;
  content: string;
  tags: string[];
  featuredImage: string;
  imageFile?: File;
  imagePrompt?: string;
  imageGenerationFailed?: boolean;
  imageGenerating?: boolean;
};

type Title = {
  id: number;
  title: string;
  regenerating?: boolean;
};

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

interface ArticleGeneratorProps {
  mode: "create" | "edit";
  siteId: string;
  onSave?: (articles: Article[]) => void;
  onContinue?: () => void;
  onBack?: () => void;
  existingArticles?: SiteArticle[];
  onDeleteSiteArticle?: (id: string) => void;
  onUpdateSiteArticle?: (id: string, updates: Partial<SiteArticle>) => void;
  stepperComponent?: React.ReactNode;
  headerTitle?: string;
  continueButtonText?: string;
  saveButtonText?: string;
}

export default function ArticleGenerator({
  mode,
  siteId,
  onSave,
  onContinue,
  onBack,
  existingArticles = [],
  onDeleteSiteArticle,
  onUpdateSiteArticle,
  stepperComponent,
  headerTitle = "Generate Content",
  continueButtonText = "Continue",
  saveButtonText = "Save & Continue",
}: ArticleGeneratorProps) {
  const router = useRouter();
  const showToast = useToast();

  const maxArticles = 100;
  const minArticles = 1;

  const [form, setForm] = useState<{
    contentStyle: string;
    tone: string;
    niche: string;
    language: string;
    refreshCycle: string;
    numberOfArticles: number | "";
  }>({
    contentStyle: contentStyles[0],
    tone: tones[0],
    niche: categories[0],
    language: languages[0],
    refreshCycle: refreshCycles[0],
    numberOfArticles: minArticles,
  });

  const [fieldErrors, setFieldErrors] = useState<{
    contentStyle?: string;
    tone?: string;
    niche?: string;
    language?: string;
    refreshCycle?: string;
    numberOfArticles?: string;
  }>({});

  const [modalErrors, setModalErrors] = useState<{
    title?: string;
    metaDescription?: string;
    content?: string;
  }>({});

  const [articles, setArticles] = useState<Article[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [articlesGenerated, setArticlesGenerated] = useState(0);
  const [generatingTitles, setGeneratingTitles] = useState(false);
  const [generatingArticles, setGeneratingArticles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState("");
  const [deleteTitleModalOpen, setDeleteTitleModalOpen] = useState(false);
  const [titleToDelete, setTitleToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [deleteArticleModalOpen, setDeleteArticleModalOpen] = useState(false);
  const [articleToDeleteFromList, setArticleToDeleteFromList] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [regeneratingImages, setRegeneratingImages] = useState<Set<string>>(
    new Set()
  );
  const imageInputRef = useRef<HTMLInputElement>(null);

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case "contentStyle":
        return !value ? "Content style is required" : "";
      case "tone":
        return !value ? "Tone is required" : "";
      case "niche":
        return !value || value.trim() === ""
          ? "Niche/Category is required"
          : "";
      case "language":
        return !value ? "Language is required" : "";
      case "refreshCycle":
        return !value ? "Content refresh cycle is required" : "";
      case "numberOfArticles":
        if (!value && value !== 0) return "Number of articles is required";
        if (typeof value === "string" && value.trim() === "")
          return "Number of articles is required";
        const num = Number(value);
        if (isNaN(num) || num < minArticles)
          return `Minimum ${minArticles} article required`;
        if (num > maxArticles) return `Maximum ${maxArticles} articles allowed`;
        return "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    let isValid = true;

    Object.keys(form).forEach((key) => {
      const error = validateField(key, form[key as keyof typeof form]);
      if (error) {
        errors[key as keyof typeof errors] = error;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const validateModalField = (name: string, value: any): string => {
    switch (name) {
      case "title":
        return !value || value.trim() === "" ? "Title is required" : "";
      case "metaDescription":
        return !value || value.trim() === ""
          ? "Meta description is required"
          : "";
      case "content":
        // For HTML content, we need to check if it's truly empty
        if (!value) return "Content is required";

        // Remove HTML tags and check if there's actual text content
        const textContent = value.replace(/<[^>]*>/g, "").trim();
        // Also check for common empty HTML patterns
        const isEmptyHtml =
          value.trim() === "" ||
          value.trim() === "<p></p>" ||
          value.trim() === "<p><br></p>" ||
          value.trim() === "<p><br/></p>" ||
          value.trim() === "<br>" ||
          value.trim() === "<br/>" ||
          value.trim() === "<p></p><p></p>" ||
          value.trim() === "<p> </p>" ||
          textContent === "" ||
          textContent === " ";

        console.log("Content validation:", { value, textContent, isEmptyHtml }); // Debug log
        return isEmptyHtml ? "Content is required" : "";
      default:
        return "";
    }
  };

  const validateModalForm = (): boolean => {
    if (!editArticle) return false;

    const errors: typeof modalErrors = {};
    let isValid = true;

    // Validate required fields
    const fieldsToValidate = ["title", "metaDescription", "content"];
    fieldsToValidate.forEach((field) => {
      const error = validateModalField(
        field,
        editArticle[field as keyof typeof editArticle]
      );
      if (error) {
        errors[field as keyof typeof errors] = error;
        isValid = false;
      }
    });

    setModalErrors(errors);
    return isValid;
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    // Validate the field
    const error = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "numberOfArticles") {
      // Allow only numbers or empty string
      const numericValue = value.replace(/[^0-9]/g, "");

      // Allow empty string to let user delete
      if (numericValue === "") {
        setForm((prev) => ({ ...prev, [name]: "" }));
        // Clear field error when user starts typing
        setFieldErrors((prev) => ({ ...prev, [name]: "" }));
        return;
      }

      // Convert to number
      let numValue = parseInt(numericValue, 10);

      // Clamp value between min and max
      numValue = Math.min(Math.max(numValue, minArticles), maxArticles);

      setForm((prev) => ({ ...prev, [name]: numValue }));
      // Validate the field
      const error = validateField(name, numValue);
      setFieldErrors((prev) => ({ ...prev, [name]: error }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
      // Clear field error when user starts typing and validate
      const error = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleGenerateTitles = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneratingTitles(true);
    setError("");

    // Validate the entire form
    if (!validateForm()) {
      // setError("Please fix all validation errors before proceeding.");
      setGeneratingTitles(false);
      return;
    }

    try {
      const res = await fetch("/api/articles/generate/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          numberOfArticles: Number(form.numberOfArticles),
        }),
      });
      const data = await res.json();
      setTitles(data.titles || []);
    } catch (err) {
      setError("Failed to generate titles.");
    } finally {
      setGeneratingTitles(false);
      const titlesDiv = document.getElementById("titles");
      const articlesDiv = document.getElementById("articles");
      if (titlesDiv) {
        titlesDiv.style.display = "block";
      }
      if (articlesDiv) {
        articlesDiv.style.display = "none";
      }
    }
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const generateImageWithRetry = async (article: any, maxRetries = 1) => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        await generateImage(article, article.imagePrompt); // Assuming generateImage returns a promise
        return; // Success, exit the loop
      } catch (error) {
        attempt++;
        console.warn(`Retry ${attempt} for image generation failed.`, error);
        if (attempt < maxRetries) {
          const backoff = 500 * Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s...
          await delay(backoff);
        } else {
          console.error(
            "Max retries reached for image generation",
            article.title
          );
        }
      }
    }
  };

  const handleGenerateArticles = async () => {
    const titlesDiv = document.getElementById("titles");
    const articlesDiv = document.getElementById("articles");
    if (titlesDiv) titlesDiv.style.display = "none";
    if (articlesDiv) articlesDiv.style.display = "block";

    setGeneratingArticles(true);
    setArticlesGenerated(0);
    setError("");
    setArticles([]);

    const concurrencyLimit = 5;
    let index = 0;

    while (index < titles.length) {
      const batch = titles.slice(index, index + concurrencyLimit);

      const batchPromises = batch.map(async (title) => {
        try {
          // Step 1: Generate Article
          const res = await fetch("/api/articles/generate/single-article", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              title: title.title,
              articleId: title.id,
            }),
          });

          const data = await res.json();

          // Step 2: Store Article
          setArticles((prev) => [...prev, data.article]);

          // Step 3: Generate Image with Retry
          await generateImageWithRetry(data.article);
        } catch (err) {
          console.error("Error generating article or image", err);
        } finally {
          setArticlesGenerated((prev) => prev + 1);
        }
      });

      await Promise.allSettled(batchPromises);
      index += concurrencyLimit;

      await delay(1000); // Optional batch delay
    }

    setGeneratingArticles(false);
  };

  const handleDelete = (id: number) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDeleteTitle = (id: number) => {
    setTitles((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRegenerateTitle = async (id: number) => {
    try {
      // Set regenerating state for this specific title
      setTitles((prev) =>
        prev.map((t) => (t.id === id ? { ...t, regenerating: true } : t))
      );

      const res = await fetch("/api/articles/generate/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          numberOfArticles: 1,
        }),
      });
      const data = await res.json();
      setTitles((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, title: data.titles[0].title, regenerating: false }
            : t
        )
      );
    } catch (err) {
      setError("Failed to generate titles.");
      showToast({ message: "Failed to generate titles.", color: "error" });
      // Clear regenerating state on error
      setTitles((prev) =>
        prev.map((t) => (t.id === id ? { ...t, regenerating: false } : t))
      );
    }
  };

  const handleSaveAndContinue = async () => {
    if (!siteId) {
      setError("Site ID is missing.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("siteId", siteId);
      formData.append("articles", JSON.stringify(articles));
      formData.append("form", JSON.stringify(form));

      // Append image files if they exist
      articles.forEach((article, index) => {
        if (article.imageFile) {
          formData.append(`imageFile_${index}`, article.imageFile);
        }
      });

      const res = await fetch("/api/articles/save", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showToast({
          message: "Articles saved successfully.",
          color: "success",
        });
        if (onSave) {
          onSave(articles);
        }
        if (onContinue) {
          onContinue();
        }
      } else {
        setError("Failed to save articles.");
        showToast({ message: "Failed to save articles.", color: "error" });
      }
    } catch (err) {
      setError("Failed to save articles.");
      showToast({ message: "Failed to save articles.", color: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateArticle = async () => {
    if (!editArticle) return;

    // Validate modal form
    if (!validateModalForm()) {
      return;
    }

    setArticles((prev) =>
      prev.map((a) => (a.id === editArticle.id ? editArticle : a))
    );
    setEditModalOpen(false);
    setEditArticle(null);
    setModalErrors({}); // Clear modal errors when closing
  };

  const handleTiptapChange = (html: string) => {
    if (editArticle) {
      setEditArticle({ ...editArticle, content: html });
      // Clear content error when user starts typing
      const error = validateModalField("content", html);
      setModalErrors((prev) => ({ ...prev, content: error }));
    }
  };

  const handleModalFieldChange = (field: string, value: string) => {
    if (editArticle) {
      setEditArticle({ ...editArticle, [field]: value });
      // Validate the field
      const error = validateModalField(field, value);
      setModalErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const openEditModal = (article: Article) => {
    console.log("Opening modal with article:", article); // Debug log
    setEditArticle(article);
    setEditModalOpen(true);

    // Validate all fields and show errors for empty required fields
    const errors: typeof modalErrors = {};
    const fieldsToValidate = ["title", "metaDescription", "content"];
    fieldsToValidate.forEach((field) => {
      const fieldValue = article[field as keyof typeof article];
      console.log(`Validating ${field}:`, fieldValue); // Debug log
      const error = validateModalField(field, fieldValue);
      console.log(`Error for ${field}:`, error); // Debug log
      if (error) {
        errors[field as keyof typeof errors] = error;
      }
    });
    console.log("Final errors:", errors); // Debug log
    setModalErrors(errors);
  };

  async function generateImage(article: Article, prompt?: string) {
    try {
      // Set generating state to true and clear any previous failure state
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id
            ? { ...a, imageGenerating: true, imageGenerationFailed: false }
            : a
        )
      );

      const res = await fetch("/api/articles/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagePrompt: prompt || "",
          title: article.title,
          niche: form.niche,
        }),
      });

      if (!res.ok) {
        showToast({ message: "Image generation failed", color: "error" });
        // Mark as failed and stop generating
        setArticles((prev) =>
          prev.map((a) =>
            a.id === article.id
              ? { ...a, imageGenerationFailed: true, imageGenerating: false }
              : a
          )
        );
        return;
      }

      const data = await res.json();

      if (data.imageUrl) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === article.id
              ? {
                  ...a,
                  featuredImage: data.imageUrl,
                  imageGenerationFailed: false,
                  imageGenerating: false,
                }
              : a
          )
        );
      } else {
        // Mark as failed if no image URL returned and stop generating
        setArticles((prev) =>
          prev.map((a) =>
            a.id === article.id
              ? { ...a, imageGenerationFailed: true, imageGenerating: false }
              : a
          )
        );
      }
    } catch (err) {
      console.error(`Error generating image for "${article.title}":`, err);
      showToast({ message: "Image generation failed", color: "error" });
      // Mark as failed and stop generating
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id
            ? { ...a, imageGenerationFailed: true, imageGenerating: false }
            : a
        )
      );
    }
  }

  async function regenerateSiteArticleImage(articleId: string, title: string) {
    try {
      setRegeneratingImages((prev) => new Set([...prev, articleId]));

      const res = await fetch("/api/articles/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagePrompt: "",
          title: title,
          niche: form.niche,
          articleId: articleId,
        }),
      });

      if (!res.ok) {
        showToast({ message: "Image regeneration failed", color: "error" });
        return;
      }

      const data = await res.json();

      if (data.imageUrl) {
        // Update the existing articles array through parent callback
        if (onUpdateSiteArticle) {
          onUpdateSiteArticle(articleId, { image_url: data.imageUrl });
        }
        showToast({
          message: "Image regenerated successfully",
          color: "success",
        });
      } else {
        showToast({ message: "Failed to regenerate image", color: "error" });
      }
    } catch (err) {
      console.error(`Error regenerating image for article "${title}":`, err);
      showToast({ message: "Image regeneration failed", color: "error" });
    } finally {
      setRegeneratingImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
    }
  }

  useEffect(() => {
    if (editModalOpen && editArticle) {
      const updated = articles.find((a) => a.id === editArticle.id);
      if (updated && updated.featuredImage !== editArticle.featuredImage) {
        // Don't override if the current featuredImage is a blob URL (new upload)
        const isBlobUrl = editArticle.featuredImage?.startsWith("blob:");
        if (!isBlobUrl) {
          setEditArticle(updated);
        }
      }
    }
  }, [articles, editModalOpen, editArticle]);

  return (
    <div>
      {stepperComponent}

      {/* Existing Articles Section for Edit Mode */}
      {mode === "edit" && (
        <Card className="bg-white mx-auto p-0 gap-0 mb-6">
          <div className="flex justify-between border-b border-gray-200 px-6 py-4 items-center">
            <h2 className="text-xl font-semibold">Update articles</h2>
            <div className="flex gap-4">
              {onBack && (
                <Button
                  variant="outline"
                  type="button"
                  className="bg-white"
                  onClick={onBack}
                >
                  Back
                </Button>
              )}
              {onContinue && (
                <Button
                  type="button"
                  className="text-white flex items-center gap-2"
                  onClick={onContinue}
                >
                  {continueButtonText}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          {existingArticles.length > 0 && (
            <div className="p-6 space-y-6">
              {existingArticles.map((article: SiteArticle) => (
                <div
                  key={article.id}
                  className="bg-gray-50 rounded-lg p-4 shadow flex gap-6 relative"
                >
                  {article.image_url ? (
                    <div className="relative w-60 h-40">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        width={240}
                        height={160}
                        className="rounded object-cover h-40 w-full"
                      />
                      {regeneratingImages.has(article.id) ? (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded flex items-center justify-center">
                          <AILoader size="md" className="text-cyan-600" />
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="default"
                          className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm border-gray-300 text-primary hover:bg-white hover:border-gray-400 p-2 h-8 w-8 rounded-lg shadow-sm"
                          title="Regenerate Image"
                          onClick={() => {
                            regenerateSiteArticleImage(
                              article.id,
                              article.title
                            );
                          }}
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="w-60 h-40 bg-gray-200 animate-pulse rounded" />
                  )}
                  <div className="flex-1">
                    <div className="flex gap-2 mb-4">
                      {article.article_tags.map((tag) => (
                        <span
                          key={tag.tag.slug}
                          className="bg-gray-200 text-gray-900 px-3 py-1 rounded-full text-sm"
                        >
                          {tag.tag.name}
                        </span>
                      ))}
                    </div>
                    <h4 className="font-bold text-lg mb-2">{article.title}</h4>
                    <p className="text-gray-700 mb-2 text-sm line-clamp-4">
                      {article.meta_description}
                    </p>
                    <div className="flex gap-2 mt-auto relative xl:absolute top-0 right-0 xl:top-4 xl:right-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white border-cyan-600 text-cyan-600 flex gap-2 px-3 py-1 text-sm font-normal hover:bg-cyan-50"
                        onClick={() => {
                          // Navigate to edit article page
                          router.push(
                            `/edit/article/${siteId}/${article.slug}`
                          );
                        }}
                      >
                        <Image src={editIcon} alt="edit" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white border-red-700 text-red-700 flex gap-2 px-3 py-1 text-sm font-normal hover:bg-red-50"
                        onClick={() => {
                          setArticleToDelete(article.id.toString());
                          setDeleteModalOpen(true);
                        }}
                      >
                        <Image src={deleteIcon} alt="delete"></Image>Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {existingArticles.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-gray-500">No articles found</p>
            </div>
          )}
        </Card>
      )}

      <form onSubmit={handleGenerateTitles}>
        {/* Generate More Articles Section */}
        <Card className="bg-white mx-auto p-0 gap-0 mb-6">
          <div className="flex justify-between border-b border-gray-200 px-6 py-4 items-center">
            <h2 className="text-xl font-semibold">
              {mode === "edit" ? "Generate More articles" : headerTitle}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 xl:grid-cols-12 gap-8 mb-6">
              <div className="grid gap-2 col-span-2 md:col-span-2 xl:col-span-4 relative">
                <Label className="gap-1" htmlFor="contentStyle">
                  Content Style <span className="text-red-700">*</span>
                </Label>
                <Select
                  value={form.contentStyle}
                  onValueChange={(value) =>
                    handleSelectChange("contentStyle", value)
                  }
                  name="contentStyle"
                >
                  <SelectTrigger id="contentStyle" className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="w-full bg-white">
                    {contentStyles.map((s) => (
                      <SelectItem
                        className="cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100"
                        key={s}
                        value={s}
                      >
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.contentStyle && (
                  <p className="text-xs text-red-700 validation-error">
                    {fieldErrors.contentStyle}
                  </p>
                )}
              </div>
              <div className="grid gap-2 col-span-2 md:col-span-2 xl:col-span-4 relative">
                <Label className="gap-1" htmlFor="tone">
                  Tone <span className="text-red-700">*</span>
                </Label>
                <Select
                  value={form.tone}
                  onValueChange={(value) => handleSelectChange("tone", value)}
                  name="tone"
                >
                  <SelectTrigger id="tone" className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="w-full bg-white">
                    {tones.map((t) => (
                      <SelectItem
                        className="cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100"
                        key={t}
                        value={t}
                      >
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.tone && (
                  <p className="text-xs text-red-700 validation-error">
                    {fieldErrors.tone}
                  </p>
                )}
              </div>
              <div className="grid gap-2 col-span-2 md:col-span-2 xl:col-span-4 relative">
                <Label className="gap-1" htmlFor="niche">
                  Niche/Category <span className="text-red-700">*</span>
                </Label>
                <Input
                  value={form.niche}
                  name="niche"
                  id="niche"
                  className="w-full"
                  onChange={handleChange}
                  placeholder="Enter niche or category"
                />
                {fieldErrors.niche && (
                  <p className="text-xs text-red-700 validation-error">
                    {fieldErrors.niche}
                  </p>
                )}
              </div>
              <div className="grid gap-2 col-span-2 md:col-span-2 xl:col-span-4 relative">
                <Label className="gap-1" htmlFor="language">
                  Language <span className="text-red-700">*</span>
                </Label>
                <Select
                  value={form.language}
                  onValueChange={(value) =>
                    handleSelectChange("language", value)
                  }
                  name="language"
                >
                  <SelectTrigger id="language" className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="w-full bg-white">
                    {languages.map((l) => (
                      <SelectItem
                        className="cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100"
                        key={l}
                        value={l}
                      >
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.language && (
                  <p className="text-xs text-red-700 validation-error">
                    {fieldErrors.language}
                  </p>
                )}
              </div>
              <div className="grid gap-2 col-span-2 md:col-span-2 xl:col-span-4 relative">
                <Label className="gap-1" htmlFor="refreshCycle">
                  Content Refresh Cycle <span className="text-red-700">*</span>
                </Label>
                <Select
                  value={form.refreshCycle}
                  onValueChange={(value) =>
                    handleSelectChange("refreshCycle", value)
                  }
                  name="refreshCycle"
                >
                  <SelectTrigger id="refreshCycle" className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="w-full bg-white">
                    {refreshCycles.map((r) => (
                      <SelectItem
                        className="cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100"
                        key={r}
                        value={r}
                      >
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.refreshCycle && (
                  <p className="text-xs text-red-700 validation-error">
                    {fieldErrors.refreshCycle}
                  </p>
                )}
              </div>
              <div className="grid gap-2 col-span-2 md:col-span-2 xl:col-span-4 relative">
                <Label htmlFor="numberOfArticles" className="block">
                  Number of Articles <span className="text-red-700">*</span>
                </Label>
                <Input
                  type="number"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  name="numberOfArticles"
                  id="numberOfArticles"
                  min={1}
                  max={100}
                  value={form.numberOfArticles}
                  onChange={handleChange}
                  placeholder="Enter number (1-100)"
                  onBlur={() => {
                    if (!form.numberOfArticles) {
                      setForm((prev) => ({
                        ...prev,
                        numberOfArticles: minArticles,
                      }));
                    }
                  }}
                />
                {fieldErrors.numberOfArticles && (
                  <p className="text-xs text-red-700 validation-error">
                    {fieldErrors.numberOfArticles}
                  </p>
                )}
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end mt-4">
              <Button
                className="text-white flex items-center gap-2"
                type="submit"
                disabled={generatingTitles}
              >
                {generatingTitles ? "Generating..." : "Generate Titles"}
              </Button>
            </div>

            {error && <div className="text-red-700 mb-4">{error}</div>}
          </div>
        </Card>

        {/* Progress Bar */}
        {generatingArticles && (
          <div className="w-full my-6">
            <div className="text-sm text-gray-600 mb-1">
              Generating {articlesGenerated} of {titles.length} articles...
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(articlesGenerated / titles.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        <Card id="articles" className="bg-white mx-auto p-0 gap-0 hidden">
          <h2 className="text-xl font-semibold border-b border-gray-200 px-6 py-4">
            Articles
          </h2>
          <div className="p-6">
            <div className="gap-6 grid grid-cols-1">
              {articles.map((article: Article) => (
                <div
                  key={article.id}
                  className="bg-gray-50 rounded-lg p-4 shadow flex gap-6 relative"
                >
                  {article.featuredImage ? (
                    <div className="relative w-60 h-40">
                      <img
                        src={article.featuredImage}
                        alt={article.title}
                        width={240} // width in px (60 * 4)
                        height={160} // height in px (40 * 4)
                        className="rounded object-cover h-40 w-full"
                      />
                      {article.imageGenerating ? (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded flex items-center justify-center">
                          <AILoader size="md" className="text-white" />
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="default"
                          className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm border-gray-300 text-primary hover:bg-white hover:border-gray-400 p-2 h-8 w-8 rounded-lg shadow-sm"
                          title="Regenerate Image"
                          onClick={() => {
                            generateImage(article);
                          }}
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ) : article.imageGenerationFailed ? (
                    <div className="relative w-60 h-40 bg-white border-2 border-red-200 rounded flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-red-700 text-xs mb-4">
                          Image generation failed
                        </div>
                        {!article.imageGenerating && (
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-white border-primary  text-primary hover:bg-primary/5 px-3 py-1 text-xs"
                            onClick={() => {
                              generateImage(article);
                            }}
                          >
                            <Sparkles className="h-3 w-3" />
                            Retry
                          </Button>
                        )}
                        {article.imageGenerating && (
                          <div className="flex items-center justify-center">
                            <AILoader size="sm" text="Generating..." showText />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : article.imageGenerating ? (
                    <div className="w-60 h-40 bg-gray-200 animate-pulse rounded flex items-center justify-center">
                      <AILoader size="lg" text="Generating image..." showText />
                    </div>
                  ) : (
                    <div className="w-60 h-40 bg-gray-200 animate-pulse rounded" />
                  )}
                  <div className="flex-1">
                    <div className="flex gap-2 mb-4">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-200 text-gray-900 px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h4 className="font-bold text-lg mb-2">{article.title}</h4>
                    <p className="text-gray-700 mb-2 text-sm line-clamp-4">
                      {article.metaDescription}
                    </p>
                    <div className="flex gap-2 mt-auto relative xl:absolute top-0 right-0 xl:top-4 xl:right-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white border-cyan-600 text-cyan-600 flex gap-2 px-3 py-1 text-sm font-normal hover:bg-cyan-50"
                        onClick={() => {
                          openEditModal(article);
                        }}
                      >
                        <Image src={editIcon} alt="edit"></Image>Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white border-red-700 text-red-700 flex gap-2 px-3 py-1 text-sm font-normal hover:bg-red-50"
                        onClick={() => {
                          setArticleToDeleteFromList({
                            id: article.id,
                            title: article.title,
                          });
                          setDeleteArticleModalOpen(true);
                        }}
                      >
                        <Image src={deleteIcon} alt="delete"></Image>Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card id="titles" className="bg-white mx-auto p-0 gap-0">
          <h2 className="text-xl font-semibold border-b border-gray-200 px-6 py-4">
            Titles
          </h2>
          <div className="p-6">
            <div className="gap-4 grid grid-cols-1">
              {titles.length === 0 && (
                <div className="text-gray-500">No titles generated yet</div>
              )}
              {titles.map((title: Title) => (
                <div
                  key={title.id}
                  className="bg-gray-50 rounded-lg px-4 py-2 border flex justify-between items-center"
                >
                  <h4
                    className={`font-bold text-md ${
                      title.regenerating ? "blur-[3px]" : ""
                    }`}
                  >
                    {title.title}
                  </h4>
                  <div className="flex items-center gap-3">
                    <Button
                      className="p-0 w-7 h-7 flex items-center justify-center"
                      variant="destructive"
                      type="button"
                      onClick={() => handleRegenerateTitle(title.id)}
                      disabled={title.regenerating}
                    >
                      <Image
                        src={regenrateIcon}
                        alt="Regenerate Icon"
                        width={20}
                        className={title.regenerating ? "animate-spin" : ""}
                      />
                    </Button>
                    <Button
                      className="p-0 w-7 h-7 flex items-center justify-center"
                      variant="destructive"
                      type="button"
                      onClick={() => {
                        setTitleToDelete({ id: title.id, title: title.title });
                        setDeleteTitleModalOpen(true);
                      }}
                    >
                      <Image src={deleteIcon} alt="Delete Icon" width={20} />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end mt-4">
                {titles.length > 0 && (
                  <Button
                    type="button"
                    className="text-white flex items-center gap-2"
                    onClick={handleGenerateArticles}
                    disabled={generatingArticles}
                  >
                    {generatingArticles
                      ? "Generating..."
                      : "Continue Generate Articles"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="action-footer mt-6 flex justify-end">
          <div className="flex justify-end gap-4">
            <Button
              className="text-white flex items-center gap-2"
              onClick={handleSaveAndContinue}
              disabled={saving || articles.length === 0}
            >
              {saving ? "Saving..." : saveButtonText}
            </Button>
          </div>
        </div>
      </form>

      {/* Edit Article Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="rounded-xl shadow-2xl p-0 !max-w-5xl bg-white gap-0">
          {editArticle && (
            <>
              <Card className="p-0 gap-0 border-none rounded-none shadow-none max-h-[calc(100vh_-_150px)]">
                <div className="flex justify-between border-b border-gray-200 px-6 py-4 items-center">
                  <h2 className="text-xl font-semibold">Article Editor</h2>
                </div>
                <div className="p-6 overflow-auto h-full mb-4">
                  <div className="space-y-6">
                    <div className="flex gap-6">
                      <div className="flex-1 space-y-6">
                        <div>
                          <Label className="block mb-2">Tags</Label>
                          <TagsInput
                            tags={editArticle?.tags || []}
                            setTags={(tags) =>
                              setEditArticle({ ...editArticle!, tags })
                            }
                          />
                        </div>
                        <div className="relative">
                          <Label className="block mb-2">
                            Title <span className="text-red-700">*</span>
                          </Label>
                          <Input
                            name="title"
                            className="border rounded-md px-3 py-2 w-full mb-2 text-sm h-[44px]"
                            value={editArticle?.title || ""}
                            onChange={(e) =>
                              handleModalFieldChange("title", e.target.value)
                            }
                            placeholder="Enter article title"
                          />
                          {modalErrors.title && (
                            <p className="text-xs text-red-700 validation-error">
                              {modalErrors.title}
                            </p>
                          )}
                        </div>
                        <div className="relative">
                          <Label className="block mb-2">
                            Meta Description{" "}
                            <span className="text-red-700">*</span>
                          </Label>
                          <textarea
                            name="metaDescription"
                            className="border rounded-md px-3 py-2 !pr-10 w-full min-h-[60px] focus:outline-none focus:ring-0 text-sm resize-none"
                            value={editArticle?.metaDescription || ""}
                            onChange={(e) =>
                              handleModalFieldChange(
                                "metaDescription",
                                e.target.value
                              )
                            }
                            placeholder="Enter meta description"
                            rows={3}
                          />
                          {modalErrors.metaDescription && (
                            <p className="text-xs text-red-700 validation-error">
                              {modalErrors.metaDescription}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Image */}
                      <div className="m-w-[300px] w-[300px] flex flex-col">
                        <Label className="block mb-2">Image</Label>
                        <div className="flex flex-col items-center gap-4 flex-1 rounded-lg overflow-hidden relative max-h-[260px]">
                          {editArticle?.featuredImage ? (
                            <img
                              src={editArticle.featuredImage}
                              alt="Article"
                              className="rounded object-cover border !w-full !h-full"
                              style={{ width: 180, height: 120 }}
                            />
                          ) : (
                            <div className="w-60 h-40 bg-gray-200 animate-pulse rounded" />
                          )}
                          <div className="grid grid-cols-2 gap-2 absolute bottom-3 w-full px-3">
                            <div className="flex-1">
                              <Input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const blobUrl = URL.createObjectURL(file);
                                    setEditArticle({
                                      ...editArticle!,
                                      featuredImage: blobUrl,
                                      imageFile: file,
                                    });
                                  }
                                }}
                                style={{ display: "none" }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full bg-white text-sm border-primary border text-primary"
                                onClick={() => imageInputRef.current?.click()}
                              >
                                <Upload /> Upload
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="relative">
                      <Label className="block mb-2">
                        Description <span className="text-red-700">*</span>
                      </Label>
                      <div className="border rounded-md overflow-hidden relative">
                        <TiptapEditor
                          value={editArticle?.content || ""}
                          onChange={handleTiptapChange}
                        />
                      </div>
                      {modalErrors.content && (
                        <p className="text-xs text-red-700 validation-error">
                          {modalErrors.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
              <div className="flex justify-end gap-2 p-6 border-t">
                <Button
                  type="button"
                  className="bg-white"
                  variant="outline"
                  onClick={() => {
                    setModalErrors({}); // Clear modal errors
                    setEditModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="text-white"
                  onClick={handleUpdateArticle}
                >
                  Update Article
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="rounded-xl shadow-2xl p-8 max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">
              Are you sure?
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-base mb-8">
              <span className="block mb-2">
                Are you sure you want to permanently delete the following
                article?
                <br />
                <b>
                  {
                    existingArticles.find(
                      (article) => article.id === articleToDelete
                    )?.title
                  }
                </b>
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border border-gray-300 text-gray-800 font-medium rounded-md px-6 py-2"
              onClick={() => setDeleteModalOpen(false)}
              title="Cancel"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-md px-6 py-2"
              onClick={() => {
                if (onDeleteSiteArticle) {
                  onDeleteSiteArticle(articleToDelete);
                }
                setDeleteModalOpen(false);
              }}
              title="Delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Title Confirmation Modal */}
      <Dialog
        open={deleteTitleModalOpen}
        onOpenChange={setDeleteTitleModalOpen}
      >
        <DialogContent className="rounded-xl shadow-2xl p-8 max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">
              Are you sure?
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-base mb-8">
              <span className="block mb-2">
                Are you sure you want to permanently delete the following title?
                <br />
                <b>{titleToDelete?.title}</b>
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border border-gray-300 text-gray-800 font-medium rounded-md px-6 py-2"
              onClick={() => setDeleteTitleModalOpen(false)}
              title="Cancel"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-md px-6 py-2"
              onClick={() => {
                if (titleToDelete) {
                  handleDeleteTitle(titleToDelete.id);
                }
                setDeleteTitleModalOpen(false);
                setTitleToDelete(null);
              }}
              title="Delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Article Confirmation Modal */}
      <Dialog
        open={deleteArticleModalOpen}
        onOpenChange={setDeleteArticleModalOpen}
      >
        <DialogContent className="rounded-xl shadow-2xl p-8 max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">
              Are you sure?
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-base mb-8">
              <span className="block mb-2">
                Are you sure you want to permanently delete the following
                article?
                <br />
                <b>{articleToDeleteFromList?.title}</b>
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border border-gray-300 text-gray-800 font-medium rounded-md px-6 py-2"
              onClick={() => setDeleteArticleModalOpen(false)}
              title="Cancel"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-md px-6 py-2"
              onClick={() => {
                if (articleToDeleteFromList) {
                  handleDelete(articleToDeleteFromList.id);
                }
                setDeleteArticleModalOpen(false);
                setArticleToDeleteFromList(null);
              }}
              title="Delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
