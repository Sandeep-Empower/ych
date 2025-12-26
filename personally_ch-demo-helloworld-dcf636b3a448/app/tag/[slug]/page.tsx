import { getArticlesByTag } from "@/lib/articles";
import Link from "next/link";
import { dummyAuthor } from "@/lib/dummy";
import ArticleCard from "@/components/ArticleCard";
import { Suspense } from "react";
import Loader from "@/components/Loader";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tagName = decodeURIComponent(slug).replace(/-/g, " ");

  return {
    title: `${tagName} Articles`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const articles = await getArticlesByTag(slug, 12);

  return (
    <div className="min-h-screen">
      {/* Tag Title */}
      <div className="bg-primary-100 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900">
          {slug.charAt(0).toUpperCase() + slug.slice(1)}
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles && articles.length > 0 ? (
            articles.map((article: Article) => (
              <Suspense key={article.id} fallback={<Loader />}>
                <ArticleCard article={article} />
              </Suspense>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 text-lg py-20">
              No articles found for this tag.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
