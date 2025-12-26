import React from "react";
import Link from "next/link";
import { CalendarIcon, EyeIcon } from "lucide-react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { dummyAuthor } from "@/lib/dummy";

function ArticleCard({ article }: { article: Article }): React.JSX.Element {
  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border">
        {/* Top image */}
        <div className="h-52 w-full flex items-center justify-center relative">
          {/* Badges */}
          <div className="absolute flex flex-wrap gap-2 left-4 top-4">
            {article.article_tags &&
              article.article_tags.map((tagObj, idx) => (
                <Link
                  key={idx}
                  href={`/tag/${tagObj.tag.slug}`}
                  className={`bg-white text-xs font-semibold shadow-sm border px-3 py-1 rounded-full`}
                >
                  {tagObj.tag.name}
                </Link>
              ))}
          </div>
          {article.image_url ? (
            <Link
              className="w-full h-full"
              href={`/${article.article_tags[0].tag.slug}/${article.slug}`}
            >
              {" "}
              <img
                src={article.image_url}
                alt={article.title}
                className="object-cover w-full h-full"
              />
            </Link>
          ) : (
            <Link
              className="w-full h-full"
              href={`/${article.article_tags[0].tag.slug}/${article.slug}`}
            >
              <img
                src="https://placehold.co/600x400?text=No+Image"
                alt="Default article"
                className="object-cover w-full h-full"
              />
            </Link>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col px-4 pb-4 pt-4">
          <div className="flex items-center text-gray-500 text-xs mb-2 gap-1">
            <CalendarIcon className="w-4 h-4" />
            <span data-date={article.created_at}>
              {new Intl.DateTimeFormat("en-US", {
                timeZone: "UTC",
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(new Date(article.created_at))}
            </span>
          </div>
          <Link
            key={article.slug}
            href={`/${article.article_tags[0].tag.slug}/${article.slug}`}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
              {article.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {article.meta_description ||
                article.content.slice(0, 100) + "..."}
            </p>
          </Link>
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Link
                className="flex items-center gap-2 font-semibold  hover:text-primary-600"
                href={`/author/${dummyAuthor.slug}`}
              >
                <img
                  src={dummyAuthor.avatar}
                  alt={dummyAuthor.name || "Author"}
                  className="w-6 h-6 rounded-full object-cover"
                />
                {dummyAuthor.name}
              </Link>
            </div>
            {/* <div className="flex items-center gap-4 text-gray-500 text-xs">
                    <span className="flex items-center gap-1"><EyeIcon className="w-4 h-4" />{0}</span>
                    <span className="flex items-center gap-1"><ChatBubbleLeftRightIcon className="w-4 h-4" />{0}</span>
                  </div> */}
          </div>
        </div>
      </div>
    </>
  );
}

export default ArticleCard;
