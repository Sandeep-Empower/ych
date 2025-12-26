import React from "react";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";

type Article = {
  id: string | number;
  title: string;
  image_url?: string;
  created_at: string;
  slug: string;
  // Optionally, add category if available
  category?: string;
  article_tags?: { tag: { slug: string; name: string } }[];
};

interface RelatedArticleProps {
  relatedArticles: Article[];
}

const RelatedArticle: React.FC<{ relatedArticles: Article[] }> = ({
  relatedArticles,
}) => {
  if (!relatedArticles || relatedArticles.length === 0) {
    return null;
  }
  const articles = relatedArticles;

  // Helper to guess category from article_tags or category property
  function getArticleUrl(article: Article) {
    if (article.category) {
      return `/${article.category}/${article.slug}`;
    }
    // Try to infer category from first tag if available
    if (article.article_tags && article.article_tags.length > 0) {
      return `/${article.article_tags[0].tag.slug}/${article.slug}`;
    }
    // Fallback to /article/[slug]
    return `/article/${article.slug}`;
  }
  return (
    <div className="bg-white rounded-xl shadow flex flex-col">
      <h3 className="text-lg font-bold px-6 py-4 border-b">Related Articles</h3>
      <div className="flex flex-col gap-4 p-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={getArticleUrl(article)}
            className="flex gap-3 items-start group"
          >
            <img
              src={
                article.image_url || "https://placehold.co/80x80?text=No+Image"
              }
              alt={article.title}
              className="w-16 h-16 rounded-md object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center text-gray-500 text-xs mb-1 gap-1">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  {new Date(article.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="font-semibold text-sm text-gray-900 group-hover:text-primary-600 line-clamp-2">
                {article.title}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedArticle;
