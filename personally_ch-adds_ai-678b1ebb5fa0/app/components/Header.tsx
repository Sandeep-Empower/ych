"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

import defaultProfileImg from "../assets/images/avatar.png";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Loader } from "@/components/ui/loader"; // Import your loader

// Helper to get meta value by key
function getMetaValue(metas: any[], key: string) {
  return metas?.find((meta) => meta.meta_key === key)?.meta_value || "";
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user, logout, loading } = useAuth();
  const [loggingOut, setLoggingOut] = React.useState(false); // Add state
  const [siteDomainName, setSiteDomainName] = useState("");

  useEffect(() => {
    function updateSiteDomainName() {
      setSiteDomainName(window.sessionStorage.getItem("siteDomainName") || "");
    }
    updateSiteDomainName(); // initial load

    window.addEventListener("siteDomainNameChanged", updateSiteDomainName);
    return () => {
      window.removeEventListener("siteDomainNameChanged", updateSiteDomainName);
    };
  }, []);

  // Only show siteDomainName on these paths
  const showSiteDomainName = [
    "/create/step-2",
    "/create/step-3",
    "/create/success",
    "/edit/step-1",
    "/edit/step-2",
    "/edit/step-3",
  ];

  // Map pathnames to page titles
  const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/manageSite": "Manage Sites",
    "/companies": "Companies",
    "/publishers": "Publishers",
    "/affiliates": "Affiliates",
    "/products": "Products",
    "/payments": "Payments",
    "/reports": "Reports",
    "/settings": "Settings",
    "/profileSetting": "Profile Settings",
    // Add more as needed
  };
  const safePathname = pathname ?? "";
  const pageTitle = safePathname.startsWith("/create")
    ? "Create Site"
    : safePathname.startsWith("/edit")
    ? "Edit Site"
    : pageTitles[safePathname] ||
      (safePathname
        ? safePathname
            .replace(/^\//, "")
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : "Dashboard");

  // Get first and last name from user.metas
  const firstName = getMetaValue(user?.metas, "first_name");
  const lastName = getMetaValue(user?.metas, "last_name");
  const displayName = `${firstName} ${lastName}`.trim() || "Unknown User";
  const roleName = getMetaValue(user?.metas, "account_type");

  if (loading || !isLoggedIn) return null;

  const handleLogout = async () => {
    setLoggingOut(true); // Show loader
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      logout(); // Remove await here to prevent hanging
    } catch (error) {
      console.error("Logout failed:", error);
      logout(); // Force logout even if API fails
    } finally {
      setLoggingOut(false); // Ensure loader is always hidden
    }
  };

  return (
    <header className="bg-white border-b border-gray-300 z-50 w-full">
      <nav className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 border data-[orientation=vertical]:h-4"
            />
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold">{pageTitle}</h1>
              {showSiteDomainName.includes(safePathname) && (
                <div className="text-sm text-gray-500">{siteDomainName}</div>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            {loggingOut && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white bg-opacity-70">
                <Loader />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="text-left flex space-x-3 text-gray-600 hover:text-gray-900 focus:outline-none"
                aria-label="User menu"
              >
                <Image
                  src={defaultProfileImg}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />

                <div className="gap-0 flex-col hidden sm:flex">
                  <h5 className="font-[600]">
                    {displayName || "Wilson Workman"}
                  </h5>
                  <span className="text-sm capitalize">
                    {roleName || "User"}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-white">
                <DropdownMenuItem asChild>
                  <Link href="/profileSetting" className="dropdown-item-hover">
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="dropdown-item-hover"
                  disabled={loggingOut} // Disable button while logging out
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    </header>
  );
}
