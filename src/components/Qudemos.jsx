import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../context/CompanyContext";
import { useNotification } from "../context/NotificationContext";
import { getNodeApiUrl, getApiUrl } from "../config/api";
import ReactPlayer from "react-player";
import HybridVideoPlayer from "./HybridVideoPlayer";
import QudemoPreview from "./QudemoPreview";
import WidgetGeneratorModal from "./WidgetGeneratorModal";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  PlayIcon,
  ClockIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ChartBarIcon,
  LockClosedIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
const Qudemos = () => {
  const [qudemos, setQudemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { company } = useCompany();
  // Check subscription status
  const subscriptionPlan = company?.subscription_plan || "free";
  const subscriptionStatus = company?.subscription_status || "active";
  const isActive = ["active", "trialing", "on_trial"].includes(
    subscriptionStatus,
  );
  const isPro = ["pro", "enterprise"].includes(subscriptionPlan) && isActive;
  const isEnterprise = subscriptionPlan === "enterprise" && isActive;
  const [previewingQudemo, setPreviewingQudemo] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [deletingQudemoId, setDeletingQudemoId] = useState(null);
  const [sharingQudemo, setSharingQudemo] = useState(null);
  const [shareLink, setShareLink] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareOptionsModal, setShowShareOptionsModal] = useState(false);
  const [showUniqueLinksModal, setShowUniqueLinksModal] = useState(false);
  const [showFewUniqueLinksModal, setShowFewUniqueLinksModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [qudemoToDelete, setQudemoToDelete] = useState(null);
  const [qudemoToShare, setQudemoToShare] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [showGeneratedLinksModal, setShowGeneratedLinksModal] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadData, setDownloadData] = useState(null);
  const [originalFilename, setOriginalFilename] = useState(null);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPeopleListModal, setShowPeopleListModal] = useState(false);
  const [showInteractionsListModal, setShowInteractionsListModal] =
    useState(false);
  const [qudemoPeople, setQudemoPeople] = useState([]);
  const [qudemoInteractions, setQudemoInteractions] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [aiInsightSummary, setAiInsightSummary] = useState("");
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [showWidgetGeneratorModal, setShowWidgetGeneratorModal] =
    useState(false);
  const [selectedQudemoForWidget, setSelectedQudemoForWidget] = useState(null);
  const [widgetData, setWidgetData] = useState(null);
  const [introVideos, setIntroVideos] = useState({}); // Store intro videos for each QuDemo
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification();
  // Filter interactions based on search term and exclude users with no engagement
  const filteredInteractions = qudemoInteractions.filter((interaction) => {
    // First, exclude users who haven't asked questions and don't have time spent
    const hasQuestions =
      interaction.question_count && interaction.question_count > 0;
    const hasTimeSpent =
      interaction.total_duration && interaction.total_duration > 0;
    // Only show users who have asked questions OR spent time
    if (!hasQuestions && !hasTimeSpent) {
      return false;
    }
    // Then apply search filter
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const name = (interaction.client_name || "").toLowerCase();
    const email = (interaction.client_email || "").toLowerCase();
    const company = (interaction.client_company || "").toLowerCase();
    return (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      company.includes(searchLower)
    );
  });
  // Format duration helper
  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    // Round to nearest whole number to avoid floating point precision issues
    const roundedSeconds = Math.round(seconds);
    const minutes = Math.floor(roundedSeconds / 60);
    const remainingSeconds = roundedSeconds % 60;
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
  // Handle view details for interactions
  const handleViewDetails = (interaction) => {
    if (interaction.questions && interaction.questions.length > 0) {
    }
    // Reset AI summary state
    setAiInsightSummary("");
    setLoadingAiSummary(false);
    setSelectedInteraction(interaction);
    setActiveTab("overview");
    setShowDetailsModal(true);
    setShowInteractionsListModal(false);
    // Generate AI insight summary
    generateAiInsightSummary(interaction);
  };
  // Handle view interactions for a QuDemo
  const handleViewQudemoInteractions = async (qudemo) => {
    // Check if user has Pro/Enterprise plan first
    // COMMENTED OUT FOR TESTING - Allow free users to view interactions
    // if (!isPro) {
    //   // Show upgrade popup for free users
    //   setErrorDetails({
    //     title: 'View Interactions requires Pro plan',
    //     message: 'Upgrade to Pro to view detailed interaction analytics for your Qudemos.',
    //     currentPlan: 'free',
    //     subscriptionStatus: 'active',
    //     isCancelled: false
    //   });
    //   setShowUpgradeModal(true);
    //   return;
    // }
    try {
      setLoadingInteractions(true);
      setSearchTerm(""); // Clear search when opening modal
      // Fetch interactions for this specific QuDemo and show interactions list
      const interactions = await fetchQudemoInteractions(qudemo.id);
      setQudemoInteractions(interactions);
      setShowInteractionsListModal(true);
    } catch (error) {
      showError("Failed to fetch interactions");
    } finally {
      setLoadingInteractions(false);
    }
  };
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };
  // Fetch interactions for a specific QuDemo
  const fetchQudemoInteractions = async (qudemoId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        getNodeApiUrl(`/api/analytics/qudemo-interactions/${qudemoId}`),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  };
  // Share functionality
  const handleShareQudemo = async (qudemo) => {
    // Special handling for demo Qudemo - bypass Pro check and go straight to single link
    if (qudemo.isDemo && qudemo.share_token) {
      await generateSingleShareLink(qudemo);
      return;
    }

    // Check if user has Pro/Enterprise plan first
    // COMMENTED OUT FOR TESTING - Allow free users to share
    // if (!isPro) {
    //   // Show upgrade popup for free users
    //   setErrorDetails({
    //     title: 'Share functionality requires Pro plan',
    //     message: 'Upgrade to Pro to generate shareable links for your Qudemos.',
    //     currentPlan: 'free',
    //     subscriptionStatus: 'active',
    //     isCancelled: false
    //   });
    //   setShowUpgradeModal(true);
    //   return;
    // }
    // Show share options modal for Pro/Enterprise users (don't generate link yet)
    setQudemoToShare(qudemo);
    setShowShareOptionsModal(true);
  };
  // Handle share option selection
  const handleShareOption = async (option) => {
    setShowShareOptionsModal(false);
    if (option === "single") {
      await generateSingleShareLink(qudemoToShare);
    } else if (option === "unique") {
      // Show unique links modal instead of navigating directly
      setShowUniqueLinksModal(true);
    }
  };
  // Handle unique links option selection
  const handleUniqueLinksOption = async (option) => {
    setShowUniqueLinksModal(false);
    if (option === "few") {
      // Initialize with one empty customer for manual entry
      setCustomers([{ name: "", email: "", company: "" }]);
      // Show few unique links modal instead of navigating directly
      setShowFewUniqueLinksModal(true);
    } else if (option === "bulk") {
      // Show bulk upload modal instead of navigating directly
      setShowBulkUploadModal(true);
    }
  };
  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };
  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null);
    // Reset file input
    const fileInput = document.getElementById("file-input");
    if (fileInput) {
      fileInput.value = "";
    }
  };
  // Clear selected file when modal is closed
  const handleBulkUploadModalClose = () => {
    setShowBulkUploadModal(false);
    removeSelectedFile();
  };
  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!selectedFile) {
      showError("Please select a file first");
      return;
    }
    try {
      let clientData = [];
      const fileExtension = selectedFile.name.toLowerCase().split(".").pop();
      if (fileExtension === "csv") {
        // Parse CSV file
        const text = await selectedFile.text();
        const lines = text.trim().split("\n");
        if (lines.length < 2) {
          showError(
            "CSV file must have at least a header row and one data row",
          );
          return;
        }
        const parseCSVLine = (line) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };
        const headers = parseCSVLine(lines[0]).map((h) =>
          h.replace(/"/g, "").trim().toLowerCase(),
        );
        const requiredHeaders = ["name", "email", "company"];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h),
        );
        if (missingHeaders.length > 0) {
          showError(
            `CSV file is missing required columns: ${missingHeaders.join(", ")}`,
          );
          return;
        }
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]).map((v) =>
            v.replace(/"/g, "").trim(),
          );
          const requiredColumnCount = 3;
          if (values.length >= requiredColumnCount) {
            const slNoIndex =
              headers.indexOf("sl no") !== -1
                ? headers.indexOf("sl no")
                : headers.indexOf("slno");
            const slNo =
              slNoIndex !== -1 ? values[slNoIndex] || String(i) : String(i);
            const client = {
              slNo: slNo,
              clientName: values[headers.indexOf("name")] || "",
              email: values[headers.indexOf("email")] || "",
              companyName: values[headers.indexOf("company")] || "",
            };
            if (client.clientName && client.email) {
              clientData.push(client);
            }
          }
        }
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        // Parse Excel file using SheetJS
        try {
          const XLSX = await import("xlsx");
          const data = await selectedFile.arrayBuffer();
          const workbook = XLSX.read(data);
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (jsonData.length < 2) {
            showError(
              "Excel file must have at least a header row and one data row",
            );
            return;
          }
          const headers = jsonData[0].map((h) =>
            String(h).trim().toLowerCase(),
          );
          const requiredHeaders = ["name", "email", "company"];
          const missingHeaders = requiredHeaders.filter(
            (h) => !headers.includes(h),
          );
          if (missingHeaders.length > 0) {
            showError(
              `Excel file is missing required columns: ${missingHeaders.join(", ")}`,
            );
            return;
          }
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;
            const hasData = row.some(
              (cell) =>
                cell !== null &&
                cell !== undefined &&
                String(cell).trim() !== "",
            );
            if (!hasData) continue;
            const requiredColumnCount = 3;
            if (row && row.length >= requiredColumnCount) {
              const slNoIndex =
                headers.indexOf("sl no") !== -1
                  ? headers.indexOf("sl no")
                  : headers.indexOf("slno");
              const slNo =
                slNoIndex !== -1
                  ? String(row[slNoIndex] || "").trim() || String(i)
                  : String(i);
              const client = {
                slNo: slNo,
                clientName: String(row[headers.indexOf("name")] || "").trim(),
                email: String(row[headers.indexOf("email")] || "").trim(),
                companyName: String(
                  row[headers.indexOf("company")] || "",
                ).trim(),
              };
              if (client.clientName && client.email) {
                clientData.push(client);
              }
            }
          }
        } catch (xlsxError) {
          showError(
            "Error parsing Excel file. Please ensure the file is not corrupted.",
          );
          return;
        }
      } else {
        showError(
          "Unsupported file format. Please upload a CSV or Excel (.xlsx/.xls) file.",
        );
        return;
      }
      if (clientData.length === 0) {
        showError(
          "No valid client data found in file. Please ensure each row has name and email.",
        );
        return;
      }
      // Send to backend
      const requestBody = {
        qudemoId: qudemoToShare.id,
        clientData: clientData,
        operationSource: "bulk_upload",
        originalFilename: selectedFile?.name || "bulk-upload.csv",
      };
      const token = localStorage.getItem("accessToken");
      const response = await fetch(getNodeApiUrl("/api/qudemos/bulk-share"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      if (response.ok) {
        const data = await response.json();
        // Set download data and show download modal
        setDownloadData(data.data || []);
        setOriginalFilename(selectedFile?.name || null); // Store original filename before clearing
        setSelectedFile(null);
        setShowBulkUploadModal(false);
        setShowDownloadModal(true);
        showSuccess(
          `Successfully generated ${data.data?.length || 0} bulk links!`,
        );
        // Reset file input
        const fileInput = document.getElementById("file-input");
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        const errorData = await response.json();
        // Check if it's a subscription error
        if (errorData.requiresUpgrade) {
          if (errorData.isCancelled) {
            // Show popup modal for cancelled subscriptions
            setShowUpgradeModal(true);
            setErrorDetails({
              title: errorData.error,
              message: errorData.message,
              currentPlan: errorData.currentPlan,
              isCancelled: true,
            });
          } else {
            // Show popup modal for other upgrade scenarios
            setShowUpgradeModal(true);
            setErrorDetails({
              title: errorData.error,
              message: errorData.message,
              currentPlan: errorData.currentPlan,
              isCancelled: false,
            });
          }
        } else {
          showError("Failed to generate bulk links. Please try again.");
        }
      }
    } catch (error) {
      showError("Network error. Please try again.");
    }
  };
  // Handle customer input changes
  const handleCustomerChange = (index, field, value) => {
    const updatedCustomers = [...customers];
    updatedCustomers[index][field] = value;
    setCustomers(updatedCustomers);
  };
  // Add another customer (max 5)
  const addAnotherCustomer = () => {
    if (customers.length < 5) {
      setCustomers([...customers, { name: "", email: "", company: "" }]);
    } else {
      showError("Maximum 5 customers allowed");
    }
  };
  // Remove customer
  const removeCustomer = (index) => {
    if (customers.length > 1) {
      const updatedCustomers = customers.filter((_, i) => i !== index);
      setCustomers(updatedCustomers);
    }
  };
  // Handle generate few links
  const handleGenerateFewLinks = async () => {
    // Validate required fields
    const validCustomers = customers.filter(
      (customer) => customer.name && customer.email,
    );
    if (validCustomers.length === 0) {
      showError("Please fill in at least one customer with name and email");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      // Prepare client data for bulk share endpoint
      const clientData = validCustomers.map((customer, index) => ({
        slNo: index + 1,
        clientName: customer.name,
        email: customer.email,
        companyName: customer.company || "Unknown Company",
      }));
      // Use bulk share endpoint instead of individual share endpoint
      const response = await fetch(getNodeApiUrl("/api/qudemos/bulk-share"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qudemoId: qudemoToShare.id,
          clientData: clientData,
          operationSource: "few_links",
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform the response data to match the expected format
          const generatedLinksData = data.data.map((result, index) => ({
            name: result.clientName,
            email: result.email,
            company: result.companyName,
            shareUrl: result.shareUrl,
            shareId: result.shareId,
          }));
          // Show results modal
          setGeneratedLinks(generatedLinksData);
          setShowFewUniqueLinksModal(false);
          setShowGeneratedLinksModal(true);
          showSuccess(
            `Successfully generated ${generatedLinksData.length} unique links!`,
          );
        } else {
          showError(data.error || "Failed to generate links");
        }
      } else {
        const errorData = await response.json();
        showError(errorData.error || "Failed to generate links");
      }
    } catch (error) {
      showError("Failed to generate links. Please try again.");
    }
  };
  // Copy link to clipboard
  const copyLinkToClipboard = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      showSuccess("Link copied to clipboard!");
    } catch (err) {
      showError("Failed to copy link. Please copy manually.");
    }
  };
  // Handle download of generated file
  const handleDownloadFile = async () => {
    if (!downloadData) return;
    try {
      // Prepare CSV data
      const csvHeaders = [
        "SL No",
        "Client Name",
        "Company Name",
        "Email",
        "Shared QuDemo",
      ];
      const csvRows = downloadData.map((item, index) => [
        item.slNo || index + 1,
        item.clientName || "",
        item.companyName || "",
        item.email || "",
        item.shareUrl || "",
      ]);
      // Create CSV content
      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");
      // Add UTF-8 BOM for better Excel compatibility
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      // Use original filename if available, otherwise generate one
      let filename;
      if (originalFilename) {
        // Remove existing extension and add .csv
        const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, "");
        filename = `${nameWithoutExt}.csv`;
      } else {
        // Fallback to generated filename
        const timestamp = new Date().toISOString().slice(0, 10);
        filename = `bulk_share_links_${timestamp}.csv`;
      }
      // Download the file
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      showSuccess("File downloaded successfully!");
      setShowDownloadModal(false);
    } catch (error) {
      showError("Failed to download file. Please try again.");
    }
  };
  // Generate single share link
  const generateSingleShareLink = async (qudemo) => {
    // Prevent multiple simultaneous requests for the same qudemo
    if (sharingQudemo && sharingQudemo.id === qudemo.id) {
      return;
    }
    setSharingQudemo(qudemo);

    // Special handling for demo Qudemo - use existing share token
    if (qudemo.isDemo && qudemo.share_token) {
      try {
        const shareUrl = `${window.location.origin}/share/${qudemo.share_token}`;
        setShareLink(shareUrl);
        setShowShareModal(true);
        showSuccess("Share link retrieved successfully!");
        setSharingQudemo(null);
        return;
      } catch (err) {
        showError("Failed to generate share link. Please try again.");
        setSharingQudemo(null);
        return;
      }
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        getNodeApiUrl(`/api/qudemos/${qudemo.id}/share`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setShareLink(data.shareUrl);
        setShowShareModal(true);
        // Show different message based on whether it's a new or existing link
        if (data.isNewLink) {
          showSuccess("Share link generated successfully!");
        } else {
          showSuccess("Share link retrieved successfully!");
        }
      } else {
        const errorData = await response.json();
        // Check if it's a subscription error
        if (errorData.requiresUpgrade) {
          if (errorData.isCancelled) {
            // Show popup modal for cancelled subscriptions
            setShowUpgradeModal(true);
            // Store error details for the modal
            setErrorDetails({
              title: errorData.error,
              message: errorData.message,
              currentPlan: errorData.currentPlan,
              isCancelled: true,
            });
          } else if (errorData.currentPlan === "free") {
            showError(
              "Share functionality requires Pro plan. Please upgrade to continue.",
            );
            // Optionally redirect to pricing page
            setTimeout(() => {
              window.location.href = "/pricing";
            }, 2000);
          } else {
            // Show popup modal for other upgrade scenarios
            setShowUpgradeModal(true);
            setErrorDetails({
              title: errorData.error,
              message: errorData.message,
              currentPlan: errorData.currentPlan,
              isCancelled: false,
            });
          }
        } else {
          showError("Failed to generate share link. Please try again.");
        }
      }
    } catch (err) {
      showError("Network error. Please try again.");
    } finally {
      setSharingQudemo(null);
    }
  };
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      showSuccess("Share link copied to clipboard!");
    } catch (err) {
      showError("Failed to copy link. Please copy manually.");
    }
  };
  const handleConfirmDelete = async () => {
    if (qudemoToDelete) {
      setDeletingQudemoId(qudemoToDelete.id);
      setShowDeleteModal(false);
      await deleteQudemo(qudemoToDelete.id);
      setDeletingQudemoId(null);
      setQudemoToDelete(null);
    }
  };
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setQudemoToDelete(null);
  };
  // Helper function to get relative time
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };
  const fetchQudemos = async () => {
    if (!company?.id) {
      setLoading(false);
      setError("No company found. Please create a company first.");
      // setQudemos([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("accessToken");

      // Fetch user's own Qudemos
      const response = await fetch(
        getNodeApiUrl(`/api/qudemos?companyId=${company.id}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();

      if (response.ok && data.success) {
        const userQudemos = data.data || [];

        // Fetch the welcome/demo Qudemo using public share link
        try {
          const WELCOME_SHARE_TOKEN = "ca6b5a1b-0764-4e1c-bf6c-3e3c5bc93d1d";
          const welcomeResponse = await fetch(
            getNodeApiUrl(`/api/qudemos/share/${WELCOME_SHARE_TOKEN}`),
          );

          if (welcomeResponse.ok) {
            const welcomeData = await welcomeResponse.json();

            if (welcomeData.success && welcomeData.data) {
              // Add a flag to identify this as the demo Qudemo and include the share token
              const demoQudemo = {
                ...welcomeData.data,
                isDemo: true,
                share_token: WELCOME_SHARE_TOKEN,
                title: welcomeData.data.title || "Welcome to Qudemo",
              };

              // Add demo Qudemo at the beginning
              setQudemos([demoQudemo, ...userQudemos]);
            } else {
              // If demo fetch fails, just show user's Qudemos
              setQudemos(userQudemos);
            }
          } else {
            // If demo fetch fails, just show user's Qudemos
            setQudemos(userQudemos);
          }
        } catch (welcomeError) {
          console.error("Failed to fetch welcome Qudemo:", welcomeError);
          // If demo fetch fails, just show user's Qudemos
          setQudemos(userQudemos);
        }
      } else {
        setError(data.error || "Failed to fetch qudemos");
        // setQudemos([]);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      // setQudemos([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchQudemos();
  }, [company]);

  // Fetch intro videos for all QuDemos
  useEffect(() => {
    if (qudemos.length > 0 && company?.name) {
      fetchIntroVideos();
    }
  }, [qudemos, company]);

  const fetchIntroVideos = async () => {
    console.log("🎬 Fetching intro videos for all QuDemos...");
    const newIntroVideos = {};

    for (const qudemo of qudemos) {
      try {
        const response = await fetch(
          getApiUrl(`/ask/${encodeURIComponent(company.name)}/${qudemo.id}`),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: "INTRO_VIDEO" }),
          },
        );

        const data = await response.json();

        if (data && data.has_avatar_video && data.avatar_video_url) {
          console.log(`✅ Intro video found for QuDemo: ${qudemo.title}`);
          newIntroVideos[qudemo.id] = data.avatar_video_url;
        }
      } catch (error) {
        console.error(`❌ Error fetching intro video for ${qudemo.id}:`, error);
      }
    }

    setIntroVideos(newIntroVideos);
    console.log(`🎬 Loaded ${Object.keys(newIntroVideos).length} intro videos`);
  };

  // Refresh data when component comes into focus (e.g., when navigating back)
  // Removed aggressive refresh to prevent UI refresh issues
  // useEffect(() => {
  //   const handleFocus = () => {
  //     fetchQudemos();
  //   };
  //   window.addEventListener('focus', handleFocus);
  //   return () => window.removeEventListener('focus', handleFocus);
  // }, [company]);
  const handleGenerateWidget = async (qudemo) => {
    try {
      console.log("Generating widget for qudemo:", qudemo.id);
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        getNodeApiUrl(`/api/qudemos/${qudemo.id}/generate-widget`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "light",
            position: "bottom-right",
            size: "medium",
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setWidgetData(data);
        setSelectedQudemoForWidget(qudemo);
        setShowWidgetGeneratorModal(true);
        showSuccess("Widget code generated successfully!");
      } else {
        showError("Failed to generate widget code");
      }
    } catch (error) {
      console.error("Error generating widget:", error);
      showError("Failed to generate widget code");
    }
  };

  const handleDropdownAction = async (action, qudemo) => {
    setDropdownOpen(null);
    switch (action) {
      case "edit":
        navigate(`/view-qudemo/${qudemo.id}`);
        break;
      case "interactions":
        // Check if user has Pro/Enterprise plan first
        // COMMENTED OUT FOR TESTING - Allow free users to view interactions
        // if (!isPro) {
        //   // Show upgrade popup for free users
        //   setErrorDetails({
        //     title: 'View Interactions requires Pro plan',
        //     message: 'Upgrade to Pro to view detailed interaction analytics for your Qudemos.',
        //     currentPlan: 'free',
        //     subscriptionStatus: 'active',
        //     isCancelled: false
        //   });
        //   setShowUpgradeModal(true);
        //   return;
        // }
        try {
          setLoadingInteractions(true);
          // Fetch interactions for this specific QuDemo and show people list
          const interactions = await fetchQudemoInteractions(qudemo.id);
          if (interactions.length > 0) {
            setQudemoPeople(interactions);
            setShowPeopleListModal(true);
          } else {
            showInfo("No interactions found for this QuDemo");
          }
        } catch (error) {
          showError("Failed to fetch interactions");
        } finally {
          setLoadingInteractions(false);
        }
        break;
      case "delete":
        setQudemoToDelete(qudemo);
        setShowDeleteModal(true);
        break;
      case "share":
        handleShareQudemo(qudemo);
        break;
      case "generate-widget":
        handleGenerateWidget(qudemo);
        break;
      default:
        break;
    }
  };
  const deleteQudemo = async (qudemoId) => {
    try {
      // Don't set global loading, just track the specific qudemo being deleted
      const token = localStorage.getItem("accessToken");
      const response = await fetch(getNodeApiUrl(`/api/qudemos/${qudemoId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Remove the qudemo from the local state immediately for better UX
        setQudemos((prevQudemos) =>
          prevQudemos.filter((q) => q.id !== qudemoId),
        );
        // Close preview modal if the deleted qudemo is being previewed
        if (previewingQudemo && previewingQudemo.id === qudemoId) {
          setPreviewingQudemo(null);
        }
        // Clean up localStorage data for the deleted qudemo
        const chatKey = `qudemo_chat_${qudemoId}`;
        localStorage.removeItem(chatKey);
        // Show success message
        // Show success notification
        showSuccess("Qudemo deleted successfully!");
      } else {
        showError(
          "Failed to delete qudemo: " + (data.error || "Unknown error"),
        );
      }
    } catch (error) {
      showError("Failed to delete qudemo. Please try again.");
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  if (error) {
    // Check if it's a "no company" error
    const isNoCompanyError =
      error.includes("No company found") ||
      error.includes("create a company first");
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-orange-600"
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
        </div>
        <h3 className="text-lg font-medium text-graydark mb-2">
          {isNoCompanyError ? "No Company Found" : "Error Loading Qudemos"}
        </h3>
        <p className="text-bodydark mb-6">
          {isNoCompanyError
            ? "You need to create a company first before you can create qudemos."
            : error}
        </p>
        {isNoCompanyError ? (
          <button
            onClick={() => navigate("/company-management")}
            className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Create Company
          </button>
        ) : (
          <button
            onClick={fetchQudemos}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-6 dashboard-font">
      {/* Header */}
      <div className="flex justify-end items-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchQudemos}
            className="flex items-center space-x-2 px-3 py-2 bg-whiten text-bodydark rounded-lg hover:bg-bodydark1 transition-colors"
            title="Refresh qudemos"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>
      {/* Qudemos Grid */}
      {qudemos.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-whiten rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayIcon className="w-8 h-8 text-bodydark2" />
          </div>
          <h3 className="text-lg font-medium text-graydark mb-2">
            No qudemos created yet
          </h3>
          <p className="text-bodydark">
            Get started by creating your first Qudemo!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qudemos.map((qudemo) => (
            <div
              key={qudemo.id}
              className={`bg-white rounded-2xl border hover:border transition-shadow border border-strokedark/10 ${
                deletingQudemoId === qudemo.id
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
            >
              {/* Video Thumbnail */}
              <div className="relative h-48 bg-whiten rounded-t-2xl overflow-hidden">
                {/* Delete Loading Overlay */}
                {deletingQudemoId === qudemo.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-t-lg">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">Deleting...</p>
                    </div>
                  </div>
                )}
                {introVideos[qudemo.id] ? (
                  // Show intro AI video preview if available
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <video
                      src={introVideos[qudemo.id].replace(/ /g, "%20")}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : qudemo.videos && qudemo.videos.length > 0 ? (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <div className="relative w-full h-full group">
                      {/* Video Player Preview */}
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full">
                          {(() => {
                            const videoUrl = qudemo.videos[0].video_url;
                            const isLoomVideo =
                              videoUrl && videoUrl.includes("loom.com");
                            const isYouTubeVideo =
                              videoUrl &&
                              (videoUrl.includes("youtube.com") ||
                                videoUrl.includes("youtu.be"));
                            const isVimeoVideo =
                              videoUrl && videoUrl.includes("vimeo.com");
                            // For Loom videos, use custom iframe since ReactPlayer doesn't support them well
                            if (isLoomVideo) {
                              const loomVideoId = videoUrl
                                .split("loom.com/share/")[1]
                                ?.split("?")[0];
                              const loomEmbedUrl = `https://www.loom.com/embed/${loomVideoId}?autoplay=0&muted=1&hide_share=1&hide_title=1&hide_owner=1&hide_embed_top_bar=1`;
                              return (
                                <iframe
                                  src={loomEmbedUrl}
                                  width="100%"
                                  height="100%"
                                  frameBorder="0"
                                  allowFullScreen
                                  title="Loom video preview"
                                  className="rounded-t-lg"
                                  style={{ borderRadius: "0.5rem 0.5rem 0 0" }}
                                  onError={() => {}}
                                />
                              );
                            }
                            // For YouTube, Vimeo, and other videos, use ReactPlayer
                            return (
                              <ReactPlayer
                                url={videoUrl}
                                width="100%"
                                height="100%"
                                controls={false}
                                playing={false}
                                muted={true}
                                loop={true}
                                className="rounded-t-lg"
                                onError={(error) => {}}
                                onReady={() => {}}
                                fallback={
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                    <div className="text-center text-white">
                                      <PlayIcon className="w-12 h-10 mx-auto mb-2 opacity-80" />
                                      <p className="text-sm opacity-80">
                                        Video Preview
                                      </p>
                                    </div>
                                  </div>
                                }
                                config={{
                                  file: {
                                    attributes: {
                                      style: {
                                        borderRadius: "0.5rem 0.5rem 0 0",
                                      },
                                    },
                                  },
                                  youtube: {
                                    playerVars: {
                                      rel: 0,
                                      modestbranding: 1,
                                      iv_load_policy: 3,
                                      fs: 0,
                                      cc_load_policy: 0,
                                      disablekb: 1,
                                      playsinline: 1,
                                      showinfo: 0,
                                      loop: 0,
                                      end: 0,
                                      wmode: "opaque",
                                      origin: window.location.origin,
                                      widget_referrer: window.location.origin,
                                      html5: 1,
                                      vq: "hd720",
                                      disable_polymer: 1,
                                      no_https: 1,
                                      hl: "en",
                                      cc_lang_pref: "en",
                                    },
                                  },
                                  vimeo: {
                                    playerVars: {
                                      autoplay: false,
                                      controls: false,
                                      muted: true,
                                      loop: true,
                                      playsinline: true,
                                      preload: "metadata",
                                    },
                                  },
                                }}
                              />
                            );
                          })()}
                        </div>
                      </div>
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewingQudemo(qudemo);
                          }}
                          className="w-16 h-16 bg-black bg-opacity-60 rounded-full flex items-center justify-center hover:bg-opacity-80 hover:scale-110 transition-all duration-300 border"
                        >
                          <PlayIcon className="w-8 h-8 text-white ml-1" />
                        </button>
                      </div>
                      {/* Video Duration Badge */}
                      {qudemo.videos[0].duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {qudemo.videos[0].duration}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center">
                      <VideoCameraIcon className="w-12 h-10 text-bodydark2 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No video</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Card Content */}
              <div className={qudemo.isDemo ? "p-3" : "p-4"}>
                <div
                  className={
                    qudemo.isDemo
                      ? "flex justify-between items-start"
                      : "flex justify-between items-start mb-2"
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-graydark truncate">
                        {qudemo.title}
                      </h3>
                      {qudemo.isDemo && (
                        <span className="inline-flex items-center px-2 py-0.5 my-auto rounded-full text-xs font-medium bg-primary/10 text-primary whitespace-nowrap">
                          Demo
                        </span>
                      )}
                    </div>
                  </div>
                  {!qudemo.isDemo && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpen(
                            dropdownOpen === qudemo.id ? null : qudemo.id,
                          );
                        }}
                        className="p-1 hover:bg-whiten rounded"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
                      </button>
                      {dropdownOpen === qudemo.id && (
                        <div className="absolute right-0 top-8 bg-white border border-strokedark/10 rounded-lg border z-10 min-w-[220px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewingQudemo(qudemo);
                              setDropdownOpen(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-whiter flex items-center space-x-2"
                          >
                            <PlayIcon className="w-4 h-4" />
                            <span>Preview</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDropdownAction("edit", qudemo);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-whiter flex items-center space-x-2"
                          >
                            <PencilIcon className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // COMMENTED OUT FOR TESTING - Allow free users to view interactions
                              // if (!isPro) {
                              //   setErrorDetails({
                              //     title: 'View Interactions requires Pro plan',
                              //     message: 'Upgrade to Pro to view detailed interaction analytics for your Qudemos.',
                              //     features: [
                              //       { title: 'Advanced Analytics', description: 'Track views and engagement', icon: '📊' },
                              //       { title: 'Public Sharing', description: 'Generate shareable links for your Qudemos', icon: '🔗' }
                              //     ],
                              //     pricing: 'Starting at $29.9/month',
                              //     action: 'Upgrade to Pro'
                              //   });
                              //   setShowUpgradeModal(true);
                              // } else {
                              handleDropdownAction("interactions", qudemo);
                              // }
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-whiter flex items-center space-x-2 text-bodydark"
                          >
                            {/* COMMENTED OUT FOR TESTING - Always show ChartBar icon */}
                            {/* {!isPro ? <LockClosedIcon className="w-4 h-4" /> : <ChartBarIcon className="w-4 h-4" />} */}
                            <ChartBarIcon className="w-4 h-4" />
                            <span>View Interactions</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // COMMENTED OUT FOR TESTING - Allow free users to share
                              // if (!isPro) {
                              //   setErrorDetails({
                              //     title: 'Share functionality requires Pro plan',
                              //     message: 'Upgrade to Pro to generate shareable links for your Qudemos.',
                              //     features: [
                              //       { title: 'Public Sharing', description: 'Generate shareable links for your Qudemos', icon: '🔗' },
                              //       { title: 'Advanced Analytics', description: 'Track views and engagement', icon: '📊' }
                              //     ],
                              //     pricing: 'Starting at $29.9/month',
                              //     action: 'Upgrade to Pro'
                              //   });
                              //   setShowUpgradeModal(true);
                              // } else {
                              handleDropdownAction("share", qudemo);
                              // }
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-whiter flex items-center space-x-2 text-bodydark"
                          >
                            <ShareIcon className="w-4 h-4" />
                            {/* COMMENTED OUT FOR TESTING - No lock icon shown */}
                            {/* {!isPro && <LockClosedIcon className="w-3 h-3" />} */}
                            <span>Share</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDropdownAction("generate-widget", qudemo);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-whiter flex items-center space-x-2 text-purple-600"
                          >
                            <CodeBracketIcon className="w-4 h-4" />
                            <span>Generate Widget</span>
                          </button>
                          <hr className="my-0" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDropdownAction("delete", qudemo);
                            }}
                            disabled={deletingQudemoId === qudemo.id}
                            className={`w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2 ${
                              deletingQudemoId === qudemo.id
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {deletingQudemoId === qudemo.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <TrashIcon className="w-4 h-4" />
                            )}
                            <span>
                              {deletingQudemoId === qudemo.id
                                ? "Deleting..."
                                : "Delete"}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Action Buttons */}
                {qudemo.isDemo ? (
                  <div className="mt-6 space-y-2">
                    {/* Preview Button for Demo Qudemo */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewingQudemo(qudemo);
                      }}
                      className="w-full flex items-center justify-center space-x-2 transition-colors duration-200 px-4 py-3 rounded-lg border text-primary hover:text-primary hover:bg-primary/10 border-primary/30"
                    >
                      <PlayIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Preview Qudemo
                      </span>
                    </button>
                    {/* Share Button for Demo Qudemo */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareQudemo(qudemo);
                      }}
                      className="w-full flex items-center justify-center space-x-2 transition-colors duration-200 px-4 py-3 rounded-lg border text-green-600 hover:text-green-800 hover:bg-green-50 border-green-200"
                    >
                      <ShareIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Share Qudemo</span>
                    </button>
                  </div>
                ) : (
                  <div className="mb-3 space-y-2">
                    {/* View Interactions Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // COMMENTED OUT FOR TESTING - Allow free users to view interactions
                        // if (!isPro) {
                        //   setErrorDetails({
                        //     title: 'View Interactions requires Pro plan',
                        //     message: 'Upgrade to Pro to view detailed interaction analytics for your Qudemos.',
                        //     features: [
                        //       { title: 'Advanced Analytics', description: 'Track views and engagement', icon: '📊' },
                        //       { title: 'Public Sharing', description: 'Generate shareable links for your QuDemos', icon: '🔗' }
                        //     ],
                        //     pricing: 'Starting at $29.9/month',
                        //     action: 'Upgrade to Pro'
                        //   });
                        //   setShowUpgradeModal(true);
                        // } else {
                        handleViewQudemoInteractions(qudemo);
                        // }
                      }}
                      className="w-full flex items-center justify-center space-x-2 transition-colors duration-200 px-4 py-3 rounded-lg border text-primary hover:text-primary hover:bg-primary/10 border-primary/30"
                    >
                      {/* COMMENTED OUT FOR TESTING - Always show Eye icon */}
                      {/* {!isPro ? <LockClosedIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />} */}
                      <EyeIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        View Interactions
                      </span>
                    </button>
                    {/* Share Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // COMMENTED OUT FOR TESTING - Allow free users to share
                        // if (!isPro) {
                        //   setErrorDetails({
                        //     title: 'Share functionality requires Pro plan',
                        //     message: 'Upgrade to Pro to generate shareable links for your Qudemos.',
                        //     features: [
                        //       { title: 'Public Sharing', description: 'Generate shareable links for your QuDemos', icon: '🔗' },
                        //       { title: 'Advanced Analytics', description: 'Track views and engagement', icon: '📊' }
                        //     ],
                        //     pricing: 'Starting at $29.9/month',
                        //     action: 'Upgrade to Pro'
                        //   });
                        //   setShowUpgradeModal(true);
                        // } else {
                        handleDropdownAction("share", qudemo);
                        // }
                      }}
                      className="w-full flex items-center justify-center space-x-2 transition-colors duration-200 h-12 px-3 rounded-lg border text-green-600 hover:text-green-800 hover:bg-green-50 border-green-200"
                    >
                      {/* COMMENTED OUT FOR TESTING - Always show Share icon */}
                      {/* {!isPro ? <LockClosedIcon className="w-4 h-4" /> : <ShareIcon className="w-4 h-4" />} */}
                      <ShareIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Share Qudemo</span>
                    </button>
                  </div>
                )}
                {/* Stats - Hide for demo Qudemos */}
                {!qudemo.isDemo && (
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      {/* Video count - keep as is */}
                      <div className="flex items-center space-x-1">
                        <VideoCameraIcon className="w-4 h-4" />
                        <span>{qudemo.video_count || 0}</span>
                      </div>
                      {/* Document icon - only show if documents were processed */}
                      {qudemo.document_count > 0 && (
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-4 h-4" />
                        </div>
                      )}
                      {/* Website icon - only show if websites were processed */}
                      {qudemo.website_count > 0 && (
                        <div className="flex items-center">
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
                              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{getRelativeTime(qudemo.created_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Qudemo Preview Modal */}
      {previewingQudemo && (
        <QudemoPreview
          qudemo={previewingQudemo}
          onClose={() => setPreviewingQudemo(null)}
        />
      )}
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border max-w-2xl w-full mx-4">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setShowShareOptionsModal(true);
                  }}
                  className="text-bodydark2 hover:text-bodydark"
                  title="Back"
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-graydark text-left flex-1 ml-3">
                  Share Qudemo
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-bodydark2 hover:text-bodydark"
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
              <div className="mb-6">
                <p className="text-sm text-bodydark mb-2 text-left">
                  Share this Qudemo with anyone using the link below:
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-strokedark/20 rounded-lg text-sm bg-whiter"
                  />
                  <button
                    onClick={copyShareLink}
                    className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
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
                    Copy
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-primary">
                  <strong>Note:</strong> This link is public and can be accessed
                  by anyone without authentication. The shared page will show
                  your company name and the Qudemo content.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setShowShareOptionsModal(true);
                  }}
                  className="px-6 py-2 bg-white text-bodydark border border-strokedark/20 rounded-lg hover:bg-whiter font-medium"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Share Options Modal */}
      {showShareOptionsModal && qudemoToShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="relative mb-4">
                <h3 className="text-lg font-semibold text-graydark text-center">
                  Share Qudemo
                </h3>
                <button
                  onClick={() => setShowShareOptionsModal(false)}
                  className="absolute right-0 top-0 text-bodydark2 hover:text-bodydark"
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
              <div className="mb-6">
                <p className="text-sm text-bodydark mb-6 text-center">
                  Choose how you'd like to share{" "}
                  <strong>"{qudemoToShare.title}"</strong>
                </p>
                <div className="space-y-4">
                  {/* Single Link Option */}
                  <button
                    onClick={() => handleShareOption("single")}
                    className="w-full p-6 border border-strokedark/10 rounded-lg hover:border-blue-300 hover:bg-primary/10 transition-colors"
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-3 mb-3">
                        <svg
                          className="w-6 h-6 text-primary"
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
                        <h4 className="font-medium text-graydark text-lg">
                          Single Link
                        </h4>
                      </div>
                      <p className="text-sm text-bodydark">
                        Generate one shareable link that can be used by anyone
                      </p>
                    </div>
                  </button>
                  {/* Unique Links Option */}
                  <button
                    onClick={() => handleShareOption("unique")}
                    className="w-full p-6 border border-strokedark/10 rounded-lg hover:border-blue-300 hover:bg-primary/10 transition-colors"
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-3 mb-3">
                        <svg
                          className="w-6 h-6 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <h4 className="font-medium text-graydark text-lg">
                          Unique Links
                        </h4>
                      </div>
                      <p className="text-sm text-bodydark">
                        Generate personalized links for specific customers with
                        tracking
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Generate Unique Links Modal */}
      {showUniqueLinksModal && qudemoToShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="relative mb-4">
                <h3 className="text-lg font-semibold text-graydark text-left">
                  Generate Unique Links
                </h3>
                <button
                  onClick={() => setShowUniqueLinksModal(false)}
                  className="absolute right-0 top-0 text-bodydark2 hover:text-bodydark"
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
              <div className="mb-6">
                <p className="text-sm text-bodydark mb-6 text-left">
                  Choose how you'd like to create unique customer links
                </p>
                <div className="space-y-4">
                  {/* Few Unique Links Option */}
                  <button
                    onClick={() => handleUniqueLinksOption("few")}
                    className="w-full p-6 border border-strokedark/10 rounded-lg hover:border-blue-300 hover:bg-primary/10 transition-colors"
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-3 mb-3">
                        <svg
                          className="w-6 h-6 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <h4 className="font-medium text-graydark text-lg">
                          Few Unique Links
                        </h4>
                      </div>
                      <p className="text-sm text-bodydark">
                        Manually add customer details for a few personalized
                        links
                      </p>
                    </div>
                  </button>
                  {/* Bulk Unique Links Option */}
                  <button
                    onClick={() => handleUniqueLinksOption("bulk")}
                    className="w-full p-6 border border-strokedark/10 rounded-lg hover:border-blue-300 hover:bg-primary/10 transition-colors"
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-3 mb-3">
                        <svg
                          className="w-6 h-6 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <h4 className="font-medium text-graydark text-lg">
                          Bulk Unique Links
                        </h4>
                      </div>
                      <p className="text-sm text-bodydark">
                        Upload a CSV file with customer data to generate
                        multiple links
                      </p>
                    </div>
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowUniqueLinksModal(false);
                    setShowShareOptionsModal(true);
                  }}
                  className="px-4 py-2 text-bodydark hover:text-gray-800"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Upload Modal */}
      {showBulkUploadModal && qudemoToShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border max-w-4xl w-full mx-4">
            <div className="p-6">
              <div className="relative mb-4">
                <h3 className="text-lg font-semibold text-graydark text-left">
                  Bulk Generate Unique Links
                </h3>
                <button
                  onClick={handleBulkUploadModalClose}
                  className="absolute right-0 top-0 text-bodydark2 hover:text-bodydark"
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
              <div className="mb-6">
                <p className="text-sm text-bodydark mb-6 text-left">
                  Upload customer data in CSV or Excel format to generate
                  multiple personalized links. The system will create a "Shared
                  Qudemo" column with the generated links.
                </p>
                <div className="space-y-4">
                  {/* Upload CSV File Section */}
                  <div>
                    <h4 className="font-medium text-graydark mb-3 text-left">
                      Upload File (CSV/XLSX)
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-input"
                        key={selectedFile ? "file-selected" : "no-file"}
                      />
                      <label
                        htmlFor="file-input"
                        className="flex items-center justify-center space-x-2 w-full p-4 border-2 border-dashed border-strokedark/20 rounded-lg hover:border-blue-400 hover:bg-primary/10 cursor-pointer transition-colors"
                      >
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
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="text-primary font-medium">
                          {selectedFile
                            ? "Change File"
                            : "Choose File (CSV/XLSX)"}
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 text-left">
                        Upload a CSV or Excel file with customer data (SL No,
                        name, email, company)
                      </p>
                      {selectedFile && (
                        <div className="flex items-center justify-center space-x-3">
                          <p className="text-sm text-green-600">
                            ✓ Selected: {selectedFile.name}
                          </p>
                          <button
                            onClick={removeSelectedFile}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* File Format Example */}
                  <div>
                    <h4 className="font-medium text-graydark mb-3 text-left">
                      File Format Example (CSV/Excel):
                    </h4>
                    <div className="bg-whiten p-3 rounded-lg overflow-x-auto">
                      <table className="w-full text-xs text-primary border-collapse">
                        <thead>
                          <tr className="border-b border-strokedark/20">
                            <th className="text-center h-12 px-3 text-sm font-bold border-r border-strokedark/20">
                              SL No
                            </th>
                            <th className="text-center h-12 px-3 text-sm font-bold border-r border-strokedark/20">
                              name
                            </th>
                            <th className="text-center h-12 px-3 text-sm font-bold border-r border-strokedark/20">
                              email
                            </th>
                            <th className="text-center h-12 px-3 text-sm font-bold">
                              company
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="h-12 px-3 border-r border-strokedark/20">
                              1
                            </td>
                            <td className="h-12 px-3 border-r border-strokedark/20">
                              John Doe
                            </td>
                            <td className="h-12 px-3 border-r border-strokedark/20">
                              john@example.com
                            </td>
                            <td className="h-12 px-3">Acme Inc</td>
                          </tr>
                          <tr>
                            <td className="h-12 px-3 border-r border-strokedark/20">
                              2
                            </td>
                            <td className="h-12 px-3 border-r border-strokedark/20">
                              Jane Smith
                            </td>
                            <td className="h-12 px-3 border-r border-strokedark/20">
                              jane@example.com
                            </td>
                            <td className="h-12 px-3">Tech Corp</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setShowShareOptionsModal(true);
                  }}
                  className="px-4 py-2 text-bodydark hover:text-gray-800 border border-strokedark/20 rounded-lg hover:bg-whiter transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!selectedFile}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedFile
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Generate Links
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Generate Few Unique Links Modal */}
      {showFewUniqueLinksModal && qudemoToShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border max-w-4xl w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    setShowFewUniqueLinksModal(false);
                    setShowUniqueLinksModal(true);
                  }}
                  className="text-bodydark2 hover:text-bodydark"
                  title="Back"
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-graydark text-left flex-1 ml-3">
                  Generate Few Unique Links
                </h3>
                <button
                  onClick={() => setShowFewUniqueLinksModal(false)}
                  className="text-bodydark2 hover:text-bodydark"
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
              <div className="mb-6">
                <p className="text-sm text-bodydark mb-6 text-left">
                  Add customer details to generate personalized tracking links.
                </p>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {/* Customer Input Fields */}
                  {customers.map((customer, index) => (
                    <div
                      key={index}
                      className="border border-strokedark/10 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-graydark">
                          Customer {index + 1}
                        </h4>
                        {customers.length > 1 && (
                          <button
                            onClick={() => removeCustomer(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-bodydark mb-1 text-left">
                            Customer Name *
                          </label>
                          <input
                            type="text"
                            value={customer.name}
                            onChange={(e) =>
                              handleCustomerChange(
                                index,
                                "name",
                                e.target.value,
                              )
                            }
                            placeholder="John Doe"
                            className="w-full px-3 py-2 border border-strokedark/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-bodydark mb-1 text-left">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={customer.email}
                            onChange={(e) =>
                              handleCustomerChange(
                                index,
                                "email",
                                e.target.value,
                              )
                            }
                            placeholder="john@example.com"
                            className="w-full px-3 py-2 border border-strokedark/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-bodydark mb-1 text-left">
                            Company
                          </label>
                          <input
                            type="text"
                            value={customer.company}
                            onChange={(e) =>
                              handleCustomerChange(
                                index,
                                "company",
                                e.target.value,
                              )
                            }
                            placeholder="Acme Inc"
                            className="w-full px-3 py-2 border border-strokedark/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Add Another Customer Button */}
                  <button
                    onClick={addAnotherCustomer}
                    disabled={customers.length >= 5}
                    className={`w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed rounded-lg transition-colors ${
                      customers.length >= 5
                        ? "border-strokedark/10 bg-whiter cursor-not-allowed opacity-50"
                        : "border-strokedark/20 hover:border-blue-400 hover:bg-primary/10"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${customers.length >= 5 ? "text-bodydark2" : "text-primary"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span
                      className={`font-medium ${customers.length >= 5 ? "text-bodydark2" : "text-primary"}`}
                    >
                      {customers.length >= 5
                        ? "+ Maximum 5 Customers Reached"
                        : "+ Add Another Customer"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setShowFewUniqueLinksModal(false);
                    setShowShareOptionsModal(true);
                  }}
                  className="px-4 py-2 text-bodydark hover:text-gray-800 border border-strokedark/20 rounded-lg hover:bg-whiter transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerateFewLinks}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Generate Links
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Generated Links Results Modal */}
      {showGeneratedLinksModal && generatedLinks.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-graydark text-left flex-1">
                  Generated Links
                </h3>
                <button
                  onClick={() => setShowGeneratedLinksModal(false)}
                  className="text-bodydark2 hover:text-bodydark"
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
              <div className="mb-6">
                <p className="text-sm text-bodydark mb-6 text-left">
                  Successfully generated {generatedLinks.length} unique tracking
                  links for "{qudemoToShare?.title}".
                </p>
                <div className="space-y-4">
                  {generatedLinks.map((link, index) => (
                    <div
                      key={index}
                      className="border border-strokedark/10 rounded-lg p-4"
                    >
                      <div className="mb-3 text-left">
                        <div className="flex items-center gap-3 text-sm text-bodydark">
                          <div className="flex items-center gap-1.5">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="font-medium">{link.name}</span>
                          </div>
                          <span className="text-bodydark2">•</span>
                          <div className="flex items-center gap-1.5">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{link.email}</span>
                          </div>
                          {link.company && (
                            <>
                              <span className="text-bodydark2">•</span>
                              <div className="flex items-center gap-1.5">
                                <svg
                                  className="w-4 h-4 text-gray-500"
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
                                <span>{link.company}</span>
                              </div>
                            </>
                          )}
                          <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Link #{index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={link.shareUrl}
                          readOnly
                          className="flex-1 px-3 py-2 border border-strokedark/20 rounded-lg text-sm bg-whiter text-center"
                        />
                        <button
                          onClick={() => copyLinkToClipboard(link.shareUrl)}
                          className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm"
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
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-left flex-1">
                      <h4 className="text-sm font-medium text-primary mb-2">
                        Important Notes:
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li className="flex items-start">
                          <span className="mr-2 flex-shrink-0">•</span>
                          <span>
                            Each link is unique and tracks individual customer
                            interactions
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 flex-shrink-0">•</span>
                          <span>
                            Links can be accessed by anyone without
                            authentication
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 flex-shrink-0">•</span>
                          <span>
                            Customer details are stored for analytics and
                            tracking
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 flex-shrink-0">•</span>
                          <span>
                            You can view analytics for each link in the
                            Analytics page
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowGeneratedLinksModal(false)}
                    className="px-6 py-2 border border-strokedark/20 text-bodydark rounded-lg hover:text-graydark hover:border-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && qudemoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-graydark">
                  Delete Qudemo
                </h3>
                <button
                  onClick={handleCancelDelete}
                  className="text-bodydark2 hover:text-bodydark"
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
              <div className="mb-6">
                <p className="text-sm text-bodydark mb-4 text-left">
                  Are you sure you want to delete{" "}
                  <strong>"{qudemoToDelete.title}"</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 text-left">
                      <h4 className="text-sm font-medium text-red-800">
                        This action will permanently delete:
                      </h4>
                      <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1 text-left">
                        <li>All shared Qudemo and their links</li>
                        <li>All knowledge sources</li>
                        <li>All analytics data</li>
                      </ul>
                      <p className="mt-2 text-sm font-medium text-red-800 text-left">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-bodydark bg-whiten hover:bg-bodydark1 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors duration-200"
                >
                  Delete Qudemo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Upgrade Modal */}
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
                {errorDetails?.title || "Upgrade Required"}
              </h3>
            </div>

            <p className="text-bodydark mb-6 text-left">
              {errorDetails?.message ||
                "Upgrade to Pro to access premium features including share functionality and advanced analytics."}
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setErrorDetails(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-bodydark bg-whiten hover:bg-bodydark1 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowUpgradeModal(false);
                  setErrorDetails(null);
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
                      showError(
                        `Failed to start checkout: ${data.error || "Unknown error"}`,
                      );
                    }
                  } catch (error) {
                    showError(`Failed to start checkout: ${error.message}`);
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
      {/* Download Generated File Modal */}
      {showDownloadModal && downloadData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border max-w-md w-full mx-4">
            <div className="p-6">
              <div className="text-left mb-6">
                <div className="flex items-center justify-start h-10 w-10 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-6 w-6 text-green-600 ml-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-graydark mb-2 text-left">
                  Bulk Links Generated Successfully!
                </h3>
                <p className="text-sm text-bodydark mb-4 text-left">
                  Successfully generated <strong>{downloadData.length}</strong>{" "}
                  unique share links for "{qudemoToShare?.title}".
                </p>
                <p className="text-sm text-bodydark text-left">
                  Download the CSV file with all generated links and client
                  information.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-primary mt-0.5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-primary text-left">
                    <p className="font-medium mb-1">File includes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>SL No, Client Name, Email, Company</li>
                      <li>Generated Share Links</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex justify-start space-x-3">
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="px-4 py-2 border border-strokedark/20 text-bodydark rounded-lg hover:bg-whiter transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadFile}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download Excel File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* People List Modal */}
      {showPeopleListModal && qudemoPeople.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-strokedark/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-graydark">
                    QuDemo Interactions
                  </h3>
                  <p className="text-sm text-gray-500">
                    {qudemoPeople[0]?.qudemo_title} - {qudemoPeople.length}{" "}
                    people have interacted
                  </p>
                </div>
                <button
                  onClick={() => setShowPeopleListModal(false)}
                  className="text-bodydark2 hover:text-bodydark transition-colors"
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
            {/* People List */}
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-3">
                {qudemoPeople.map((person, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-whiter rounded-lg hover:bg-whiten transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(person)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {person.client_name
                          ? person.client_name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <div>
                        <h4 className="font-medium text-graydark">
                          {person.client_name || "Anonymous User"}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {person.client_company ||
                            person.client_email ||
                            "No company info"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-bodydark">
                      <div className="text-center">
                        <p className="font-medium">{person.question_count}</p>
                        <p className="text-xs">Questions</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">
                          {formatDuration(person.total_duration)}
                        </p>
                        <p className="text-xs">Time Spent</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{person.access_count}</p>
                        <p className="text-xs">Views</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {person.last_accessed_at
                            ? new Date(
                                person.last_accessed_at,
                              ).toLocaleDateString()
                            : "Never"}
                        </p>
                        <p className="text-xs text-gray-500">Last Active</p>
                      </div>
                      <button className="px-3 py-1 bg-white border border-blue-600 text-primary text-xs rounded-md hover:bg-primary hover:text-white transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Interaction Details Modal */}
      {showDetailsModal && selectedInteraction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border max-w-4xl w-full mx-4 max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-strokedark/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowInteractionsListModal(true);
                    }}
                    className="text-bodydark2 hover:text-bodydark transition-colors mr-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <div className="w-12 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                    {selectedInteraction.client_name
                      ? selectedInteraction.client_name.charAt(0).toUpperCase()
                      : "I"}
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-graydark text-left">
                      {selectedInteraction.client_name ||
                        "Interactions Overview"}
                    </h3>
                    {/* User Details Section */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-bodydark">
                      {selectedInteraction.client_email && (
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-4 h-4 text-bodydark2"
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
                            className="w-4 h-4 text-bodydark2"
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
                      {selectedInteraction.last_interaction && (
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-4 h-4 text-bodydark2"
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
                            Last interaction:{" "}
                            {new Date(
                              selectedInteraction.last_interaction,
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              selectedInteraction.last_interaction,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowInteractionsListModal(true);
                  }}
                  className="text-bodydark2 hover:text-bodydark transition-colors"
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
            {/* Modal Content */}
            <div className="flex-1 overflow-hidden">
              {/* Tabs */}
              <div className="bg-whiten p-1.5">
                <nav className="flex gap-1.5">
                  <button
                    onClick={() => handleTabClick("overview")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "overview"
                        ? "bg-white text-graydark shadow-sm"
                        : "bg-transparent text-bodydark hover:text-graydark"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => handleTabClick("questions")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "questions"
                        ? "bg-white text-graydark shadow-sm"
                        : "bg-transparent text-bodydark hover:text-graydark"
                    }`}
                  >
                    Questions asked
                  </button>
                  <button
                    onClick={() => handleTabClick("past-interactions")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "past-interactions"
                        ? "bg-white text-graydark shadow-sm"
                        : "bg-transparent text-bodydark hover:text-graydark"
                    }`}
                  >
                    Past interactions
                  </button>
                </nav>
              </div>
              {/* Tab Content */}
              <div className="p-6 overflow-y-auto max-h-96">
                {activeTab === "overview" && (
                  <div className="min-h-96">
                    {/* AI Insight Summary - HIDDEN */}
                    {/* <div className="border border-primary/30 rounded-lg p-4 bg-blue-50 mb-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="font-medium text-blue-900">AI Insight Summary</span>
                      </div>
                      {loadingAiSummary ? (
                        <div className="flex items-center space-x-2 text-blue-700">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Analyzing customer questions...</span>
                    </div>
                      ) : (
                        <p className="text-primary leading-relaxed">
                          {aiInsightSummary || 'Generating AI insight summary...'}
                        </p>
                      )}
                    </div> */}
                    {/* Interaction Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* Demo Watched */}
                      <div className="bg-white border border-strokedark/10 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className="text-sm font-medium text-bodydark text-left">
                              Demo Watched
                            </p>
                            <p className="text-lg font-semibold text-graydark text-left">
                              {selectedInteraction.qudemo_title ||
                                "Unknown Demo"}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
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
                                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Time Spent */}
                      <div className="bg-white border border-strokedark/10 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className="text-sm font-medium text-bodydark text-left">
                              Time Spent
                            </p>
                            <p className="text-lg font-semibold text-graydark text-left">
                              {formatDuration(
                                selectedInteraction.total_duration,
                              )}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
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
                          </div>
                        </div>
                      </div>
                      {/* Questions Asked */}
                      <div className="bg-white border border-strokedark/10 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className="text-sm font-medium text-bodydark text-left">
                              Questions Asked
                            </p>
                            <p className="text-lg font-semibold text-graydark text-left">
                              {selectedInteraction.question_count || 0}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
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
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Unique Link Details */}
                    <div className="border border-primary/30 rounded-lg p-4 bg-blue-50">
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
                          <span className="text-sm text-primary font-medium">
                            Link Type:
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                            Unique Customer Link
                          </span>
                        </div>
                        <div className="flex items-start space-x-2 text-left">
                          <span className="text-sm text-primary font-medium whitespace-nowrap">
                            URL:
                          </span>
                          <code className="flex-1 bg-white border border-primary/30 rounded px-2 py-1 text-sm text-blue-900 text-left break-all">
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
                        selectedInteraction.questions.map((qa, index) => {
                          return (
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
                                    Asked during session
                                  </p>
                                </div>
                              </div>
                              {/* Answer */}
                              <div className="flex items-start space-x-3 bg-white rounded-lg p-3">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-bodydark text-xs font-medium">
                                    AI
                                  </div>
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="text-sm text-bodydark whitespace-pre-wrap text-left">
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
                                        Video timestamp:{" "}
                                        {qa.formatted_timestamp}
                                        {qa.start_timestamp && (
                                          <span className="text-gray-500 ml-1">
                                            (
                                            {Math.floor(
                                              qa.start_timestamp / 60,
                                            )}
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
                          );
                        })
                      ) : (
                        <div className="text-center py-8">
                          <svg
                            className="mx-auto h-10 w-10 text-bodydark2"
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
                    <h4 className="font-medium text-graydark mb-4">
                      Past Interactions History
                    </h4>
                    <div className="bg-white rounded-lg border border-strokedark/10 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-whiter">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-bold text-bodydark tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-bodydark tracking-wider">
                              Demo
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-bodydark tracking-wider">
                              Questions
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-bold text-bodydark tracking-wider">
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
      {/* Interactions List Modal */}
      {showInteractionsListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">P</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-graydark text-left">
                      Product Overview - Customer Interactions
                    </h3>
                    <p className="text-bodydark mt-1 text-left">
                      View detailed buyer interactions with this QuDemo
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInteractionsListModal(false)}
                  className="text-bodydark2 hover:text-bodydark"
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
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white border border-strokedark/10 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-500 text-left">
                        Total Interactions
                      </p>
                      <p className="text-2xl font-semibold text-graydark text-left">
                        {filteredInteractions.length}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-strokedark/10 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-500 text-left">
                        Total Questions
                      </p>
                      <p className="text-2xl font-semibold text-graydark text-left">
                        {filteredInteractions.reduce(
                          (total, interaction) =>
                            total +
                            (interaction.questions
                              ? interaction.questions.length
                              : 0),
                          0,
                        )}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
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
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-strokedark/10 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-500 text-left">
                        Avg. Time Spent
                      </p>
                      <p className="text-2xl font-semibold text-graydark text-left">
                        {filteredInteractions.length > 0
                          ? formatDuration(
                              Math.floor(
                                filteredInteractions.reduce(
                                  (total, interaction) =>
                                    total + (interaction.total_duration || 0),
                                  0,
                                ) / filteredInteractions.length,
                              ),
                            )
                          : "0:00"}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-bodydark2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-strokedark/20 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              {/* Interactions Table */}
              <div className="bg-white border border-strokedark/10 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-whiter">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-bold text-bodydark tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-bold text-bodydark tracking-wider">
                          <div className="flex justify-center">
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
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-bold text-bodydark tracking-wider">
                          <div className="flex justify-center">
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-bodydark tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredInteractions.length > 0 ? (
                        filteredInteractions.map((interaction, index) => (
                          <tr key={index} className="hover:bg-whiter">
                            <td className="px-6 py-4 whitespace-nowrap text-left">
                              <div>
                                <div className="text-sm font-medium text-graydark">
                                  {interaction.client_name ||
                                    "Unknown Customer"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {interaction.client_company || "No company"}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="text-sm text-graydark">
                                {interaction.questions
                                  ? interaction.questions.length
                                  : 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="text-sm text-graydark">
                                {interaction.total_duration
                                  ? formatDuration(interaction.total_duration)
                                  : "0:00"}
                              </span>
                            </td>
                            <td className="pl-6 pr-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                              <button
                                onClick={() => handleViewDetails(interaction)}
                                className="inline-flex items-center px-3 py-1 border border-strokedark/20 text-sm font-medium rounded text-bodydark bg-white hover:bg-whiter focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center">
                            <svg
                              className="mx-auto h-10 w-10 text-bodydark2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-graydark">
                              {searchTerm
                                ? "No matching interactions found"
                                : "No interactions found"}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {searchTerm
                                ? `No interactions match "${searchTerm}". Try a different search term.`
                                : "This QuDemo hasn't been shared with any customers yet."}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Loading Interactions Modal */}
      {loadingInteractions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border max-w-sm w-full mx-4 p-6">
            <div className="flex flex-col items-center space-y-4">
              {/* Spinner */}
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              {/* Loading Text */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-graydark mb-2">
                  Loading Interactions
                </h3>
                <p className="text-sm text-gray-500">
                  Please wait while we fetch the interaction data...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Widget Generator Modal */}
      <WidgetGeneratorModal
        isOpen={showWidgetGeneratorModal}
        onClose={() => {
          setShowWidgetGeneratorModal(false);
          setSelectedQudemoForWidget(null);
          setWidgetData(null);
        }}
        widgetData={widgetData}
        qudemo={selectedQudemoForWidget}
      />
    </div>
  );
};
export default Qudemos;
