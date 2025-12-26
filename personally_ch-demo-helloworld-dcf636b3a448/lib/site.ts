// lib/site.ts
import { headers } from "next/headers";

export async function getSiteData(page = 1, limit = 12): Promise<SiteData | null> {
  try {
    const headersList = await headers();
    const domain = headersList.get("x-domain") || "model.com";

    const apiUrl = process.env.API_URL || "http://localhost:3000";
    const response = await fetch(
      `${apiUrl}/api/site/data?domain=${domain}&page=${page}&limit=${limit}`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );
    

    if (!response.ok) {
      console.error(`Failed to fetch site data: ${response.statusText}`);
      return null;
    }

    const site = await response.json();
    return site;
  } catch (error) {
    console.error("Error fetching site data:", error);
    return null;
  }
}

// lib/site.ts
// lib/site.ts
// const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://likedcontent.com";

export async function getArticlesBySiteId(siteId: string, page: number, limit: number) {
  try {
        const apiUrl = process.env.API_URL || "http://localhost:3000";
    const res = await fetch(
      `${apiUrl}/api/articles/get?siteId=${siteId}&page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch articles");
    }

    return await res.json();
  } catch (err) {
    console.error("getArticlesBySiteId error:", err);
    return null;
  }
}




