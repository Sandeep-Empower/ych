// app/page/[pageNumber]/page.tsx

import { getArticlesBySiteId, getSiteData } from "@/lib/site";
import SearchBox from "@/components/SearchBox";
import ArticleCard from "@/components/ArticleCard";
import type { Metadata } from "next";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageNumber: string }>;
}): Promise<Metadata> {
  const { pageNumber } = await params;

  return {
    title: `Page ${pageNumber}`,
  };
}

const ARTICLES_PER_PAGE = 12;

export default async function PaginatedPage({
  params,
}: {
  params: Promise<{ pageNumber: string }>;
}) {
  // ✅ Destructure params directly
  const { pageNumber } = await params;
  const currentPage = Number(pageNumber) || 1;

  const siteData = await getSiteData();
  if (!siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Site Not Found</h1>
      </div>
    );
  }

  const articles = await getArticlesBySiteId(
    siteData.id,
    currentPage,
    ARTICLES_PER_PAGE
  );
  const paginatedArticles = Array.isArray(articles.articles)
    ? articles.articles
    : [];
  const totalArticles = siteData.articlesCount || 0;
  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);
  return (
    <>
      <div className="search-box bg-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center leading-tight">
            Find What You're Looking For
          </h2>
          <p className="text-gray-800 text-center">
            Discover the most relevant results with our advanced search
            technology
          </p>
          <div className="search-input w-full max-w-[700px] mt-6">
            <SearchBox />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">
            Latest Blogs & Searches
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.isArray(paginatedArticles) && paginatedArticles.length > 0 ? (
            paginatedArticles.map((article, idx) => (
              <ArticleCard key={article?.id ?? idx} article={article} />
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500">
              No articles found.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={
                        currentPage === 2 ? `/` : `/page/${currentPage - 1}`
                      }
                    />
                  </PaginationItem>
                )}

                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href={i === 0 ? `/` : `/page/${i + 1}`}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext href={`/page/${currentPage + 1}`} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </>
  );
}
