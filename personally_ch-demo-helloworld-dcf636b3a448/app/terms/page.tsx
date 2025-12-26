import Sidebar from "@/components/Sidebar";
import React, { Suspense } from "react";
import { headers } from "next/headers";
import Loader from "@/components/Loader";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Terms",
  };
}

export default async function Terms(): Promise<React.JSX.Element> {
  try {
    const headersList = await headers();
    const domain = headersList.get("x-domain");
    const apiUrl = process.env.API_URL || "http://localhost:3000";
    const response = await fetch(
      `${apiUrl}/api/pages/get/terms?domain=${domain}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache control to prevent stale data
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return (
        <div className="min-h-screen flex flex-col gap-6 items-center justify-center">
          <h1 className="text-[50px] font-bold mt-[-100px]">Coming Soon</h1>
          <p className="max-w-[600px] text-center text-lg text-gray-600">
            We're working on something exciting! Our new website is under
            construction and will be ready soon.
          </p>
        </div>
      );
    }

    const data = await response.json();
    const page_html =
      typeof data.page?.content === "string" ? data.page.content : "<p></p>";
    return (
      <>
        <div className="bg-primary-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Terms</h2>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Main Card */}
            <Suspense fallback={<Loader />}>
              <div className="md:col-span-2">
                <div
                  className="prose prose-sm md:prose-base max-w-none"
                  dangerouslySetInnerHTML={{ __html: page_html }}
                />
              </div>
            </Suspense>
            {/* Sidebar */}
            <Sidebar />
          </div>
        </div>
      </>
    );
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Error loading page</h1>
      </div>
    );
  }
}
