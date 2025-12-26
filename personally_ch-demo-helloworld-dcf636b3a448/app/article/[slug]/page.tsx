import React, { Suspense } from "react";
import { getArticleBySlug } from "@/lib/articles"; // Assume this function fetches the article data by ID
import Sidebar from "@/components/Sidebar";
import CalendarIcon from "@heroicons/react/24/outline/CalendarIcon";
import Loader from "@/components/Loader";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  return {
    title: article ? article.title : "Article Not Found",
    description: article
      ? article.meta_description || article.title
      : "Article not found",
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Article not found.
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Article Content */}
        <div className="md:col-span-2">
          <Suspense fallback={<Loader />}>
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-bold mb-4">{article.title}</h2>
              <div className="flex items-center text-gray-500 text-xs mb-2 gap-1">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  {new Date(article.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div
                className="text-gray-700 mb-4"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>
          </Suspense>
        </div>
        {/* Sidebar */}
        <Sidebar />
      </div>
    </div>
  );
}
