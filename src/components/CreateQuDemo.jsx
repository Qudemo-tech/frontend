import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useCompany } from "../context/CompanyContext";
import { getNodeApiUrl, getApiUrl } from "../config/api";
import { useNavigate } from "react-router-dom";
import DocumentUpload from "./DocumentUpload";
import { CircleCheck, Info } from "lucide-react";
const CreateQuDemo = () => {
  const { company, isLoading } = useCompany();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [videoUrls, setVideoUrls] = useState([""]);
  const [websiteUrls, setWebsiteUrls] = useState([""]);
  const [sources, setSources] = useState([""]);
  const [calendlyLink, setCalendlyLink] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0); // Track last submission time
  const [urlValidationErrors, setUrlValidationErrors] = useState({}); // Track validation errors for each URL
  const [documents, setDocuments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [createdQudemoId, setCreatedQudemoId] = useState(null);
  // Error popup state
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorPopupData, setErrorPopupData] = useState(null);

  // Avatar video feature states
  const [presenterPhoto, setPresenterPhoto] = useState(null);
  const [presenterPhotoPreview, setPresenterPhotoPreview] = useState(null);
  const [presenterName, setPresenterName] = useState("");

  // Voice selection states
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(null);
  const [visibleVoiceRows, setVisibleVoiceRows] = useState(3); // Show 3 rows initially (9 voices)
  const speechSynthesisRef = React.useRef(null);
  // Load browser voices for Web Speech API
  useEffect(() => {
    // Load voices immediately
    window.speechSynthesis.getVoices();

    // Also load on voiceschanged event (for browsers that load async)
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };

    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  // Fetch available voices from backend
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const pythonApiUrl = getApiUrl("python");
        const response = await fetch(`${pythonApiUrl}/heygen-voices`);
        const data = await response.json();
        if (data.success && data.voices) {
          setVoices(data.voices);
          // Set default voice (the custom one)
          const defaultVoice = data.voices.find((v) => v.is_default);
          if (defaultVoice) {
            setSelectedVoice(defaultVoice.id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch voices:", err);
      }
    };

    fetchVoices();
  }, []);

  // Handle error popup close and redirect
  const handleErrorPopupClose = () => {
    setShowErrorPopup(false);
    setErrorPopupData(null);
    // Reset form
    setTitle("");
    setVideoUrls([""]);
    setWebsiteUrls([""]);
    setSources([""]);
    setCalendlyLink("");
    setDocuments([]);
    setSelectedFiles([]);
    setCreatedQudemoId(null);
    setPresenterPhoto(null);
    setPresenterPhotoPreview(null);
    setPresenterName("");
    setSelectedVoice(null);
    setVisibleVoiceRows(3); // Reset to show 3 rows initially
    // Navigate to qudemos page after closing popup
    setTimeout(() => {
      navigate("/qudemos");
    }, 100);
  };

  // Handle presenter photo upload
  const handlePresenterPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPG, PNG, etc.)");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      setPresenterPhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPresenterPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  // Remove presenter photo
  const removePresenterPhoto = () => {
    setPresenterPhoto(null);
    setPresenterPhotoPreview(null);
  };

  // Handle voice preview (play audio)
  const handleVoicePreview = (voiceId) => {
    // If already playing this voice, stop it
    if (isPlayingVoice === voiceId) {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
        speechSynthesisRef.current = null;
      }
      setIsPlayingVoice(null);
      return;
    }

    // Stop any currently playing voice
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
    }

    // Find the voice data
    const voice = voices.find((v) => v.id === voiceId);
    if (!voice) return;

    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(voice.sample_text);

    // Configure voice characteristics based on gender
    const availableVoices = window.speechSynthesis.getVoices();
    let selectedBrowserVoice;

    if (voice.gender === "Female") {
      selectedBrowserVoice = availableVoices.find(
        (v) =>
          v.name.includes("Female") ||
          v.name.includes("Samantha") ||
          v.name.includes("Victoria"),
      );
    } else {
      selectedBrowserVoice = availableVoices.find(
        (v) =>
          v.name.includes("Male") ||
          v.name.includes("Daniel") ||
          v.name.includes("Alex"),
      );
    }

    if (selectedBrowserVoice) {
      utterance.voice = selectedBrowserVoice;
    }

    // Set rate and pitch from voice data
    utterance.rate = voice.rate || 1.0;
    utterance.pitch = voice.pitch || 1.0;

    // Handle speech events
    utterance.onstart = () => {
      setIsPlayingVoice(voiceId);
    };

    utterance.onend = () => {
      setIsPlayingVoice(null);
      speechSynthesisRef.current = null;
    };

    utterance.onerror = () => {
      setIsPlayingVoice(null);
      speechSynthesisRef.current = null;
      console.error("Error playing voice preview");
    };

    // Play the voice
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // const handleSourceChange = (index, value) => { // Not used
  //   const updated = [...sources];
  //   updated[index] = value;
  //   setSources(updated);
  // };
  // const addSourceField = () => { // Not used
  //   setSources([...sources, ""]);
  // };
  // const removeSourceField = (index) => { // Not used
  //   const updated = sources.filter((_, i) => i !== index);
  //   setSources(updated);
  // };
  const handleVideoUrlChange = (index, value) => {
    const updated = [...videoUrls];
    updated[index] = value;
    setVideoUrls(updated);
    // Real-time validation
    if (value.trim()) {
      const validation = validateVideoUrl(value);
      setUrlValidationErrors((prev) => ({
        ...prev,
        [index]: validation.isValid ? null : validation.error,
      }));
    } else {
      setUrlValidationErrors((prev) => ({
        ...prev,
        [index]: null,
      }));
    }
  };
  const handleWebsiteUrlChange = (index, value) => {
    const updated = [...websiteUrls];
    updated[index] = value;
    setWebsiteUrls(updated);
    // Real-time validation
    if (value.trim()) {
      const validation = validateWebsiteUrl(value);
      setUrlValidationErrors((prev) => ({
        ...prev,
        [`website_${index}`]: validation.isValid ? null : validation.error,
      }));
    } else {
      setUrlValidationErrors((prev) => ({
        ...prev,
        [`website_${index}`]: null,
      }));
    }
  };
  // Link validation function
  const validateVideoUrl = (url) => {
    if (!url || !url.trim()) {
      return { isValid: false, error: "Video URL is required" };
    }
    const trimmedUrl = url.trim();
    // Check if it's a valid URL format
    try {
      new URL(trimmedUrl);
    } catch {
      return { isValid: false, error: "Please enter a valid URL" };
    }
    // Check if it's YouTube
    if (trimmedUrl.includes("youtube.com") || trimmedUrl.includes("youtu.be")) {
      return { isValid: true, type: "youtube" };
    }
    // Check if it's Loom
    if (trimmedUrl.includes("loom.com")) {
      return { isValid: true, type: "loom" };
    }
    // If it's neither YouTube nor Loom
    return {
      isValid: false,
      error:
        "Only YouTube and Loom video links are supported. Please provide a valid YouTube or Loom URL.",
    };
  };
  // Website URL validation function
  const validateWebsiteUrl = (url) => {
    if (!url || !url.trim()) {
      return { isValid: false, error: "Website URL is required" };
    }
    const trimmedUrl = url.trim();
    // Check if it's a valid URL format
    try {
      new URL(trimmedUrl);
    } catch {
      return { isValid: false, error: "Please enter a valid URL" };
    }
    // Check if it's HTTP or HTTPS
    if (
      !trimmedUrl.startsWith("http://") &&
      !trimmedUrl.startsWith("https://")
    ) {
      return {
        isValid: false,
        error: "URL must start with http:// or https://",
      };
    }
    return { isValid: true, type: "website" };
  };

  // Calendly URL validation function
  const validateCalendlyUrl = (url) => {
    if (!url || !url.trim()) {
      return { isValid: true }; // Empty is valid since it's optional
    }

    const trimmedUrl = url.trim();

    // Check if it's a valid URL format
    try {
      new URL(trimmedUrl);
    } catch {
      return { isValid: false, error: "Please enter a valid Calendly URL" };
    }

    // Check if it's a Calendly URL
    if (!trimmedUrl.includes("calendly.com")) {
      return {
        isValid: false,
        error:
          "Please enter a valid Calendly URL (should contain calendly.com)",
      };
    }

    return { isValid: true };
  };

  // Check if all URLs are valid or if we have documents
  const areAllUrlsValid = () => {
    // If we have documents (uploaded) or selected files, we don't need videos or websites
    if (documents.length > 0 || selectedFiles.length > 0) {
      return true;
    }
    // Check if we have any valid content (videos or websites)
    const hasValidVideos = videoUrls.some(
      (url) => url.trim() && validateVideoUrl(url.trim()).isValid,
    );
    const hasValidWebsites = websiteUrls.some(
      (url) => url.trim() && validateWebsiteUrl(url.trim()).isValid,
    );
    if (!hasValidVideos && !hasValidWebsites) {
      return false;
    }
    // Check video URLs (only if they have content)
    const videoUrlsValid = videoUrls.every((url, index) => {
      if (!url.trim()) return true; // Empty URLs are valid (optional)
      const validation = validateVideoUrl(url);
      return validation.isValid;
    });
    // Check website URLs (only if they have content)
    const websiteUrlsValid = websiteUrls.every((url, index) => {
      if (!url.trim()) return true; // Empty URLs are valid (optional)
      const validation = validateWebsiteUrl(url);
      return validation.isValid;
    });

    // Check Calendly URL (optional but must be valid if provided)
    const calendlyUrlValid = validateCalendlyUrl(calendlyLink).isValid;

    const isValid = videoUrlsValid && websiteUrlsValid && calendlyUrlValid;
    return isValid;
  };
  const addVideoUrlField = () => {
    setVideoUrls([...videoUrls, ""]);
  };
  const removeVideoUrlField = (index) => {
    const updated = videoUrls.filter((_, i) => i !== index);
    setVideoUrls(updated);
    // Clean up validation errors for removed field
    setUrlValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      // Shift remaining errors down
      const shiftedErrors = {};
      Object.keys(newErrors).forEach((key) => {
        const keyIndex = parseInt(key);
        if (keyIndex > index) {
          shiftedErrors[keyIndex - 1] = newErrors[key];
        } else if (keyIndex < index) {
          shiftedErrors[keyIndex] = newErrors[key];
        }
      });
      return shiftedErrors;
    });
  };
  const addWebsiteUrlField = () => {
    setWebsiteUrls([...websiteUrls, ""]);
  };
  const removeWebsiteUrlField = (index) => {
    const updated = websiteUrls.filter((_, i) => i !== index);
    setWebsiteUrls(updated);
    // Clean up validation errors for removed field
    setUrlValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`website_${index}`];
      // Shift remaining errors down
      const shiftedErrors = {};
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith("website_")) {
          const keyIndex = parseInt(key.replace("website_", ""));
          if (keyIndex > index) {
            shiftedErrors[`website_${keyIndex - 1}`] = newErrors[key];
          } else if (keyIndex < index) {
            shiftedErrors[`website_${keyIndex}`] = newErrors[key];
          }
        } else {
          shiftedErrors[key] = newErrors[key];
        }
      });
      return shiftedErrors;
    });
  };
  // Progress tracking functions - COMMENTED OUT (not used)
  // const startProgressTracking = (taskId) => {
  //   setCurrentTaskId(taskId);
  //   setScrapingProgress({
  //     status: "starting",
  //     progress: { current: 0, total: 0, percentage: 0 },
  //     stats: { urls_scraped: 0, urls_skipped: 0 }
  //   });
  //   // Poll for progress updates every 5 seconds
  //   const interval = setInterval(async () => {
  //     try {
  //       const response = await fetch(getNodeApiUrl(`/scraping-progress/${taskId}`));
  //       if (response.ok) {
  //         const data = await response.json();
  //         if (data.success) {
  //           setScrapingProgress(data.data);
  //           // Stop tracking if completed or failed
  //           if (data.data.status === 'completed' || data.data.status === 'failed') {
  //             stopProgressTracking();
  //           }
  //         }
  //       }
  //     } catch (err) {
  //
  //     }
  //   }, 5000);
  //   setProgressInterval(interval);
  // };
  // const stopProgressTracking = () => {
  //   if (progressInterval) {
  //     clearInterval(progressInterval);
  //     setProgressInterval(null);
  //   }
  //   setCurrentTaskId(null);
  //   setScrapingProgress(null);
  // };
  // const fetchKnowledgeSources = async () => { // Not used
  //   try {
  //     const token = localStorage.getItem('accessToken');
  //     const response = await fetch(getNodeApiUrl(`/api/knowledge/sources/${company.name}`), {
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       }
  //     });
  //     if (response.ok) {
  //       const data = await response.json();
  //       setKnowledgeSources(data.data || []);
  //       // Check if any sources are still processing
  //       const processingSources = data.data?.filter(source => source.status === 'processing') || [];
  //       if (processingSources.length > 0) {
  //         setSuccess(`⏳ ${processingSources.length} knowledge source(s) still processing... Please wait.`);
  //       }
  //     }
  //   } catch (err) {
  //
  //   }
  // };
  // Load knowledge sources on component mount - COMMENTED OUT (not used)
  // React.useEffect(() => {
  //   if (company) {
  //     fetchKnowledgeSources();
  //   }
  // }, [company]);
  // Add video URL validation (Loom, Vimeo, and YouTube) - COMMENTED OUT (not used)
  // const validateVideoUrl = (url) => {
  //   if (!url || !url.trim()) {
  //     return { isValid: false, error: "Video URL is required" };
  //   }
  //   if (!url.startsWith('http')) {
  //     return { isValid: false, error: "Please provide a valid URL starting with http" };
  //   }
  //   const isLoomVideo = url.includes('loom.com');
  //   const isVimeoVideo = url.includes('vimeo.com');
  //   const isYouTubeVideo = url.includes('youtube.com') || url.includes('youtu.be');
  //   if (!isLoomVideo && !isVimeoVideo && !isYouTubeVideo) {
  //     return { isValid: false, error: "Only Loom, Vimeo, and YouTube video URLs are supported" };
  //   }
  //   return { isValid: true, error: null };
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    // Prevent rapid submissions
    const now = Date.now();
    if (now - lastSubmissionTime < 2000) {
      setError("Please wait a moment before submitting again.");
      return;
    }
    setLastSubmissionTime(now);
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      // Validate required fields
      if (!company || !company.id) {
        setError(
          "Company information is required. Please refresh the page and try again.",
        );
        return;
      }
      // Validate video URLs and website URLs
      const validVideoUrls = videoUrls.filter((url) => url.trim());
      const validWebsiteUrls = websiteUrls.filter((url) => url.trim());
      // Check if we have either videos, websites, or documents/files
      const hasDocuments = documents.length > 0;
      const hasSelectedFiles = selectedFiles.length > 0;
      if (
        validVideoUrls.length === 0 &&
        validWebsiteUrls.length === 0 &&
        !hasDocuments &&
        !hasSelectedFiles
      ) {
        setError(
          "Please provide at least one video URL, website URL, or upload documents to create a QuDemo.",
        );
        return;
      }
      // Validate each video URL
      for (let i = 0; i < validVideoUrls.length; i++) {
        const validation = validateVideoUrl(validVideoUrls[i]);
        if (!validation.isValid) {
          setError(`Video ${i + 1}: ${validation.error}`);
          return;
        }
      }
      // Validate each website URL
      for (let i = 0; i < validWebsiteUrls.length; i++) {
        const validation = validateWebsiteUrl(validWebsiteUrls[i]);
        if (!validation.isValid) {
          setError(`Website ${i + 1}: ${validation.error}`);
          return;
        }
      }
      // Create qudemo first
      const qudemoData = {
        title: title || "Untitled Qudemo",
        description: "No description provided",
        companyId: company.id,
        calendlyLink: calendlyLink.trim() || null,
        presenterName: presenterName.trim() || null,
        voiceId: selectedVoice || null,
        videos: validVideoUrls.map((url, index) => {
          const validation = validateVideoUrl(url);
          return {
            url: url.trim(),
            type: validation.type,
            title: `Video ${index + 1}`,
            order: index + 1,
          };
        }),
        websites: validWebsiteUrls.map((url, index) => {
          const validation = validateWebsiteUrl(url);
          return {
            url: url.trim(),
            type: validation.type,
            title: `Website ${index + 1}`,
            order: index + 1,
          };
        }),
        knowledgeSources: sources
          .filter((source) => source.trim())
          .map((source) => ({
            url: source.trim(),
            type: "website",
          })),
      };
      const token = localStorage.getItem("accessToken");
      const createResponse = await fetch(getNodeApiUrl("/api/qudemos"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(qudemoData),
      });
      const createResult = await createResponse.json();
      if (!createResult.success) {
        throw new Error(createResult.error || "Failed to create qudemo");
      }
      const qudemoId = createResult.data.id;
      setCreatedQudemoId(qudemoId); // Set the created QuDemo ID

      // Upload presenter photo if provided
      if (presenterPhoto) {
        try {
          const formData = new FormData();
          formData.append("presenterPhoto", presenterPhoto);
          formData.append("qudemoId", qudemoId);
          formData.append("companyName", company.name);

          const photoResponse = await fetch(
            getNodeApiUrl("/api/qudemos/upload-presenter-photo"),
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            },
          );

          const photoResult = await photoResponse.json();
          if (!photoResult.success) {
            console.error(
              "Failed to upload presenter photo:",
              photoResult.error,
            );
            // Don't fail the entire process, just log the error
          } else {
            console.log("✓ Presenter photo uploaded successfully");
          }
        } catch (photoError) {
          console.error("Error uploading presenter photo:", photoError);
          // Don't fail the entire process
        }
      }

      if (validVideoUrls.length > 0 || validWebsiteUrls.length > 0) {
        setSuccess(
          "Please wait, your content is now processing. This may take a few minutes. Once it's ready, you'll be redirected to your Qudemos page.",
        );
      } else {
        setSuccess(
          "QuDemo created successfully! Documents will be processed automatically.",
        );
      }

      // Show avatar video generation message if presenter photo was provided
      if (presenterPhoto) {
        if (documents.length > 0 || selectedFiles.length > 0) {
          setSuccess(
            (prev) =>
              prev +
              "\n\n🤖 AI Avatar videos will be generated for your FAQs + fallback messages (this may take 10-15 minutes).",
          );
        } else {
          setSuccess(
            (prev) =>
              prev +
              "\n\n🤖 AI Avatar videos will be generated for fallback messages like 'no answer' and 'sales inquiry' (this may take 5-10 minutes).",
          );
        }
      }
      // Process all content automatically using the new endpoint
      if (validVideoUrls.length > 0 || validWebsiteUrls.length > 0) {
        try {
          const contentResponse = await fetch(
            getNodeApiUrl(
              `/api/qudemos/process-content/${company.name}/${qudemoId}`,
            ),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                video_urls: validVideoUrls,
                website_urls: validWebsiteUrls,
              }),
            },
          );
          const contentResult = await contentResponse.json();
          // Check for processing errors first, regardless of success status
          if (
            contentResult.processing_errors &&
            contentResult.processing_errors.length > 0
          ) {
            // Handle processing errors with popup
            const { processing_errors, has_anti_bot_protection } =
              contentResult;
            let errorMessage = "❌ Some content failed to process!\n\n";
            // Show specific failed content with detailed reasons
            errorMessage += "📋 Failed Content Details:\n\n";
            processing_errors.forEach((error, index) => {
              if (error.type === "website") {
                errorMessage += `🌐 WEBSITE FAILED:\n`;
                errorMessage += `   URL: ${error.url}\n`;
                errorMessage += `   Reason: ${error.error}\n`;
                if (error.error_type === "crm_bot_detection") {
                  errorMessage += `   🏢 CRM Site with Bot Protection\n`;
                  errorMessage += `   💡 Suggestion: Upload documents instead of scraping\n`;
                } else if (error.error_type) {
                  errorMessage += `   Error Type: ${error.error_type.toUpperCase()}\n`;
                }
                if (error.protection_detected) {
                  errorMessage += `   🛡️ Anti-Bot Protection: YES\n`;
                }
                errorMessage += `\n`;
              } else if (error.type === "video") {
                errorMessage += `📹 VIDEO FAILED:\n`;
                errorMessage += `   URL: ${error.url}\n`;
                errorMessage += `   Reason: ${error.error}\n`;
                if (error.error_type) {
                  errorMessage += `   Error Type: ${error.error_type.toUpperCase()}\n`;
                }
                errorMessage += `\n`;
              }
            });
            // Add suggestions based on error types
            const hasWebsiteErrors = processing_errors?.some(
              (e) => e.type === "website",
            );
            const hasVideoErrors = processing_errors?.some(
              (e) => e.type === "video",
            );
            errorMessage += "💡 What you can do:\n";
            if (hasWebsiteErrors && !hasVideoErrors) {
              const hasCrmErrors = processing_errors?.some(
                (e) =>
                  e.type === "website" && e.error_type === "crm_bot_detection",
              );
              if (hasCrmErrors) {
                errorMessage +=
                  "• Upload documents instead of scraping CRM sites\n";
                errorMessage +=
                  "• CRM sites (Salesforce, SurveySparrow, Zendesk) often block scraping\n";
                errorMessage +=
                  "• Try regular help/documentation sites instead\n";
              } else {
                errorMessage +=
                  "• Try a different website URL (avoid sites with anti-bot protection)\n";
                errorMessage += "• Use only video content for this QuDemo\n";
                errorMessage += "• Contact the website owner for API access\n";
              }
            } else if (hasVideoErrors && !hasWebsiteErrors) {
              errorMessage +=
                "• Check that your video URLs are valid and accessible\n";
              errorMessage +=
                "• Try different video URLs (YouTube, Loom, Vimeo)\n";
              errorMessage += "• Use only website content for this QuDemo\n";
            } else if (hasWebsiteErrors && hasVideoErrors) {
              errorMessage +=
                "• Try different content sources (both videos and websites failed)\n";
              errorMessage +=
                "• Check that all URLs are valid and accessible\n";
              errorMessage += "• Contact support for assistance\n";
            } else {
              errorMessage += "• Try different content sources\n";
              errorMessage +=
                "• Check that all URLs are valid and accessible\n";
              errorMessage += "• Contact support if you need assistance\n";
            }
            errorMessage +=
              "\n⚠️ QuDemo was created but some content failed to process.";
            // Show error popup instead of inline error
            setErrorPopupData({
              title: "Content Processing Issues",
              message: errorMessage,
              processingErrors: processing_errors,
              hasAntiBotProtection: has_anti_bot_protection,
            });
            setShowErrorPopup(true);
            // Exit early to prevent success flow from executing
            return;
          }
          // If no processing errors, proceed with success flow
          if (contentResult.success) {
            const {
              videos_processed,
              website_processed,
              total_chunks,
              processing_order,
            } = contentResult;
            let successMessage = "🎉 All content processed successfully!";
            if (videos_processed > 0) {
              successMessage += `\n📹 ${videos_processed} video(s) processed`;
            }
            if (website_processed) {
              successMessage += `\n🌐 Website processed (${total_chunks} chunks created)`;
            }
            if (processing_order.length > 0) {
              successMessage += `\n⏱️ Processing order: ${processing_order.join(" → ")}`;
            }
            // Hide the processing message and show completion
            setSuccess("");
          }
        } catch (contentError) {
          setError(
            `Content processing failed: ${contentError.message}. The qudemo was created but content processing needs to be retried.`,
          );
          return; // Exit early to prevent success flow from executing
        }
      }
      // Hide the processing message
      setSuccess("");
      // Reset form
      setTitle("");
      setVideoUrls([""]);
      setWebsiteUrls([""]);
      setSources([""]);
      setCalendlyLink("");
      setDocuments([]);
      setSelectedFiles([]);
      setCreatedQudemoId(null);
      setPresenterPhoto(null);
      setPresenterPhotoPreview(null);
      setPresenterName("");
      // Navigate to qudemos page after a short delay to show success message
      setTimeout(() => {
        navigate("/qudemos");
      }, 2000);
    } catch (error) {
      setError(error.message || "Failed to create qudemo. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  if (!company) {
    return (
      <div className="text-center py-12 px-4 sm:px-6 lg:px-8 bg-white rounded-lg border">
        <h3 className="mt-2 text-lg font-medium text-graydark">
          No Company Found
        </h3>
        <p className="mt-1 text-sm text-bodydark">
          You need to create a company before you can create a QuDemo.
        </p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-whiter flex items-center flex-col justify-center pt-8 dashboard-font">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-graydark mb-3">
          Create New Qudemo
        </h1>
        <p className="text-base text-normal text-bodydark">
          Create an interactive demo that allows prospects to learn about your
          product at their own pace.
        </p>
      </div>
      <div className="w-full max-w-2xl p-6 bg-white rounded-2xl border border-gray-200">
        {/* Main Heading and Subheading */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Qudemo Title */}
          <div>
            <label className="block text-sm font-bold text-graydark mb-2 text-left">
              Qudemo Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter qudemo title"
              required
              className="w-full text-[14px] border px-4 py-3 rounded-lg focus:border-blue-400 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          {/* Video URL */}
          <div>
            <label className="block text-sm font-bold text-graydark mb-2 text-left">
              Link to Loom or YouTube demo videos
            </label>
            <p className="text-xs text-gray-500 mb-3 text-left">
              Note: Unlisted YouTube videos will not be processed
            </p>
            {videoUrls.map((url, index) => (
              <div key={index} className="mb-4">
                <div className="flex items-center gap-2 mb-1 relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) =>
                      handleVideoUrlChange(index, e.target.value)
                    }
                    placeholder="https://www.loom.com/share/your-video-id or https://youtube.com/watch?v="
                    className={`w-full text-[14px] border px-4 py-3 rounded-lg focus:border-blue-400 outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      urlValidationErrors[index]
                        ? "!border-red-500"
                        : url.trim() && !urlValidationErrors[index]
                          ? "border-green-500"
                          : "border-strokedark/20"
                    }`}
                  />
                  {videoUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVideoUrlField(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                  {urlValidationErrors[index] && (
                    <Info className="size-4 text-red-400 absolute right-4 top-0 bottom-0 my-auto" />
                  )}
                  {url.trim() && !urlValidationErrors[index] && (
                    <CircleCheck className="size-4 text-green-400 absolute right-4 top-0 bottom-0 my-auto" />
                  )}
                </div>
                {urlValidationErrors[index] && (
                  <p className="text-red-500 text-xs mt-1 ml-1 text-left">
                    {urlValidationErrors[index]}
                  </p>
                )}
                {url.trim() && !urlValidationErrors[index] && (
                  <p className="text-green-600 text-xs mt-1 ml-1 text-left">
                    ✓ Valid {url.includes("loom.com") ? "Loom" : "YouTube"} URL
                  </p>
                )}
              </div>
            ))}
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={addVideoUrlField}
                className="text-primary hover:underline text-sm font-medium flex items-center justify-center gap-1"
              >
                <span className="text-primary font-bold">+</span> Add another
                video
              </button>
            </div>
          </div>
          {/* Website URL - COMMENTED OUT */}
          {/*
        <div className="mt-6">
            <label className="block text-sm font-bold text-graydark mb-2 text-left">
                Website URLs to scrape
          </label>
            <p className="text-xs text-gray-500 mb-3 text-left">
                Enter website URLs to scrape content from. Only same-domain paths will be scraped.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                            CRM Sites Warning
                        </h3>
                        <div className="mt-1 text-sm text-yellow-700">
                            <p>
                                <strong>CRM websites</strong> (like Salesforce, SurveySparrow, Zendesk) often have bot detection that prevents scraping.
                                If a website fails to scrape, try uploading documents instead.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {websiteUrls.map((url, index) => (
              <div key={index} className="mb-4">
                <div className="flex items-center gap-2 mb-1">
            <input
              type="text"
                    value={url}
                    onChange={e => handleWebsiteUrlChange(index, e.target.value)}
                    placeholder="https://example.com/help or https://docs.example.com"
                    className={`flex-1 border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      urlValidationErrors[`website_${index}`]
                        ? 'border-red-500 bg-red-50'
                        : url.trim() && !urlValidationErrors[`website_${index}`]
                          ? 'border-green-500 bg-green-50'
                          : 'border-strokedark/20'
                    }`}
                  />
                  {websiteUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWebsiteUrlField(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
          </div>
                {urlValidationErrors[`website_${index}`] && (
                  <p className="text-red-500 text-sm mt-1 ml-1">
                    {urlValidationErrors[`website_${index}`]}
                  </p>
                )}
                {url.trim() && !urlValidationErrors[`website_${index}`] && (
                  <p className="text-green-600 text-sm mt-1 ml-1">
                    ✓ Valid website URL
                  </p>
                )}
              </div>
            ))}
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={addWebsiteUrlField}
                className="text-primary hover:underline text-sm font-medium flex items-center justify-center gap-1"
              >
                <span className="text-primary font-bold">+</span> Add another website
              </button>
            </div>
        </div>
        */}
          {/* Document Upload Section */}
          <div className="mt-6">
            <label className="block text-sm font-bold text-graydark mb-2 text-left">
              Product Document
            </label>
            <p className="text-xs text-gray-500 mb-3 text-left">
              Upload your product knowledge documents here
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-lg">💡</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-primary text-left">
                    Add any product knowledge doc and Qudemo AI will use them to
                    pull out only the relevant information to answer your
                    customer's questions
                  </p>
                </div>
              </div>
            </div>
            <DocumentUpload
              qudemoId={createdQudemoId}
              companyName={company?.name}
              onDocumentsChange={setDocuments}
              onSelectedFilesChange={setSelectedFiles}
            />
          </div>

          {/* Presenter Photo Upload Section - Always visible */}
          <div className="mt-6">
            <label className="block text-sm font-bold text-graydark mb-2 text-left">
              Presenter Photo 🎬{" "}
              <span className="text-xs text-green-600 font-normal">
                (New Feature!)
              </span>
            </label>
            <p className="text-xs text-gray-500 mb-3 text-left">
              Upload a presenter photo to create AI avatar videos for all
              responses (including fallback messages)
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🤖✨</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-purple-900 font-semibold mb-1 text-left">
                    AI Avatar Videos for Document Answers
                  </p>
                  <p className="text-xs text-purple-700 text-left">
                    When customers ask questions about your documents, they'll
                    see an AI-generated video of your presenter speaking the
                    answer - making document-based responses as engaging as
                    video demos!
                  </p>
                </div>
              </div>
            </div>

            {!presenterPhotoPreview ? (
              <div className="border-2 border-dashed border-strokedark/20 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  id="presenter-photo"
                  accept="image/*"
                  onChange={handlePresenterPhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="presenter-photo"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-3xl">👤</span>
                  </div>
                  <p className="text-sm font-medium text-bodydark mb-1">
                    Upload Presenter Photo
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    JPG or PNG, max 5MB
                  </p>
                  <div className="mt-3 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors inline-block">
                    Choose Photo
                  </div>
                </label>
              </div>
            ) : (
              <div className="border border-strokedark/20 rounded-lg p-4 bg-white">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={presenterPhotoPreview}
                      alt="Presenter preview"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-purple-300"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-graydark">
                        Presenter Photo Uploaded
                      </p>
                      <button
                        type="button"
                        onClick={removePresenterPhoto}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={presenterName}
                      onChange={(e) => setPresenterName(e.target.value)}
                      placeholder="Presenter Name (Optional)"
                      className="w-full border border-strokedark/20 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      ✓ This photo will be used to generate AI avatar videos for
                      FAQ answers
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Voice Selection Section */}
          <div className="mt-6">
            <label className="block text-sm font-bold text-graydark mb-2 text-left">
              Select Avatar Voice 🎤{" "}
              <span className="text-xs text-blue-600 font-normal">
                (AI Avatar Video Feature)
              </span>
            </label>
            <p className="text-xs text-gray-500 mb-3 text-left">
              Choose a voice for your AI avatar videos. Click preview to hear
              the voice.
            </p>

            {voices.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {voices.slice(0, visibleVoiceRows * 3).map((voice) => (
                    <div
                      key={voice.id}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                        selectedVoice === voice.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      } ${voice.is_custom ? "ring-2 ring-green-200" : ""}`}
                      onClick={() => setSelectedVoice(voice.id)}
                    >
                      <div className="flex flex-col">
                        <div className="text-left mb-3">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="text-sm font-bold text-graydark">
                              {voice.name}
                            </h4>
                            {voice.is_default && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          {voice.description && (
                            <p className="text-xs text-gray-700 mb-2 leading-relaxed font-medium">
                              {voice.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <span className="flex items-center gap-1">
                              {voice.gender === "Male"
                                ? "👨"
                                : voice.gender === "Female"
                                  ? "👩"
                                  : "👤"}
                              {voice.gender}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              🌍 {voice.language}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVoicePreview(voice.id);
                          }}
                          className={`w-full px-3 py-1.5 text-white text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 font-medium ${
                            isPlayingVoice === voice.id
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-blue-500 hover:bg-blue-600"
                          }`}
                          title={
                            isPlayingVoice === voice.id
                              ? "Stop preview"
                              : "Play voice preview"
                          }
                        >
                          {isPlayingVoice === voice.id ? (
                            <>
                              <svg
                                className="w-3.5 h-3.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Stop
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3.5 h-3.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
                              </svg>
                              Play
                            </>
                          )}
                        </button>

                        {/* Audio playing indicator */}
                        {isPlayingVoice === voice.id && (
                          <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg text-xs text-left">
                            <div className="flex items-start gap-2">
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-1 h-3 bg-blue-500 rounded animate-pulse"></span>
                                <span
                                  className="w-1 h-4 bg-blue-500 rounded animate-pulse"
                                  style={{ animationDelay: "0.2s" }}
                                ></span>
                                <span
                                  className="w-1 h-3 bg-blue-500 rounded animate-pulse"
                                  style={{ animationDelay: "0.4s" }}
                                ></span>
                              </div>
                              <div className="flex-1">
                                <p className="text-blue-900 font-semibold mb-1">
                                  🔊 Playing...
                                </p>
                                <p className="italic text-blue-700 leading-relaxed text-xs">
                                  "{voice.sample_text}"
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Show More Button */}
                {visibleVoiceRows * 3 < voices.length && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleVoiceRows((prev) => prev + 3)}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
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
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      Show More Voices ({voices.length - visibleVoiceRows * 3}{" "}
                      remaining)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Loading voices...</p>
              </div>
            )}
          </div>

          {/* Calendly Link Section */}
          <div className="mt-6">
            <label className="block text-sm font-bold text-graydark mb-2 text-left">
              Add Calendly Link{" "}
              <span className="text-bodydark2 text-xs font-normal">
                (Optional)
              </span>
            </label>
            <p className="text-xs text-gray-500 mb-3 text-left">
              Add a Calendly link to let prospects book meetings directly from
              your Qudemo
            </p>
            <input
              type="text"
              value={calendlyLink}
              onChange={(e) => setCalendlyLink(e.target.value)}
              placeholder="https://calendly.com/your-username/meeting"
              className={`w-full text-[14px] border px-4 py-3 rounded-lg focus:border-blue-400 outline-none focus:ring-2 focus:ring-blue-500/40 ${
                calendlyLink.trim() &&
                !validateCalendlyUrl(calendlyLink).isValid
                  ? "border-red-500 bg-red-50"
                  : calendlyLink.trim() &&
                      validateCalendlyUrl(calendlyLink).isValid
                    ? "border-green-500 bg-green-50"
                    : "border-strokedark/20"
              }`}
            />
            {calendlyLink.trim() &&
              !validateCalendlyUrl(calendlyLink).isValid && (
                <p className="text-red-500 text-sm mt-1 ml-1">
                  {validateCalendlyUrl(calendlyLink).error}
                </p>
              )}
            {calendlyLink.trim() &&
              validateCalendlyUrl(calendlyLink).isValid && (
                <p className="text-green-600 text-sm mt-1 ml-1">
                  ✓ Valid Calendly URL
                </p>
              )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !areAllUrlsValid()}
            className={`w-full font-bold py-3 px-6 rounded-lg transition-colors duration-200 ${
              isSubmitting || !areAllUrlsValid()
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 text-white"
            }`}
          >
            {isSubmitting ? "Processing Content..." : "Create Qudemo"}
          </button>
        </form>
        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Processing Failed
                </h3>
                <div className="mt-2 text-sm text-red-700 whitespace-pre-line">
                  {error}
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Processing Message Popup */}
        {success && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-primary"
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
                <h3 className="ml-3 text-lg font-semibold text-graydark text-left">
                  Processing Your Qudemo
                </h3>
              </div>

              <p className="text-bodydark mb-6 text-left">{success}</p>

              <div className="flex justify-end">
                <button
                  onClick={() => setSuccess("")}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Error Popup Modal */}
      {showErrorPopup && errorPopupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-graydark flex items-center">
                <svg
                  className="w-6 h-6 text-yellow-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                {errorPopupData.title}
              </h3>
              <button
                onClick={handleErrorPopupClose}
                className="text-bodydark2 hover:text-bodydark focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            {/* Content */}
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
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
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800">
                      Processing Issues Detected
                    </h4>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Some content failed to process, but your QuDemo was
                        created successfully with the content that did work.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Error Details */}
              <div className="bg-whiter rounded-lg p-4">
                <h4 className="text-sm font-medium text-graydark mb-3">
                  Failed Content Details:
                </h4>
                <div className="space-y-3">
                  {errorPopupData.processingErrors?.map((error, index) => (
                    <div
                      key={index}
                      className="border border-strokedark/10 rounded-lg p-3"
                    >
                      {error.type === "website" && (
                        <div>
                          <div className="flex items-center mb-2">
                            <svg
                              className="w-4 h-4 text-blue-500 mr-2"
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
                            <span className="font-medium text-graydark">
                              Website Failed
                            </span>
                          </div>
                          <div className="text-sm text-bodydark mb-2">
                            <strong>URL:</strong> {error.url}
                          </div>
                          <div className="text-sm text-bodydark mb-2">
                            <strong>Reason:</strong> {error.error}
                          </div>
                          {error.error_type === "crm_bot_detection" && (
                            <div className="bg-red-50 border border-red-200 rounded p-2">
                              <div className="flex items-center">
                                <svg
                                  className="w-4 h-4 text-red-500 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                  />
                                </svg>
                                <span className="text-sm font-medium text-red-800">
                                  CRM Site with Bot Protection
                                </span>
                              </div>
                              <p className="text-sm text-red-700 mt-1">
                                💡 <strong>Suggestion:</strong> Upload documents
                                instead of scraping this website
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      {error.type === "video" && (
                        <div>
                          <div className="flex items-center mb-2">
                            <svg
                              className="w-4 h-4 text-red-500 mr-2"
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
                            <span className="font-medium text-graydark">
                              Video Failed
                            </span>
                          </div>
                          <div className="text-sm text-bodydark mb-2">
                            <strong>URL:</strong> {error.url}
                          </div>
                          <div className="text-sm text-bodydark">
                            <strong>Reason:</strong> {error.error}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-end">
              <button
                onClick={handleErrorPopupClose}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Continue to QuDemos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CreateQuDemo;
