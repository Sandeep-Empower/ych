"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";

interface SiteData {
  site_name: string;
  site_meta: Array<{
    meta_key: string;
    meta_value: string;
  }>;
}

interface ConditionalHeaderProps {
  siteData: SiteData;
}

export default function ConditionalHeader({
  siteData,
}: ConditionalHeaderProps) {
  const pathname = usePathname();
  const isSearchPage = pathname?.startsWith("/search") ?? false;

  if (isSearchPage) {
    return null;
  }

  return <Header siteData={siteData} />;
}
