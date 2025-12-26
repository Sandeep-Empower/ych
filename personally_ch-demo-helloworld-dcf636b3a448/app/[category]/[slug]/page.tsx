import { Suspense } from "react";
import ArticlePageClient from "@/app/[category]/[slug]/client";
import { getArticleBySlug } from "@/lib/articles";
import { getSiteData } from "@/lib/site";
import Sidebar from "@/components/Sidebar";
import Loader from "@/components/Loader";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
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
  const siteData = await getSiteData();
  const allArticles = siteData?.articles || [];
  // Exclude current article from related
  const relatedArticles = allArticles.filter((a) => a.slug !== slug);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Article not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-gray-900 text-center leading-[1.5]">
            {article.title}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Article Content */}
          <Suspense
            fallback={
              <div className="col-span-2">
                <Loader />
              </div>
            }
          >
            <ArticlePageClient article={article} />
          </Suspense>
          {/* Sidebar */}

          <Sidebar
            showRelatedArticle={true}
            relatedArticles={relatedArticles}
          />
        </div>
      </div>
    </div>
  );
}
