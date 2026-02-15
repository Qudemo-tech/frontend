import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, FileText, HelpCircle, Upload, Link } from "lucide-react";
import AVATAR_VIDEOS from "../Videos";

// Languages for multi-select
const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "ar", label: "Arabic" },
  { id: "fr", label: "French" },
  { id: "hi", label: "Hindi" },
  { id: "es", label: "Spanish" },
  { id: "zh", label: "Mandarin" },
  { id: "ja", label: "Japanese" },
];

// Typeform-style design tokens (Paper + Ink palette, Plus Jakarta Sans)
const AvatarVideoCard = ({ avatar, isSelected, onSelect, TYPEFORM }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isSelected) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isSelected]);

  const handleMouseEnter = () => {
    const el = videoRef.current;
    if (el) el.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    const el = videoRef.current;
    if (el && !isSelected) el.pause();
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative block w-full aspect-square rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#262627] focus:ring-offset-2"
      style={{
        border: `2px solid ${isSelected ? TYPEFORM.accent : TYPEFORM.border}`,
        borderRadius: TYPEFORM.radius,
      }}
    >
      <video
        ref={videoRef}
        src={avatar.videoSrc}
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      />
      <div
        className="absolute inset-0 flex items-end justify-center p-2"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}
      >
        <span className="text-xs font-medium text-white truncate w-full text-center">
          {avatar.name}
        </span>
      </div>
    </button>
  );
};

const TYPEFORM = {
  font: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  bg: "#FFFFFF",
  bgCard: "#FFFFFF",
  text: "#262627",
  textMuted: "#6B6B6B",
  accent: "#262627",
  accentHover: "#000000",
  border: "#E8E8E8",
  borderFocus: "#262627",
  radius: "12px",
  radiusFull: "50px",
};

const CourseCreationPage = () => {
  const navigate = useNavigate();

  // Mode: null = choose, "design" = design flow, "request" = request flow
  const [courseCreationMode, setCourseCreationMode] = useState(null);

  // Wizard step: "details" | "module" | "final"
  const [step, setStep] = useState("details");

  // Step index for modules (0-based)
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);

  // Request flow state
  const [requestCourseName, setRequestCourseName] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [requestPdf, setRequestPdf] = useState(null);
  const [requestVideoUrls, setRequestVideoUrls] = useState([]);
  const [requestVideoUrlInput, setRequestVideoUrlInput] = useState("");
  const [showRequestSuccessModal, setShowRequestSuccessModal] = useState(false);

  // Form state (persisted across steps)
  const [courseName, setCourseName] = useState("");
  const [numModules, setNumModules] = useState(3);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [designPdfs, setDesignPdfs] = useState([]);
  const [designVideoUrls, setDesignVideoUrls] = useState([]);
  const [designVideoUrlInput, setDesignVideoUrlInput] = useState("");
  const [modules, setModules] = useState([
    {
      id: 1,
      name: "",
      submodules: [
        {
          id: 101,
          type: "lecture",
          avatarSpeaking: "",
          pdfFile: null,
          videoLink: "",
          questions: [],
        },
      ],
    },
  ]);

  // Create/update modules when numModules changes (from details step)
  const ensureModulesCount = () => {
    const n = Math.max(1, Math.min(20, parseInt(numModules, 10) || 1));
    setModules((prev) => {
      const next = [];
      for (let i = 0; i < n; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else {
          next.push({
            id: Date.now() + i,
            name: "",
            submodules: [
              {
                id: Date.now() + 100 + i,
                type: "lecture",
                avatarSpeaking: "",
                pdfFile: null,
                videoLink: "",
                questions: [],
              },
            ],
          });
        }
      }
      return next;
    });
  };

  const numModulesInt = Math.max(1, Math.min(20, parseInt(numModules, 10) || 1));

  const toggleLanguage = (id) => {
    setSelectedLanguages((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState({});

  const updateModule = (index, field, value) => {
    setModules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addSubmodule = (moduleIndex) => {
    setModules((prev) => {
      const next = [...prev];
      const mod = next[moduleIndex];
      const newSub = {
        id: Date.now(),
        type: "lecture",
        avatarSpeaking: "",
        pdfFile: null,
        videoLink: "",
        questions: [],
      };
      next[moduleIndex] = {
        ...mod,
        submodules: [...(mod.submodules || []), newSub],
      };
      return next;
    });
  };

  const updateSubmodule = (moduleIndex, subIndex, field, value) => {
    setModules((prev) => {
      const next = [...prev];
      const submodules = [...(next[moduleIndex].submodules || [])];
      submodules[subIndex] = { ...submodules[subIndex], [field]: value };
      next[moduleIndex] = { ...next[moduleIndex], submodules };
      return next;
    });
  };

  const removeSubmodule = (moduleIndex, subIndex) => {
    setModules((prev) => {
      const next = [...prev];
      const submodules = (next[moduleIndex].submodules || []).filter((_, i) => i !== subIndex);
      next[moduleIndex] = { ...next[moduleIndex], submodules };
      return next;
    });
  };

  const addQuestion = (moduleIndex, subIndex) => {
    setModules((prev) => {
      const next = [...prev];
      const submodules = [...(next[moduleIndex].submodules || [])];
      const sub = submodules[subIndex];
      const qs = sub.questions || [];
      submodules[subIndex] = {
        ...sub,
        questions: [
          ...qs,
          { id: Date.now(), question: "", options: ["", "", "", ""] },
        ],
      };
      next[moduleIndex] = { ...next[moduleIndex], submodules };
      return next;
    });
  };

  const updateQuestion = (moduleIndex, subIndex, questionIndex, field, value) => {
    setModules((prev) => {
      const next = [...prev];
      const submodules = [...(next[moduleIndex].submodules || [])];
      const sub = submodules[subIndex];
      const questions = [...(sub.questions || [])];
      questions[questionIndex] = { ...questions[questionIndex], [field]: value };
      submodules[subIndex] = { ...sub, questions };
      next[moduleIndex] = { ...next[moduleIndex], submodules };
      return next;
    });
  };

  const removeQuestion = (moduleIndex, subIndex, questionIndex) => {
    setModules((prev) => {
      const next = [...prev];
      const submodules = [...(next[moduleIndex].submodules || [])];
      const sub = submodules[subIndex];
      const questions = (sub.questions || []).filter((_, i) => i !== questionIndex);
      submodules[subIndex] = { ...sub, questions };
      next[moduleIndex] = { ...next[moduleIndex], submodules };
      return next;
    });
  };

  const validateDetails = () => {
    const e = {};
    if (!courseName.trim()) e.courseName = "Course name is required";
    const n = parseInt(numModules, 10);
    if (isNaN(n) || n < 1 || n > 20) e.numModules = "Number of modules must be between 1 and 20";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateModule = (idx) => {
    const e = {};
    if (!modules[idx]?.name?.trim()) e.moduleName = "Module name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextDetails = () => {
    if (!validateDetails()) return;
    ensureModulesCount();
    setStep("module");
    setCurrentModuleIndex(0);
  };

  const handleNextModule = () => {
    if (!validateModule(currentModuleIndex)) return;
    if (currentModuleIndex < numModulesInt - 1) {
      setCurrentModuleIndex((i) => i + 1);
    } else {
      setStep("final");
    }
  };

  const handleBack = () => {
    if (step === "module" && currentModuleIndex > 0) {
      setCurrentModuleIndex((i) => i - 1);
    } else if (step === "module" && currentModuleIndex === 0) {
      setStep("details");
    } else if (step === "final") {
      setStep("module");
      setCurrentModuleIndex(numModulesInt - 1);
    } else if (step === "details" && courseCreationMode === "design") {
      setCourseCreationMode(null);
      setStep("details");
    }
  };

  const addRequestVideoUrl = () => {
    if (requestVideoUrlInput.trim()) {
      setRequestVideoUrls((prev) => [...prev, requestVideoUrlInput.trim()]);
      setRequestVideoUrlInput("");
    }
  };

  const removeRequestVideoUrl = (index) => {
    setRequestVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const validateRequestForm = () => {
    const e = {};
    if (!requestCourseName.trim()) e.requestCourseName = "Course name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRequestCourse = () => {
    if (!validateRequestForm()) return;
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      setShowRequestSuccessModal(true);
    }, 1500);
  };

  const addDesignPdf = (e) => {
    const files = e.target.files;
    if (files?.length) {
      setDesignPdfs((prev) => [
        ...prev,
        ...Array.from(files).map((f) => ({ id: Date.now() + Math.random(), file: f, name: f.name })),
      ]);
    }
  };

  const removeDesignPdf = (id) => setDesignPdfs((prev) => prev.filter((p) => p.id !== id));

  const addDesignVideoUrl = () => {
    if (designVideoUrlInput.trim()) {
      setDesignVideoUrls((prev) => [...prev, designVideoUrlInput.trim()]);
      setDesignVideoUrlInput("");
    }
  };

  const removeDesignVideoUrl = (index) => setDesignVideoUrls((prev) => prev.filter((_, i) => i !== index));

  const handleDesignCreateCourse = () => {
    if (!validateDetails()) return;
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      setShowSuccessModal(true);
    }, 1500);
  };

  const handleCreateCourse = () => {
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      setShowSuccessModal(true);
    }, 1500);
  };

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: TYPEFORM.bg, fontFamily: TYPEFORM.font }}
    >
      {/* Header - Typeform style */}
      <header
        className="sticky top-0 z-50"
        style={{ backgroundColor: TYPEFORM.bgCard, borderBottom: `1px solid ${TYPEFORM.border}` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div
              className="flex items-center cursor-pointer gap-2"
              onClick={() => navigate("/")}
            >
              <img
                src="/Qudemo LP.svg"
                alt="Qudemo Logo"
                className="w-auto h-6 sm:h-7 md:h-8 scale-[2.5] sm:scale-[3] md:scale-[3.5] origin-left"
              />
            </div>
            <button
              onClick={() => navigate("/v2-avatar/courses")}
              className="text-sm font-medium transition-colors"
              style={{ color: TYPEFORM.textMuted }}
            >
              Back to Courses
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress indicator - hidden for design (single-step flow) */}
        {courseCreationMode === "design" && (step === "module" || step === "final") && (
          <div className="mb-8">
            <div
              className="flex items-center justify-between text-sm font-medium mb-2"
              style={{ color: TYPEFORM.textMuted }}
            >
              <span>Course Details</span>
              <span>Modules</span>
              <span>Create</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: TYPEFORM.border }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width:
                    step === "details"
                      ? "33%"
                      : step === "module"
                      ? `${33 + (66 * (currentModuleIndex + 1)) / numModulesInt}%`
                      : "100%",
                  backgroundColor: TYPEFORM.accent,
                }}
              />
            </div>
          </div>
        )}

        {/* Mode selection - first page (CourseCraft style) */}
        {courseCreationMode === null && (
          <div className="max-w-2xl mx-auto">
            <h1
              className="text-3xl sm:text-4xl font-bold mb-12 text-center"
              style={{ color: TYPEFORM.text }}
            >
              How would you like to create your course?
            </h1>
            <div className="space-y-6">
              {/* Design my own course card */}
              <div
                className="rounded-2xl p-8 transition-all duration-200 hover:shadow-lg"
                style={{
                  backgroundColor: TYPEFORM.bgCard,
                  border: `1px solid ${TYPEFORM.border}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <h2
                  className="text-xl font-semibold mb-3"
                  style={{ color: TYPEFORM.text }}
                >
                  Design my own course
                </h2>
                <p
                  className="text-base mb-6 leading-relaxed"
                  style={{ color: TYPEFORM.textMuted }}
                >
                  Build your course step by step with full control over modules, content, and quizzes.
                </p>
                <button
                  onClick={() => {
                    setCourseCreationMode("design");
                    setStep("details");
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-full transition-all hover:opacity-90"
                  style={{
                    backgroundColor: TYPEFORM.accent,
                    borderRadius: TYPEFORM.radiusFull,
                  }}
                >
                  Get started
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {/* Request a Course card */}
              <div
                className="rounded-2xl p-8 transition-all duration-200 hover:shadow-lg"
                style={{
                  backgroundColor: TYPEFORM.bgCard,
                  border: `1px solid ${TYPEFORM.border}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <h2
                  className="text-xl font-semibold mb-3"
                  style={{ color: TYPEFORM.text }}
                >
                  Request a Course
                </h2>
                <p
                  className="text-base mb-6 leading-relaxed"
                  style={{ color: TYPEFORM.textMuted }}
                >
                  Tell us what you need and we'll create your course for you within 3 business days.
                </p>
                <button
                  onClick={() => setCourseCreationMode("request")}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-full transition-all hover:opacity-90"
                  style={{
                    backgroundColor: TYPEFORM.accent,
                    borderRadius: TYPEFORM.radiusFull,
                  }}
                >
                  Get started
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request Course flow */}
        {courseCreationMode === "request" && (
          <div
            className="rounded-lg shadow-sm p-6 sm:p-8"
            style={{ backgroundColor: TYPEFORM.bgCard, border: `1px solid ${TYPEFORM.border}` }}
          >
            <h2
              className="text-2xl font-semibold mb-8"
              style={{ color: TYPEFORM.text }}
            >
              Request a Course
            </h2>
            <div className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: TYPEFORM.text }}
                >
                  Course Name <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={requestCourseName}
                  onChange={(e) => setRequestCourseName(e.target.value)}
                  placeholder="e.g. Introduction to 5G"
                  className="w-full px-4 py-3 text-base font-normal outline-none"
                  style={{
                    borderRadius: TYPEFORM.radius,
                    border: `1px solid ${errors.requestCourseName ? "#DC2626" : TYPEFORM.border}`,
                    color: TYPEFORM.text,
                  }}
                />
                {errors.requestCourseName && (
                  <p className="mt-1 text-sm" style={{ color: "#DC2626" }}>{errors.requestCourseName}</p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: TYPEFORM.text }}
                >
                  Course Description
                </label>
                <textarea
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Describe your course requirements..."
                  rows={4}
                  className="w-full px-4 py-3 text-base font-normal outline-none resize-none"
                  style={{
                    borderRadius: TYPEFORM.radius,
                    border: `1px solid ${TYPEFORM.border}`,
                    color: TYPEFORM.text,
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: TYPEFORM.text }}
                >
                  Any Relevant PDF (Optional)
                </label>
                <label
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors rounded-lg"
                  style={{
                    border: `1px dashed ${TYPEFORM.border}`,
                    color: TYPEFORM.textMuted,
                  }}
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">
                    {requestPdf?.name || "Upload .pdf"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setRequestPdf(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: TYPEFORM.text }}
                >
                  Any Relevant Videos (Optional)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={requestVideoUrlInput}
                    onChange={(e) => setRequestVideoUrlInput(e.target.value)}
                    placeholder="Paste video URL"
                    className="flex-1 px-4 py-3 text-base font-normal outline-none"
                    style={{
                      borderRadius: TYPEFORM.radius,
                      border: `1px solid ${TYPEFORM.border}`,
                      color: TYPEFORM.text,
                    }}
                  />
                  <button
                    type="button"
                    onClick={addRequestVideoUrl}
                    className="inline-flex items-center gap-2 px-4 py-3 font-medium"
                    style={{
                      backgroundColor: TYPEFORM.accent,
                      color: "white",
                      borderRadius: TYPEFORM.radius,
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {requestVideoUrls.length > 0 && (
                  <ul className="space-y-2">
                    {requestVideoUrls.map((url, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between px-4 py-2 rounded-lg"
                        style={{ backgroundColor: `${TYPEFORM.bg}99`, border: `1px solid ${TYPEFORM.border}` }}
                      >
                        <span className="text-sm truncate" style={{ color: TYPEFORM.text }}>{url}</span>
                        <button
                          type="button"
                          onClick={() => removeRequestVideoUrl(i)}
                          className="text-sm font-medium"
                          style={{ color: "#DC2626" }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCourseCreationMode(null)}
                className="inline-flex items-center gap-2 px-6 py-2.5 font-medium transition-colors"
                style={{
                  border: `1px solid ${TYPEFORM.border}`,
                  borderRadius: TYPEFORM.radiusFull,
                  color: TYPEFORM.text,
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleRequestCourse}
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-white font-medium disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                style={{
                  backgroundColor: TYPEFORM.accent,
                  borderRadius: TYPEFORM.radiusFull,
                }}
              >
                {isCreating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Request Course"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Course Details (Design flow only) */}
        {courseCreationMode === "design" && step === "details" && (
          <div
            className="rounded-lg shadow-sm p-6 sm:p-8"
            style={{ backgroundColor: TYPEFORM.bgCard, border: `1px solid ${TYPEFORM.border}` }}
          >
            <h2
              className="text-2xl font-semibold mb-8"
              style={{ color: TYPEFORM.text }}
            >
              Course Details
            </h2>
            <div className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: TYPEFORM.text }}
                >
                  Course Name <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Introduction to 5G"
                  className="w-full px-4 py-3 text-base font-normal outline-none"
                  style={{
                    borderRadius: TYPEFORM.radius,
                    border: `1px solid ${errors.courseName ? "#DC2626" : TYPEFORM.border}`,
                    color: TYPEFORM.text,
                  }}
                />
                {errors.courseName && (
                  <p className="mt-1 text-sm" style={{ color: "#DC2626" }}>{errors.courseName}</p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: TYPEFORM.text }}
                >
                  Number of Modules <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={numModules}
                  onChange={(e) => setNumModules(e.target.value)}
                  className="w-full px-4 py-3 text-base font-normal outline-none"
                  style={{
                    borderRadius: TYPEFORM.radius,
                    border: `1px solid ${errors.numModules ? "#DC2626" : TYPEFORM.border}`,
                    color: TYPEFORM.text,
                  }}
                />
                {errors.numModules && (
                  <p className="mt-1 text-sm" style={{ color: "#DC2626" }}>{errors.numModules}</p>
                )}
                <p className="mt-1 text-xs" style={{ color: TYPEFORM.textMuted }}>
                  Enter a number between 1 and 20
                </p>
              </div>

              {/* Select Avatar */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: TYPEFORM.text }}
                >
                  Select Avatar
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {AVATAR_VIDEOS.map((avatar) => (
                    <AvatarVideoCard
                      key={avatar.id}
                      avatar={avatar}
                      isSelected={selectedAvatar === avatar.id}
                      onSelect={() => setSelectedAvatar(avatar.id)}
                      TYPEFORM={TYPEFORM}
                    />
                  ))}
                </div>
              </div>

              {/* Select Language */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: TYPEFORM.text }}
                >
                  Select Language
                </label>
                <p className="text-xs mb-3" style={{ color: TYPEFORM.textMuted }}>
                  Select one or more languages for your course
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {LANGUAGES.map((lang) => (
                    <label
                      key={lang.id}
                      className="flex items-center gap-3 p-4 cursor-pointer transition-colors rounded-lg"
                      style={{
                        border: `1px solid ${selectedLanguages.includes(lang.id) ? TYPEFORM.accent : TYPEFORM.border}`,
                        backgroundColor: selectedLanguages.includes(lang.id) ? `${TYPEFORM.accent}08` : TYPEFORM.bgCard,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang.id)}
                        onChange={() => toggleLanguage(lang.id)}
                        className="w-4 h-4"
                        style={{ accentColor: TYPEFORM.accent }}
                      />
                      <span className="text-sm font-medium" style={{ color: TYPEFORM.text }}>
                        {lang.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Upload PDF (multiple) */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: TYPEFORM.text }}
                >
                  Upload PDF (Optional)
                </label>
                <label
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors rounded-lg mb-3"
                  style={{
                    border: `1px dashed ${TYPEFORM.border}`,
                    color: TYPEFORM.textMuted,
                    borderRadius: TYPEFORM.radius,
                  }}
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Add PDF files</span>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={addDesignPdf}
                  />
                </label>
                {designPdfs.length > 0 && (
                  <ul className="space-y-2">
                    {designPdfs.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between px-4 py-2 rounded-lg"
                        style={{ backgroundColor: `${TYPEFORM.bg}99`, border: `1px solid ${TYPEFORM.border}`, borderRadius: TYPEFORM.radius }}
                      >
                        <span className="text-sm truncate" style={{ color: TYPEFORM.text }}>{p.name}</span>
                        <button
                          type="button"
                          onClick={() => removeDesignPdf(p.id)}
                          className="text-sm font-medium"
                          style={{ color: "#DC2626" }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Video Link (multiple) */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: TYPEFORM.text }}
                >
                  Video Links (Optional)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={designVideoUrlInput}
                    onChange={(e) => setDesignVideoUrlInput(e.target.value)}
                    placeholder="Paste video URL"
                    className="flex-1 px-4 py-3 text-base font-normal outline-none"
                    style={{
                      borderRadius: TYPEFORM.radius,
                      border: `1px solid ${TYPEFORM.border}`,
                      color: TYPEFORM.text,
                    }}
                  />
                  <button
                    type="button"
                    onClick={addDesignVideoUrl}
                    className="inline-flex items-center gap-2 px-4 py-3 font-medium"
                    style={{
                      backgroundColor: TYPEFORM.accent,
                      color: "white",
                      borderRadius: TYPEFORM.radius,
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {designVideoUrls.length > 0 && (
                  <ul className="space-y-2">
                    {designVideoUrls.map((url, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between px-4 py-2 rounded-lg"
                        style={{ backgroundColor: `${TYPEFORM.bg}99`, border: `1px solid ${TYPEFORM.border}`, borderRadius: TYPEFORM.radius }}
                      >
                        <span className="text-sm truncate" style={{ color: TYPEFORM.text }}>{url}</span>
                        <button
                          type="button"
                          onClick={() => removeDesignVideoUrl(i)}
                          className="text-sm font-medium"
                          style={{ color: "#DC2626" }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => {
                  setCourseCreationMode(null);
                  setStep("details");
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 font-medium transition-colors"
                style={{
                  border: `1px solid ${TYPEFORM.border}`,
                  borderRadius: TYPEFORM.radiusFull,
                  color: TYPEFORM.text,
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleDesignCreateCourse}
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-white font-medium disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                style={{
                  backgroundColor: TYPEFORM.accent,
                  borderRadius: TYPEFORM.radiusFull,
                }}
              >
                {isCreating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Course"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Module (repeat for each module) - Design flow only */}
        {courseCreationMode === "design" && step === "module" && modules[currentModuleIndex] && (
          <div
            className="rounded-lg shadow-sm p-6 sm:p-8"
            style={{ backgroundColor: TYPEFORM.bgCard, border: `1px solid ${TYPEFORM.border}` }}
          >
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: TYPEFORM.text }}
            >
              Module {currentModuleIndex + 1} of {numModulesInt}
            </h2>
            <p className="text-sm mb-6" style={{ color: TYPEFORM.textMuted }}>
              Add submodules to this module. Each submodule is either a Lecture or a Quiz.
            </p>

            <div className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: TYPEFORM.text }}
                >
                  Module Name <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={modules[currentModuleIndex].name}
                  onChange={(e) =>
                    updateModule(currentModuleIndex, "name", e.target.value)
                  }
                  placeholder="e.g. Introduction"
                  className="w-full px-4 py-3 text-base font-normal outline-none"
                  style={{
                    borderRadius: TYPEFORM.radius,
                    border: `1px solid ${errors.moduleName ? "#DC2626" : TYPEFORM.border}`,
                    color: TYPEFORM.text,
                  }}
                />
                {errors.moduleName && (
                  <p className="mt-1 text-sm" style={{ color: "#DC2626" }}>{errors.moduleName}</p>
                )}
              </div>

              {/* Submodules */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label
                    className="block text-sm font-medium"
                    style={{ color: TYPEFORM.text }}
                  >
                    Submodules
                  </label>
                  <button
                    onClick={() => addSubmodule(currentModuleIndex)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
                    style={{ color: TYPEFORM.accent, borderRadius: TYPEFORM.radius }}
                  >
                    <Plus className="w-4 h-4" />
                    Add submodule
                  </button>
                </div>

                <div className="space-y-4">
                  {(modules[currentModuleIndex].submodules || []).map(
                    (sub, subIdx) => (
                      <div
                        key={sub.id}
                        className="rounded-lg p-4"
                        style={{ border: `1px solid ${TYPEFORM.border}`, backgroundColor: `${TYPEFORM.bg}99` }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className="text-sm font-medium"
                            style={{ color: TYPEFORM.text }}
                          >
                            Submodule {subIdx + 1}
                          </span>
                          <button
                            onClick={() =>
                              removeSubmodule(currentModuleIndex, subIdx)
                            }
                            className="text-sm font-medium"
                            style={{ color: "#DC2626" }}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mb-4">
                          <label
                            className="block text-xs font-medium mb-2"
                            style={{ color: TYPEFORM.textMuted }}
                          >
                            Type
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`sub-type-${currentModuleIndex}-${subIdx}`}
                                checked={sub.type === "lecture"}
                                onChange={() =>
                                  updateSubmodule(
                                    currentModuleIndex,
                                    subIdx,
                                    "type",
                                    "lecture"
                                  )
                                }
                                style={{ accentColor: TYPEFORM.accent }}
                                className="w-4 h-4"
                              />
                              <FileText className="w-4 h-4" style={{ color: TYPEFORM.textMuted }} />
                              <span className="text-sm" style={{ color: TYPEFORM.text }}>Lecture</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`sub-type-${currentModuleIndex}-${subIdx}`}
                                checked={sub.type === "quiz"}
                                onChange={() =>
                                  updateSubmodule(
                                    currentModuleIndex,
                                    subIdx,
                                    "type",
                                    "quiz"
                                  )
                                }
                                style={{ accentColor: TYPEFORM.accent }}
                                className="w-4 h-4"
                              />
                              <HelpCircle className="w-4 h-4" style={{ color: TYPEFORM.textMuted }} />
                              <span className="text-sm" style={{ color: TYPEFORM.text }}>Quiz</span>
                            </label>
                          </div>
                        </div>

                        {sub.type === "lecture" && (
                          <div className="space-y-4">
                            <div>
                              <label
                                className="block text-xs font-medium mb-2"
                                style={{ color: TYPEFORM.textMuted }}
                              >
                                Avatar Speaking
                              </label>
                              <textarea
                                value={sub.avatarSpeaking || ""}
                                onChange={(e) =>
                                  updateSubmodule(
                                    currentModuleIndex,
                                    subIdx,
                                    "avatarSpeaking",
                                    e.target.value
                                  )
                                }
                                placeholder="What should the AI avatar say?"
                                rows={3}
                                className="w-full px-3 py-2 text-sm font-normal outline-none resize-none"
                                style={{
                                  borderRadius: TYPEFORM.radius,
                                  border: `1px solid ${TYPEFORM.border}`,
                                  color: TYPEFORM.text,
                                }}
                              />
                            </div>
                            <div>
                              <label
                                className="block text-xs font-medium mb-2"
                                style={{ color: TYPEFORM.textMuted }}
                              >
                                PDF Upload
                              </label>
                              <label
                                className="flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors"
                                style={{
                                  border: `1px dashed ${TYPEFORM.border}`,
                                  borderRadius: TYPEFORM.radius,
                                  color: TYPEFORM.textMuted,
                                }}
                              >
                                <Upload className="w-4 h-4" />
                                <span className="text-sm">
                                  {sub.pdfFile?.name || "Upload .pdf"}
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f)
                                      updateSubmodule(
                                        currentModuleIndex,
                                        subIdx,
                                        "pdfFile",
                                        f
                                      );
                                  }}
                                />
                              </label>
                            </div>
                            <div>
                              <label
                                className="block text-xs font-medium mb-2"
                                style={{ color: TYPEFORM.textMuted }}
                              >
                                Video Link
                              </label>
                              <div className="relative">
                                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: TYPEFORM.textMuted }} />
                                <input
                                  type="url"
                                  value={sub.videoLink || ""}
                                  onChange={(e) =>
                                    updateSubmodule(
                                      currentModuleIndex,
                                      subIdx,
                                      "videoLink",
                                      e.target.value
                                    )
                                  }
                                  placeholder="https://..."
                                  className="w-full pl-10 pr-4 py-2 text-sm font-normal outline-none"
                                  style={{
                                    borderRadius: TYPEFORM.radius,
                                    border: `1px solid ${TYPEFORM.border}`,
                                    color: TYPEFORM.text,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {sub.type === "quiz" && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <label
                                className="block text-xs font-medium"
                                style={{ color: TYPEFORM.textMuted }}
                              >
                                Questions
                              </label>
                              <button
                                onClick={() =>
                                  addQuestion(currentModuleIndex, subIdx)
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
                                style={{ color: TYPEFORM.accent, borderRadius: TYPEFORM.radius }}
                              >
                                <Plus className="w-3 h-3" />
                                Add question
                              </button>
                            </div>
                            <div className="space-y-3">
                              {(sub.questions || []).map((q, qIdx) => (
                                <div
                                  key={q.id}
                                  className="p-3 rounded-lg"
                                  style={{
                                    backgroundColor: TYPEFORM.bgCard,
                                    border: `1px solid ${TYPEFORM.border}`,
                                    borderRadius: TYPEFORM.radius,
                                  }}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <input
                                      type="text"
                                      value={q.question || ""}
                                      onChange={(e) =>
                                        updateQuestion(
                                          currentModuleIndex,
                                          subIdx,
                                          qIdx,
                                          "question",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Question"
                                      className="flex-1 px-3 py-2 text-sm font-normal outline-none"
                                      style={{
                                        borderRadius: TYPEFORM.radius,
                                        border: `1px solid ${TYPEFORM.border}`,
                                        color: TYPEFORM.text,
                                      }}
                                    />
                                    <button
                                      onClick={() =>
                                        removeQuestion(
                                          currentModuleIndex,
                                          subIdx,
                                          qIdx
                                        )
                                      }
                                      className="ml-2"
                                      style={{ color: TYPEFORM.textMuted }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(q.options || ["", "", "", ""]).map(
                                      (opt, oIdx) => (
                                        <input
                                          key={oIdx}
                                          type="text"
                                          value={opt}
                                          onChange={(e) => {
                                            const opts = [...(q.options || ["", "", "", ""])];
                                            opts[oIdx] = e.target.value;
                                            updateQuestion(
                                              currentModuleIndex,
                                              subIdx,
                                              qIdx,
                                              "options",
                                              opts
                                            );
                                          }}
                                          placeholder={`Option ${oIdx + 1}`}
                                          className="px-3 py-1.5 text-sm font-normal outline-none"
                                          style={{
                                            borderRadius: TYPEFORM.radius,
                                            border: `1px solid ${TYPEFORM.border}`,
                                            color: TYPEFORM.text,
                                          }}
                                        />
                                      )
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-6 py-2.5 font-medium transition-colors"
                style={{
                  border: `1px solid ${TYPEFORM.border}`,
                  borderRadius: TYPEFORM.radiusFull,
                  color: TYPEFORM.text,
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleNextModule}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-white font-medium transition-colors"
                style={{
                  backgroundColor: TYPEFORM.accent,
                  borderRadius: TYPEFORM.radiusFull,
                }}
              >
                {currentModuleIndex < numModulesInt - 1 ? (
                  <>
                    Next Module
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Final - Design flow only */}
        {courseCreationMode === "design" && step === "final" && (
          <div
            className="rounded-lg shadow-sm p-6 sm:p-8"
            style={{ backgroundColor: TYPEFORM.bgCard, border: `1px solid ${TYPEFORM.border}` }}
          >
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: TYPEFORM.text }}
            >
              Ready to create your course
            </h2>
            <p className="text-sm mb-6" style={{ color: TYPEFORM.textMuted }}>
              Review your course structure below. Click Create Course when ready.
            </p>

            <div
              className="rounded-lg p-4 mb-8"
              style={{
                border: `1px solid ${TYPEFORM.border}`,
                backgroundColor: `${TYPEFORM.bg}99`,
              }}
            >
              <h3 className="font-medium mb-3" style={{ color: TYPEFORM.text }}>{courseName || "Untitled"}</h3>
              <div className="space-y-2 text-sm" style={{ color: TYPEFORM.textMuted }}>
                {modules.slice(0, numModulesInt).map((m, i) => (
                  <div key={m.id}>
                    <span className="font-medium">Module {i + 1}:</span>{" "}
                    {m.name || "(unnamed)"}
                    {m.submodules?.length > 0 && (
                      <span style={{ color: TYPEFORM.textMuted }}>
                        {" "}
                        — {m.submodules.length} submodule(s)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-6 py-2.5 font-medium transition-colors"
                style={{
                  border: `1px solid ${TYPEFORM.border}`,
                  borderRadius: TYPEFORM.radiusFull,
                  color: TYPEFORM.text,
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-white font-medium disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                style={{
                  backgroundColor: TYPEFORM.accent,
                  borderRadius: TYPEFORM.radiusFull,
                }}
              >
                {isCreating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Course"
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Success modal - Design flow */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div
            className="rounded-lg shadow-xl max-w-sm w-full p-6 text-center"
            style={{ backgroundColor: TYPEFORM.bgCard }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#D1FAE5" }}
            >
              <span className="text-2xl" style={{ color: "#059669" }}>✓</span>
            </div>
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: TYPEFORM.text }}
            >
              {courseName || "Course"} is being created
            </h3>
            <p className="text-sm mb-6" style={{ color: TYPEFORM.textMuted }}>
              You'll receive a notification once it's ready.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/v2-avatar/courses");
              }}
              className="w-full px-6 py-2.5 text-white font-medium"
              style={{
                backgroundColor: TYPEFORM.accent,
                borderRadius: TYPEFORM.radiusFull,
              }}
            >
              Back to Courses
            </button>
          </div>
        </div>
      )}

      {/* Success modal - Request flow */}
      {showRequestSuccessModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div
            className="rounded-lg shadow-xl max-w-sm w-full p-6 text-center"
            style={{ backgroundColor: TYPEFORM.bgCard }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#D1FAE5" }}
            >
              <span className="text-2xl" style={{ color: "#059669" }}>✓</span>
            </div>
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: TYPEFORM.text }}
            >
              Your {requestCourseName || "course"} will be created in 3 business days
            </h3>
            <p className="text-sm mb-6" style={{ color: TYPEFORM.textMuted }}>
              Our team will review your request and build your course accordingly.
            </p>
            <button
              onClick={() => {
                setShowRequestSuccessModal(false);
                navigate("/v2-avatar/courses");
              }}
              className="w-full px-6 py-2.5 text-white font-medium"
              style={{
                backgroundColor: TYPEFORM.accent,
                borderRadius: TYPEFORM.radiusFull,
              }}
            >
              Back to Courses
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCreationPage;
