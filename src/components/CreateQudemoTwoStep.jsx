import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon, PencilIcon, TrashIcon, PlusIcon, CheckIcon, SpeakerWaveIcon } from "@heroicons/react/24/outline";
import { useCompany } from "../context/CompanyContext";
import { getNodeApiUrl, getApiUrl, getVideoApiUrl } from "../config/api";
import { useNavigate } from "react-router-dom";
import DocumentUpload from "./DocumentUpload";
import CustomFAQModal from "./CustomFAQModal";

const CreateQudemoTwoStep = () => {
  const { company, isLoading } = useCompany();
  const navigate = useNavigate();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1); // 1 = Sources & Generate FAQ, 2 = Review & Generate Videos
  
  // Form states
  const [title, setTitle] = useState("");
  const [videoUrls, setVideoUrls] = useState([""]);
  const [calendlyLink, setCalendlyLink] = useState("");
  const [presenterName, setPresenterName] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [createdQudemoId, setCreatedQudemoId] = useState(null);
  
  // Voice & User Collection
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [collectUserInfo, setCollectUserInfo] = useState(false);
  const [collectName, setCollectName] = useState(true);
  const [collectEmail, setCollectEmail] = useState(true);
  const [collectCompany, setCollectCompany] = useState(false);
  
  // FAQ states
  const [generatedFAQs, setGeneratedFAQs] = useState(null); // { content_faqs: [], system_faqs: [] }
  const [isGeneratingFAQs, setIsGeneratingFAQs] = useState(false);
  const [faqGenerationProgress, setFaqGenerationProgress] = useState("");
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  
  // Custom FAQ states
  const [isCustomFAQModalOpen, setIsCustomFAQModalOpen] = useState(false);
  const [customFAQs, setCustomFAQs] = useState([]);
  
  // Video generation states
  const [presenterPhoto, setPresenterPhoto] = useState(null);
  const [presenterPhotoPreview, setPresenterPhotoPreview] = useState(null);
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const [videoGenerationProgress, setVideoGenerationProgress] = useState("");
  
  // UI states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlValidationErrors, setUrlValidationErrors] = useState({});
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  
  // Fetch voices
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const pythonApiUrl = getApiUrl('python');
        console.log('🎤 Fetching voices from:', `${pythonApiUrl}/heygen-voices`);
        const response = await fetch(`${pythonApiUrl}/heygen-voices`);
        const data = await response.json();
        console.log('🎤 Voices response:', data);
        if (data.success && data.voices) {
          console.log(`✅ Received ${data.voices.length} voices:`, data.voices.map(v => v.name));
          setVoices(data.voices);
          const defaultVoice = data.voices.find((v) => v.is_default);
          if (defaultVoice) {
            console.log('✅ Setting default voice:', defaultVoice.name);
            setSelectedVoice(defaultVoice.id);
          }
        } else {
          console.error('❌ Invalid voices response:', data);
        }
      } catch (err) {
        console.error("Failed to fetch voices:", err);
      }
    };
    fetchVoices();
  }, []);
  
  // Voice preview function
  const handleVoicePreview = async (voiceId) => {
    try {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      
      setPreviewingVoiceId(voiceId);
      
      // Call our backend API to get voice preview (keeps API key secure)
      const pythonApiUrl = getApiUrl('python');
      const response = await fetch(`${pythonApiUrl}/heygen-voice-preview/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.audio_url) {
        const audio = new Audio(data.audio_url);
        setAudioElement(audio);
        
        audio.onended = () => {
          setPreviewingVoiceId(null);
        };
        
        audio.onerror = () => {
          setPreviewingVoiceId(null);
          console.error('Error playing audio preview');
        };
        
        await audio.play();
      } else {
        setPreviewingVoiceId(null);
        console.error('No audio URL in response');
      }
    } catch (error) {
      console.error('Failed to preview voice:', error);
      setPreviewingVoiceId(null);
    }
  };
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);
  
  // URL validation functions
  const validateVideoUrl = (url) => {
    if (!url || !url.trim()) return { isValid: false, error: "URL is required" };
    
    const loomRegex = /^https?:\/\/(www\.)?loom\.com\/share\/[a-zA-Z0-9]+/;
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;
    
    if (loomRegex.test(url)) return { isValid: true, type: "loom" };
    if (youtubeRegex.test(url)) return { isValid: true, type: "youtube" };
    
    return { isValid: false, error: "Invalid URL. Must be a Loom or YouTube link." };
  };
  
  // URL management
  const handleVideoUrlChange = (index, value) => {
    const newUrls = [...videoUrls];
    newUrls[index] = value;
    setVideoUrls(newUrls);
    
    if (value.trim()) {
      const validation = validateVideoUrl(value);
      if (!validation.isValid) {
        setUrlValidationErrors({ ...urlValidationErrors, [index]: validation.error });
      } else {
        const { [index]: removed, ...rest } = urlValidationErrors;
        setUrlValidationErrors(rest);
      }
    }
  };
  
  const addVideoUrlField = () => setVideoUrls([...videoUrls, ""]);
  const removeVideoUrlField = (index) => {
    if (videoUrls.length > 1) {
      setVideoUrls(videoUrls.filter((_, i) => i !== index));
      const { [index]: removed, ...rest } = urlValidationErrors;
      setUrlValidationErrors(rest);
    }
  };
  
  // Step 1: Create QuDemo and process content (NO video generation yet)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    
    try {
      // Validate
      if (!company || !company.id) {
        setError("Company information is required. Please refresh the page and try again.");
        return;
      }
      
      const validVideoUrls = videoUrls.filter((url) => url.trim());
      const hasDocuments = documents.length > 0 || selectedFiles.length > 0;
      
      console.log("📋 Creating QuDemo - Sources check:", {
        videos: validVideoUrls.length,
        documents: documents.length,
        selectedFiles: selectedFiles.length,
        selectedFilesData: selectedFiles
      });
      
      // Require at least one source (video OR document)
      if (validVideoUrls.length === 0 && !hasDocuments) {
        setShowValidationPopup(true);
        return;
      }
      
      // Validate video URLs if provided
      if (validVideoUrls.length > 0) {
        for (let i = 0; i < validVideoUrls.length; i++) {
          const validation = validateVideoUrl(validVideoUrls[i]);
          if (!validation.isValid) {
            setError(`Video ${i + 1}: ${validation.error}`);
            return;
          }
        }
      }
      
      // Create qudemo
      console.log('🎤 Selected Voice ID:', selectedVoice);
      console.log('🎤 All voices:', voices.map(v => ({ id: v.id, name: v.name })));
      
      const qudemoData = {
        title: title || "Untitled Qudemo",
        description: "No description provided",
        companyId: company.id,
        calendlyLink: calendlyLink.trim() || null,
        presenterName: presenterName.trim() || null,
        voiceId: selectedVoice || null,
        collectUserInfo: collectUserInfo,
        collectName: collectUserInfo ? collectName : false,
        collectEmail: collectUserInfo ? collectEmail : false,
        collectCompany: collectUserInfo ? collectCompany : false,
        videos: validVideoUrls.map((url, index) => {
          const validation = validateVideoUrl(url);
          return {
            url: url.trim(),
            type: validation.type,
            title: `Video ${index + 1}`,
            order: index + 1,
          };
        }),
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
      setCreatedQudemoId(qudemoId);
      
      // Process content (videos)
      if (validVideoUrls.length > 0) {
        setSuccess("Processing your videos... This may take a few minutes.");
        
        const contentResponse = await fetch(
          getNodeApiUrl(`/api/qudemos/process-content/${company.name}/${qudemoId}`),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              video_urls: validVideoUrls,
              website_urls: [], // No websites
            }),
          }
        );
        
        const contentResult = await contentResponse.json();
        if (!contentResult.success && contentResult.processing_errors) {
          setError("Some content failed to process. Please check and try again.");
          return;
        }
      }
      
      // Upload documents if any
      if (selectedFiles.length > 0) {
        console.log(`📤 Uploading ${selectedFiles.length} document(s) to Python backend...`);
        setSuccess(`Uploading ${selectedFiles.length} document(s)...`);
        
        const pythonApiUrl = getApiUrl('python');
        console.log(`🔗 Python API URL: ${pythonApiUrl}`);
        
        const uploadPromises = selectedFiles.map(async (fileInfo) => {
          console.log(`📄 Uploading file: ${fileInfo.name || fileInfo.file.name}`, {
            id: fileInfo.id,
            type: fileInfo.type,
            size: fileInfo.size
          });
          
          const formData = new FormData();
          formData.append("file", fileInfo.file);
          formData.append("company_name", company.name);
          formData.append("qudemo_id", qudemoId);
          formData.append("document_id", fileInfo.id.toString());
          formData.append("mime_type", fileInfo.type || fileInfo.file.type);
          
          const uploadResponse = await fetch(`${pythonApiUrl}/process-document`, {
            method: "POST",
            body: formData,
          });
          
          const result = await uploadResponse.json();
          console.log(`📄 Upload result for ${fileInfo.name || fileInfo.file.name}:`, result);
          return result;
        });
        
        const uploadResults = await Promise.all(uploadPromises);
        const failedUploads = uploadResults.filter(r => !r.success);
        
        if (failedUploads.length > 0) {
          console.error(`❌ Failed uploads:`, failedUploads);
          setError(`Failed to upload ${failedUploads.length} document(s). Please try again.`);
          return;
        }
        
        console.log(`✅ All ${selectedFiles.length} document(s) uploaded successfully!`);
        setSuccess(`✅ Uploaded ${selectedFiles.length} document(s) successfully!`);
      } else {
        console.log("ℹ️ No documents to upload (selectedFiles is empty)");
      }
      
      // Now automatically generate FAQs
      setSuccess("Reading your sources...");
      setIsGeneratingFAQs(true);
      
      const pythonApiUrl = getApiUrl('python');
      const faqResponse = await fetch(
        `${pythonApiUrl}/generate-faqs-preview?company_name=${encodeURIComponent(company.name)}&qudemo_id=${qudemoId}`,
        { method: "POST" }
      );
      
      if (!faqResponse.ok) {
        throw new Error("Failed to generate FAQs");
      }
      
      setSuccess("Generating FAQ questions and answers...");
      
      const faqData = await faqResponse.json();
      if (faqData.success && faqData.faqs) {
        setGeneratedFAQs(faqData.faqs);
        setCurrentStep(2); // Move to FAQ review step
        setSuccess(`✅ Generated ${faqData.faqs.total_content} content FAQs + ${faqData.faqs.total_system} system FAQs!`);
      } else {
        throw new Error("Failed to generate FAQs");
      }
      
    } catch (error) {
      setError(error.message || "Failed to create qudemo. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsGeneratingFAQs(false);
    }
  };
  
  // Step 1.5: Generate FAQs for preview
  const handleGenerateFAQs = async () => {
    if (!createdQudemoId || !company) return;
    
    setIsGeneratingFAQs(true);
    setFaqGenerationProgress("Reading your sources...");
    setError("");
    
    try {
      const pythonApiUrl = getApiUrl('python');
      const response = await fetch(
        `${pythonApiUrl}/generate-faqs-preview?company_name=${encodeURIComponent(company.name)}&qudemo_id=${createdQudemoId}`,
        { method: "POST" }
      );
      
      if (!response.ok) {
        throw new Error("Failed to generate FAQs");
      }
      
      setFaqGenerationProgress("Generating FAQ questions and answers...");
      
      const data = await response.json();
      if (data.success && data.faqs) {
        setGeneratedFAQs(data.faqs);
        setFaqGenerationProgress("");
        setCurrentStep(2); // Move to FAQ review step
        setSuccess(`✅ Generated ${data.faqs.total_content} content FAQs + ${data.faqs.total_system} system FAQs!`);
      } else {
        throw new Error("Failed to generate FAQs");
      }
    } catch (error) {
      setError("Failed to generate FAQs: " + error.message);
      setFaqGenerationProgress("");
    } finally {
      setIsGeneratingFAQs(false);
    }
  };
  
  // FAQ editing functions
  const startEditingFaq = (faq) => {
    setEditingFaqId(faq.id);
    setEditedQuestion(faq.question);
    setEditedAnswer(faq.answer);
  };
  
  const cancelEditingFaq = () => {
    setEditingFaqId(null);
    setEditedQuestion("");
    setEditedAnswer("");
  };
  
  const saveEditedFaq = () => {
    if (!generatedFAQs || !editingFaqId) return;
    
    // Update in content_faqs or system_faqs
    const updatedContentFaqs = generatedFAQs.content_faqs.map(faq => 
      faq.id === editingFaqId 
        ? { ...faq, question: editedQuestion, answer: editedAnswer }
        : faq
    );
    
    const updatedSystemFaqs = generatedFAQs.system_faqs.map(faq =>
      faq.id === editingFaqId
        ? { ...faq, question: editedQuestion, answer: editedAnswer }
        : faq
    );
    
    setGeneratedFAQs({
      ...generatedFAQs,
      content_faqs: updatedContentFaqs,
      system_faqs: updatedSystemFaqs
    });
    
    cancelEditingFaq();
  };
  
  const deleteFaq = (faqId, isSystem) => {
    if (!generatedFAQs) return;
    
    if (isSystem) {
      // Allow deleting system FAQs
      const updatedSystemFaqs = generatedFAQs.system_faqs.filter(faq => faq.id !== faqId);
      
      setGeneratedFAQs({
        ...generatedFAQs,
        system_faqs: updatedSystemFaqs,
        total_system: updatedSystemFaqs.length,
        total_videos: generatedFAQs.content_faqs.length + updatedSystemFaqs.length
      });
    } else {
      // Delete content FAQ
      const updatedContentFaqs = generatedFAQs.content_faqs.filter(faq => faq.id !== faqId);
      
      setGeneratedFAQs({
        ...generatedFAQs,
        content_faqs: updatedContentFaqs,
        total_content: updatedContentFaqs.length,
        total_videos: updatedContentFaqs.length + generatedFAQs.system_faqs.length
      });
    }
  };
  
  const addNewFaq = () => {
    if (!generatedFAQs) return;
    
    const newId = `faq_${String(generatedFAQs.content_faqs.length + 1).padStart(3, '0')}`;
    const newFaq = {
      id: newId,
      question: "New Question",
      answer: "New Answer",
      category: "general",
      source: "manual",
      is_system: false
    };
    
    setGeneratedFAQs({
      ...generatedFAQs,
      content_faqs: [...generatedFAQs.content_faqs, newFaq],
      total_content: generatedFAQs.content_faqs.length + 1,
      total_videos: generatedFAQs.content_faqs.length + 1 + generatedFAQs.system_faqs.length
    });
    
    // Start editing the new FAQ
    startEditingFaq(newFaq);
  };
  
  // Custom FAQ handlers
  const handleAddCustomFAQ = async (faqData) => {
    if (!createdQudemoId || !company) return;
    
    try {
      // Add custom FAQ via API
      const pythonApiUrl = getVideoApiUrl('');
      const response = await fetch(`${pythonApiUrl}/add-custom-faq/${encodeURIComponent(company.name)}/${createdQudemoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faqData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to add custom FAQ");
      }
      
      const data = await response.json();
      console.log('✅ Custom FAQ added:', data.faq);
      
      // Add to custom FAQs list
      setCustomFAQs(prev => [...prev, data.faq]);
      
      // Update generated FAQs to include custom FAQ
      if (generatedFAQs) {
        setGeneratedFAQs({
          ...generatedFAQs,
          content_faqs: [...generatedFAQs.content_faqs, data.faq],
          total_content: generatedFAQs.content_faqs.length + 1,
          total_videos: generatedFAQs.content_faqs.length + 1 + generatedFAQs.system_faqs.length
        });
      }
      
      setSuccess("✅ Custom FAQ added successfully!");
    } catch (error) {
      console.error('❌ Error adding custom FAQ:', error);
      setError("Failed to add custom FAQ: " + error.message);
    }
  };
  
  const handleDeleteCustomFAQ = async (faqId) => {
    if (!createdQudemoId || !company) return;
    
    if (!window.confirm("Are you sure you want to delete this custom FAQ?")) {
      return;
    }
    
    try {
      const pythonApiUrl = getVideoApiUrl('');
      const response = await fetch(`${pythonApiUrl}/delete-custom-faq/${encodeURIComponent(company.name)}/${createdQudemoId}/${faqId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete custom FAQ");
      }
      
      // Remove from custom FAQs list
      setCustomFAQs(prev => prev.filter(f => f.id !== faqId));
      
      // Remove from generated FAQs
      if (generatedFAQs) {
        const updatedContentFaqs = generatedFAQs.content_faqs.filter(faq => faq.id !== faqId);
        setGeneratedFAQs({
          ...generatedFAQs,
          content_faqs: updatedContentFaqs,
          total_content: updatedContentFaqs.length,
          total_videos: updatedContentFaqs.length + generatedFAQs.system_faqs.length
        });
      }
      
      setSuccess("✅ Custom FAQ deleted successfully!");
    } catch (error) {
      console.error('❌ Error deleting custom FAQ:', error);
      setError("Failed to delete custom FAQ: " + error.message);
    }
  };
  
  // Save FAQs to backend (draft)
  const handleSaveFAQs = async () => {
    if (!generatedFAQs || !createdQudemoId || !company) return;
    
    try {
      const pythonApiUrl = getApiUrl('python');
      const response = await fetch(`${pythonApiUrl}/update-faqs/${createdQudemoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: company.name,
          content_faqs: generatedFAQs.content_faqs,
          system_faqs: generatedFAQs.system_faqs
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to save FAQs");
      }
      
      setSuccess("✅ FAQs saved successfully!");
    } catch (error) {
      setError("Failed to save FAQs: " + error.message);
    }
  };
  
  // Step 2: Upload photo and trigger video generation
  const handlePresenterPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPG, PNG, etc.)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      
      setPresenterPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPresenterPhotoPreview(reader.result);
      reader.readAsDataURL(file);
      setError("");
    }
  };
  
  const removePresenterPhoto = () => {
    setPresenterPhoto(null);
    setPresenterPhotoPreview(null);
  };
  
  const handleGenerateVideos = async () => {
    // Validate required fields
    if (!presenterPhoto) {
      setError("⚠️ Presenter photo is required to generate AI videos. Please upload a clear, front-facing photo.");
      // Scroll to presenter photo section
      const presenterSection = document.getElementById('presenter-photo-section');
      if (presenterSection) {
        presenterSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!selectedVoice) {
      setError("⚠️ Please select an AI voice for the video narration.");
      return;
    }
    
    if (!createdQudemoId || !company) {
      setError("⚠️ QuDemo information is missing. Please try again.");
      return;
    }
    
    // Save FAQs first
    await handleSaveFAQs();
    
    setIsGeneratingVideos(true);
    setVideoGenerationProgress("Uploading presenter photo...");
    setError("");

    try {
      console.log('🎤 Pre-recorded config - Voice ID:', selectedVoice);

      const formData = new FormData();
      formData.append("qudemoId", createdQudemoId);
      formData.append("companyName", company.name);
      formData.append("presenterPhoto", presenterPhoto);
      formData.append("voiceId", selectedVoice);
      
      const pythonApiUrl = getApiUrl('python');
      const response = await fetch(`${pythonApiUrl}/trigger-video-generation-final`, {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to start video generation");
      }

      setVideoGenerationProgress("Starting AI video generation...");

      const data = await response.json();

      if (data.success) {
        setSuccess(`✅ Video generation started! ${data.total_videos} videos will be generated in ~${data.estimated_time_minutes} minutes. Redirecting to QuDemos page...`);

        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/qudemos");
        }, 3000);
      } else {
        throw new Error("Failed to start video generation");
      }
    } catch (error) {
      setError("Failed to generate videos: " + error.message);
      setVideoGenerationProgress("");
    } finally {
      setIsGeneratingVideos(false);
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
        <h3 className="mt-2 text-lg font-medium text-graydark">No Company Found</h3>
        <p className="mt-1 text-sm text-bodydark">
          You need to create a company before you can create a QuDemo.
        </p>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Upload Sources & Generate FAQ</span>
          </div>
          
          <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          
          <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Review FAQs & Generate Videos</span>
          </div>
        </div>
      </div>
      
      {/* Error & Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm whitespace-pre-line">{success}</p>
        </div>
      )}
      
      {/* STEP 1: Upload Sources */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-graydark mb-6">Step 1: Add Your Content Sources</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
            {/* Title */}
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
                className="w-full border border-strokedark/20 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-left"
              />
            </div>
            
            {/* Video URLs */}
            <div>
              <label className="block text-sm font-bold text-graydark mb-2 text-left">
                Link to Loom or YouTube demo videos (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3 text-left">
                Add videos to generate FAQs from transcripts. Unlisted YouTube videos will not be processed.
              </p>
              {videoUrls.map((url, index) => (
                <div key={index} className="mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleVideoUrlChange(index, e.target.value)}
                      placeholder="https://www.loom.com/share/your-video-id or https://youtube.com/watch?v="
                      className={`flex-1 border px-4 py-3 rounded-lg text-left ${
                        urlValidationErrors[index] ? "border-red-500" : "border-strokedark/20"
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
                  </div>
                  {urlValidationErrors[index] && (
                    <p className="text-red-500 text-xs mt-1">{urlValidationErrors[index]}</p>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addVideoUrlField}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add another video
              </button>
            </div>
            
            {/* Document Upload */}
            <div>
              <label className="block text-sm font-bold text-graydark mb-2 text-left">
                Upload Documents (Optional - PDF, DOCX, TXT)
              </label>
              <DocumentUpload
                onDocumentsChange={setDocuments}
                onSelectedFilesChange={setSelectedFiles}
              />
            </div>
            
            {/* Calendly Link */}
            <div>
              <label className="block text-sm font-bold text-graydark mb-2 text-left">
                Calendly Meeting Link (Optional)
              </label>
              <input
                type="url"
                value={calendlyLink}
                onChange={(e) => setCalendlyLink(e.target.value)}
                placeholder="https://calendly.com/your-link"
                className="w-full border border-strokedark/20 px-4 py-3 rounded-lg text-left"
              />
            </div>
            
            {/* User Data Collection */}
            <div className="border-t pt-6">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                  <label htmlFor="collectUserInfo" className="text-sm font-bold text-graydark cursor-pointer text-left">
                    Collect visitor information before demo
                  </label>
                  
                  {/* Main Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setCollectUserInfo(!collectUserInfo)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      collectUserInfo ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        collectUserInfo ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {collectUserInfo && (
                  <div className="ml-4 space-y-1 mt-4 bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-2 text-left">Select information to collect:</p>
                    
                    {/* Name Toggle */}
                    <div className="flex items-center justify-between py-1.5">
                      <label htmlFor="collectName" className="text-sm text-gray-700 cursor-pointer text-left">
                        Name
                      </label>
                      <button
                        type="button"
                        onClick={() => setCollectName(!collectName)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
                          collectName ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            collectName ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    {/* Email Toggle */}
                    <div className="flex items-center justify-between py-1.5">
                      <label htmlFor="collectEmail" className="text-sm text-gray-700 cursor-pointer text-left">
                        Email
                      </label>
                      <button
                        type="button"
                        onClick={() => setCollectEmail(!collectEmail)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
                          collectEmail ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            collectEmail ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    {/* Company Toggle */}
                    <div className="flex items-center justify-between py-1.5">
                      <label htmlFor="collectCompany" className="text-sm text-gray-700 cursor-pointer text-left">
                        Company
                      </label>
                      <button
                        type="button"
                        onClick={() => setCollectCompany(!collectCompany)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
                          collectCompany ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            collectCompany ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Submit Button - Centered */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting || isGeneratingFAQs}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <span>{isSubmitting || isGeneratingFAQs ? "Processing..." : "Generate FAQ"}</span>
                {(isSubmitting || isGeneratingFAQs) && (
                  <svg className="animate-spin ml-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </button>
            </div>
          </form>
          
          {/* Validation Warning Popup */}
          {showValidationPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4 relative">
                {/* Close Button */}
                <button
                  onClick={() => setShowValidationPopup(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Source Required
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Please provide at least one video URL or upload a document to create a QuDemo.
                  </p>
                  <button
                    onClick={() => setShowValidationPopup(false)}
                    className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* FAQ Generation Progress */}
          {isGeneratingFAQs && (
            <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-sm font-medium text-gray-700">{faqGenerationProgress}</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* STEP 2: Review FAQs & Generate Videos */}
      {currentStep === 2 && generatedFAQs && (
        <div className="space-y-6">
          {/* FAQ Preview Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-graydark">
                Step 2: Review & Edit FAQs
              </h2>
              <div className="text-sm text-gray-600">
                {generatedFAQs.total_content} Content + {generatedFAQs.total_system} System = {generatedFAQs.total_videos} Total Videos
              </div>
            </div>
            
            {/* Content FAQs */}
            <div className="mb-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 text-left">Content FAQs ({generatedFAQs.total_content})</h3>
              </div>
              
              <div className="space-y-4">
                {generatedFAQs.content_faqs.map((faq, index) => (
                  <div key={faq.id} className="border rounded-lg p-4 hover:border-blue-300 transition">
                    {editingFaqId === faq.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editedQuestion}
                          onChange={(e) => setEditedQuestion(e.target.value)}
                          className="w-full border border-blue-300 px-3 py-2 rounded-lg font-medium"
                          placeholder="Question"
                        />
                        <textarea
                          value={editedAnswer}
                          onChange={(e) => setEditedAnswer(e.target.value)}
                          rows={4}
                          className="w-full border border-blue-300 px-3 py-2 rounded-lg text-sm"
                          placeholder="Answer"
                          maxLength={1000}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {editedAnswer.length}/1000 characters
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={saveEditedFaq}
                              className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditingFaq}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-blue-600 uppercase">Q{index + 1}</span>
                            <h4 className="font-semibold text-gray-900 text-left">{faq.question}</h4>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => startEditingFaq(faq)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteFaq(faq.id, false)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line text-left">{faq.answer}</p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded">{faq.category}</span>
                          <span>{faq.answer.length} chars</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Add New FAQ Button */}
              <div className="mt-4">
                <button
                  onClick={addNewFaq}
                  className="flex items-center px-4 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add New FAQ
                </button>
              </div>
            </div>
            
            {/* Custom FAQs Section */}
            {customFAQs.length > 0 && (
              <div className="mb-8">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 text-left">
                    Custom FAQs ({customFAQs.length})
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    User-created FAQs with custom videos or text answers
                  </p>
                </div>
                
                <div className="space-y-4">
                  {customFAQs.map((faq, index) => (
                    <div key={faq.id} className="border-2 border-green-200 rounded-lg p-4 bg-green-50 hover:border-green-300 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-semibold text-green-600 uppercase px-2 py-1 bg-green-100 rounded">
                              👤 CUSTOM
                            </span>
                            {faq.has_custom_video && (
                              <span className="text-xs font-semibold text-blue-600 uppercase px-2 py-1 bg-blue-100 rounded flex items-center">
                                🎬 VIDEO
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 text-left">{faq.question}</h4>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleDeleteCustomFAQ(faq.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Delete custom FAQ"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line text-left">{faq.answer}</p>
                      {faq.has_custom_video && faq.custom_video_url && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs text-blue-700 font-medium">📹 Custom Video</p>
                          <p className="text-xs text-gray-600 truncate">{faq.custom_video_url}</p>
                        </div>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="bg-green-100 px-2 py-1 rounded">{faq.category}</span>
                        <span>{faq.answer.length} chars</span>
                        {faq.estimated_duration && (
                          <span>~{Math.round(faq.estimated_duration)}s</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Custom FAQ Button */}
            <div className="mb-8">
              <button
                onClick={() => setIsCustomFAQModalOpen(true)}
                disabled={!createdQudemoId}
                className="flex items-center space-x-2 px-6 py-3 border-2 border-dashed border-green-300 text-green-700 rounded-lg hover:border-green-400 hover:bg-green-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Custom Question with Video</span>
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Upload your own demo videos (up to 300MB) or add text-only answers
              </p>
            </div>
            
            {/* System FAQs */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 text-left mb-4">System FAQs ({generatedFAQs.total_system})</h3>
              <div className="space-y-4">
                {generatedFAQs.system_faqs.map((faq) => (
                  <div key={faq.id} className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                    {editingFaqId === faq.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editedQuestion}
                          onChange={(e) => setEditedQuestion(e.target.value)}
                          className="w-full border border-purple-300 px-3 py-2 rounded-lg font-medium"
                          placeholder="Question"
                        />
                        <textarea
                          value={editedAnswer}
                          onChange={(e) => setEditedAnswer(e.target.value)}
                          rows={3}
                          className="w-full border border-purple-300 px-3 py-2 rounded-lg text-sm"
                          placeholder="Answer"
                          maxLength={1000}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {editedAnswer.length}/1000 characters
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={saveEditedFaq}
                              className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditingFaq}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-purple-600 uppercase">
                              {faq.is_intro ? "INTRO" : faq.is_fallback ? "FALLBACK" : faq.is_sales ? "SALES" : faq.is_no_answer ? "NO ANSWER" : "SYSTEM"}
                            </span>
                            <h4 className="font-semibold text-gray-900 text-left">{faq.question}</h4>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => startEditingFaq(faq)}
                              className="p-1.5 text-purple-600 hover:bg-purple-100 rounded"
                              title="Edit system FAQ"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 text-left">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Save FAQs Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveFAQs}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                💾 Save FAQs
              </button>
            </div>
          </div>
          
          {/* Presenter Photo & Video Generation */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-bold text-graydark mb-6">Presenter Details & Generate AI Videos</h3>
            
            {/* Presenter Name */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-graydark mb-2 text-left">
                Presenter Name (Optional)
              </label>
              <input
                type="text"
                value={presenterName}
                onChange={(e) => setPresenterName(e.target.value)}
                placeholder="Enter presenter name (optional)"
                className="w-full border border-strokedark/20 px-4 py-3 rounded-lg text-left"
              />
            </div>
            
            {/* Voice Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-graydark mb-2 text-left">
                Select AI Voice <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3 text-left">
                Choose the voice that will read your FAQ answers (Click speaker icon to preview)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {voices.slice(0, 6).map((voice) => (
                  <div
                    key={voice.id}
                    onClick={() => {
                      console.log(`🎤 Voice clicked: ${voice.name} (ID: ${voice.id})`);
                      setSelectedVoice(voice.id);
                    }}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedVoice === voice.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {voice.name}
                          </h4>
                          {voice.is_default && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                              Default
                            </span>
                          )}
                          {selectedVoice === voice.id && (
                            <CheckIcon className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {voice.gender} • {voice.language}
                        </p>
                        {voice.accent && (
                          <p className="text-xs text-gray-500 mt-1">
                            {voice.accent}
                          </p>
                        )}
                      </div>
                      
                      {/* Preview Speaker Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoicePreview(voice.id);
                        }}
                        disabled={previewingVoiceId === voice.id}
                        className={`ml-3 p-2 rounded-full transition-all duration-200 ${
                          previewingVoiceId === voice.id
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                        }`}
                        title="Preview voice"
                      >
                        <SpeakerWaveIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {!selectedVoice && (
                <p className="text-xs text-red-500 mt-2 text-left">
                  Please select a voice to continue
                </p>
              )}
            </div>

            {/* Presenter Photo */}
            <div className="mb-6" id="presenter-photo-section">
              <label className="block text-sm font-bold text-graydark mb-2 text-left">
                Presenter Photo <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3 text-left">
                <span className="font-semibold text-red-600">Required:</span>{' '}
                Upload a clear, front-facing photo for the AI avatar (max 5MB)
              </p>

              {presenterPhotoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={presenterPhotoPreview}
                    alt="Presenter preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-blue-300"
                  />
                  <button
                    onClick={removePresenterPhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="block w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer border-red-300 bg-red-50 hover:border-red-500 hover:bg-red-100">
                  <div className="space-y-2">
                    <div className="text-red-400">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-red-600">
                      Required: Click to upload presenter photo
                    </div>
                    <div className="text-xs text-gray-600">
                      or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePresenterPhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            {/* Generate Videos Button - Centered */}
            <div className="space-y-3">
              <div className="flex justify-center">
                <button
                  onClick={handleGenerateVideos}
                  disabled={isGeneratingVideos || !selectedVoice || !presenterPhoto}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingVideos ? "Generating..." : `Generate ${generatedFAQs.total_videos} AI Videos`}
                </button>
              </div>

              {/* Requirements Notice */}
              {(!presenterPhoto || !selectedVoice) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Missing Requirements:</span>
                    {!presenterPhoto && !selectedVoice && " Upload presenter photo and select AI voice"}
                    {!presenterPhoto && selectedVoice && " Upload presenter photo"}
                    {presenterPhoto && !selectedVoice && " Select AI voice"}
                  </p>
                </div>
              )}
            </div>
            
            {/* Video Generation Progress */}
            {isGeneratingVideos && videoGenerationProgress && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <p className="text-sm font-medium text-purple-700">{videoGenerationProgress}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Custom FAQ Modal */}
      <CustomFAQModal
        isOpen={isCustomFAQModalOpen}
        onClose={() => setIsCustomFAQModalOpen(false)}
        onSave={handleAddCustomFAQ}
        companyName={company?.name}
        qudemoId={createdQudemoId}
      />
    </div>
  );
};

export default CreateQudemoTwoStep;

