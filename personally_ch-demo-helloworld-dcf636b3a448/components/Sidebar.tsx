"use server";
import React from "react";
import Link from "next/link";
import { getTags } from "@/lib/tags";
import TagCloud from "./TagCloud";
import Categories from "./Categories";
import RelatedArticle from "./RelatedArticle";

const Statictags: Tag[] = [
  { name: "Automotive & Transport", slug: "automotive-transport" },
  { name: "Business & Finance", slug: "business-finance" },
  { name: "Education & Learning", slug: "education-learning" },
  { name: "History & Facts", slug: "history-facts" },
  { name: "Science & Innovation", slug: "science-innovation" },
  { name: "Health & Wellness", slug: "health-wellness" },
  { name: "Technology", slug: "technology" },
  { name: "Lifestyle & Culture", slug: "lifestyle-culture" },
  { name: "Sports & Fitness", slug: "sports-fitness" },
  { name: "True Crime & Mystery", slug: "true-crime-mystery" },
];

export default async function Sidebar({
  showRelatedArticle = false,
  showTagCloud = true,
  showCategories = true,
  relatedArticles = [],
}: {
  showRelatedArticle?: boolean;
  showTagCloud?: boolean;
  showCategories?: boolean;
  relatedArticles?: Article[];
}): Promise<React.JSX.Element> {
  const tags = (await getTags()) ?? [];

  return (
    <div className="flex flex-col gap-8">
      {/* Related Articles */}
      {showRelatedArticle && (
        <RelatedArticle relatedArticles={relatedArticles.slice(0, 5)} />
      )}

      {/* Tag Cloud */}
      {showTagCloud && <TagCloud tags={tags} />}

      {/* Categories */}
      {showCategories && <Categories tags={tags} />}
    </div>
  );
}
