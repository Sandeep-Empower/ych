'use client';

import { useEffect } from 'react';

export default function ApiDocsRedirect() {
  useEffect(() => {
    // Redirect to the static HTML Swagger UI
    window.location.href = '/swagger.html';
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to API Documentation...</p>
        <p className="text-sm text-gray-500 mt-2">
          If you are not redirected automatically, 
          <a href="/swagger.html" className="text-blue-600 hover:underline ml-1">
            click here
          </a>
        </p>
      </div>
    </div>
  );
}
