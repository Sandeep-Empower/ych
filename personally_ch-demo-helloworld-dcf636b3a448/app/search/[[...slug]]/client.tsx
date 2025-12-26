"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";

type Ad = {
  $: {
    appNs: string | null;
    k: string | null;
    metadata: string | null;
    rank: string | null;
    siteHost: string | null;
    biddedListing: string | null;
    adultRating?: string | null;
    ImpressionId?: string | null;
    faviconUrl: string | null;
    title: string | null;
    description: string | null;
    phoneNumber: string | null;
  };
  ClickUrl: Array<string>;
  Extensions: Array<{
    PartnerOptOut: Array<{
      IsAllowed: Array<string>;
    }>;
    calloutExtension: Array<{
      phrases: Array<{
        phrase: Array<string>;
      }>;
    }>;
  }>;
};

type OrganicResult = {
  name: string | null;
  url: string | null;
  displayUrl: string | null;
  snippet: string | null;
};

interface SiteData {
  site_name: string;
  site_meta: Array<{
    meta_key: string;
    meta_value: string;
  }>;
}

export default function SearchClient({
  slug,
  siteData: initialSiteData,
}: {
  slug: string[] | undefined;
  siteData: SiteData | null;
}) {
  const [query, page] = slug ?? [];
  const [keyword, setKeyword] = useState(
    decodeURIComponent(query || "").trim()
  );
  const [currentPage, setCurrentPage] = useState(page ? parseInt(page, 10) : 1);

  const router = useRouter();

  const [ads, setAds] = useState<Ad[]>([]);
  const [organic, setOrganic] = useState<OrganicResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [siteData, setSiteData] = useState<SiteData | null>(initialSiteData);

  // Fetch site data if not provided or fallback to API
  useEffect(() => {
    if (!siteData) {
      fetch("/api/site/data")
        .then((res) => res.json())
        .then((data) => {
          setSiteData(data);
        })
        .catch((error) => {
          console.error("Error fetching site data:", error);
        });
    }
  }, [siteData]);

  const logo = siteData?.site_meta?.find(
    (meta: any) => meta.meta_key === "logo_url"
  )?.meta_value;

  // Fetch results when keyword changes
  useEffect(() => {
    if (!keyword) return;
    setLoading(true);

    // Freestar API
    fetch(`/api/search/${justClean(keyword)}`)
      .then((res) => res.json())
      .then((data) => {
        setAds(data.listings || []);
        // setOrganic(data.organic || []);
      })
      .catch((error) => {
        console.error("Error fetching search results:", error);
      })
      .finally(() => setLoading(false));

    // Freestar API
    fetch(`/api/bing/${justClean(keyword)}`)
      .then((res) => res.json())
      .then((data) => {
        setOrganic(data.results || []);
      })
      .catch((error) => {
        console.error("Error fetching search results:", error);
      })
      .finally(() => setLoading(false));
  }, [keyword]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center h-12 justify-center my-2">
        <Link
          href="/"
          className="flex items-center h-full w-[150px] max-w-[200px]"
        >
          {logo ? (
            <img
              src={logo}
              alt={siteData?.site_name || "Site Logo"}
              height="auto"
              width="auto"
              className="max-h-full"
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">
              {siteData?.site_name || "Loading..."}
            </h1>
          )}
        </Link>
      </div>
      {/* Search Bar */}
      <div className="search-box">
        <div className="relative max-w-[600px] mx-auto flex flex-col items-center justify-center">
          <div className="w-full">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const query = formData.get("query") as string;
                if (query.trim()) {
                  router.push(`/search/${encodeURIComponent(query.trim())}`);
                }
              }}
              className="w-full"
            >
              <div className="relative w-full group flex items-center justify-between gap-3">
                <div className="relative bg-white rounded-lg border flex-1  h-[50px] focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                  <input
                    type="search"
                    name="query"
                    placeholder="Search"
                    defaultValue={keyword}
                    className="w-full px-4 py-3 bg-transparent placeholder-gray-500 focus:outline-none focus:ring-0"
                  />
                </div>
                <Button
                  type="submit"
                  className="text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300  h-[50px] px-6 rounded-lg shadow-none"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex justify-center items-center">
          <Loader />
        </div>
      )}

      {!loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-12 w-full">
          <div className="text-sm font-semibold text-gray-700 mb-4">
            Sponsored Results for: <span className="text-black">{keyword}</span>
          </div>

          {ads.slice(0, 3).map((ad, idx) => (
            <div
              className="bg-gray-100 rounded-xl p-5 mb-4 border border-gray-50 hover:shadow-lg hover:bg-gray-100"
              data-yiid={ad.$.ImpressionId}
              key={idx}
            >
              <a
                href={`/out/?url=${
                  ad.ClickUrl[0]
                }&js=1&keyword=${encodeURIComponent(keyword)}&rk=${idx}`}
                target="_blank"
                className="block"
                rel="noindex, nofollow"
              >
                <div
                  className="text-xl font-bold mb-1"
                  dangerouslySetInnerHTML={{ __html: ad.$.title || "" }}
                ></div>

                <div className="flex items-center gap-2">
                  <img
                    src={
                      ad.$.faviconUrl ||
                      "https://s.yimg.com/pp/favicons-new/default.png"
                    }
                    className="img-fluid rounded d-block"
                    style={{ maxHeight: "24px" }}
                    alt=""
                  />
                  {ad.$.siteHost && (
                    <div className="text-sm mb-1 text-blue-600">
                      {ad.$.siteHost}
                    </div>
                  )}
                </div>

                <div
                  className="text-gray-700 text-sm mt-1"
                  dangerouslySetInnerHTML={{
                    __html: ad.$.description?.slice(0, 120) || "",
                  }}
                ></div>
              </a>
            </div>
          ))}

          {/* Organic Results */}
          <div className="mt-5">
            <div className="text-sm font-semibold text-gray-700 mb-4">
              {" "}
              Organic Results{" "}
            </div>
            {organic.map((item, idx: React.Key | null | undefined) => (
              <div
                className="bg-white rounded-xl p-5 mb-4 border border-gray-200 hover:shadow-lg hover:bg-gray-100"
                key={idx}
              >
                <a
                  href={`/out/?url=${
                    item.url
                  }&js=1&keyword=${encodeURIComponent(keyword)}&rk=${idx}`}
                  target="_blank"
                  className="block"
                  rel="noindex, nofollow"
                >
                  <div
                    className="text-xl font-bold mb-1"
                    dangerouslySetInnerHTML={{ __html: item.name || "" }}
                  ></div>

                  <div className="flex items-center gap-2">
                    {item.displayUrl && (
                      <div className="text-sm mb-1 text-blue-600">
                        {item.displayUrl}
                      </div>
                    )}
                  </div>

                  <div
                    className="text-gray-700 text-sm mt-1"
                    dangerouslySetInnerHTML={{
                      __html: item.snippet?.slice(0, 120) || "",
                    }}
                  ></div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function justClean(clean: string): string {
  const specialCharacters: { [key: string]: string } = {
    "%2b": " ",
    "'": "",
    "%20": " ",
    "=+": "",
    "+": " ",
    "&amp;": "&",
    "&quot;": '"',
  };

  let unescaped = clean;
  for (const [key, value] of Object.entries(specialCharacters)) {
    unescaped = unescaped.split(key).join(value);
  }

  // Normalize whitespace and convert spaces to '+'
  return unescaped.replace(/\s+/g, "+").trim();
}
