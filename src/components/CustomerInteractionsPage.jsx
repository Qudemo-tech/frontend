import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../context/CompanyContext";
import { useNotification } from "../context/NotificationContext";
import { getNodeApiUrl, getApiUrl } from "../config/api";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
const CustomerInteractionsPage = () => {
  const navigate = useNavigate();
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [aiInsightSummary, setAiInsightSummary] = useState("");
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { company } = useCompany();
  const { showError } = useNotification();

  // Check subscription status
  const subscriptionPlan = company?.subscription_plan || "free";
  const subscriptionStatus = company?.subscription_status || "active";
  const isActive = ["active", "trialing", "on_trial"].includes(
    subscriptionStatus,
  );
  const isPro = ["pro", "enterprise"].includes(subscriptionPlan) && isActive;
  // Fetch lightweight customer list (without detailed Q&A data)
  const fetchCustomerList = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const startTime = Date.now();
      const response = await fetch(
        getNodeApiUrl("/api/analytics/customer-list"),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const endTime = Date.now();
      if (!response.ok) {
        throw new Error("Failed to fetch customer list");
      }
      const data = await response.json();
      setInteractions(data.data || []);
    } catch (error) {
      setError("Failed to load customer interactions");
      showError("Failed to load customer interactions");
    } finally {
      setLoading(false);
    }
  };
  // Fetch detailed interaction data for a specific customer
  const fetchCustomerInteractionDetails = async (shareToken) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        getNodeApiUrl(
          `/api/analytics/customer-interaction-details/${shareToken}`,
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch interaction details");
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      showError("Failed to load interaction details");
      return null;
    }
  };
  useEffect(() => {
    if (company?.id) {
      fetchCustomerList();
    }
  }, [company?.id]);
  // Filter interactions based on search term and exclude users with no engagement
  const filteredInteractions = interactions.filter((interaction) => {
    // First, exclude users who haven't asked questions and don't have last accessed date
    const hasQuestions =
      interaction.question_count && interaction.question_count > 0;
    const hasTimeSpent =
      interaction.total_duration && interaction.total_duration > 0;
    // Debug logging for all users to see what data they have
    // Only show users who have asked questions OR spent time (more strict filtering)
    if (!hasQuestions && !hasTimeSpent) {
      return false;
    }
    // Then apply search filter
    const searchLower = searchTerm.toLowerCase();
    return (
      interaction.client_name?.toLowerCase().includes(searchLower) ||
      interaction.client_email?.toLowerCase().includes(searchLower) ||
      interaction.client_company?.toLowerCase().includes(searchLower) ||
      interaction.qudemo_title?.toLowerCase().includes(searchLower)
    );
  });
  // Pagination
  const totalPages = Math.ceil(filteredInteractions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInteractions = filteredInteractions.slice(
    startIndex,
    endIndex,
  );
  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    // Fix floating point precision issues by rounding to 2 decimal places
    const roundedSeconds = Math.round(seconds * 100) / 100;
    const minutes = Math.floor(roundedSeconds / 60);
    const remainingSeconds = Math.floor(roundedSeconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };
  // Generate AI insight summary for interaction
  const generateAiInsightSummary = async (interaction) => {
    if (!interaction.questions || interaction.questions.length === 0) {
      setAiInsightSummary(
        `${interaction.client_name || "The prospect"} accessed ${interaction.qudemo_title || "this demo"} but hasn't asked any questions yet. They spent ${formatDuration(interaction.total_duration)} viewing the demo.`,
      );
      return;
    }
    try {
      setLoadingAiSummary(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        getNodeApiUrl("/api/analytics/generate-insight-summary"),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questions: interaction.questions,
            customerName: interaction.client_name,
            qudemoTitle: interaction.qudemo_title,
          }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        setAiInsightSummary(data.data.summary);
      } else {
        // Fallback to generic message
        setAiInsightSummary(
          `${interaction.client_name || "The prospect"} has shown interest in ${interaction.qudemo_title} by asking ${interaction.questions.length} question${interaction.questions.length > 1 ? "s" : ""} about various aspects of the product.`,
        );
      }
    } catch (error) {
      // Fallback to generic message
      setAiInsightSummary(
        `${interaction.client_name || "The prospect"} has shown interest in ${interaction.qudemo_title} by asking ${interaction.questions.length} question${interaction.questions.length > 1 ? "s" : ""} about various aspects of the product.`,
      );
    } finally {
      setLoadingAiSummary(false);
    }
  };
  // Handle view details
  const handleViewDetails = async (interaction) => {
    // Check if user has active Pro plan
    // COMMENTED OUT FOR TESTING - Allow free users to view details
    // if (!isPro) {
    //   // Show upgrade modal for inactive Pro users
    //   setShowUpgradeModal(true);
    //   return;
    // }

    // Reset AI summary state
    setAiInsightSummary("");
    setLoadingAiSummary(false);
    // Set the selected interaction (with basic data)
    setSelectedInteraction(interaction);
    setActiveTab("overview"); // Reset to overview tab when opening modal
    setShowDetailsModal(true);
    // Load detailed interaction data
    const detailedData = await fetchCustomerInteractionDetails(
      interaction.share_token,
    );
    if (detailedData) {
      setSelectedInteraction(detailedData);
      // Generate AI insight summary with detailed data
      generateAiInsightSummary(detailedData);
    }
  };
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchCustomerList}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-6 dashboard-font">
      {/* Interactions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <div className="flex gap-4 p-6 py-4 justify-between items-center border-b">
            <h1 className="text-xl font-bold text-graydark">
              All Interactions
            </h1>
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-bodydark22" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, company or demo watched..."
                value={searchTerm}
                onChange={handleSearch}
                className="block min-w-[340px] w-full pl-10 pr-3 py-3 border border-strokedark/20 rounded-md text-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-whiter">
              <tr>
                <th className="px-6 py-6 text-left text-xs font-normal text-bodydark22 tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-6 text-left text-xs font-normal text-bodydark22 tracking-wider">
                  Company
                </th>
                <th className="px-6 py-6 text-left text-xs font-normal text-bodydark22 tracking-wider">
                  Demo watched
                </th>
                <th className="px-6 py-6 text-left text-xs font-normal text-bodydark22 tracking-wider">
                  <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                </th>
                <th className="px-6 py-6 text-left text-xs font-normal text-bodydark22 tracking-wider">
                  <ClockIcon className="h-4 w-4" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-normal text-bodydark22 tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedInteractions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "No interactions found matching your search."
                      : "No interactions found."}
                  </td>
                </tr>
              ) : (
                paginatedInteractions.map((interaction, index) => (
                  <tr
                    key={interaction.share_id || index}
                    className="hover:bg-whiter"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm font-medium text-graydark">
                        {interaction.client_name || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm text-graydark">
                        {interaction.client_company || "Unknown Company"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm text-graydark">
                        {interaction.qudemo_title || "Unknown Demo"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {interaction.question_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm text-graydark">
                        {formatDuration(interaction.total_duration)}
                      </div>
                    </td>
                    <td className="pl-6 pr-1 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(interaction)}
                        className="inline-flex items-center px-3 py-1 border border-strokedark/20 text-sm font-medium rounded text-bodydark2 bg-white hover:bg-whiter focus:outline-none"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 px-6 border-t">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-strokedark/20 bg-white px-4 py-2 text-sm font-medium text-bodydark2 hover:bg-whiter disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-strokedark/20 bg-white px-4 py-2 text-sm font-medium text-bodydark2 hover:bg-whiter disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                  <span className="text-sm text-bodydark2">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="border border-strokedark/20 rounded-md px-2 py-1 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-bodydark2">per page, </span>
                  <p className="text-sm text-bodydark2">
                    showing{" "}
                    <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(endIndex, filteredInteractions.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredInteractions.length}
                    </span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md gap-2"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-md px-2 py-2 text-bodydark22 ring-1 ring-inset ring-gray-300 hover:bg-whiter focus:z-20 focus:outline-offset-0 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum =
                        Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                        i;
                      if (pageNum > totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-normal ${
                            pageNum === currentPage
                              ? "z-10 bg-blue-400/10 text-blue-400 focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                              : "text-graydark hover:bg-blue-400/10 focus:z-20 focus:outline-offset-0"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-md px-2 py-2 text-bodydark22 ring-1 ring-inset ring-gray-300 hover:bg-whiter focus:z-20 focus:outline-offset-0 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Details Modal */}
      {showDetailsModal && selectedInteraction && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 pt-20 -top-10 dashboard-font">
          <div className="bg-white rounded-lg border max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="bg-white border-b border-strokedark/10 p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {selectedInteraction.client_name
                          ?.charAt(0)
                          ?.toUpperCase() || "U"}
                      </span>
                    </div>
                    {/* Customer Info */}
                    <div className="text-left">
                      <h3 className="text-xl font-semibold text-graydark text-left">
                        {selectedInteraction.client_name || "Unknown Customer"}{" "}
                        - Customer Interaction Details
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-bodydark2">
                        {selectedInteraction.client_email && (
                          <div className="flex items-center space-x-2">
                            <svg
                              className="w-4 h-4 text-bodydark22"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{selectedInteraction.client_email}</span>
                          </div>
                        )}
                        {selectedInteraction.client_company && (
                          <div className="flex items-center space-x-2">
                            <svg
                              className="w-4 h-4 text-bodydark22"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            <span>{selectedInteraction.client_company}</span>
                          </div>
                        )}
                        {selectedInteraction.last_accessed_at && (
                          <div className="flex items-center space-x-2">
                            <svg
                              className="w-4 h-4 text-bodydark22"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              {new Date(
                                selectedInteraction.last_accessed_at,
                              ).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Close Button */}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-bodydark22 hover:text-bodydark2 mb-6"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Tabs */}
              <div className="bg-white mt-4 px-6">
                <nav className="flex gap-1.5">
                  <button
                    onClick={() => handleTabClick("overview")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "overview"
                        ? "bg-blue-400/10 text-graydark border"
                        : "bg-gray-100 text-bodydark2 hover:text-blue-400 hover:bg-blue-400/10"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => handleTabClick("questions")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "questions"
                        ? "bg-blue-400/10 text-graydark border"
                        : "bg-gray-100 text-bodydark2 hover:text-blue-400 hover:bg-blue-400/10"
                    }`}
                  >
                    Questions asked
                  </button>
                  <button
                    onClick={() => handleTabClick("past-interactions")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "past-interactions"
                        ? "bg-blue-400/10 text-graydark border"
                        : "bg-gray-100 text-bodydark2 hover:text-blue-400 hover:bg-blue-400/10"
                    }`}
                  >
                    Past interactions
                  </button>
                </nav>
              </div>
              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {activeTab === "overview" && (
                  <div className="min-h-96">
                    {/* AI Insight Summary - HIDDEN */}
                    {/* <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 mb-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="font-medium text-blue-900">AI Insight Summary</span>
                      </div>
                      {loadingAiSummary ? (
                        <div className="flex items-center space-x-2 text-blue-700">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Analyzing customer questions...</span>
                        </div>
                      ) : (
                      <p className="text-primary">
                          {aiInsightSummary || 'Generating AI insight summary...'}
                      </p>
                      )}
                    </div> */}
                    {/* Interaction Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* Demo Watched */}
                      <div className="bg-white border border-strokedark/10 rounded-xl p-4">
                        <div className="flex items-start flex-col gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-primary m-auto"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="flex flex-col items-start text-left">
                            <p className="text-sm font-medium text-bodydark2">
                              Demo Watched
                            </p>
                            <p className="text-lg font-semibold text-graydark">
                              {selectedInteraction.qudemo_title ||
                                "Unknown Demo"}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Time Spent */}
                      <div className="bg-white border border-strokedark/10 rounded-xl p-4">
                        <div className="flex items-start flex-col gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-purple-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="flex flex-col items-start text-left">
                            <p className="text-sm font-medium text-bodydark2">
                              Time Spent
                            </p>
                            <p className="text-lg font-semibold text-graydark">
                              {formatDuration(
                                selectedInteraction.total_duration,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Questions Asked */}
                      <div className="bg-white border border-strokedark/10 rounded-xl p-4">
                        <div className="flex items-start flex-col gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                          </div>
                          <div className="flex flex-col items-start text-left">
                            <p className="text-sm font-medium text-bodydark2">
                              Questions Asked
                            </p>
                            <p className="text-lg font-semibold text-graydark">
                              {selectedInteraction.question_count || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Unique Link Details */}
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center space-x-2 mb-3">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                        <span className="font-medium text-blue-900">
                          Unique Link Details
                        </span>
                      </div>
                      <div className="space-y-3 text-left">
                        <div className="flex items-center justify-between text-left">
                          <span className="text-sm py-1 text-primary font-medium">
                            Link Type:
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                            Unique Customer Link
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-left">
                          <span className="text-sm text-primary font-medium whitespace-nowrap">
                            URL:
                          </span>
                          <code className="flex-1 bg-white border border-blue-200 rounded px-2 py-1 text-sm text-blue-900 text-left break-all">
                            {window.location.origin}/share/
                            {selectedInteraction.share_token}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/share/${selectedInteraction.share_token}`,
                              );
                              // You could add a toast notification here
                            }}
                            className="flex items-center space-x-2 px-3 py-1 bg-white border border-blue-300 text-primary text-sm rounded hover:bg-primary/10"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            <span>Copy</span>
                          </button>
                        </div>
                        <div>
                          <span className="text-sm text-primary">
                            <span className="font-medium">Generated on:</span>{" "}
                            {selectedInteraction.last_accessed_at
                              ? new Date(
                                  selectedInteraction.last_accessed_at,
                                ).toLocaleDateString("en-US", {
                                  month: "numeric",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "questions" && (
                  <div className="bg-whiter rounded-lg p-4 min-h-96">
                    <h4 className="font-medium text-graydark mb-4">
                      Questions & Responses
                    </h4>
                    <div className="space-y-6 max-h-96 overflow-y-auto">
                      {selectedInteraction.questions &&
                      selectedInteraction.questions.length > 0 ? (
                        selectedInteraction.questions.map((qa, index) => (
                          <div key={index} className="space-y-3">
                            {/* Question */}
                            <div className="flex items-start space-x-3 bg-whiten rounded-lg p-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {selectedInteraction.client_name
                                    ? selectedInteraction.client_name
                                        .charAt(0)
                                        .toUpperCase()
                                    : "C"}
                                </div>
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm font-semibold text-graydark text-left">
                                  {qa.question}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 text-left">
                                  Asked on{" "}
                                  {qa.created_at
                                    ? new Date(qa.created_at).toLocaleString(
                                        "en-US",
                                        {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        },
                                      )
                                    : "Unknown time"}
                                </p>
                              </div>
                            </div>
                            {/* Answer */}
                            <div className="flex items-start space-x-3 bg-white rounded-lg p-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-bodydark2 text-xs font-medium">
                                  AI
                                </div>
                              </div>
                              <div className="flex-1 text-left">
                                <div className="text-sm text-bodydark2 whitespace-pre-wrap text-left">
                                  {qa.answer
                                    .replace(/\*\*(.*?)\*\*/g, "$1")
                                    .replace(/\*(.*?)\*/g, "$1")
                                    .replace(/`(.*?)`/g, "$1")}
                                </div>
                                {qa.formatted_timestamp && (
                                  <div className="mt-2 flex items-center space-x-2">
                                    <svg
                                      className="w-4 h-4 text-blue-500"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <span className="text-xs text-primary font-medium">
                                      Video timestamp: {qa.formatted_timestamp}
                                      {qa.start_timestamp && (
                                        <span className="text-gray-500 ml-1">
                                          ({Math.floor(qa.start_timestamp / 60)}
                                          :
                                          {(qa.start_timestamp % 60)
                                            .toString()
                                            .padStart(2, "0")}
                                          )
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <svg
                            className="mx-auto h-10 w-10 text-bodydark22"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-graydark">
                            No questions asked
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            This customer hasn't asked any questions yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === "past-interactions" && (
                  <div className="min-h-96">
                    <div className="bg-white rounded-lg border border-strokedark/10 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-whiter">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-bold text-bodydark2 tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-bodydark2 tracking-wider">
                              Demo
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-bodydark2 tracking-wider">
                              Questions
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-bodydark2 tracking-wider">
                              Time spent
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedInteraction.questions &&
                          selectedInteraction.questions.length > 0 ? (
                            (() => {
                              // Group questions into sessions (same logic as backend)
                              const questions =
                                selectedInteraction.questions || [];
                              if (questions.length === 0) return null;
                              const SESSION_GAP_HOURS = 2;
                              const SESSION_GAP_MS =
                                SESSION_GAP_HOURS * 60 * 60 * 1000;
                              const sessions = [];
                              let currentSession = {
                                questions: [questions[0]],
                                startTime: questions[0].created_at,
                                endTime: questions[0].created_at,
                              };
                              for (let i = 1; i < questions.length; i++) {
                                const timeDiff =
                                  new Date(questions[i].created_at) -
                                  new Date(questions[i - 1].created_at);
                                if (timeDiff > SESSION_GAP_MS) {
                                  sessions.push(currentSession);
                                  currentSession = {
                                    questions: [questions[i]],
                                    startTime: questions[i].created_at,
                                    endTime: questions[i].created_at,
                                  };
                                } else {
                                  currentSession.questions.push(questions[i]);
                                  currentSession.endTime =
                                    questions[i].created_at;
                                }
                              }
                              sessions.push(currentSession);
                              // Display each session as a row
                              return sessions.map((session, sessionIndex) => {
                                const sessionDate = new Date(session.startTime);
                                const now = new Date();
                                const diffTime = Math.abs(now - sessionDate);
                                const diffDays = Math.ceil(
                                  diffTime / (1000 * 60 * 60 * 24),
                                );
                                let dateDisplay;
                                if (diffDays === 1) {
                                  dateDisplay = "Today";
                                } else if (diffDays === 2) {
                                  dateDisplay = "Yesterday";
                                } else if (diffDays <= 7) {
                                  dateDisplay = `${diffDays - 1} days ago`;
                                } else {
                                  dateDisplay =
                                    sessionDate.toLocaleDateString();
                                }
                                // Calculate session duration
                                const sessionDuration = Math.floor(
                                  (new Date(session.endTime) -
                                    new Date(session.startTime)) /
                                    1000,
                                );
                                const questionTime =
                                  session.questions.length * 45;
                                const demoTime =
                                  sessionIndex === 0
                                    ? Math.min(sessionDuration * 0.3, 300)
                                    : 0;
                                const totalSessionTime = Math.max(
                                  sessionDuration + questionTime + demoTime,
                                  session.questions.length * 30,
                                );
                                return (
                                  <tr
                                    key={sessionIndex}
                                    className="hover:bg-whiter"
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark text-left">
                                      {dateDisplay}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark text-left">
                                      {selectedInteraction.qudemo_title ||
                                        "Product Demo"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark text-left">
                                      {session.questions.length}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-graydark text-left">
                                      {formatDuration(
                                        Math.min(totalSessionTime, 1800),
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
                            })()
                          ) : (
                            <tr>
                              <td
                                colSpan="4"
                                className="px-6 py-8 text-center text-sm text-gray-500"
                              >
                                No past interactions found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal for Inactive Pro Users */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <svg
                className="h-8 w-8 text-orange-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-graydark text-left">
                Upgrade Required
              </h3>
            </div>

            <p className="text-bodydark2 mb-6 text-left">
              Your Pro plan is currently inactive. To view detailed interaction
              analytics and insights, please upgrade to Pro or reactivate your
              subscription.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-bodydark2 bg-whiten hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowUpgradeModal(false);
                  try {
                    const token =
                      localStorage.getItem("accessToken") ||
                      localStorage.getItem("token");
                    if (!token) {
                      navigate("/login");
                      return;
                    }
                    const baseUrl = getApiUrl("node");
                    const checkoutUrl = `${baseUrl}/api/subscription/checkout`;
                    const response = await fetch(checkoutUrl, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        plan: "pro",
                        billingCycle: "monthly",
                      }),
                    });
                    const data = await response.json();
                    if (data.success && data.checkoutUrl) {
                      window.location.href = data.checkoutUrl;
                    } else {
                      alert(
                        `Failed to start checkout: ${data.error || "Unknown error"}`,
                      );
                    }
                  } catch (error) {
                    alert(`Failed to start checkout: ${error.message}`);
                  }
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerInteractionsPage;
