"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TagIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { dummyAuthor } from "@/lib/dummy";
import { Copy, Send } from "lucide-react";

export default function ArticlePageClient({ article }: { article: Article }) {
  // Use a ref to check if running in browser
  const isBrowser = typeof window !== "undefined";
  const [location, setLocation] = useState({
    href: "",
    pathname: "",
    origin: "",
  });
  // Add state for copy status
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isBrowser) {
      setLocation({
        href: window.location.href,
        pathname: window.location.pathname,
        origin: window.location.origin,
      });
    }
  }, [isBrowser]);

  const copyToClipboard = (text: string) => {
    if (isBrowser) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
          })
          .catch((err) => console.error("Clipboard error:", err));
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        } catch (err) {
          console.error("Fallback copy failed:", err);
        }
        document.body.removeChild(textarea);
      }
    }
  };

  // Fallback for SSR: don't render share/copy UI until mounted
  const isMounted =
    typeof location.href === "string" && location.href.length > 0;

  return (
    <div className="md:col-span-2">
      <div className="rounded-2xl p-0 mb-8">
        {/* Top image */}
        <div className="relative mb-6 rounded-xl overflow-hidden">
          {/* Badges */}
          <div className="absolute flex flex-wrap gap-2 left-4 top-4 z-10">
            {article.article_tags &&
              article.article_tags.map((tagObj, idx) => (
                <span
                  key={idx}
                  className="bg-white text-gray-800 text-sm font-semibold px-4 py-2 rounded-full"
                >
                  {tagObj.tag.name}
                </span>
              ))}
          </div>
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={article.title}
              width={900}
              height={400}
              className="w-full h-[400px] object-cover"
            />
          ) : (
            <img
              src="https://placehold.co/400?text=No+Image"
              alt="Default article"
              width={900}
              height={400}
              className="w-full h-[340px] object-cover"
            />
          )}
        </div>
        {/* Date */}
        <div className="flex items-center text-primary-600 mb-8">
          <CalendarIcon className="w-5 h-5 mr-2" />
          <span data-date={article.created_at}>
            {new Intl.DateTimeFormat("en-US", {
              timeZone: "UTC",
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date(article.created_at))}
          </span>
        </div>
        {/* Article Content */}
        <div
          className="text-gray-600 pb-8 prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
      {/* Share Section */}
      {isMounted && (
        <div className="bg-gray-50 rounded-xl shadow p-4 mb-8 flex flex-col gap-4">
          <div className="flex gap-4 items-center">
            <span className="font-semibold text-xl text-gray-700">
              Share Article:
            </span>
            <div className="flex gap-2">
              <Link
                className="rounded-full bg-primary-100 p-2 hover:bg-primary-200"
                rel="nofollow noopener"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  location.href
                )}`}
                target="_blank"
                aria-label="Share on Facebook"
              >
                {/* ...facebook svg... */}
                <svg
                  className="w-5 h-5 text-primary-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.877v-6.987h-2.54v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.632.771-1.632 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.128 22 16.991 22 12"></path>
                </svg>
              </Link>
              <Link
                className="rounded-full bg-primary-100 p-2 hover:bg-primary-200"
                rel="nofollow noopener"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  article.title
                )}&url=${encodeURIComponent(location.href)}`}
                target="_blank"
                aria-label="Share on Twitter"
              >
                {/* ...twitter svg... */}
                <svg
                  className="w-5 h-5 text-primary-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.46 6c-.77.35-1.6.59-2.47.7a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 8.99 4.07 7.13 1.64 4.16c-.37.63-.58 1.36-.58 2.14 0 1.48.75 2.78 1.89 3.54-.7-.02-1.36-.21-1.94-.53v.05c0 2.07 1.47 3.8 3.42 4.19-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.68 2.1 2.91 3.95 2.94A8.6 8.6 0 0 1 2 19.54a12.13 12.13 0 0 0 6.56 1.92c7.88 0 12.2-6.53 12.2-12.2 0-.19 0-.37-.01-.56A8.72 8.72 0 0 0 24 4.59a8.48 8.48 0 0 1-2.54.7z"></path>
                </svg>
              </Link>
              <Link
                className="rounded-full bg-primary-100 p-2 hover:bg-primary-200"
                rel="nofollow noopener"
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  article.title
                )}%20${encodeURIComponent(location.href)}`}
                target="_blank"
                aria-label="Share on Whatsapp"
              >
                {/* ...whatsapp svg... */}
                <svg
                  className="w-5 h-5 text-primary-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.26-1.64A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.26-1.44l-.37-.22-3.72.98.99-3.62-.24-.38A9.93 9.93 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.34-.26.27-1 1.01-1 2.46 0 1.45 1.03 2.85 1.18 3.05.15.2 2.03 3.1 4.93 4.23.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.12.56-.08 1.65-.67 1.89-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.19-.53-.33z"></path>
                </svg>
              </Link>
              <Link
                className="rounded-full bg-primary-100 p-2 hover:bg-primary-200"
                rel="nofollow noopener"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  location.href
                )}`}
                target="_blank"
                aria-label="Share on LinkedIn"
              >
                {/* ...linkedin svg... */}
                <svg
                  className="w-5 h-5 text-primary-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.37-1.54 2.82-1.54 3.01 0 3.57 1.98 3.57 4.56v4.75z"></path>
                </svg>
              </Link>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <input
                type="text"
                readOnly
                value={location.href}
                className="border rounded-md px-3 py-2 text-sm w-full outline-none bg-gray-200"
              />
              <button
                className={`${
                  isCopied
                    ? "bg-primary-300 text-white"
                    : "bg-primary text-white hover:bg-primary-600"
                } px-3 py-2 rounded-md text-sm flex items-center gap-2`}
                onClick={() => copyToClipboard(location.href)}
              >
                <Copy className="w-4 h-4" />
                {isCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-8">
        <TagIcon className="w-6 h-6 text-gray-500 inline-block mr-2" />
        {article.article_tags && article.article_tags.length > 0 ? (
          <span className="text-gray-500">
            Tags:{" "}
            {article.article_tags.map((tagObj, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && ", "}
                <Link
                  href={`/tag/${tagObj.tag.slug}`}
                  className="text-primary-600 hover:underline"
                >
                  {tagObj.tag.name}
                </Link>
              </React.Fragment>
            ))}
          </span>
        ) : null}
      </div>
      {/* Author Card */}
      <div className="bg-white rounded-xl shadow p-6 flex  gap-4 mb-8">
        <img
          src={dummyAuthor.avatar}
          alt={dummyAuthor.name || "Author"}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div>
          <Link href={`/author/${dummyAuthor.slug}`}>
            <div className="font-bold text-xl mb-1">
              {dummyAuthor.name || "Author Name"}
            </div>
            <div className="text-gray-500 text-sm">
              {dummyAuthor.bio || "Author bio goes here."}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
