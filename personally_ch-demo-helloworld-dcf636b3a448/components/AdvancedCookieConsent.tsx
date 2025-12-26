"use client";

import { useEffect, useState } from "react";

interface ConsentState {
  analytics: boolean;
  advertising: boolean;
  functional: boolean;
}

export default function AdvancedCookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    analytics: false,
    advertising: false,
    functional: true, // Usually required for basic functionality
  });

  useEffect(() => {
    const storedConsent = localStorage.getItem('detailed-cookie-consent');
    if (!storedConsent) {
      setShowBanner(true);
    } else {
      const parsedConsent = JSON.parse(storedConsent);
      setConsent(parsedConsent);
      if (parsedConsent.advertising) {
        loadInMobiCMP();
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const fullConsent = { analytics: true, advertising: true, functional: true };
    localStorage.setItem('detailed-cookie-consent', JSON.stringify(fullConsent));
    setConsent(fullConsent);
    setShowBanner(false);
    loadInMobiCMP();
  };

  const handleRejectAll = () => {
    const minimalConsent = { analytics: false, advertising: false, functional: true };
    localStorage.setItem('detailed-cookie-consent', JSON.stringify(minimalConsent));
    setConsent(minimalConsent);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('detailed-cookie-consent', JSON.stringify(consent));
    setShowBanner(false);
    if (consent.advertising) {
      loadInMobiCMP();
    }
  };

  const loadInMobiCMP = () => {
    // Simple InMobi CMP loading without the complex stub functions
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://cmp.inmobi.com/choice/ZnQvycDh8JUqY/${window.location.hostname}/choice.js?tag_version=V3`;
    
    // Add error handling
    script.onerror = () => {
      console.warn('Failed to load InMobi CMP');
    };
    
    document.head.appendChild(script);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 max-h-[80vh] overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {!showDetails ? (
            // Simple banner
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Cookie Preferences</h3>
              <p className="text-sm text-gray-700">
                We use cookies to enhance your experience and provide personalized content and ads. 
                You can accept all cookies or customize your preferences.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={() => setShowDetails(true)}
                  className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Customize
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          ) : (
            // Detailed preferences
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Cookie Preferences</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Functional Cookies */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Functional Cookies</h4>
                    <p className="text-sm text-gray-600">Required for basic website functionality</p>
                  </div>
                  <div className="text-sm text-gray-500">Always On</div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Analytics Cookies</h4>
                    <p className="text-sm text-gray-600">Help us understand how you use our website</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.analytics}
                      onChange={(e) => setConsent(prev => ({ ...prev, analytics: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Advertising Cookies */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Advertising Cookies</h4>
                    <p className="text-sm text-gray-600">Used to show you relevant ads and measure ad performance</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.advertising}
                      onChange={(e) => setConsent(prev => ({ ...prev, advertising: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
