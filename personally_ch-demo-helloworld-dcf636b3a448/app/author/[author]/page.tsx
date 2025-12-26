import React, { Suspense } from "react";
import { getArticlesByAuthor } from "@/lib/articles"; // Assume this function fetches the article data by ID
import {
  CalendarIcon,
  UserIcon,
  GlobeEuropeAfricaIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { dummyAuthor } from "@/lib/dummy"; // Dummy author data for fallback
import ArticleCard from "@/components/ArticleCard";
import Loader from "@/components/Loader";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ author: string }>;
}): Promise<Metadata> {
  const { author } = await params;
  const authorName = decodeURIComponent(author).replace(/-/g, " ");

  return {
    title: `Articles by ${authorName}`,
  };
}

// Create a separate component for articles content
async function AuthorArticles({ author }: { author: string }) {
  const articles = await getArticlesByAuthor(author, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {articles &&
        articles.map((article, index) => (
          <ArticleCard key={index} article={article} />
        ))}
      {!articles || articles.length === 0 ? (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-gray-500">
          No articles found.
        </div>
      ) : null}
    </div>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ author: string }>;
}) {
  const { author } = await params;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Author box */}
      <div className="bg-gray-50 mb-12 rounded-2xl flex shadow p-8 gap-4">
        <div>
          <img
            src={dummyAuthor.avatar}
            alt={dummyAuthor.name || "Author"}
            className="w-24 h-24 min-w-24 rounded-full border-2 border-gray-500"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-6 mb-2">
            {dummyAuthor.name}{" "}
            <Link href="/" className="hover:text-primary-600">
              <GlobeEuropeAfricaIcon className="w-6 h-6" />
            </Link>
          </h1>
          <p className="text-gray-600">
            Join Sally, Doug, and me on our mission to bring you the internet's
            most popular content in clear, engaging articles. We track the most
            liked, upvoted, and trending topics to keep you informed and
            entertained.
          </p>
        </div>
      </div>

      <Suspense fallback={<Loader />}>
        <AuthorArticles author={author} />
      </Suspense>
    </div>
  );
}
