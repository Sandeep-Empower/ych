"use client";
import { useState, useEffect, useRef } from "react";
import EditArticleModal from "@/app/components/EditArticleModal";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import TiptapEditor from "@/app/components/TiptapEditor";
import { useToast } from "@/app/components/ui/SimpleToaster";
import { Card } from "@/components/ui/card";
import { Sparkles, Upload } from "lucide-react";
import TagsInput from "@/app/components/TagsInput";

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string; siteId: string }>;
}) {
  const { slug, siteId } = React.use(params);
  const [article, setArticle] = useState<SiteArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    meta_description?: string;
    content?: string;
    image?: string;
  }>({});
  const showToast = useToast();
  const [formData, setFormData] = useState({
    content: "",
    title: "",
    meta_description: "",
    tags: [] as string[], // <-- now an array
    image: null as File | null,
  });
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case "title":
        return !value || value.trim() === "" ? "Title is required" : "";
      case "meta_description":
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

        return isEmptyHtml ? "Content is required" : "";
      case "image":
        // Image is not required, but we can validate file if present
        return "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    let isValid = true;

    // Validate required fields
    const fieldsToValidate = ["title", "meta_description", "content"];
    fieldsToValidate.forEach((field) => {
      const error = validateField(
        field,
        formData[field as keyof typeof formData]
      );
      if (error) {
        errors[field as keyof typeof errors] = error;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Validate the field and clear any existing error
    const error = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleTiptapChange = (html: string) => {
    setFormData((prev) => ({ ...prev, content: html }));
    // Validate the content field
    const error = validateField("content", html);
    setFieldErrors((prev) => ({ ...prev, content: error }));
  };

  const handleClose = () => {
    router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    // Add your update logic here
    const fd = new FormData();
    fd.append("content", formData.content);
    fd.append("title", formData.title);
    fd.append("meta_description", formData.meta_description);
    fd.append("tags", formData.tags.join(", ")); // <-- join array for backend
    fd.append("siteId", siteId);
    fd.append("articleId", article?.id || "");
    fd.append("image", formData.image || "");
    const res = await fetch(`/api/articles/update`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const errorMsg = "Failed to update article";
      showToast({ message: errorMsg, color: "error" });
      return;
    }
    showToast({ message: "Article updated successfully", color: "success" });
    router.back();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFieldErrors((prev) => ({ ...prev, image: "" }));
      setFormData((prev) => ({ ...prev, image: null }));
      return;
    }
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/svg+xml",
      "image/gif",
    ];
    if (!validTypes.includes(file.type)) {
      const error = "Invalid file type. Allowed: JPG, PNG, SVG, GIF.";
      setFieldErrors((prev) => ({ ...prev, image: error }));
      setFormData((prev) => ({ ...prev, image: null }));
      return;
    }
    if (file.size > 1024 * 1024 * 3) {
      const error = "File too large. Max 3MB.";
      setFieldErrors((prev) => ({ ...prev, image: error }));
      setFormData((prev) => ({ ...prev, image: null }));
      return;
    }
    // Check dimensions
    const img = new window.Image();
    img.onload = function () {
      if (img.width > 1792 || img.height > 1024) {
        const error = "Image dimensions must not exceed 1792x1024.";
        setFieldErrors((prev) => ({ ...prev, image: error }));
        setFormData((prev) => ({ ...prev, image: null }));
      } else {
        setFieldErrors((prev) => ({ ...prev, image: "" }));
        setFormData((prev) => ({ ...prev, image: file }));
      }
    };
    img.onerror = function () {
      const error = "Invalid image file.";
      setFieldErrors((prev) => ({ ...prev, image: error }));
      setFormData((prev) => ({ ...prev, image: null }));
    };
    img.src = URL.createObjectURL(file);
  };

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/articles/get/${slug}?siteId=${siteId}`);
        if (!res.ok) {
          const errorMsg = "Failed to fetch article";
          setError(errorMsg);
          showToast({ message: errorMsg, color: "error" });
          setLoading(false);
          return;
        }
        const data = await res.json();
        setArticle(data.article);
        setFormData({
          title: data.article.title,
          content: data.article.content,
          meta_description: data.article.meta_description,
          tags: data.article.article_tags.map((t: any) => t.tag.name), // <-- array
          image: null,
        });
      } catch (err) {
        const errorMsg = "Failed to fetch article";
        setError(errorMsg);
        showToast({ message: errorMsg, color: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug, siteId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-700">
        {error}
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Article not found
      </div>
    );
  }

  return (
    <>
      <Card className="bg-white mx-auto p-0 gap-0">
        <div className="flex justify-between border-b border-gray-200 px-6 py-4 items-center">
          <h2 className="text-xl font-semibold">Article Editor</h2>
          {/* <Button type="submit" className="text-white">
            <Sparkles /> Regenerate All
          </Button> */}
        </div>
        <div className="p-6 mb-4">
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="flex-1  space-y-6">
                <div>
                  <Label className="block mb-2">Tags</Label>
                  <TagsInput
                    tags={formData.tags}
                    setTags={(tags) =>
                      setFormData((prev) => ({ ...prev, tags }))
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
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter article title"
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-red-700 validation-error">
                      {fieldErrors.title}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <Label className="block mb-2">
                    Meta Description <span className="text-red-700">*</span>
                  </Label>
                  <textarea
                    name="meta_description"
                    className="border rounded-md px-3 py-2 !pr-10 w-full min-h-[60px] focus:outline-none focus:ring-0 text-sm resize-none"
                    value={formData.meta_description}
                    onChange={handleChange}
                    placeholder="Enter meta description"
                    rows={3}
                  />
                  {fieldErrors.meta_description && (
                    <p className="text-xs text-red-700 validation-error">
                      {fieldErrors.meta_description}
                    </p>
                  )}
                </div>
              </div>

              {/* Image */}
              <div className="m-w-[300px] w-[300px] flex flex-col">
                <Label className="block mb-2">Image</Label>
                <div className="flex flex-col items-center gap-4 flex-1 rounded-lg overflow-hidden relative max-h-[250px]">
                  {formData.image ? (
                    <img
                      src={URL.createObjectURL(formData.image)}
                      alt="Article"
                      className="rounded object-cover border !w-full !h-full"
                      style={{ width: 180, height: 120 }}
                    />
                  ) : (
                    <img
                      src={article.image_url}
                      alt="Article"
                      className="rounded object-cover border !w-full !h-full"
                      style={{ width: 180, height: 120 }}
                    />
                  )}
                  <div className="grid  grid-cols-2 gap-2 absolute bottom-3 w-full px-3">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.ico"
                        style={{ display: "none" }}
                        ref={imageInputRef}
                        onChange={handleImageChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-white text-sm border-primary border text-primary"
                        onClick={() => {
                          imageInputRef.current?.click();
                        }}
                      >
                        <Upload /> Upload
                      </Button>
                    </div>
                    {/* <Button
                      type="button"
                      variant="outline"
                      className=" bg-white text-sm border-primary border text-primary"
                    >
                      <Sparkles /> Regenerate
                    </Button> */}
                    {/* <Button type="button" variant="outline">Regenerate</Button> */}
                  </div>
                </div>
                {fieldErrors.image && (
                  <p className="text-xs text-red-700 validation-error">
                    {fieldErrors.image}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="relative">
              <Label className="block mb-2">
                Description <span className="text-red-700">*</span>
              </Label>
              <div className="border rounded-md overflow-hidden relative">
                <TiptapEditor
                  value={formData.content}
                  onChange={handleTiptapChange}
                />
              </div>
              {fieldErrors.content && (
                <p className="text-xs text-red-700 validation-error">
                  {fieldErrors.content}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
      <div className="flex justify-end gap-2 mt-6">
        <Button
          type="button"
          className="bg-white"
          variant="outline"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button type="submit" className="text-white" onClick={handleSubmit}>
          Update Article
        </Button>
      </div>
    </>
  );
}
