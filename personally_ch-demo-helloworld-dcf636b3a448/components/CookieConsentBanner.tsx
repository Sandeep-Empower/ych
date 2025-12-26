"use client";

import { useEffect, useState } from "react";

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if consent was already given
    const storedConsent = localStorage.getItem("cookie-consent");
    if (!storedConsent) {
      setShowBanner(true);
    } else if (storedConsent === "accepted") {
      loadInMobiCMP();
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
    loadInMobiCMP();
  };

  const handleRejectAll = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setShowBanner(false);
  };

  const loadInMobiCMP = () => {
    // Only load InMobi CMP after user consent
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://cmp.inmobi.com/choice/ZnQvycDh8JUqY/${window.location.hostname}/choice.js?tag_version=V3`;

    document.head.appendChild(script);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              We use cookies to enhance your experience and provide personalized
              content. By clicking "Accept All", you consent to our use of
              cookies for analytics and advertising.
              <a
                href="/privacy-policy"
                className="text-blue-600 hover:text-blue-800 underline ml-1"
              >
                Learn more
              </a>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Reject All
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
