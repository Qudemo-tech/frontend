import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { getNodeApiUrl } from "../config/api";

const WidgetPlayground = () => {
  const { qudemoId } = useParams();
  const navigate = useNavigate();
  const [qudemoData, setQudemoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const fetchQudemoData = async () => {
      try {
        // Use public endpoint - no authentication required
        const response = await fetch(
          getNodeApiUrl(`/api/qudemos/public/${qudemoId}`)
        );
        const data = await response.json();

        console.log("📊 Widget Playground - Fetched QuDemo data (public):", data);

        if (data.success) {
          setQudemoData(data.qudemo);
        } else {
          console.error("❌ Failed to fetch QuDemo data:", data);
        }
      } catch (error) {
        console.error("❌ Error fetching qudemo data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (qudemoId) {
      console.log("🎮 Widget Playground initialized for QuDemo:", qudemoId);
      fetchQudemoData();
    }
  }, [qudemoId]);

  if (loading) {
    return (
      <div className="min-h-screen md:bg-gradient-to-br md:from-blue-50 md:to-blue-100 flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:bg-gradient-to-br md:from-blue-50 md:to-blue-100" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Inter", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>
      {/* Header - Hidden on mobile for full-screen widget experience */}
      <div className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isLoggedIn && (
                <>
                  <button
                    onClick={() => navigate("/qudemos")}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back to QuDemos</span>
                  </button>
                  <div className="h-6 w-px bg-gray-300"></div>
                </>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                  Widget Playground
                </h1>
                <p className="text-sm text-gray-600 font-light">
                  Test your widget before embedding
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Widget Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Hidden on mobile for full-screen widget experience */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Website Mockup */}
        <div className="bg-white rounded-xl border overflow-hidden">
          {/* Mockup Browser Bar */}
          <div className="bg-gray-100 border-b border-gray-300 px-4 py-3">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 bg-white rounded px-3 py-1 text-sm text-gray-600 flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>https://your-website.com</span>
              </div>
            </div>
          </div>

          {/* Mockup Content */}
          <div className="p-8 min-h-[600px] bg-gradient-to-br from-white to-gray-50">
            <div className="max-w-4xl mx-auto">
              {/* Hero Section */}
              <div className="text-center mb-12">
                <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  Demo Website
                </div>
                <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
                  Welcome to Our Website
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
                  This is a preview of how your widget will appear on your
                  actual website. Notice the QuDemo widget in the bottom-right
                  corner!
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  {
                    icon: "🚀",
                    title: "Fast Setup",
                    desc: "Get started in minutes",
                  },
                  {
                    icon: "💬",
                    title: "Interactive Q&A",
                    desc: "Engage with visitors",
                  },
                  { icon: "📊", title: "Analytics", desc: "Track engagement" },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-6 border border border-gray-200"
                  >
                    <div className="text-4xl mb-3">{feature.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-2 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm font-light">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* CTA Section */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center text-white">
                <h2 className="text-lg font-semibold mb-2 tracking-tight">
                  Ready to Get Started?
                </h2>
                <p className="text-blue-100 text-sm mb-3 font-light">
                  Click the widget below to see it in action
                </p>
                <div className="flex items-center justify-center space-x-2 text-blue-100 text-sm font-light">
                  <svg
                    className="w-4 h-4 animate-bounce"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <span>Look at the bottom-right corner</span>
                  <svg
                    className="w-4 h-4 animate-bounce"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FloatingQudemoWidget removed - HeyGen integration deprecated */}
    </div>
  );
};

export default WidgetPlayground;
