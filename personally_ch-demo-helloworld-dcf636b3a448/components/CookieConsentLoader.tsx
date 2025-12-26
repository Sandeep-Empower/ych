"use client";

import { useEffect, useState } from "react";

// Update this to your actual InMobi CMP ID from the dashboard
const INMOBI_CMP_ID = "ZnQvycDh8JUqY";

export default function CookieConsentLoader() {
  const [showBanner, setShowBanner] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [cmpLoaded, setCmpLoaded] = useState(false);

  useEffect(() => {
    // Check if consent was already given
    const storedConsent = localStorage.getItem("cookie-consent");
    if (storedConsent) {
      setConsentGiven(true);
      if (storedConsent === "accepted") {
        loadInMobiCMP();
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setConsentGiven(true);
    setShowBanner(false);
    loadInMobiCMP();
  };

  const handleRejectAll = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setShowBanner(false);
    // Don't load InMobi CMP if rejected
  };

  const loadInMobiCMP = () => {
    if (cmpLoaded) return;
    setCmpLoaded(true);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://cmp.inmobi.com/choice/${INMOBI_CMP_ID}/${window.location.hostname}/choice.js?tag_version=V3`;

    document.head.appendChild(script);
  };

  if (showBanner) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                We use cookies to enhance your experience and provide
                personalized content. By clicking "Accept All", you consent to
                our use of cookies for analytics and advertising.{" "}
                <a
                  href="/privacy-policy"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Learn more
                </a>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
