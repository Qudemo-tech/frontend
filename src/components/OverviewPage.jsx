import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../context/CompanyContext";
import {
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

const OverviewPage = () => {
  const { company } = useCompany();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalViews: 0,
    questionsAsked: 0,
    avgEngagement: 0,
  });

  const [recentInteractions, setRecentInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch overview stats from the backend
        const response = await fetch(
          `${process.env.REACT_APP_NODE_API_URL || "http://localhost:5000"}/api/analytics/overview`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error("Failed to fetch overview stats");
        }

        // Fetch recent interactions
        const interactionsResponse = await fetch(
          `${process.env.REACT_APP_NODE_API_URL || "http://localhost:5000"}/api/analytics/recent-interactions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (interactionsResponse.ok) {
          const interactionsData = await interactionsResponse.json();
          setRecentInteractions(interactionsData.slice(0, 4)); // Show only latest 4
        } else {
          console.error(
            "Failed to fetch recent interactions:",
            interactionsResponse.status,
            interactionsResponse.statusText,
          );
          const errorText = await interactionsResponse.text();
          console.error("Error response:", errorText);
        }
      } catch (error) {
        console.error("Error fetching overview stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleCreateQudemo = () => {
    // Navigate to create qudemo page
    navigate("/create");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-whiter min-h-screen dashboard-font">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-graydark text-left">
            Overview
          </h1>
          <p className="text-base text-gray-500 text-left">
            Welcome back! Here's what's happening with your Qudemos.
          </p>
        </div>

        <button
          onClick={handleCreateQudemo}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200"
        >
          <PlusIcon className="w-5 h-5" />
          Create Qudemo
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Total Demo Views */}
        <div className="bg-white rounded-2xl border border border-strokedark/10 p-6 transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-left">
              <h3 className="text-sm font-normal text-gray-500 mb-2 text-left">
                Total Qudemo Views
              </h3>
              <p className="text-3xl font-bold text-graydark text-left">
                {stats.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-[12px] bg-primary/10">
              <EyeIcon className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Questions Asked */}
        <div className="bg-white rounded-2xl border border border-strokedark/10 p-6 transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-left">
              <h3 className="text-sm font-medium text-gray-500 mb-2 text-left">
                Questions Asked
              </h3>
              <p className="text-3xl font-bold text-graydark text-left">
                {stats.questionsAsked.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-[12px] bg-meta-3/10">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-meta-3" />
            </div>
          </div>
        </div>

        {/* Avg. Engagement */}
        <div className="bg-white rounded-2xl border border border-strokedark/10 p-6 transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-left">
              <h3 className="text-sm font-medium text-gray-500 mb-2 text-left">
                Avg. Engagement
              </h3>
              <p className="text-3xl font-bold text-graydark text-left">
                {stats.avgEngagement}%
              </p>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-[12px] bg-warning/10">
              <ChartBarIcon className="w-5 h-5 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Interactions Section */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-graydark text-left">
            Recent Interactions
          </h2>
          <button
            onClick={() => navigate("/customer-interactions")}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            View in Detail
          </button>
        </div>

        <div className="bg-white rounded-lg border border border-strokedark/10 overflow-hidden">
          {recentInteractions.length > 0 ? (
            <div className="divide-y divide-strokedark/10">
              {recentInteractions.map((interaction, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-whiten transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-[12px] flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-graydark">
                          {interaction.client_name || "Anonymous User"}
                        </p>
                        <p className="text-xs text-bodydark">
                          {interaction.client_company || "No company"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-graydark font-medium">
                        {interaction.questionCount || 0} questions
                      </p>
                      <p className="text-xs text-bodydark">
                        {interaction.lastInteractionDate
                          ? new Date(
                              interaction.lastInteractionDate,
                            ).toLocaleDateString()
                          : "No date"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <ChatBubbleLeftRightIcon className="w-12 h-10 text-bodydark mx-auto mb-4" />
              <p className="text-bodydark text-sm">
                No recent interactions found
              </p>
              <p className="text-bodydark2 text-xs mt-1">
                Start sharing your Qudemo to see interactions here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
