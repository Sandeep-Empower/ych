import { Suspense } from "react";
import VerifyOtpClient from "./client";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary px-4">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <VerifyOtpClient />
    </Suspense>
  );
}
