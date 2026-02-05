import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getNodeApiUrl } from "../config/api";

const PublicQudemoShareWidget = () => {
  const { qudemoId } = useParams();
  const [qudemoData, setQudemoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQudemoData = async () => {
      try {
        // Use public endpoint - no authentication required
        const response = await fetch(
          getNodeApiUrl(`/api/qudemos/public/${qudemoId}`)
        );
        const data = await response.json();

        console.log("📊 Public Share Widget - Fetched QuDemo data:", data);

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
      console.log("🔗 Public Share Widget initialized for QuDemo:", qudemoId);
      fetchQudemoData();
    }
  }, [qudemoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!qudemoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">QuDemo Not Found</h2>
          <p className="text-gray-600">This QuDemo may have been removed or is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:bg-gradient-to-br md:from-blue-50 md:to-blue-100">
      {/* FloatingQudemoWidget removed - HeyGen integration deprecated */}
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Widget functionality removed</p>
      </div>
    </div>
  );
};

export default PublicQudemoShareWidget;

