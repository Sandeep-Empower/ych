"use client";
import React from "react";
import Link from "next/link";

interface SiteMeta {
  meta_key: string;
  meta_value: string;
}

interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface SiteData {
  id: string;
  domain: string;
  site_name: string;
  status: boolean;
  company: Company;
  phoneNumber: string;
  email: string;
  site_meta: SiteMeta[];
  articles: any[];
  articlesCount: number;
}

export default function Footer({ siteData }: { siteData: SiteData }) {
  if (!siteData) {
    return null;
  }

  const tagline = siteData.site_meta.find(
    (meta) => meta.meta_key === "tagline"
  )?.meta_value;
  const address = siteData.company?.address || "";
  const company = siteData.company?.name || "";
  const phoneNumber = siteData.company?.phone || siteData.phoneNumber || "";
  const email = siteData.company?.email || siteData.email || "";

  return (
    <footer className="bg-[rgba(var(--primary-900),0.9)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-primary-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-semibold mb-6">Quick Links</h3>
            <ul className="mt-2 space-y-2 text-primary-100">
              <li>
                <Link href="/" className="hover:text-primary-50">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary-50">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/for-advertisers" className="hover:text-primary-50">
                  For Advertisers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-6">Legal Links</h3>
            <ul className="mt-2 space-y-2 text-primary-100">
              <li>
                <Link href="/privacy-policy" className="hover:text-primary-50">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary-50">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-6">Contact Us</h3>
            <ul className="mt-2 space-y-2 text-primary-100">
              <li>
                <Link href="/contact" className="hover:text-primary-50">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-primary-900 p-4 text-center text-sm text-[rgba(var(--primary-100),0.7)] leading-7">
        © {siteData.domain}, owned by {company}, {address}. All rights reserved.
        <p>
          This site receives its traffic primarily through social media
          campaigns. To display search ads, the URL must meet specific criteria.
        </p>
      </div>
    </footer>
  );
}
