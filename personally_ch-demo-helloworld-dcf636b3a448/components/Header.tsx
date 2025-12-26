"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import SearchBox from "@/components/SearchBox";

interface SiteData {
  site_name: string;
  site_meta: Array<{
    meta_key: string;
    meta_value: string;
  }>;
}

interface HeaderProps {
  siteData: SiteData;
}

export default function Header({ siteData }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  if (!siteData) {
    return null;
  }

  const logo = siteData.site_meta.find(
    (meta) => meta.meta_key === "logo_url"
  )?.meta_value;

  // Define menu items
  const menu = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/privacy-policy", label: "Privacy & Cookies" },
    { href: "/for-advertisers", label: "For Advertisers" },
    { href: "/terms", label: "Terms" },
    { href: "/contact", label: "Contact Us" },
    { href: "/search", icon: true },
  ];

  return (
    <header className="bg-white shadow-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center h-12">
            <Link
              href="/"
              className="flex items-center h-full w-[150px] max-w-[200px]"
            >
              {logo ? (
                <img
                  src={logo}
                  alt={siteData.site_name}
                  height="auto"
                  width="auto"
                  className="max-h-full"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">
                  {siteData.site_name}
                </h1>
              )}
            </Link>
          </div>
          {/* Hamburger and mobile search icon */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Search Dialog for mobile */}
            <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
              <Dialog.Trigger asChild>
                <button
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
                  aria-label="Open search"
                  type="button"
                >
                  <Search className="w-5 h-5" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/90 z-50" />
                <Dialog.Content className="fixed z-50 w-full h-full flex items-center justify-center">
                  <div className="flex justify-center items-center flex-col w-full max-w-lg px-4">
                    <Dialog.Title className="italic mb-4 text-white text-center">
                      Enter your keyword into the search box
                    </Dialog.Title>
                    <SearchBox onSubmit={() => setSearchOpen(false)} />
                  </div>
                  <Dialog.Close asChild className="fixed top-3 right-3 z-50">
                    <button className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                      <X className="w-3 h-3" />
                    </button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            {/* Hamburger button */}
            <button
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    menuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
          {/* Desktop nav */}
          <nav className="hidden lg:flex space-x-6">
            {menu.map((item) =>
              item.icon ? (
                <Dialog.Root
                  key={item.href}
                  open={searchOpen}
                  onOpenChange={setSearchOpen}
                >
                  <Dialog.Trigger asChild>
                    <button
                      className={`text-gray-600 hover:text-primary-600 flex items-center ${
                        pathname === item.href ? "font-medium text-primary" : ""
                      }`}
                      aria-label="Open search"
                      type="button"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/90 z-50" />
                    <Dialog.Content className="fixed z-50 w-full h-full flex items-center justify-center">
                      <div className="flex justify-center items-center flex-col w-full max-w-lg px-4">
                        <Dialog.Title className="italic mb-4 text-white text-center">
                          Enter your keyword into the search box
                        </Dialog.Title>
                        <SearchBox onSubmit={() => setSearchOpen(false)} />
                      </div>
                      <Dialog.Close
                        asChild
                        className="fixed top-3 right-3 z-50"
                      >
                        <button className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                          <X className="w-3 h-3" />
                        </button>
                      </Dialog.Close>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-gray-600 hover:text-primary-600 flex items-center ${
                    pathname === item.href ? "font-medium text-primary" : ""
                  }`}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>
        {/* Mobile nav */}
        {menuOpen && (
          <nav className="flex flex-col mt-4 lg:hidden absolute inset-x-0 top-16 bg-white shadow-lg z-50 border-t-2 ">
            {menu
              .filter((item) => !item.icon) // <-- Exclude search icon from mobile menu
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-gray-600 hover:text-primary flex items-center px-4 py-3 border-b border-gray-100 last:border-0  ${
                    pathname === item.href ? "text-primary" : ""
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
          </nav>
        )}
      </div>
    </header>
  );
}
