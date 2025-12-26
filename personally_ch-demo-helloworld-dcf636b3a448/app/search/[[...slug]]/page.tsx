import { Suspense } from "react";
import { notFound } from "next/navigation";
import SearchClient from "./client";
import Loader from "@/components/Loader";
import { getSiteData } from "@/lib/site";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const searchTerm = slug && slug.length > 0 ? decodeURIComponent(slug[0]) : "";

  return {
    title: searchTerm ? `Search Results for "${searchTerm}"` : "Search",
  };
}

export default async function SearchPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    notFound();
  }

  const siteData = await getSiteData();

  return (
    <Suspense fallback={<Loader />}>
      <SearchClient slug={slug} siteData={siteData} />
    </Suspense>
  );
}
