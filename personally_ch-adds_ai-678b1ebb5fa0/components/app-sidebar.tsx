"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "../app/assets/images/logo.svg";
import {
  LayoutDashboard,
  Globe,
  Users,
  Share2,
  Package,
  CreditCard,
  FileText,
  Settings,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";

// Sidebar menu data with Lucide React icons
const data = {
  navMain: [
    {
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Manage Sites",
          url: "/manageSite",
          icon: Globe,
        },
        {
          title: "Companies",
          url: "/companies",
          icon: Building2,
        },
        {
          title: "Publishers",
          url: "#",
          icon: Users,
        },
        {
          title: "Affiliates",
          url: "#",
          icon: Share2,
        },
        {
          title: "Products",
          url: "#",
          icon: Package,
        },
        {
          title: "Payments",
          url: "#",
          icon: CreditCard,
        },
        {
          title: "Reports",
          url: "#",
          icon: FileText,
        },
        {
          title: "Settings",
          url: "#",
          icon: Settings,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  return (
    <Sidebar {...props} className="bg-white">
      <SidebarHeader className="h-[76px] flex items-center justify-center mb-6">
        <Link href="/" className="text-xl font-bold text-gray-800">
          <Image src={logo} alt="logo" className="max-w-[200px]" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-4">
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarMenu
            className="gap-2"
            key={item.items.map((i) => i.title).join("-")}
          >
            {item.items.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link
                      href={item.url}
                      className={` 
                        flex items-center gap-2 h-auto px-3 py-2 text-gray-600
                        border border-transparent font-medium hover:text-cyan-600
                        data-[active=true]:bg-white
                        data-[active=true]:border-cyan-600
                        data-[active=true]:text-cyan-600
                      `}
                    >
                      {Icon && <Icon className="!w-5 !h-5 shrink-0" />}
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
