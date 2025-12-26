import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AuthProvider } from "@/app/context/AuthContext";
import { SimpleToasterProvider } from "./components/ui/SimpleToaster";
import { ConditionalLayout } from "./components/ConditionalLayout";
import ErrorBoundary from "./components/ErrorBoundary";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Adds AI",
  description: "AI-powered website creation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen">
        <ErrorBoundary>
          <AuthProvider>
            <SimpleToasterProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </SimpleToasterProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
