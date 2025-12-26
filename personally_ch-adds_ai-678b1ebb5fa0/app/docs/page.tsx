'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Swagger UI...</p>
      </div>
    </div>
  )
});

export default function SwaggerUIPage() {
  const [mounted, setMounted] = useState(false);
  const [apiSpec, setApiSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);

    // Fetch the API specification
    fetch('/api/docs')
      .then(response => response.json())
      .then(data => {
        setApiSpec(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching API spec:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Adds AI API Documentation
            </h1>
            <p className="text-gray-600">
              Comprehensive API documentation for the Adds AI platform
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading API Documentation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Adds AI API Documentation
            </h1>
            <p className="text-gray-600">
              Comprehensive API documentation for the Adds AI platform
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading API Documentation</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Adds AI API Documentation
          </h1>
          <p className="text-gray-600">
            Comprehensive API documentation for the Adds AI platform
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>API Specification loaded successfully. Endpoints: {apiSpec?.paths ? Object.keys(apiSpec.paths).length : 0}</p>
          </div>
        </div>

        <div className="swagger-ui-container">
          {apiSpec ? (
            <SwaggerUI
              spec={apiSpec}
              deepLinking={true}
              tryItOutEnabled={true}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No API specification available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
