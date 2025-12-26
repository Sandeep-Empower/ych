"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Define routes that should NOT have the sidebar layout
  const authRoutes = ["/", "/register"];
  const isAuthRoute = authRoutes.includes(pathname ?? "");

  const authRoutesverifyOtp = ["/", "/verifyOtp"];
  const isAuthRouteverifyOtp = authRoutesverifyOtp.includes(pathname ?? "");

   const authRoutesforgotPassword = ["/", "/forgotPassword"];
  const isAuthRouteforgotPassword = authRoutesforgotPassword.includes(pathname ?? "");

  const authRoutesresetPassword = ["/", "/resetPassword"];
  const isAuthRouteresetPassword = authRoutesresetPassword.includes(pathname ?? "");
  // If it's an auth route (login/register), render without sidebar
  if (isAuthRoute) {
    return <>{children}</>;
  }
 if(isAuthRouteverifyOtp) {
    return <>{children}</>; }
    
     if(isAuthRouteforgotPassword) {
    return <>{children}</>; }

     if(isAuthRouteresetPassword) {
    return <>{children}</>; }
  // For all other routes, render with sidebar layout
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="p-6 bg-gray-50 overflow-auto h-full">{children}</div>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
