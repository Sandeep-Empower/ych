// app/page/[pageNumber]/page.tsx

import { getArticlesBySiteId } from "@/lib/site";
import SearchBox from "@/components/SearchBox";
import ArticleCard from "@/components/ArticleCard";
import { getSiteData } from "@/lib/site";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Metadata } from "next";

const ARTICLES_PER_PAGE = 12;
const SITE_ID = "661eee8b-ba04-415d-8edd-009d53fab230";

export async function generateMetadata(): Promise<Metadata> {
  const siteData = await getSiteData();

  if (!siteData) {
    return {
      title: "Home",
    };
  }

  return {
    title: `Home - ${siteData.site_name}`,
  };
}

interface PageProps {
  params: {
    pageNumber: string;
  };
}

export default async function HomePage() {
  // ✅ Destructure params directly

  const currentPage = 1;

  // const siteData = await getArticlesBySiteId(SITE_ID, currentPage, ARTICLES_PER_PAGE);
  const siteData = await getSiteData();

  if (!siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Site Not Found</h1>
      </div>
    );
  }

  const paginatedArticles = Array.isArray(siteData.articles)
    ? siteData.articles
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
