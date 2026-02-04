"use client";

import { useState } from "react";

export default function DiagnosticsPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults(null);

    try {
      // Test WordPress connection
      const wpTest = await fetch("/api/artkey/test-connection");
      const wpData = await wpTest.json();

      // Test general WordPress API
      const generalTest = await fetch("/api/test-wordpress");
      const generalData = await generalTest.json();

      // Test products API
      let productsTest = null;
      try {
        const productsRes = await fetch("/api/products?limit=5");
        productsTest = {
          status: productsRes.status,
          ok: productsRes.ok,
          count: productsRes.ok ? (await productsRes.json()).length : 0,
        };
      } catch (e: any) {
        productsTest = { error: e.message };
      }

      setTestResults({
        timestamp: new Date().toISOString(),
        wordpress: wpData,
        general: generalData,
        products: productsTest,
        envVars: {
          // Check which env vars are set (from API response)
          hasWpApiBase: wpData.wpSiteBase ? true : false,
          hasWpUser: wpData.error ? "Check API response" : "Set if WordPress save works",
          hasWpPass: wpData.error ? "Check API response" : "Set if WordPress save works",
          hasWcUrl: generalData.wordpressUrl ? true : false,
          hasWcKey: productsTest?.ok ? "Likely set" : "May not be set",
          hasWcSecret: productsTest?.ok ? "Likely set" : "May not be set",
        },
      });
    } catch (error: any) {
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-lightest py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-brand-darkest mb-6 font-playfair">
            Site Diagnostics
          </h1>
          <p className="text-brand-darkest mb-8">
            This page helps you verify that your environment variables are properly configured
            and that connections to WordPress and WooCommerce are working.
          </p>

          <button
            onClick={runTests}
            disabled={loading}
            className="bg-brand-medium text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-dark transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Running Tests..." : "Run Diagnostics"}
          </button>

          {testResults && (
            <div className="mt-8 space-y-6">
              <div className="bg-brand-lightest rounded-lg p-6">
                <h2 className="text-2xl font-bold text-brand-darkest mb-4 font-playfair">
                  Test Results
                </h2>
                <p className="text-sm text-brand-dark mb-4">
                  Timestamp: {testResults.timestamp}
                </p>

                {/* Environment Variables Status */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-brand-darkest mb-3">
                    Environment Variables Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={testResults.envVars?.hasWpApiBase ? "text-green-600" : "text-red-600"}>
                        {testResults.envVars?.hasWpApiBase ? "✓" : "✗"}
                      </span>
                      <span>WordPress URL (WP_API_BASE or NEXT_PUBLIC_WORDPRESS_URL)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">?</span>
                      <span>WP_APP_USER (hidden for security)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">?</span>
                      <span>WP_APP_PASS (hidden for security)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={testResults.envVars?.hasWcUrl ? "text-green-600" : "text-yellow-600"}>
                        {testResults.envVars?.hasWcUrl ? "✓" : "⚠"}
                      </span>
                      <span>WooCommerce URL (NEXT_PUBLIC_WOOCOMMERCE_URL)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">?</span>
                      <span>WOOCOMMERCE_CONSUMER_KEY (hidden for security)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">?</span>
                      <span>WOOCOMMERCE_CONSUMER_SECRET (hidden for security)</span>
                    </div>
                  </div>
                </div>

                {/* WordPress Connection Test */}
                {testResults.wordpress && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-brand-darkest mb-3">
                      WordPress REST API Connection
                    </h3>
                    {testResults.wordpress.error ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 font-semibold">Error:</p>
                        <p className="text-red-600">{testResults.wordpress.error}</p>
                        {testResults.wordpress.env && (
                          <div className="mt-2 text-sm">
                            <p>Environment variables detected:</p>
                            <pre className="bg-white p-2 rounded mt-2 text-xs overflow-auto">
                              {JSON.stringify(testResults.wordpress.env, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-600 font-semibold mb-2">✓ Connection Successful</p>
                        <p className="text-sm text-brand-darkest">
                          WordPress Site Base: {testResults.wordpress.wpSiteBase}
                        </p>
                        <p className="text-sm text-brand-darkest">
                          WordPress API Base: {testResults.wordpress.wpApiBase}
                        </p>
                        <details className="mt-4">
                          <summary className="cursor-pointer text-sm font-semibold text-brand-darkest">
                            View Endpoint Test Results
                          </summary>
                          <pre className="bg-white p-4 rounded mt-2 text-xs overflow-auto max-h-96">
                            {JSON.stringify(testResults.wordpress.endpoints, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                )}

                {/* General WordPress Test */}
                {testResults.general && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-brand-darkest mb-3">
                      General WordPress API Test
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-brand-darkest mb-2">
                        WordPress URL: {testResults.general.wordpressUrl}
                      </p>
                      {testResults.general.summary && (
                        <div className="mb-2">
                          <p className="font-semibold text-brand-darkest">
                            {testResults.general.summary.overall === "SUCCESS" ? "✓" : "✗"} 
                            {" "}Overall: {testResults.general.summary.overall}
                          </p>
                          <p className="text-sm text-brand-darkest">
                            Passed: {testResults.general.summary.passed} / {testResults.general.summary.total}
                          </p>
                        </div>
                      )}
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-semibold text-brand-darkest">
                          View Detailed Test Results
                        </summary>
                        <pre className="bg-white p-4 rounded mt-2 text-xs overflow-auto max-h-96">
                          {JSON.stringify(testResults.general.tests, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                )}

                {/* Products API Test */}
                {testResults.products && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-brand-darkest mb-3">
                      Products API Test
                    </h3>
                    {testResults.products.error ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 font-semibold">Error:</p>
                        <p className="text-red-600">{testResults.products.error}</p>
                      </div>
                    ) : testResults.products.ok ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-600 font-semibold">✓ Products API Working</p>
                        <p className="text-sm text-brand-darkest">
                          Status: {testResults.products.status}
                        </p>
                        <p className="text-sm text-brand-darkest">
                          Products Found: {testResults.products.count}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-600 font-semibold">⚠ Products API Issue</p>
                        <p className="text-sm text-brand-darkest">
                          Status: {testResults.products.status}
                        </p>
                        <p className="text-sm text-brand-darkest">
                          This might be normal if WooCommerce credentials aren't configured yet.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Display */}
                {testResults.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 font-semibold">Test Error:</p>
                    <p className="text-red-600">{testResults.error}</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-brand-darkest mb-3">
                  Next Steps
                </h3>
                <ul className="list-disc list-inside space-y-2 text-brand-darkest">
                  <li>If WordPress connection fails, check that WP_API_BASE or NEXT_PUBLIC_WORDPRESS_URL is set in Vercel</li>
                  <li>If products API fails, check that WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET are set</li>
                  <li>After adding environment variables in Vercel, you must redeploy for changes to take effect</li>
                  <li>Server-side environment variables (without NEXT_PUBLIC_) are only available in API routes</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

