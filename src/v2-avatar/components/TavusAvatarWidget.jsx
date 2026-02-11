import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from 'react-player/lazy';
import {
  X,
  Volume2,
  VolumeX,
  PhoneOff,
  Mic,
  MicOff,
  Ear,
  Brain,
  Smile,
  User,
  Video,
  Award,
  Menu,
} from "lucide-react";
import { getApiUrl, getCreateConversationUrl, getEndConversationUrl } from '../config/api';
import { useEventLogger } from '../hooks/useEventLogger';
import { useDemoVideo } from '../hooks/useDemoVideo';
import { usePdfPresentation } from '../hooks/usePdfPresentation';
// TODO: useMcqQuiz hook is available for future refactoring
// import useMcqQuiz from '../hooks/useMcqQuiz';
import TavusSessionManager from '../utils/TavusSessionManager';
import DailyEventManager from '../utils/DailyEventManager';
import LearningModules from './LearningModules';
import EntriLearningModules from './EntriLearningModules';
import MCQQuizOverlay from './MCQQuizOverlay';
import PdfPresentation from './PdfPresentation';
import { getPersona } from '../personas';
// Presentation configs - imported from persona folders
import { functionsAtEntriPresentation } from '../personas/entri/presentations/functions-at-entri';
import { hrPoliciesPresentation } from '../personas/entri/presentations/hr-policies';
import { employeeBenefitsPresentation } from '../personas/entri/presentations/employee-benefits';
import { speedLatencyPresentation } from '../personas/5G/presentations/speed-latency';
import { qatarPearlDivingPresentation } from '../personas/qatar_history/presentations/qatar-pearl-diving';
import { qatarOilGasPresentation } from '../personas/qatar_history/presentations/qatar-oil-gas';
import { microwaveWindowPresentation } from '../personas/microwave/presentations/microwave-window';

// Presentation registry - maps presentationConfig names to their data
const PRESENTATION_REGISTRY = {
  'functions-at-entri': functionsAtEntriPresentation,
  'hr-policies': hrPoliciesPresentation,
  'employee-benefits': employeeBenefitsPresentation,
  'speed-latency': speedLatencyPresentation,
  'qatar-pearl-diving': qatarPearlDivingPresentation,
  'qatar-oil-gas': qatarOilGasPresentation,
  'microwave-window': microwaveWindowPresentation,
};

// Note: videoCompletionPrompts and moduleTransitionPrompts are now accessed via persona.prompts


/**
 * TavusAvatarWidget - Tavus CVI avatar widget using Daily.co
 *
 * Adapted from MobileAvatarWidget for Tavus/Daily.co instead of HeyGen/LiveKit
 */
export const TavusAvatarWidget = ({ onDisconnect, autoExpand = true, onExpand, personaId } = {}) => {
  console.log('[TAVUS-WIDGET] TavusAvatarWidget rendering - autoExpand:', autoExpand, 'personaId:', personaId, 'hasOnExpand:', !!onExpand);

  // Get persona configuration - all persona-specific behavior flows from this
  const persona = useMemo(() => getPersona(personaId), [personaId]);

  // Helper function to check if persona should show learning modules
  const shouldShowLearningModules = useCallback(() => {
    return persona.hasFeature('learningModules');
  }, [persona]);

  const [state, setState] = useState(autoExpand ? "maximized" : "minimized");
  const [isMuted, setIsMuted] = useState(true);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [email, setEmail] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Tavus/Daily states
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [hasLiveVideo, setHasLiveVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [avatarState, setAvatarState] = useState("idle");
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [detectedIntents, setDetectedIntents] = useState([]);
  const [showCalendly, setShowCalendly] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pendingPdfUrl, setPendingPdfUrl] = useState(null);
  
  // Learning modules state - only show for Entri and Evolution personas
  const [activeModule, setActiveModule] = useState(null);
  const [completedModules, setCompletedModules] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showLearningModules, setShowLearningModules] = useState(shouldShowLearningModules());

  // Get module configuration from persona (empty arrays/objects for personas without modules)
  const moduleOrder = persona.modules.order || [];
  const modulesRequiringConfirmation = persona.modules.requiresConfirmation || [];
  const sectionEndingModules = persona.modules.sectionEndingModules || [];
  const moduleDefinitions = persona.modules.definitions || {};

  // Track if onboarding has started (for personas with proactive flow)
  const entriOnboardingStartedRef = useRef(false);
  
  // Quiz state - for conversation-based quiz
  const [quizState, setQuizState] = useState({
    isActive: false,
    currentQuestionIndex: 0,
    questions: [
      {
        question: "What is natural selection?",
        correctAnswer: "natural selection",
        keywords: ["natural selection", "survival", "fittest", "adaptation", "better at surviving"],
        topic: "Natural Selection"
      },
      {
        question: "What is genetic drift?",
        correctAnswer: "genetic drift",
        keywords: ["genetic drift", "random", "chance", "population", "random chance"],
        topic: "Genetic Drift"
      },
      {
        question: "What does the fossil record show us?",
        correctAnswer: "fossil record",
        keywords: ["fossil", "evidence", "evolution", "history", "fossil record", "millions of years"],
        topic: "Fossil Record"
      },
      {
        question: "How long did human evolution take?",
        correctAnswer: "millions of years",
        keywords: ["millions", "years", "long time", "evolution", "millions of years"],
        topic: "Evolution Timeline"
      }
    ],
    score: 0,
    waitingForAnswer: false,
    waitingForConfirmation: false, // For partial answers
    lastQuestionAsked: null,
    questionResults: [], // Track correct/incorrect/unanswered for each question
    isAskingQuestion: false // Track if avatar is currently asking a question
  });

  const mountedRef = useRef(true);
  const lastAvatarSpeechRef = useRef('');
  const preDemoWidgetStateRef = useRef(null);
  const preCalendlyWidgetStateRef = useRef(null);
  const preCalendlyMutedRef = useRef(false);
  const preCalendlyAudioEnabledRef = useRef(true);
  const pendingCalendlyRef = useRef(false);
  const pendingDemoVideoRef = useRef(null); // Store pending video URL
  const videoAnnouncementStartedRef = useRef(false); // Track if avatar has started the video announcement
  const pendingPresentationRef = useRef(null); // Store pending presentation data
  const startingPresentationRef = useRef(false); // Guard flag to prevent race condition
  const transitioningSlideRef = useRef(false); // Guard flag for slide transitions
  const userNavigatedToSlideRef = useRef(null); // Track slide user navigated to via voice command
  const pendingPdfNavigationRef = useRef(null); // Pending PDF navigation action (waits for avatar to finish speaking)
  const pdfNavigationAcknowledgedRef = useRef(false); // Track if avatar started speaking the acknowledgment
  const isQandAResponseRef = useRef(false); // Track when avatar is giving a Q&A response (prevents auto-advance)
  const expectingNarrationRef = useRef(false); // Track when we've sent an echo for narration (auto-advance only after this)
  const prePdfWidgetStateRef = useRef(null);
  const hasAutoExpandedRef = useRef(false);
  const proactiveTimeoutRef = useRef(null); // Timeout for proactive continuation
  const handleModuleSelectRef = useRef(null); // Ref to handleModuleSelect function
  const checkModuleCompletionRef = useRef(null); // Ref to checkModuleCompletion function
  const finishModuleSpeechRef = useRef(null); // Ref to finishModuleSpeech function
  const activeModuleRef = useRef(null); // Ref to track current active module
  const isUserSpeakingRef = useRef(false); // Ref for user speaking state
  const isAvatarSpeakingRef = useRef(false); // Ref for avatar speaking state
  const listeningStateRef = useRef(null); // Track current listening state to prevent redundant calls ('enabled' | 'disabled' | null)
  const playDemoVideoRef = useRef(null); // Ref to playDemoVideo function
  const startMcqQuizRef = useRef(null); // Ref to startMcqQuiz function
  const askNextMcqQuestionRef = useRef(null); // Ref to askNextMcqQuestion function
  const completeMcqQuizRef = useRef(null); // Ref to completeMcqQuiz function
  const pendingQuizDataRef = useRef(null); // Stores quiz data while instructions are being spoken
  const pendingModuleTransitionRef = useRef(null); // Pending module ID to transition to after avatar finishes speaking
  const waitingForSectionConfirmationRef = useRef(false); // True when waiting for user to say "continue" to move to next section
  const pendingSectionTransitionRef = useRef(null); // Next module ID when waiting for section confirmation
  const waitingForVideoQuizConfirmationRef = useRef(false); // True when waiting for user to say "continue" to start quiz after video
  const pendingVideoQuizModuleRef = useRef(null); // Module ID for pending video quiz
  const lastVideoUrlRef = useRef(null); // Store last video URL for replay functionality
  const pdfPresentationRef = useRef({ isPresenting: false, currentSlideIndex: 0, totalSlides: 0 }); // Track PDF state for voice commands
  const pdfGoToSlideRef = useRef(null); // Ref to hold latest goToSlide function
  const pdfNarrateSlideRef = useRef(null); // Ref to hold latest narrateSlide function
  const pdfEndPresentationRef = useRef(null); // Ref to hold latest endPresentation function
  const pdfNextSlideRef = useRef(null); // Ref to hold latest nextSlide function (for auto-advance)
  const sidebarAutoHiddenRef = useRef(false); // Track if sidebar has been auto-hidden (only auto-hide once)


  // Quiz uses click-only answers (no voice commands) for reliability

  // 🔒 HARD MODULE SPEECH LOCK - blocks ALL user interaction while module is being spoken
  const moduleSpeechLockRef = useRef(false);
  
  // 📝 Accumulates ALL agent speech for current module
  const moduleSpeechAccumulatorRef = useRef({
    text: '',
    startedAt: null,
    lastChunkAt: null,
    completed: false,
  });
  
  // 🎯 Prevent race conditions with speech epochs
  const speechEpochRef = useRef(0);
  
  // 📝 Store current module prompt to detect and ignore matching user utterances
  const currentModulePromptRef = useRef('');

  // Session manager and event manager refs
  const sessionManagerRef = useRef(null);
  const dailyEventManagerRef = useRef(null);
  const sessionInfoRef = useRef(null);

  // 🔒 Lock to prevent multiple simultaneous startTavusSession calls (race condition fix)
  const isStartingSessionRef = useRef(false);

  // ⏱️ Timeout refs for pending operations (prevent stuck states)
  const pendingVideoTimeoutRef = useRef(null);
  const pendingPdfTimeoutRef = useRef(null);

  // ⏱️ Visibility timeout - end session if user is away for 3 minutes
  const visibilityTimeoutRef = useRef(null);
  const hiddenTimestampRef = useRef(null);
  const SESSION_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

  // State to show "session ended due to inactivity" message
  const [sessionTimedOut, setSessionTimedOut] = useState(false);

  // State for module confirmation pause - waits for user to confirm before moving to next module
  const [waitingForModuleConfirmation, setWaitingForModuleConfirmation] = useState(false);
  const waitingForModuleConfirmationRef = useRef(false); // Ref for use in callbacks

  // MCQ Quiz state - for module-specific quizzes
  const [mcqQuizState, setMcqQuizState] = useState({
    isActive: false,           // Whether MCQ quiz mode is active
    moduleId: null,            // Which module's quiz is running
    currentQuestionIndex: 0,   // Current question (0-based)
    selectedIndex: null,       // User's selected option for current question
    isAnswered: false,         // Whether current question has been answered
    isCorrect: false,          // Whether selected answer is correct
    score: { correct: 0, total: 0 }, // Running score
    quizData: null,            // Quiz configuration from moduleQuizzes.js
    waitingForAvatarToFinish: false, // Waiting for avatar to finish speaking before enabling selection
    pendingNextQuestion: false, // Flag to ask next question when avatar finishes feedback
    pendingQuizComplete: false, // Flag to complete quiz when avatar finishes feedback
  });
  const mcqQuizStateRef = useRef(mcqQuizState); // Ref for use in callbacks

  // Quiz uses click-only answers (no Web Speech API)

  // ⏱️ Inactivity timeout - check-in after 30s, end after 60s of no response
  const INACTIVITY_CHECKIN_MS = 30 * 1000; // 30 seconds for first check-in
  const INACTIVITY_END_MS = 30 * 1000; // Additional 30 seconds before ending
  const inactivityCheckInTimeoutRef = useRef(null);
  const inactivityEndTimeoutRef = useRef(null);
  const hasAskedCheckInRef = useRef(false); // Track if we've already asked "Are you still there?"
  const isWaitingForUserResponseRef = useRef(false); // Track if we're in a waiting state

  // Keep ref in sync with state
  useEffect(() => {
    mcqQuizStateRef.current = mcqQuizState;
  }, [mcqQuizState]);

  // Event logging hook
  const { logs, log, clearLogs } = useEventLogger();

  // Add debug log and send to backend
  const addDebugLog = (message) => {
    const timestampedMsg = `${new Date().toLocaleTimeString()}: ${message}`;
    setDebugLogs(prev => [...prev, timestampedMsg].slice(-10));
    console.log('[TAVUS-DEBUG]', message);

    // Send to backend for logging
    try {
      fetch(`${getApiUrl()}/api/mobile-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log: `[TAVUS] ${timestampedMsg}`,
          userAgent: navigator.userAgent
        })
      }).catch(() => {});
    } catch (e) {}
  };

  // ========== INACTIVITY TIMEOUT FUNCTIONS ==========

  // Clear all inactivity timeouts
  const clearInactivityTimeouts = useCallback(() => {
    if (inactivityCheckInTimeoutRef.current) {
      clearTimeout(inactivityCheckInTimeoutRef.current);
      inactivityCheckInTimeoutRef.current = null;
    }
    if (inactivityEndTimeoutRef.current) {
      clearTimeout(inactivityEndTimeoutRef.current);
      inactivityEndTimeoutRef.current = null;
    }
    hasAskedCheckInRef.current = false;
    isWaitingForUserResponseRef.current = false;
  }, []);

  // Handle inactivity end - politely end the session
  const handleInactivityEnd = useCallback(() => {
    addDebugLog('[INACTIVITY] ⏰ 60 seconds of inactivity - ending session politely');

    // Clear any waiting states
    clearInactivityTimeouts();

    // Reset all confirmation states
    waitingForModuleConfirmationRef.current = false;
    setWaitingForModuleConfirmation(false);
    waitingForSectionConfirmationRef.current = false;
    pendingSectionTransitionRef.current = null;
    waitingForVideoQuizConfirmationRef.current = false;
    pendingVideoQuizModuleRef.current = null;

    // If in MCQ quiz, end it gracefully
    if (mcqQuizStateRef.current.isActive) {
      addDebugLog('[INACTIVITY] Ending active MCQ quiz due to inactivity');
      // Reset quiz state
      setMcqQuizState({
        isActive: false,
        moduleId: null,
        currentQuestionIndex: 0,
        selectedIndex: null,
        isAnswered: false,
        isCorrect: false,
        score: { correct: 0, total: 0 },
        quizData: null,
        waitingForAvatarToFinish: false,
        pendingNextQuestion: false,
        pendingQuizComplete: false,
      });
    }

    // Send polite goodbye message
    const goodbyeMessage = "Thank you for your time. I'll be here whenever you want to continue. Over 80% of people complete this in a single day, you've already made a great start. See you soon!";

    if (dailyEventManagerRef.current) {
      dailyEventManagerRef.current.sendEchoMessage(goodbyeMessage);
    }

    // End the session after the message is spoken
    // The goodbye message is ~35 words, at 150 words/min = ~14 seconds
    // Give 15 seconds to ensure avatar finishes speaking
    setTimeout(() => {
      if (mountedRef.current) {
        addDebugLog('[INACTIVITY] Ending Tavus session after goodbye message');
        // Trigger session end UI state
        setSessionTimedOut(true);

        // Detach daily event manager first (it doesn't have cleanup, uses detachFromDaily)
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.detachFromDaily();
        }

        // Clean up session manager
        if (sessionManagerRef.current?.isInitialized) {
          sessionManagerRef.current.cleanup().catch(err => {
            addDebugLog(`[INACTIVITY] Error cleaning up session manager: ${err.message}`);
          });
        }
      }
    }, 15000);
  }, [addDebugLog, clearInactivityTimeouts]);

  // Handle inactivity check-in - ask if user is still there
  const handleInactivityCheckIn = useCallback(() => {
    addDebugLog('[INACTIVITY] ⏰ 30 seconds of inactivity - asking check-in');
    hasAskedCheckInRef.current = true;

    // Send check-in message
    const checkInMessage = "Hey, are you still there?";

    if (dailyEventManagerRef.current) {
      dailyEventManagerRef.current.sendEchoMessage(checkInMessage);
    }

    // Start the final countdown - 30 more seconds before ending
    inactivityEndTimeoutRef.current = setTimeout(() => {
      handleInactivityEnd();
    }, INACTIVITY_END_MS);
  }, [addDebugLog, handleInactivityEnd]);

  // Start inactivity timeout when waiting for user response
  const startInactivityTimeout = useCallback(() => {
    // Clear any existing timeouts first
    clearInactivityTimeouts();

    // Mark that we're waiting for a response
    isWaitingForUserResponseRef.current = true;

    addDebugLog('[INACTIVITY] ⏱️ Starting 30-second inactivity timeout');

    // Start the check-in timeout (30 seconds)
    inactivityCheckInTimeoutRef.current = setTimeout(() => {
      // Only trigger check-in if still waiting for response
      if (isWaitingForUserResponseRef.current) {
        handleInactivityCheckIn();
      }
    }, INACTIVITY_CHECKIN_MS);
  }, [clearInactivityTimeouts, handleInactivityCheckIn, addDebugLog]);

  // Reset inactivity timeout when user responds
  const resetInactivityTimeout = useCallback(() => {
    if (isWaitingForUserResponseRef.current || hasAskedCheckInRef.current) {
      addDebugLog('[INACTIVITY] ✅ User responded - clearing inactivity timeouts');
    }
    clearInactivityTimeouts();
  }, [clearInactivityTimeouts, addDebugLog]);

  // ========== END INACTIVITY TIMEOUT FUNCTIONS ==========

  // Trigger proactive continuation after 5 seconds of silence
  const triggerProactiveContinuation = useCallback(() => {
    // 🔒 BLOCK proactive continuation when module lock is active
    if (moduleSpeechLockRef.current) {
      return; // Do not trigger any proactive continuation
    }
    
    // Clear any existing timeout
    if (proactiveTimeoutRef.current) {
      clearTimeout(proactiveTimeoutRef.current);
      proactiveTimeoutRef.current = null;
    }

    // Set timeout for 5 seconds
    proactiveTimeoutRef.current = setTimeout(() => {
      // 🔒 Check lock again before executing
      if (moduleSpeechLockRef.current) {
        return;
      }

      // 🛑 BLOCK proactive advancement when waiting for user confirmation
      if (waitingForModuleConfirmationRef.current) {
        addDebugLog('[PROACTIVE] Blocked - waiting for user confirmation');
        return;
      }

      // Check if user hasn't spoken and avatar isn't speaking (use refs for current values)
      if (!isUserSpeakingRef.current && !isAvatarSpeakingRef.current && dailyEventManagerRef.current) {
        // Qatar persona (pf5e3d8bef4a): Enable proactive conversation continuation
        // After 5 seconds of silence, prompt the avatar to continue naturally
        const isQatarPersona = personaId === 'pf5e3d8bef4a';

        if (isQatarPersona) {
          addDebugLog('[PROACTIVE] Qatar: 5 seconds passed, triggering conversation continuation');
          dailyEventManagerRef.current.sendRespondMessage("Continue the conversation naturally with a related topic or question.");
          return;
        }

        // For other personas: Do NOT auto-advance modules - all module transitions require user confirmation
        addDebugLog('[PROACTIVE] 5 seconds passed - NOT auto-advancing (confirmation required)');
      }
      proactiveTimeoutRef.current = null;
    }, 5000);
  }, [addDebugLog, personaId]);

  // Ref to track video playing state for callbacks
  const isDemoPlayingRef = useRef(false);
  const videoCompletionInProgressRef = useRef(false); // Lock to prevent concurrent video completion handling
  const lastVideoCompletionModuleRef = useRef(null); // Track which module's completion was last processed

  // Video modules that should auto-advance after video ends
  // Dynamically built from moduleDefinitions - any module with type: 'video' and hasVideo: true
  const videoModules = useMemo(() => {
    return Object.keys(moduleDefinitions).filter(moduleId => {
      const config = moduleDefinitions[moduleId];
      return config?.type === 'video' && config?.hasVideo === true;
    });
  }, [moduleDefinitions]);

  // Mapping from video modules to their associated quiz modules
  // Dynamically built: looks for a quiz module that follows the video module in moduleOrder
  const videoToQuizMap = useMemo(() => {
    const map = {};
    videoModules.forEach(videoModuleId => {
      const videoIndex = moduleOrder.indexOf(videoModuleId);
      if (videoIndex !== -1 && videoIndex < moduleOrder.length - 1) {
        const nextModuleId = moduleOrder[videoIndex + 1];
        const nextModuleConfig = moduleDefinitions[nextModuleId];
        // If the next module is a quiz, map it
        if (nextModuleConfig?.type === 'quiz') {
          map[videoModuleId] = nextModuleId;
        }
      }
    });
    return map;
  }, [videoModules, moduleOrder, moduleDefinitions]);

  // Callback for when a video module stops - move to next module
  const handleVideoModuleStop = useCallback(() => {
    const currentModule = activeModuleRef.current;
    addDebugLog(`[DEMO] handleVideoModuleStop called - currentModule: ${currentModule}, sectionEndingModules length: ${sectionEndingModules.length}`);

    // Check if current module is a video module
    if (!videoModules.includes(currentModule)) {
      return;
    }

    // Guard 1: Check if we're already processing a video completion
    if (videoCompletionInProgressRef.current) {
      addDebugLog(`[DEMO] ⚠️ Video completion already in progress, skipping duplicate call`);
      return;
    }

    // Guard 2: Check if we already processed this module's completion
    // This prevents the same module from triggering twice (e.g., on replay issues)
    if (lastVideoCompletionModuleRef.current === currentModule) {
      addDebugLog(`[DEMO] ⚠️ Already processed completion for ${currentModule}, skipping`);
      return;
    }

    // Set the lock IMMEDIATELY
    videoCompletionInProgressRef.current = true;
    lastVideoCompletionModuleRef.current = currentModule;
    addDebugLog(`[DEMO] ✅ Video completion proceeding for ${currentModule}`);

    addDebugLog(`[DEMO] Video module finished: ${currentModule}`);

    // Unlock the module lock
    moduleSpeechLockRef.current = false;
    currentModulePromptRef.current = '';

    // Mark module as complete
    setCompletedModules(prev => {
      if (prev.includes(currentModule)) {
        return prev;
      }
      return [...prev, currentModule];
    });

    // Check if this video module has an associated quiz
    // Use the video-to-quiz mapping since quiz IDs are different from video IDs
    const associatedQuizId = videoToQuizMap[currentModule];
    const hasAssociatedQuiz = associatedQuizId && persona.hasFeature('mcqQuiz') && persona.hasModuleQuiz(associatedQuizId);

    if (hasAssociatedQuiz) {
      addDebugLog(`[DEMO] ${currentModule} has quiz (${associatedQuizId}) - speaking video completion message and waiting for confirmation`);

      // Enable listening for user confirmation
      if (dailyEventManagerRef.current) {
        dailyEventManagerRef.current.enableListening();
        listeningStateRef.current = 'enabled';
        addDebugLog('[DEMO] 🎤 Enabled listening for video quiz confirmation');
      }

      // Unmute microphone for user to respond
      if (sessionManagerRef.current?.isInitialized) {
        sessionManagerRef.current.setMicrophoneMuted(false);
        setIsMuted(false);
      }

      // Set up waiting for confirmation before starting quiz
      // Store the QUIZ module ID, not the video module ID
      waitingForVideoQuizConfirmationRef.current = true;
      pendingVideoQuizModuleRef.current = associatedQuizId;

      // Speak video completion message if available (from persona's prompts)
      const completionMessage = persona.prompts.videoCompletionPrompts?.[currentModule];
      if (completionMessage && dailyEventManagerRef.current) {
        addDebugLog(`[DEMO] Speaking video completion message for ${currentModule}`);
        dailyEventManagerRef.current.sendEchoMessage(completionMessage);
      }

      // Start inactivity timeout - will ask check-in after 30s, end after 60s
      startInactivityTimeout();

      // Release the lock - completion message sent, now waiting for user
      videoCompletionInProgressRef.current = false;
      // Quiz will start when user says "continue" - handled in handleUserSpeech
    } else {
      // No quiz - check if this is a section-ending module
      const isSectionEnding = sectionEndingModules.includes(currentModule);
      const currentIndex = moduleOrder.indexOf(currentModule);
      const nextModuleId = (currentIndex >= 0 && currentIndex < moduleOrder.length - 1)
        ? moduleOrder[currentIndex + 1]
        : null;

      addDebugLog(`[DEMO] Video module ${currentModule} - isSectionEnding: ${isSectionEnding}, sectionEndingModules: [${sectionEndingModules.join(', ')}]`);

      if (isSectionEnding && nextModuleId) {
        // Section-ending video without quiz - speak completion/transition prompt and wait for confirmation
        addDebugLog(`[DEMO] ${currentModule} is section-ending - speaking prompt and waiting for confirmation`);

        // Enable listening for user confirmation
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.enableListening();
          listeningStateRef.current = 'enabled';
          addDebugLog('[DEMO] 🎤 Enabled listening for section transition confirmation');
        }

        // Unmute microphone
        if (sessionManagerRef.current?.isInitialized) {
          sessionManagerRef.current.setMicrophoneMuted(false);
          setIsMuted(false);
        }

        // Set up waiting for confirmation
        waitingForSectionConfirmationRef.current = true;
        pendingSectionTransitionRef.current = nextModuleId;

        // Prefer video completion prompt (has repeat/continue instructions), fall back to transition prompt
        const completionPrompt = persona.prompts.videoCompletionPrompts?.[currentModule];
        const transitionPrompt = persona.prompts.moduleTransitionPrompts?.[currentModule];
        const promptToSpeak = completionPrompt || transitionPrompt;

        if (promptToSpeak && dailyEventManagerRef.current) {
          addDebugLog(`[DEMO] Speaking ${completionPrompt ? 'video completion' : 'section transition'} prompt for ${currentModule}`);
          dailyEventManagerRef.current.sendEchoMessage(promptToSpeak);
        }

        // Start inactivity timeout - will ask check-in after 30s, end after 60s
        startInactivityTimeout();

        // Release the lock - completion message sent, now waiting for user
        videoCompletionInProgressRef.current = false;
      } else {
        // Not section-ending - just move to next module
        addDebugLog(`[DEMO] No quiz for ${currentModule} - moving to next module`);

        // 🔇 Ensure microphone stays muted
        if (sessionManagerRef.current?.isInitialized) {
          sessionManagerRef.current.setMicrophoneMuted(true).catch(err => {
            addDebugLog(`[DEMO] Failed to keep microphone muted: ${err.message}`);
          });
          setIsMuted(true);
        }

        // 🔴 Keep Tavus listening disabled
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.disableListening();
          addDebugLog('[DEMO] 🔇 Keeping Tavus listening disabled after video');
        }

        // Find and move to next module
        if (nextModuleId) {
          addDebugLog(`[DEMO] Scheduling transition to next module: ${nextModuleId}`);
          setTimeout(() => {
            if (mountedRef.current && !quizState.isActive && handleModuleSelectRef.current) {
              addDebugLog(`[DEMO] ✅ Moving to next module after video: ${nextModuleId}`);
              if (sessionManagerRef.current?.isInitialized) {
                sessionManagerRef.current.setMicrophoneMuted(true);
                setIsMuted(true);
              }
              handleModuleSelectRef.current(nextModuleId);
            } else {
              addDebugLog(`[DEMO] ❌ Cannot move to next module - mounted: ${mountedRef.current}, quizActive: ${quizState.isActive}, hasHandleModuleSelect: ${!!handleModuleSelectRef.current}`);
            }
          }, 500);
        }

        // Release the lock - auto-advancing to next module
        videoCompletionInProgressRef.current = false;
      }
    }
  }, [personaId, moduleOrder, sectionEndingModules, quizState.isActive, addDebugLog]);

  // Demo video hook
  const { isDemoPlaying, currentVideoUrl, isYouTube, youTubeEmbedUrl, demoVideoRef, playDemoVideo, stopDemoVideo } = useDemoVideo({
    sessionManager: sessionManagerRef.current,
    log,
    setState,
    onVideoStart: () => {
      // Interrupt avatar if speaking
      if (dailyEventManagerRef.current && isAvatarSpeaking) {
        addDebugLog('[DEMO] Interrupting avatar speech for video playback');
        dailyEventManagerRef.current.interruptReplica();
      }
      // Clear inactivity timeout - video is playing, user is watching
      clearInactivityTimeouts();
      // Mute avatar audio when video starts
      addDebugLog('[DEMO] Muting avatar audio for video playback');
      setAudioEnabled(false);
      // Reset speaking state
      setIsAvatarSpeaking(false);
      isAvatarSpeakingRef.current = false;
      // Don't set to "listening" when microphone is muted - set to "idle" instead
      setAvatarState(isMuted ? "idle" : "listening");
    },
    onVideoStop: () => {
      // Restore avatar audio when video stops
      addDebugLog(`[DEMO] Video stopped - restoring avatar audio. Active module: ${activeModuleRef.current}, sectionEndingModules: [${sectionEndingModules.join(', ')}]`);
      setAudioEnabled(true);

      // Handle founder video completion (video will be closed and next module will start)
      handleVideoModuleStop();
    },
  });

  // Update ref when isDemoPlaying changes
  useEffect(() => {
    isDemoPlayingRef.current = isDemoPlaying;
  }, [isDemoPlaying]);

  // Send message to replica - defined early so it can be used by other callbacks
  const sendMessageToReplica = useCallback((message, type = 'respond') => {
    if (!dailyEventManagerRef.current) return;

    // Strip markdown formatting before sending to avatar
    const cleanedMessage = stripMarkdown(message);

    // 🔴 CRITICAL: Block 'respond' messages during MCQ quiz - only 'echo' allowed
    // This prevents Tavus from interpreting messages as conversation context
    if (type !== 'echo' && (mcqQuizStateRef.current.isActive || mcqQuizStateRef.current.speakingInstructions)) {
      console.error(`[SEND-MESSAGE] ⛔ BLOCKED 'respond' message during quiz: "${cleanedMessage.substring(0, 50)}..."`);
      addDebugLog(`[SEND-MESSAGE] ⛔ BLOCKED 'respond' message during quiz`);
      return;
    }

    if (type === 'echo') {
      dailyEventManagerRef.current.sendEchoMessage(cleanedMessage);
      // Note: expectingNarrationRef is set directly in the onReplicaStopSpeaking callback
      // when PDF presentation is active, not here, to avoid timing issues with state sync
    } else {
      dailyEventManagerRef.current.sendRespondMessage(cleanedMessage);
    }
  }, [addDebugLog]);

  // PDF Presentation hook (must be after sendMessageToReplica is defined)
  const pdfPresentation = usePdfPresentation({
    sessionManager: sessionManagerRef.current,
    dailyEventManager: dailyEventManagerRef.current,
    sendMessage: sendMessageToReplica,
    log: addDebugLog,
    onPresentationEnd: () => {
      const currentModule = activeModuleRef.current;
      console.log('\n╔══════════════════════════════════════════════════════════════╗');
      console.log('║     🏁 PDF onPresentationEnd CALLBACK FIRED                   ║');
      console.log('╠══════════════════════════════════════════════════════════════╣');
      console.log(`║ currentModule: ${currentModule}`);
      console.trace();
      console.log('╚══════════════════════════════════════════════════════════════╝\n');
      addDebugLog('[PDF] Presentation ended for module:', currentModule);

      // CRITICAL: Reset ref immediately to avoid race conditions
      // The useEffect that syncs pdfPresentationRef.current may not run until next render
      pdfPresentationRef.current.isPresenting = false;
      expectingNarrationRef.current = false;
      isQandAResponseRef.current = false;

      // 🔊 Restore listening state after PDF presentation ends
      // Note: We don't re-enable listening here because handleModuleSelect will handle it
      // Just log that we're cleaning up
      addDebugLog('[PDF] Cleaning up presentation state');

      // Advance to next module (which might be a quiz or another lesson)
      const currentIndex = moduleOrder.indexOf(currentModule);
      if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
        const nextModuleId = moduleOrder[currentIndex + 1];
        console.log(`   🚀 Advancing to next module: ${nextModuleId}`);
        addDebugLog('[PDF] Advancing to next module:', nextModuleId);
        handleModuleSelectRef.current?.(nextModuleId);
      }
    },
  });

  // Keep pdfPresentationRef in sync for use in callbacks
  useEffect(() => {
    pdfPresentationRef.current = {
      isPresenting: pdfPresentation.isPresenting,
      currentSlideIndex: pdfPresentation.currentSlideIndex,
      totalSlides: pdfPresentation.presentationConfig?.slides?.length || 0,
    };
    // Keep PDF function refs updated
    pdfGoToSlideRef.current = pdfPresentation.goToSlide;
    pdfNarrateSlideRef.current = pdfPresentation.narrateSlide;
    pdfEndPresentationRef.current = pdfPresentation.endPresentation;
    pdfNextSlideRef.current = pdfPresentation.nextSlide;
  }, [pdfPresentation.isPresenting, pdfPresentation.currentSlideIndex, pdfPresentation.presentationConfig, pdfPresentation.goToSlide, pdfPresentation.narrateSlide, pdfPresentation.endPresentation, pdfPresentation.nextSlide]);

  // Setup DailyEventManager callbacks
  useEffect(() => {
    if (!dailyEventManagerRef.current) {
      return;
    }

    dailyEventManagerRef.current.setCallbacks({
      onReplicaStartSpeaking: () => {
        // Ignore avatar speech when video is playing
        if (isDemoPlayingRef.current) {
          addDebugLog('[DEMO] Ignoring avatar speech - video is playing');
          return;
        }

        addDebugLog('[TAVUS] 🤖 TAVUS STARTED SPEAKING');
        setIsAvatarSpeaking(true);
        isAvatarSpeakingRef.current = true;
        setAvatarState("speaking");

        // Auto-hide sidebar after avatar starts speaking (only once)
        if (!sidebarAutoHiddenRef.current && shouldShowLearningModules()) {
          sidebarAutoHiddenRef.current = true;
          // Delay to let user see the sidebar briefly before hiding
          setTimeout(() => {
            setShowLearningModules(false);
            addDebugLog('[UI] 📱 Auto-hiding sidebar - avatar started speaking');
          }, 2000); // 2 second delay before auto-hiding
        }

        // Clear inactivity timeout - avatar is speaking, so we're not waiting for user input
        clearInactivityTimeouts();

        // Mark that video announcement has started (avatar is now speaking the intro)
        if (pendingDemoVideoRef.current && !videoAnnouncementStartedRef.current) {
          videoAnnouncementStartedRef.current = true;
          addDebugLog('[DEMO] Video announcement started - will wait for avatar to finish');
        }

        // Mark that PDF navigation acknowledgment has started (avatar is now speaking "okay, going to next slide")
        if (pendingPdfNavigationRef.current && !pdfNavigationAcknowledgedRef.current) {
          pdfNavigationAcknowledgedRef.current = true;
          addDebugLog(`[PDF-NAV] Navigation acknowledgment started - will navigate when avatar finishes`);
        }

        // If module lock is active, ensure Tavus listening is disabled
        if (moduleSpeechLockRef.current && dailyEventManagerRef.current) {
          dailyEventManagerRef.current.disableListening();
          addDebugLog('[MODULE-LOCK] 🔇 Re-confirmed Tavus listening disabled');
        }

        // CRITICAL: If MCQ quiz is active OR speaking instructions, ensure Tavus listening is disabled but mic stays ON
        // Check both isActive AND speakingInstructions since mic needs to stay on during instruction phase too
        if ((mcqQuizStateRef.current.isActive || mcqQuizStateRef.current.speakingInstructions) && dailyEventManagerRef.current) {
          dailyEventManagerRef.current.disableListening();
          listeningStateRef.current = 'disabled';
          addDebugLog('[MCQ-QUIZ] 🔇 Tavus listening disabled during quiz (click-only answers)');
        } else if (pdfPresentationRef.current.isPresenting && dailyEventManagerRef.current) {
          // During PDF presentation, ENABLE Tavus listening for NLU-powered tool calls
          // Tavus will hear user commands and call PDF navigation tools
          dailyEventManagerRef.current.enableListening();
          listeningStateRef.current = 'enabled';
          addDebugLog('[PDF] 🎤 Tavus listening ENABLED during presentation for tool calls');
        } else {
          // Mute microphone at Daily.co level (backup) - only when NOT in quiz mode or PDF presentation
          if (sessionManagerRef.current?.isInitialized) {
            sessionManagerRef.current.setMicrophoneMuted(true).catch(err => {
              addDebugLog(`[MIC] ❌ Failed to mute: ${err.message}`);
            });
            setIsMuted(true);
          }
        }
      },
      onReplicaStopSpeaking: (lastSpeech, interrupted) => {
        // Ignore avatar speech when video is playing
        if (isDemoPlayingRef.current) {
          addDebugLog('[DEMO] Ignoring avatar speech end - video is playing');
          return;
        }

        // 🔍 CRITICAL LOGGING: Track if Tavus is interrupting itself
        addDebugLog(`[TAVUS] 🛑 TAVUS STOPPED SPEAKING - interrupted: ${interrupted}`);
        if (interrupted && moduleSpeechLockRef.current) {
          addDebugLog('[TAVUS] ⚠️⚠️⚠️ CRITICAL: Tavus interrupted itself during module speech!');
          addDebugLog('[TAVUS] This means Tavus listening was NOT properly disabled');
        }

        // ⚡ PRIORITY CHECK: If MCQ quiz instructions are being spoken (quiz not yet active)
        // After instructions finish, activate the quiz panel and ask first question
        // CRITICAL: If speaking instructions and interrupted, ignore this event
        // This prevents premature activation when user clicks quiz and interrupt arrives after state is set
        if (mcqQuizStateRef.current.speakingInstructions && interrupted) {
          addDebugLog('[MCQ-QUIZ] Ignoring interrupted event during instructions phase');
          return;
        }

        if (mcqQuizStateRef.current.speakingInstructions && pendingQuizDataRef.current) {
          addDebugLog('[MCQ-QUIZ] Avatar finished speaking instructions - now activating quiz panel');

          const pending = pendingQuizDataRef.current;
          const { moduleId, quizData } = pending;
          pendingQuizDataRef.current = null;

          // Create new state with quiz panel active
          const activeQuizState = {
            isActive: true, // NOW show the quiz panel
            moduleId: moduleId,
            currentQuestionIndex: 0,
            selectedIndex: null,
            isAnswered: false,
            isCorrect: false,
            score: { correct: 0, total: 0 },
            quizData: quizData,
            waitingForAvatarToFinish: true, // Wait for avatar to read the first question
            speakingInstructions: false,
          };

          // CRITICAL: Update ref IMMEDIATELY (synchronously)
          mcqQuizStateRef.current = activeQuizState;

          // Also update React state for UI
          setMcqQuizState(activeQuizState);

          // Ask the first question
          const firstQuestion = quizData.questions[0];
          const questionMessage = `Question 1: ${firstQuestion.question} Your options are: A: ${firstQuestion.options[0]}. B: ${firstQuestion.options[1]}. C: ${firstQuestion.options[2]}. D: ${firstQuestion.options[3]}.`;

          setTimeout(() => {
            if (dailyEventManagerRef.current) {
              dailyEventManagerRef.current.sendEchoMessage(questionMessage);
            }
          }, 500); // Brief pause before asking first question

          setIsAvatarSpeaking(false);
          isAvatarSpeakingRef.current = false;
          setAvatarState("idle");
          return;
        }

        // ⚡ PRIORITY CHECK: If MCQ quiz is active, handle quiz flow FIRST before any module logic
        if (mcqQuizStateRef.current.isActive) {
          const quizState = mcqQuizStateRef.current;
          addDebugLog(`[MCQ-QUIZ] Avatar stopped speaking during quiz - pendingNextQuestion: ${quizState.pendingNextQuestion}, pendingQuizComplete: ${quizState.pendingQuizComplete}, waitingForAvatarToFinish: ${quizState.waitingForAvatarToFinish}`);

          // Clear waitingForAvatarToFinish when avatar finishes speaking feedback
          // (Advancement is now handled by calculated timeout in handleMcqAnswerSelect)
          if (quizState.waitingForAvatarToFinish && (quizState.pendingNextQuestion || quizState.pendingQuizComplete)) {
            addDebugLog('[MCQ-QUIZ] Avatar finished feedback - clearing flags (advancement handled by timeout)');
            setMcqQuizState(prev => ({
              ...prev,
              waitingForAvatarToFinish: false,
              pendingNextQuestion: false,
              pendingQuizComplete: false,
            }));

            // Keep listening disabled
            if (dailyEventManagerRef.current) {
              dailyEventManagerRef.current.disableListening();
              listeningStateRef.current = 'disabled';
            }
          }
          // Enable MCQ selection when avatar finishes speaking question (not feedback)
          else if (quizState.waitingForAvatarToFinish) {
            addDebugLog('[MCQ-QUIZ] Avatar finished speaking question - enabling selection');
            setMcqQuizState(prev => ({ ...prev, waitingForAvatarToFinish: false }));

            // CRITICAL: Keep Tavus listening disabled during MCQ quiz
            if (dailyEventManagerRef.current) {
              dailyEventManagerRef.current.disableListening();
              listeningStateRef.current = 'disabled';
            }

            // Start inactivity timeout - waiting for user to select an answer
            startInactivityTimeout();
          }

          setIsAvatarSpeaking(false);
          isAvatarSpeakingRef.current = false;
          setAvatarState("idle");
          return; // Skip all module completion logic - quiz handles its own flow
        }

        // ⚡ PRIORITY CHECK: If PDF presentation is active, handle slide narration
        // CRITICAL: Use pdfPresentationRef.current (not pdfPresentation from closure) to avoid stale closure bug
        // The useEffect that sets up this callback doesn't re-run when pdfPresentation changes
        if (pdfPresentationRef.current.isPresenting && !transitioningSlideRef.current) {
          console.log('\n╔══════════════════════════════════════════════════════════════╗');
          console.log('║     🎬 PDF STOP SPEAKING HANDLER                              ║');
          console.log('╠══════════════════════════════════════════════════════════════╣');
          console.log(`║ interrupted: ${interrupted}`);
          console.log(`║ lastSpeech: "${lastSpeech?.substring(0, 60)}..."`);
          console.log(`║ userNavigatedToSlideRef: ${userNavigatedToSlideRef.current}`);
          console.log(`║ pendingPdfNavigationRef: ${pendingPdfNavigationRef.current?.action || 'null'}`);
          console.log(`║ isQandAResponseRef: ${isQandAResponseRef.current}`);
          console.log(`║ expectingNarrationRef: ${expectingNarrationRef.current}`);
          console.log(`║ currentSlideIndex: ${pdfPresentationRef.current.currentSlideIndex}`);
          console.log(`║ totalSlides: ${pdfPresentationRef.current.totalSlides}`);
          console.log('╚══════════════════════════════════════════════════════════════╝\n');

          // 🚫 If narration was interrupted, do NOT auto-advance
          // This happens when Tavus responds to our system messages or user speaks
          if (interrupted) {
            addDebugLog(`[PDF] ⚠️ Narration was INTERRUPTED - NOT auto-advancing. Last speech: "${lastSpeech?.substring(0, 50)}..."`);
            // Note: We don't need to call onNarrationComplete for interrupted speech
            setIsAvatarSpeaking(false);
            isAvatarSpeakingRef.current = false;
            setAvatarState("idle");
            return; // Don't auto-advance on interruption
          }

          // Check if user navigated via voice command - skip auto-advance
          if (userNavigatedToSlideRef.current !== null) {
            const targetSlide = userNavigatedToSlideRef.current;
            const currentSlide = pdfPresentationRef.current.currentSlideIndex;

            if (currentSlide === targetSlide) {
              // We've reached the target slide and narration finished
              // Clear the flag and DO NOT auto-advance - user is in control
              addDebugLog(`[PDF] User navigation complete - now on slide ${currentSlide + 1}. Waiting for next command.`);
              userNavigatedToSlideRef.current = null;
            } else {
              // Still transitioning (this is the interrupted narration event)
              addDebugLog(`[PDF] Ignoring stop event during user navigation (current: ${currentSlide}, target: ${targetSlide})`);
            }

            // Mark narration complete but DON'T auto-advance
            // Note: No need to call onNarrationComplete - just skip auto-advance
            setIsAvatarSpeaking(false);
            isAvatarSpeakingRef.current = false;
            setAvatarState("idle");
            return;
          }

          // 🚫 EARLY CHECK: If we're not expecting narration, this is NOT a slide narration completion
          // This happens when intro speech finishes right after presentation starts
          // We should NOT set transitioningSlideRef (which would block the real narration event)
          if (!expectingNarrationRef.current) {
            console.log('   🚫 NOT EXPECTING NARRATION - skipping auto-advance setup');
            console.log('   📝 This is likely intro speech finishing, not slide narration');
            addDebugLog('[PDF] Speech finished but not expecting narration (intro speech?) - skipping auto-advance');
            // Note: No need to call onNarrationComplete - this is intro speech, not slide narration
            setIsAvatarSpeaking(false);
            isAvatarSpeakingRef.current = false;
            setAvatarState("idle");
            return;
          }

          transitioningSlideRef.current = true;
          addDebugLog('[PDF] Avatar finished narrating slide (not interrupted) - will auto-advance after 1.5s');

          // Note: onNarrationComplete was removed as it only reset a ref that's not needed

          setIsAvatarSpeaking(false);
          isAvatarSpeakingRef.current = false;
          setAvatarState("idle");

          // Auto-advance to next slide after pause
          setTimeout(() => {
            console.log('\n⏰ [PDF AUTO-ADVANCE TIMEOUT] Checking conditions...');
            console.log(`   isPresenting: ${pdfPresentationRef.current.isPresenting}`);
            console.log(`   userNavigatedToSlideRef: ${userNavigatedToSlideRef.current}`);
            console.log(`   pendingPdfNavigationRef: ${pendingPdfNavigationRef.current?.action || 'null'}`);
            console.log(`   isQandAResponseRef: ${isQandAResponseRef.current}`);
            console.log(`   expectingNarrationRef: ${expectingNarrationRef.current}`);
            console.log(`   currentSlideIndex: ${pdfPresentationRef.current.currentSlideIndex}`);

            // Guard: Only advance if:
            // 1. Still presenting
            // 2. User hasn't manually navigated
            // 3. No pending voice navigation
            // 4. Not in Q&A mode (answer_pdf_question was called)
            // 5. We were expecting narration (echo was sent) - this prevents auto-advance after conversational responses
            // CRITICAL: Use pdfPresentationRef (not pdfPresentation from closure) to avoid stale closure bug
            if (pdfPresentationRef.current.isPresenting &&
                userNavigatedToSlideRef.current === null &&
                pendingPdfNavigationRef.current === null &&
                !isQandAResponseRef.current &&
                expectingNarrationRef.current) {
              console.log('   ✅ ALL CONDITIONS MET - AUTO-ADVANCING');
              addDebugLog('[PDF] Auto-advancing to next slide (narration completed)');

              // 🔇 Auto-mute mic when advancing to next slide (if user had enabled it)
              if (!isMuted && sessionManagerRef.current?.isInitialized) {
                sessionManagerRef.current.setMicrophoneMuted(true).catch(err => {
                  addDebugLog(`[PDF] Failed to auto-mute mic: ${err.message}`);
                });
                setIsMuted(true);
                addDebugLog('[PDF] 🔇 Auto-muted mic on slide advance');
              }

              // Keep expectingNarrationRef = true since nextSlide will call narrateSlide
              // which will send another echo. This flag stays true for continuous narration.
              // CRITICAL: Use pdfNextSlideRef (not pdfPresentation.nextSlide from closure) to avoid stale closure bug
              pdfNextSlideRef.current?.();
            } else {
              console.log('   ❌ CONDITIONS NOT MET - SKIPPING AUTO-ADVANCE');
              // Clear Q&A mode if it was set (user can ask another question or navigate)
              if (isQandAResponseRef.current) {
                console.log('   📝 Reason: Q&A response just completed');
                addDebugLog('[PDF] Auto-advance skipped - Q&A response just completed. Staying on current slide.');
                isQandAResponseRef.current = false; // Clear Q&A mode
                // CRITICAL: Reset expectingNarrationRef so the system can accept new narrations
                // This allows the user to click buttons or give voice commands to navigate
                expectingNarrationRef.current = false;
                console.log('   🔄 Reset expectingNarrationRef = false - ready for new narration');
              } else if (!expectingNarrationRef.current) {
                console.log('   📝 Reason: expectingNarrationRef is false (conversational response)');
                addDebugLog('[PDF] Auto-advance skipped - conversational response (not narration). Staying on current slide.');
                // expectingNarrationRef is already false, no need to reset
              } else if (!pdfPresentationRef.current.isPresenting) {
                console.log('   📝 Reason: PDF presentation is no longer active');
              } else {
                console.log(`   📝 Reason: User took control (userNav: ${userNavigatedToSlideRef.current}, pendingNav: ${pendingPdfNavigationRef.current?.action})`);
                addDebugLog(`[PDF] Auto-advance skipped - user took control (userNav: ${userNavigatedToSlideRef.current}, pendingNav: ${pendingPdfNavigationRef.current?.action})`);
              }
            }
            transitioningSlideRef.current = false;
          }, 1500); // 1.5 second pause before auto-advance

          return; // Skip all module completion logic - presentation handles its own flow
        }

        // Check for pending module transition
        // This handles transitions after quiz completion or when Tavus auto-responds
        console.log('\n📋 [MODULE-TRANSITION CHECK] pendingModuleTransitionRef:', pendingModuleTransitionRef.current);
        if (pendingModuleTransitionRef.current) {
          const nextModuleId = pendingModuleTransitionRef.current;
          console.log('   ⚠️ PENDING MODULE TRANSITION DETECTED:', nextModuleId);

          addDebugLog(`[MODULE-TRANSITION] Pending transition detected after Tavus speech: "${lastSpeech}" - proceeding to: ${nextModuleId}`);

          // Clear the pending transition
          pendingModuleTransitionRef.current = null;

          // Mark avatar as not speaking
          setIsAvatarSpeaking(false);
          isAvatarSpeakingRef.current = false;
          setAvatarState("idle");

          // Execute the module transition after a brief delay
          setTimeout(() => {
            if (mountedRef.current && handleModuleSelectRef.current) {
              addDebugLog(`[MODULE-TRANSITION] Executing transition to: ${nextModuleId}`);
              handleModuleSelectRef.current(nextModuleId);
            }
          }, 500);

          return;
        }

        // Handle module completion when avatar stops speaking
        // Skip video modules (handled by video stop callback) and final-quiz (handled separately)
        // Skip PDF presentations - they have their own completion flow via onPresentationEnd callback
        console.log('\n📋 [MODULE-COMPLETION CHECK]');
        console.log(`   activeModuleRef: ${activeModuleRef.current}`);
        console.log(`   isVideoModule: ${videoModules.includes(activeModuleRef.current)}`);
        console.log(`   moduleSpeechLockRef: ${moduleSpeechLockRef.current}`);
        console.log(`   interrupted: ${interrupted}`);
        console.log(`   pdfPresentationRef.isPresenting: ${pdfPresentationRef.current.isPresenting}`);
        if (activeModuleRef.current && !videoModules.includes(activeModuleRef.current) && activeModuleRef.current !== 'final-quiz' && moduleSpeechLockRef.current && !interrupted && !pdfPresentationRef.current.isPresenting) {
          console.log('   ✅ Module completion conditions MET - will process completion');
          // Skip module completion if MCQ quiz is active OR speaking instructions (quiz handles its own flow)
          if (mcqQuizStateRef.current.isActive || mcqQuizStateRef.current.speakingInstructions) {
            addDebugLog(`[MODULE-LOCK] Skipping module completion - MCQ quiz is active or speaking instructions`);
            // Don't process module completion - quiz is in control
          } else {
            // For all modules (including welcome-intro): Check if confirmation is required before completing
            const currentModule = activeModuleRef.current;

            // Check if this module requires user confirmation before advancing
            if (modulesRequiringConfirmation.includes(currentModule)) {
              addDebugLog(`[MODULE-CONFIRM] ⏸️ Module ${currentModule} finished - waiting for user confirmation`);

              // Unlock module speech lock so user can respond
              moduleSpeechLockRef.current = false;
              currentModulePromptRef.current = '';

              // Set waiting state
              setWaitingForModuleConfirmation(true);
              waitingForModuleConfirmationRef.current = true;

              // Unmute microphone so user can respond
              if (sessionManagerRef.current?.isInitialized) {
                sessionManagerRef.current.setMicrophoneMuted(false).catch(err => {
                  addDebugLog(`[MODULE-CONFIRM] Failed to unmute: ${err.message}`);
                });
                setIsMuted(false);
              }

              // CRITICAL: Keep Tavus listening DISABLED during confirmation
              // We still receive user transcripts via Daily.co events, but Tavus won't auto-respond
              // This prevents Tavus from generating its own response to "continue"
              if (dailyEventManagerRef.current) {
                listeningStateRef.current = 'disabled';
                dailyEventManagerRef.current.disableListening();
                addDebugLog('[MODULE-CONFIRM] 🎤 Mic unmuted but Tavus listening DISABLED - we handle confirmation manually');
              }

              // Start inactivity timeout - will ask check-in after 30s, end after 60s
              startInactivityTimeout();

              // Do NOT call finishModuleSpeech - wait for user confirmation
            } else {
              // Module doesn't require confirmation - proceed with auto-completion
              addDebugLog(`[MODULE-LOCK] Module ${currentModule} avatar stopped speaking - triggering completion`);
              const acc = moduleSpeechAccumulatorRef.current;
              if (!acc.completed && finishModuleSpeechRef.current) {
                acc.completed = true;
                finishModuleSpeechRef.current();
              }
            }
          }
        }

        // Check if quiz question was interrupted
        setQuizState(prev => {
          if (prev.isActive && prev.isAskingQuestion && interrupted) {
            // Quiz question was interrupted - re-ask it
            addDebugLog('[QUIZ] Question was interrupted, re-asking...');
            const currentQuestion = prev.questions[prev.currentQuestionIndex];
            setTimeout(() => {
              sendMessageToReplica(
                `Let me ask that question again: "${currentQuestion.question}" Please wait for me to finish asking before you answer.`
              );
              // Keep isAskingQuestion true until question is fully asked
              setQuizState(prevState => ({
                ...prevState,
                isAskingQuestion: true
              }));
            }, 300);
            return prev; // Don't update state yet
          }
          return prev;
        });
        
        setIsAvatarSpeaking(false);
        isAvatarSpeakingRef.current = false;
        
        // REMOVED: Don't trigger transition when avatar stops speaking during welcome
        // Wait for the full welcome script to complete (via duration check in checkModuleCompletion)
        // This ensures step-by-step course learning flow
        
        // Don't set to "listening" when microphone is muted or module lock is active
        if (moduleSpeechLockRef.current || isMuted) {
          setAvatarState("idle");
          addDebugLog('[AVATAR-STATE] Setting to "idle" - microphone muted or module lock active');
        } else {
        setAvatarState("listening");
        }
        
        // Unmute microphone after agent finishes speaking (with delay to filter background noise)
        // Only unmute if not interrupted and session is still active
        if (!interrupted && sessionManagerRef.current?.isInitialized) {
          // Add delay to filter out background noise that might trigger right after agent stops
          setTimeout(() => {
            // DO NOT automatically unmute microphone - user must manually toggle it
            // Microphone stays muted throughout onboarding flow
            addDebugLog('[MIC] ⚠️ Keeping microphone muted - user must manually enable it');
          }, 800); // 800ms delay to filter background noise
        }
        
        // Mark quiz question as complete if it wasn't interrupted
        if (!interrupted) {
          setQuizState(prev => {
            if (prev.isActive && prev.isAskingQuestion) {
              // Question was completed successfully
              setTimeout(() => {
                setQuizState(prevState => ({
                  ...prevState,
                  isAskingQuestion: false,
                  waitingForAnswer: true
                }));
                addDebugLog('[QUIZ] Question completed, ready to accept answers');
              }, 500);
            }
            return prev;
          });
        }
        
        // For quiz: Add a small delay before accepting answers to avoid noise right after avatar stops
        setTimeout(() => {
          setQuizState(prev => {
            if (prev.isActive && prev.waitingForAnswer && !prev.isAskingQuestion) {
              addDebugLog('[QUIZ] Avatar finished speaking, ready to accept answers (after noise filter delay)');
            }
            return prev; // Return unchanged state, just using it for the check
          });
        }, 500);
        
        // ❌ REMOVED: Old completion logic based on lastSpeech.length
        // ✅ NEW: Completion is now handled by sentinel phrase detection in checkModuleCompletion()
        // Module completion is detected when agent says "—END OF MODULE—"
        
        // 🔒 BLOCK proactive continuation when module lock is active
        if (moduleSpeechLockRef.current) {
          return; // Do not trigger any proactive continuation
        }
        
        // Demo triggers are handled via tool calls in Tavus, no speech detection needed
        // Trigger proactive continuation after 5 seconds if user doesn't speak
        if (!interrupted) {
          triggerProactiveContinuation();
        }
      },
      onUserStartSpeaking: () => {
        // 🔒 HARD BLOCK: Ignore ALL user speech when module lock is active
        if (moduleSpeechLockRef.current) {
          addDebugLog('[MODULE-LOCK] ⚠️ Ignoring user speech event (module lock active)');
          return; // IGNORE COMPLETELY - no processing
        }
        
        // Ignore user speech when video is playing (mic is muted anyway)
        if (isDemoPlayingRef.current) {
          addDebugLog('[DEMO] Ignoring user speech - video is playing');
          return;
        }
        
        // If we reach here, module lock is not active, so user speech is valid
        // DO NOT automatically unmute microphone when user starts speaking
        // Microphone stays muted - user must manually toggle it to enable
        addDebugLog('[MIC] ⚠️ User speech detected but microphone remains muted - user must manually enable it');
        
        setIsUserSpeaking(true);
        isUserSpeakingRef.current = true;
      },
      onUserStopSpeaking: () => {
        // Ignore user speech when video is playing
        if (isDemoPlayingRef.current) {
          return;
        }
        setIsUserSpeaking(false);
        isUserSpeakingRef.current = false;
      },
      onUserTranscript: (text, source) => {
        // 🔒 HARD BLOCK: Ignore ALL user transcripts when module lock is active
        // EXCEPTION: Allow transcripts when waiting for module confirmation, section confirmation, video quiz confirmation, or MCQ quiz
        if (moduleSpeechLockRef.current && !waitingForModuleConfirmationRef.current && !waitingForSectionConfirmationRef.current && !waitingForVideoQuizConfirmationRef.current && !mcqQuizStateRef.current.isActive) {
          // Additional check: Ignore if text matches module prompt (Tavus sometimes echoes prompts as user speech)
          const promptText = currentModulePromptRef.current;
          if (promptText && (text.includes(promptText.substring(0, 100)) || promptText.includes(text.substring(0, 100)))) {
            addDebugLog('[MODULE-LOCK] ⚠️ Ignoring user transcript that matches module prompt (Tavus echo detected)');
          } else {
            addDebugLog('[MODULE-LOCK] ⚠️ Ignoring user transcript during module speech (lock active)');
          }
          return; // IGNORE COMPLETELY
        }

        // Ignore user transcripts when video is playing
        if (isDemoPlayingRef.current) {
          addDebugLog('[DEMO] Ignoring user transcript - video is playing');
          return;
        }

        handleUserSpeech(text, source);
      },
      onReplicaTranscript: (text, source) => {
        // Ignore avatar transcripts when video is playing
        if (isDemoPlayingRef.current) {
          addDebugLog('[DEMO] Ignoring avatar transcript - video is playing');
          return;
        }
        
        // 📝 ACCUMULATE SPEECH when module lock is active
        if (moduleSpeechLockRef.current) {
          const acc = moduleSpeechAccumulatorRef.current;
          const cleanedChunk = stripMarkdown(text);
          acc.text += ' ' + cleanedChunk;
          acc.lastChunkAt = Date.now();
          if (!acc.startedAt) {
            acc.startedAt = Date.now();
          }
          addDebugLog(`[MODULE-LOCK] Accumulated speech: ${acc.text.length} chars`);
        }
        
        handleReplicaSpeech(text, source);
      },
      onToolCall: (name, args, properties) => {
        // Allow tool calls even during video (e.g., to close video)
        // But prevent new video from starting if one is already playing
        if (isDemoPlayingRef.current && name === 'show_demo_video') {
          addDebugLog('[DEMO] Ignoring show_demo_video tool call - video already playing');
          return;
        }
        log('TOOL_CALL', `Tool called: ${name}`, { args });
        handleToolCall(name, args);
      },
      onReplicaJoined: (replicaId) => {
        log('SYSTEM', 'Replica joined the call', { replicaId });
      },
      onUnhandledMessage: (msg) => {
        log('DATA_CHANNEL', 'Unhandled message', msg);
      }
    });
  }, [log, triggerProactiveContinuation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if answer is correct (fuzzy matching) - returns: 'correct', 'partial', 'incorrect', 'dont_know'
  const checkAnswer = (userAnswer, correctAnswer, keywords) => {
    const userLower = userAnswer.toLowerCase().trim();
    const correctLower = correctAnswer.toLowerCase().trim();
    
    // Check for "I don't know" responses
    const dontKnowPhrases = ["i don't know", "i don't know", "i dunno", "don't know", "no idea", "not sure", "unsure", "i'm not sure", "i have no idea"];
    if (dontKnowPhrases.some(phrase => userLower.includes(phrase))) {
      return 'dont_know';
    }
    
    // Exact match
    if (userLower === correctLower) {
      return 'correct';
    }
    
    // Check if answer contains correct answer
    if (userLower.includes(correctLower) || correctLower.includes(userLower)) {
      return 'correct';
    }
    
    // Check how many keywords are present
    let keywordMatches = 0;
    for (const keyword of keywords) {
      if (userLower.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }
    
    // If more than half keywords match, it's partial
    if (keywordMatches > 0) {
      const keywordMatchRatio = keywordMatches / keywords.length;
      if (keywordMatchRatio >= 0.5) {
        return 'partial'; // Half correct, half wrong
      } else if (keywordMatchRatio > 0) {
        return 'partial'; // Some keywords but not enough
      }
    }
    
    return 'incorrect';
  };


  // Handle user speech
  const handleUserSpeech = (text, source) => {
    if (!text) return;

    // IMPORTANT: When waiting for module, section, or video quiz confirmation, ALWAYS process user speech
    // even if avatar is speaking (Tavus may auto-respond with "Okay" but we still
    // need to catch the user's "continue" to trigger our transition)
    if (waitingForModuleConfirmationRef.current) {
      log('USER_SPEECH', `Processing during module confirmation wait (avatar may be speaking): "${text}"`, { text });
      // Don't return - fall through to process confirmation
    } else if (waitingForSectionConfirmationRef.current) {
      log('USER_SPEECH', `Processing during section confirmation wait (avatar may be speaking): "${text}"`, { text });
      // Don't return - fall through to process confirmation
    } else if (waitingForVideoQuizConfirmationRef.current) {
      log('USER_SPEECH', `Processing during video quiz confirmation wait (avatar may be speaking): "${text}"`, { text });
      // Don't return - fall through to process confirmation
    } else if (isAvatarSpeakingRef.current) {
      // Normal case: ignore user speech when avatar is speaking (especially during quiz)
      log('USER_SPEECH', `Ignored - avatar is speaking: "${text}"`, { text });
      return;
    }

    log('USER_SPEECH', `User said (${source})`, { text });

    // During PDF presentation, ignore voice commands (use UI buttons instead)
    if (pdfPresentation.isPresenting) {
      addDebugLog('[PDF] Ignoring speech during presentation - use navigation buttons');
      return;
    }

    // Check if we're in quiz mode and waiting for an answer
    if (quizState.isActive && quizState.waitingForAnswer && quizState.currentQuestionIndex < quizState.questions.length) {
      // Double-check avatar is not speaking (safety check)
      if (isAvatarSpeakingRef.current) {
        log('QUIZ', `Ignored answer - avatar is speaking: "${text}"`);
        return;
      }
      
      const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
      const answerStatus = checkAnswer(text, currentQuestion.correctAnswer, currentQuestion.keywords);
      
      let newScore = quizState.score;
      let newResults = [...quizState.questionResults];
      
      // Handle different answer statuses
      if (answerStatus === 'correct') {
        newScore = quizState.score + 1;
        newResults.push({ 
          questionIndex: quizState.currentQuestionIndex, 
          topic: currentQuestion.topic,
          status: 'correct' 
        });
        
        sendMessageToReplica(
          (quizState.currentQuestionIndex < quizState.questions.length - 1 
            ? `That's correct! Next question: "${quizState.questions[quizState.currentQuestionIndex + 1].question}"`
            : `That's correct! That was the last question!`)
        );
        
        // Move to next question
        if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
          const nextIndex = quizState.currentQuestionIndex + 1;
          setQuizState(prev => ({
            ...prev,
            currentQuestionIndex: nextIndex,
            score: newScore,
            waitingForAnswer: false, // Not ready yet - avatar is asking
            isAskingQuestion: true, // Avatar will ask next question
            lastQuestionAsked: prev.questions[nextIndex].question,
            questionResults: newResults
          }));
        } else {
          completeQuiz(newResults, newScore);
        }
        
      } else if (answerStatus === 'partial') {
        // Partial answer - just mark as partial and move on (no explanation now)
        newResults.push({ 
          questionIndex: quizState.currentQuestionIndex, 
          topic: currentQuestion.topic,
          status: 'partial' 
        });
        
        sendMessageToReplica(
          (quizState.currentQuestionIndex < quizState.questions.length - 1 
            ? `Partially correct, but not quite right. Next question: "${quizState.questions[quizState.currentQuestionIndex + 1].question}"`
            : `Partially correct, but not quite right. That was the last question!`)
        );
        
        // Move to next question immediately
        if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
          const nextIndex = quizState.currentQuestionIndex + 1;
          setQuizState(prev => ({
            ...prev,
            currentQuestionIndex: nextIndex,
            score: newScore,
            waitingForAnswer: false, // Not ready yet - avatar is asking
            isAskingQuestion: true, // Avatar will ask next question
            lastQuestionAsked: prev.questions[nextIndex].question,
            questionResults: newResults
          }));
        } else {
          completeQuiz(newResults, newScore);
        }
        
      } else if (answerStatus === 'dont_know') {
        // User doesn't know - just mark and move on (no explanation now)
        newResults.push({ 
          questionIndex: quizState.currentQuestionIndex, 
          topic: currentQuestion.topic,
          status: 'unanswered' 
        });
        
        sendMessageToReplica(
          (quizState.currentQuestionIndex < quizState.questions.length - 1 
            ? `That's okay. Next question: "${quizState.questions[quizState.currentQuestionIndex + 1].question}"`
            : `That's okay. That was the last question!`)
        );
        
        // Move to next question immediately
        if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
          const nextIndex = quizState.currentQuestionIndex + 1;
          setQuizState(prev => ({
            ...prev,
            currentQuestionIndex: nextIndex,
            waitingForAnswer: false, // Not ready yet - avatar is asking
            isAskingQuestion: true, // Avatar will ask next question
            lastQuestionAsked: prev.questions[nextIndex].question,
            questionResults: newResults
          }));
        } else {
          completeQuiz(newResults, newScore);
        }
        
      } else {
        // Incorrect answer - just mark and move on (no explanation now)
        newResults.push({ 
          questionIndex: quizState.currentQuestionIndex, 
          topic: currentQuestion.topic,
          status: 'incorrect' 
        });
        
        sendMessageToReplica(
          (quizState.currentQuestionIndex < quizState.questions.length - 1 
            ? `That's not quite right. Next question: "${quizState.questions[quizState.currentQuestionIndex + 1].question}"`
            : `That's not quite right. That was the last question!`)
        );
        
        // Move to next question immediately
        if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
          const nextIndex = quizState.currentQuestionIndex + 1;
          setQuizState(prev => ({
            ...prev,
            currentQuestionIndex: nextIndex,
            waitingForAnswer: false, // Not ready yet - avatar is asking
            isAskingQuestion: true, // Avatar will ask next question
            lastQuestionAsked: prev.questions[nextIndex].question,
            questionResults: newResults
          }));
        } else {
          completeQuiz(newResults, newScore);
        }
      }
      
      return; // Don't process as regular speech during quiz
    }

    // Check if we're waiting for module confirmation
    if (waitingForModuleConfirmationRef.current) {
      const lowerText = text.toLowerCase().trim();

      // Keywords that indicate user wants to proceed
      const confirmationKeywords = [
        'yes', 'yeah', 'yep', 'yup', 'sure', 'okay', 'ok', 'clear', 'understood',
        'got it', 'i understand', 'no questions', 'let\'s continue', 'continue',
        'move on', 'next', 'proceed', 'go ahead', 'all clear', 'makes sense',
        'i got it', 'perfect', 'great', 'good', 'fine', 'alright', 'right'
      ];

      // Check if user's response contains confirmation
      const isConfirmation = confirmationKeywords.some(keyword =>
        lowerText.includes(keyword)
      );

      // Keywords that indicate user has questions or needs clarification
      const questionKeywords = [
        'question', 'what', 'how', 'why', 'can you', 'could you', 'explain',
        'tell me more', 'clarify', 'not clear', 'confused', 'don\'t understand',
        'repeat', 'again', 'no', 'wait', 'hold on'
      ];

      const hasQuestion = questionKeywords.some(keyword =>
        lowerText.includes(keyword)
      );

      if (isConfirmation && !hasQuestion) {
        // User confirmed - check if module has quiz, otherwise proceed to next module
        addDebugLog(`[MODULE-CONFIRM] ✅ User confirmed: "${text}"`);

        // User responded - reset inactivity timeout
        resetInactivityTimeout();

        // Reset confirmation state
        setWaitingForModuleConfirmation(false);
        waitingForModuleConfirmationRef.current = false;

        // Get current module
        const currentModule = activeModuleRef.current;

        // Check if this module has a quiz (use persona config)
        if (persona.hasFeature('mcqQuiz') && persona.hasModuleQuiz(currentModule)) {
          addDebugLog(`[MODULE-CONFIRM] Module ${currentModule} has quiz - starting MCQ quiz`);

          // Keep microphone UNMUTED for voice commands during quiz
          if (sessionManagerRef.current?.isInitialized) {
            sessionManagerRef.current.setMicrophoneMuted(false);
            setIsMuted(false);
          }

          // Listening is already disabled during confirmation waiting
          // Just ensure it stays disabled during quiz
          if (dailyEventManagerRef.current) {
            listeningStateRef.current = 'disabled';
            dailyEventManagerRef.current.disableListening();
          }

          // Start the MCQ quiz for this module
          startMcqQuiz(currentModule);

          return; // Don't process as regular speech
        }

        // No quiz - advance to next module
        const currentIndex = moduleOrder.indexOf(currentModule);

        if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
          const nextModuleId = moduleOrder[currentIndex + 1];

          // Mute microphone before transitioning
          if (sessionManagerRef.current?.isInitialized) {
            sessionManagerRef.current.setMicrophoneMuted(true);
            setIsMuted(true);
          }

          // Disable listening and interrupt any pending Tavus response
          if (dailyEventManagerRef.current) {
            listeningStateRef.current = 'disabled';
            dailyEventManagerRef.current.disableListening();
            dailyEventManagerRef.current.interruptReplica();
          }

          addDebugLog(`[MODULE-CONFIRM] Transitioning directly to: ${nextModuleId}`);

          // DIRECT TRANSITION: Go straight to next module
          // Skip echo message - Tavus processes audio at API level before we can intercept,
          // so any echo we send races with Tavus's auto-response
          // Wait a bit for the interrupt to process, then transition
          setTimeout(() => {
            if (mountedRef.current && handleModuleSelectRef.current) {
              addDebugLog(`[MODULE-CONFIRM] Executing transition to: ${nextModuleId}`);
              handleModuleSelectRef.current(nextModuleId);
            }
          }, 500);
        }

        return; // Don't process as regular speech
      } else if (hasQuestion) {
        // User has a question - let avatar respond naturally, then re-ask for confirmation
        addDebugLog(`[MODULE-CONFIRM] 🤔 User has question: "${text}" - letting avatar respond`);

        // Keep waiting for confirmation, but let the question go through to avatar
        // The avatar will respond, and we'll still be in confirmation-waiting mode
        // After avatar responds, user can confirm or ask more questions
      }
      // If neither clear confirmation nor question, let it fall through to normal processing
    }

    // Check if we're waiting for section transition confirmation
    if (waitingForSectionConfirmationRef.current && pendingSectionTransitionRef.current) {
      const lowerText = text.toLowerCase().trim();

      // Check for "repeat video" command first
      const repeatVideoKeywords = ['repeat the video', 'replay the video', 'watch again', 'play again', 'replay', 'watch it again'];
      const wantsVideoReplay = repeatVideoKeywords.some(keyword => lowerText.includes(keyword));

      if (wantsVideoReplay && lastVideoUrlRef.current) {
        // User wants to replay the video
        addDebugLog(`[SECTION-CONFIRM] 🔁 User wants to replay video: "${text}"`);

        // Reset confirmation state - will be set again after video ends
        waitingForSectionConfirmationRef.current = false;
        pendingSectionTransitionRef.current = null;

        // Reset completion guards so replay can trigger new completion
        lastVideoCompletionModuleRef.current = null;
        videoCompletionInProgressRef.current = false;

        // Reset inactivity timeout
        resetInactivityTimeout();

        // Mute microphone and disable listening during video
        if (sessionManagerRef.current?.isInitialized) {
          sessionManagerRef.current.setMicrophoneMuted(true);
          setIsMuted(true);
        }
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.disableListening();
          listeningStateRef.current = 'disabled';
        }

        // Play the video again
        sendMessageToReplica("Sure, let me replay the video for you.", 'echo');
        setTimeout(() => {
          if (playDemoVideoRef.current && lastVideoUrlRef.current) {
            playDemoVideoRef.current(lastVideoUrlRef.current);
          }
        }, 2000);

        return;
      }

      // Keywords that indicate user wants to proceed
      const confirmationKeywords = [
        'yes', 'yeah', 'yep', 'yup', 'sure', 'okay', 'ok', 'clear', 'understood',
        'got it', 'i understand', 'no questions', 'let\'s continue', 'continue',
        'move on', 'next', 'proceed', 'go ahead', 'all clear', 'makes sense',
        'i got it', 'perfect', 'great', 'good', 'fine', 'alright', 'right'
      ];

      // Check if user's response contains confirmation
      const isConfirmation = confirmationKeywords.some(keyword =>
        lowerText.includes(keyword)
      );

      // Keywords that indicate user has questions or needs clarification
      // Note: removed 'repeat' and 'again' since those are handled above for video replay
      const questionKeywords = [
        'question', 'what', 'how', 'why', 'can you', 'could you', 'explain',
        'tell me more', 'clarify', 'not clear', 'confused', 'don\'t understand',
        'no', 'wait', 'hold on'
      ];

      const hasQuestion = questionKeywords.some(keyword =>
        lowerText.includes(keyword)
      );

      if (isConfirmation && !hasQuestion) {
        // User confirmed - proceed to next section
        addDebugLog(`[SECTION-CONFIRM] ✅ User confirmed section transition: "${text}"`);

        // User responded - reset inactivity timeout
        resetInactivityTimeout();

        const nextModuleId = pendingSectionTransitionRef.current;

        // Reset section confirmation state
        waitingForSectionConfirmationRef.current = false;
        pendingSectionTransitionRef.current = null;

        // Mute microphone before transitioning
        if (sessionManagerRef.current?.isInitialized) {
          sessionManagerRef.current.setMicrophoneMuted(true);
          setIsMuted(true);
        }

        // Disable listening and interrupt any pending Tavus response
        if (dailyEventManagerRef.current) {
          listeningStateRef.current = 'disabled';
          dailyEventManagerRef.current.disableListening();
          dailyEventManagerRef.current.interruptReplica();
        }

        addDebugLog(`[SECTION-CONFIRM] Transitioning to next section: ${nextModuleId}`);

        // Wait a bit for the interrupt to process, then transition
        setTimeout(() => {
          if (mountedRef.current && handleModuleSelectRef.current) {
            addDebugLog(`[SECTION-CONFIRM] Executing transition to: ${nextModuleId}`);
            handleModuleSelectRef.current(nextModuleId);
          }
        }, 500);

        return; // Don't process as regular speech
      } else if (hasQuestion) {
        // User has a question - let avatar respond naturally
        addDebugLog(`[SECTION-CONFIRM] 🤔 User has question: "${text}" - letting avatar respond`);
        // Keep waiting for confirmation, but let the question go through to avatar
      }
      // If neither clear confirmation nor question, let it fall through to normal processing
    }

    // Check if we're waiting for video quiz confirmation (after video ends, before quiz starts)
    if (waitingForVideoQuizConfirmationRef.current && pendingVideoQuizModuleRef.current) {
      const lowerText = text.toLowerCase().trim();

      // Keywords that indicate user wants to proceed to quiz
      const confirmationKeywords = [
        'yes', 'yeah', 'yep', 'yup', 'sure', 'okay', 'ok', 'clear', 'understood',
        'got it', 'i understand', 'no questions', 'let\'s continue', 'continue',
        'move on', 'next', 'proceed', 'go ahead', 'all clear', 'makes sense',
        'i got it', 'perfect', 'great', 'good', 'fine', 'alright', 'right',
        'start quiz', 'ready', 'let\'s go', 'begin'
      ];

      // Check if user's response contains confirmation
      const isConfirmation = confirmationKeywords.some(keyword =>
        lowerText.includes(keyword)
      );

      // Check for "repeat video" command
      const repeatKeywords = ['repeat the video', 'replay the video', 'watch again', 'play again', 'replay', 'watch it again'];
      const wantsReplay = repeatKeywords.some(keyword => lowerText.includes(keyword));

      // Keywords that indicate user has questions
      const questionKeywords = [
        'question', 'what', 'how', 'why', 'can you', 'could you', 'explain',
        'tell me more', 'clarify', 'not clear', 'confused', 'don\'t understand',
        'no', 'wait', 'hold on'
      ];

      const hasQuestion = questionKeywords.some(keyword =>
        lowerText.includes(keyword)
      );

      if (wantsReplay && lastVideoUrlRef.current) {
        // User wants to replay the video
        addDebugLog(`[VIDEO-QUIZ-CONFIRM] 🔁 User wants to replay video: "${text}"`);

        // Reset confirmation state - will be set again after video ends
        waitingForVideoQuizConfirmationRef.current = false;
        const moduleToReplay = pendingVideoQuizModuleRef.current;
        pendingVideoQuizModuleRef.current = null;

        // Reset completion guards so replay can trigger new completion
        lastVideoCompletionModuleRef.current = null;
        videoCompletionInProgressRef.current = false;

        // Mute microphone and disable listening during video
        if (sessionManagerRef.current?.isInitialized) {
          sessionManagerRef.current.setMicrophoneMuted(true);
          setIsMuted(true);
        }
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.disableListening();
          listeningStateRef.current = 'disabled';
        }

        // Play the video again
        sendMessageToReplica("Sure, let me replay the video for you.", 'echo');
        setTimeout(() => {
          if (playDemoVideoRef.current && lastVideoUrlRef.current) {
            playDemoVideoRef.current(lastVideoUrlRef.current);
          }
        }, 2000);

        return;
      } else if (isConfirmation && !hasQuestion) {
        // User confirmed - start the quiz
        addDebugLog(`[VIDEO-QUIZ-CONFIRM] ✅ User confirmed to start quiz: "${text}"`);

        // User responded - reset inactivity timeout
        resetInactivityTimeout();

        const moduleId = pendingVideoQuizModuleRef.current;

        // Reset confirmation state
        waitingForVideoQuizConfirmationRef.current = false;
        pendingVideoQuizModuleRef.current = null;

        // Mute microphone and disable listening during quiz
        if (sessionManagerRef.current?.isInitialized) {
          sessionManagerRef.current.setMicrophoneMuted(true);
          setIsMuted(true);
        }
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.disableListening();
          listeningStateRef.current = 'disabled';
          dailyEventManagerRef.current.interruptReplica();
        }

        addDebugLog(`[VIDEO-QUIZ-CONFIRM] Starting quiz for module: ${moduleId}`);

        // Start the quiz after a brief delay
        setTimeout(() => {
          if (mountedRef.current && startMcqQuizRef.current) {
            startMcqQuizRef.current(moduleId);
          }
        }, 500);

        return;
      } else if (hasQuestion) {
        // User has a question - let avatar respond naturally
        addDebugLog(`[VIDEO-QUIZ-CONFIRM] 🤔 User has question: "${text}" - letting avatar respond`);
        // Keep waiting for confirmation, but let the question go through to avatar
      }
      // If neither clear confirmation nor question, let it fall through to normal processing
    }

    // Check if MCQ quiz is active - quiz uses click-only answers, ignore any voice input
    if (mcqQuizStateRef.current.isActive) {
      console.log('[VOICE-DEBUG] handleUserSpeech - MCQ quiz active, ignoring voice (click-only quiz):', text);
      addDebugLog(`[MCQ-QUIZ] Ignoring voice during quiz (click-only): "${text}"`);
      return;
    }

    // When user starts a new question, clear old transcripts and start fresh
    // Only show the current conversation: new user question (avatar response will be added when it speaks)
    setTranscripts([
      {
        type: "user_speech",
        text: text,
        timestamp: Date.now(),
      },
    ]);
    detectIntent(text, { text }, "user");
  };

  // Handle replica speech
  // Strip markdown formatting from text (remove #, **, ###, etc.)
  const stripMarkdown = (text) => {
    if (!text) return text;
    return text
      // Remove markdown headers (#, ##, ###, etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold (**text** or __text__)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      // Remove italic (*text* or _text_)
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove code blocks (```code```)
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code (`code`)
      .replace(/`([^`]+)`/g, '$1')
      // Remove links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remove horizontal rules (---, ***)
      .replace(/^[-*]{3,}$/gm, '')
      // Remove blockquotes (> text)
      .replace(/^>\s+/gm, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const handleReplicaSpeech = (text, source) => {
    if (!text) return;
    
    // Strip markdown from avatar speech immediately
    const cleanedText = stripMarkdown(text);
    
    log('REPLICA_SPEECH', `Replica said (${source})`, { text: cleanedText });
    
    // Check if avatar finished speaking about a module topic
    // Mark module as completed when avatar finishes explaining
    // SKIP video modules - they have their own completion handling in handleVideoModuleStop
    // SKIP when waiting for confirmation - the avatar is speaking a completion prompt, not lesson content
    // SKIP PDF presentation modules - they complete via onPresentationEnd callback, not speech detection
    const isVideoModule = videoModules.includes(activeModule);
    const isPdfPresenting = pdfPresentationRef.current.isPresenting;
    const isWaitingForConfirmation = waitingForVideoQuizConfirmationRef.current ||
                                      waitingForSectionConfirmationRef.current ||
                                      waitingForModuleConfirmationRef.current;

    if (activeModule && activeModule !== 'final-quiz' && !completedModules.includes(activeModule) &&
        !isVideoModule && !isPdfPresenting && !isWaitingForConfirmation) {
      // Check if avatar's speech indicates completion of topic
      const completionIndicators = [
        'does that make sense',
        'any questions',
        'what would you like to know',
        'let\'s discuss another',
        'what else interests you',
        'questions do you have',
        'think of an example',
        'can you think',
        'what questions do you have',
        'ready to move on',
        'next topic',
        'another topic',
        'what would you like',
        'do you have questions',
        'anything else',
        'anything specific',
        'what interests you',
        'what would you like to know more',
        'questions about',
        'understand',
        'clear',
        'make sense'
      ];
      
      const lowerText = cleanedText.toLowerCase();
      const indicatesCompletion = completionIndicators.some(indicator => 
        lowerText.includes(indicator)
      );
      
      // For personas with proactive flow, also check if avatar has been speaking for a while (more lenient completion)
      const hasProactiveFlow = persona.hasFeature('proactiveModuleFlow');
      const textLength = cleanedText.length;
      const hasSubstantialContent = textLength > 100; // Avatar has spoken a substantial amount

      // Mark as completed after avatar finishes speaking
      // For proactive flow personas: be more lenient - if avatar has spoken substantially, consider it complete
      // For others: require completion indicators
      if (indicatesCompletion || (hasProactiveFlow && hasSubstantialContent)) {
        // Use a ref to track if we've already scheduled completion
        const moduleId = activeModule;
        setTimeout(() => {
          setCompletedModules(prev => {
            // Check if already completed to avoid duplicates
            if (prev.includes(moduleId)) {
              return prev;
            }
            
            // Add completed module
            const updated = [...prev, moduleId];
            
            // Log completion for debugging
            log('MODULE_COMPLETE', `Module ${moduleId} completed. Unlocking next module...`);

            // Determine next module to unlock (only for personas without proactive flow)
            if (!persona.hasFeature('proactiveModuleFlow')) {
              const currentIndex = moduleOrder.indexOf(moduleId);
              const nextModuleId = moduleOrder[currentIndex + 1];

              // Get module titles from persona config
              const currentModuleDef = persona.getModule(moduleId);
              const nextModuleDef = persona.getModule(nextModuleId);
              const currentModuleName = currentModuleDef?.title || moduleId;
              const nextModuleName = nextModuleDef?.title || nextModuleId;

              // Notify user about next module unlocking (if not quiz)
              if (nextModuleId && nextModuleId !== 'final-quiz') {
                setTimeout(() => {
                  sendMessageToReplica(
                    `Great job completing ${currentModuleName}! ` +
                    `The next topic "${nextModuleName}" is now unlocked. You can click on it in the sidebar to continue learning!`
                  );
                }, 1000);
              } else if (nextModuleId === 'final-quiz' && updated.length >= moduleOrder.length - 1) {
                // All topics completed, quiz unlocked
                setTimeout(() => {
                  sendMessageToReplica(
                    `Excellent! You've completed all the learning topics. The Final Quiz is now unlocked! ` +
                    `Click on "Final Quiz" in the sidebar when you're ready to test your knowledge.`
                  );
                }, 1000);
              }
            } else {
              // For Entri persona, automatically move to next module after completion
              // BUT NOT if we're waiting for user confirmation (video quiz, section transition, etc.)
              const currentIndex = moduleOrder.indexOf(moduleId);
              if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
                const nextModuleId = moduleOrder[currentIndex + 1];
                addDebugLog(`[ENTRI-ONBOARDING] Module ${moduleId} completed, checking if should auto-advance to ${nextModuleId}`);

                // Wait a bit then automatically move to next module
                // BUT skip if we're waiting for any kind of confirmation
                setTimeout(() => {
                  if (mountedRef.current && !quizState.isActive &&
                      !waitingForVideoQuizConfirmationRef.current &&
                      !waitingForSectionConfirmationRef.current &&
                      !waitingForModuleConfirmationRef.current) {
                    addDebugLog(`[ENTRI-ONBOARDING] Auto-advancing to ${nextModuleId}`);
                    handleModuleSelect(nextModuleId);
                  } else {
                    addDebugLog(`[ENTRI-ONBOARDING] Skipping auto-advance - waiting for user confirmation`);
                  }
                }, 3000); // Wait 3 seconds after completion before moving to next
              }
            }
            
            return updated;
          });
        }, 2000);
      }
    }
    
    // Check for quiz question detection
    if (quizState.isActive) {
      handleReplicaSpeechForQuiz(cleanedText);
    }
    
    // Update transcripts: keep the last user question and add/update current avatar response
    // Only show current conversation: last user question + current avatar response
    setTranscripts((prev) => {
      // Find the last user question (should be the most recent one)
      const lastUser = prev.filter(t => t.type === 'user_speech').slice(-1);
      // Keep only: last user question + current avatar response
      // Use cleaned text (already has markdown stripped)
      return [
        ...lastUser,
        {
          type: "avatar_speech",
          text: cleanedText,
          timestamp: Date.now(),
        },
      ];
    });
    lastAvatarSpeechRef.current = cleanedText;
    detectIntent(cleanedText, { text: cleanedText }, "avatar");
  };

  // Handle tool calls from Tavus
  const handleToolCall = (name, args) => {
    // VERBOSE DEBUG LOGGING - Log every tool call before processing
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║           📥 handleToolCall() INVOKED                         ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║ Tool Name: "${name}"`);
    console.log(`║ Arguments:`, JSON.stringify(args, null, 2));
    console.log(`║ PDF Presentation State:`);
    console.log(`║   - isPresenting: ${pdfPresentationRef.current?.isPresenting}`);
    console.log(`║   - currentSlideIndex: ${pdfPresentationRef.current?.currentSlideIndex}`);
    console.log(`║   - totalSlides: ${pdfPresentationRef.current?.totalSlides}`);
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    switch (name) {
      case 'schedule_meeting':
      case 'book_call':
        log('TOOL_CALL', 'Scheduling meeting via tool call', { calendly_url: args.calendly_url });

        // Send echo message to acknowledge the request
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.sendEchoMessage("Opening the calendar for you now.");
        }

        // Use URL from tool args
        if (args.calendly_url) {
          setCalendlyUrl(args.calendly_url);
        }

        pendingCalendlyRef.current = true;
        break;
      case 'show_demo':
        if (args.videoUrl) {
          playDemoVideo(args.videoUrl);
        }
        break;
      case 'show_demo_video':
        // Handle show_demo_video tool call from Tavus persona
        log('TOOL_CALL', 'show_demo_video triggered', { url: args.url, title: args.title });

        // Send echo message to announce the video
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.sendEchoMessage("Absolutely, here's the video you requested.");
        }

        // Store the video URL and wait for avatar to finish speaking
        if (args.url) {
          pendingDemoVideoRef.current = args.url;
          log('DEMO', 'Video pending - waiting for user and avatar to finish speaking');

          // Set timeout to clear pending video after 30 seconds (prevent stuck state)
          if (pendingVideoTimeoutRef.current) {
            clearTimeout(pendingVideoTimeoutRef.current);
          }
          pendingVideoTimeoutRef.current = setTimeout(() => {
            if (pendingDemoVideoRef.current) {
              log('DEMO', 'Pending video timeout - clearing stuck pending state');
              pendingDemoVideoRef.current = null;
              videoAnnouncementStartedRef.current = false;
            }
            pendingVideoTimeoutRef.current = null;
          }, 30000);
        }
        break;
      case 'show_pdf':
        // Handle show_pdf tool call from Tavus persona
        log('TOOL_CALL', 'show_pdf triggered', { url: args.url, title: args.title });

        // Send echo message to announce the PDF
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.sendEchoMessage("Sure, here's the document you requested.");
        }

        // Store the PDF URL and wait for avatar to finish speaking
        if (args.url) {
          setPendingPdfUrl(args.url);
          log('PDF', 'PDF pending - waiting for avatar to finish speaking');

          // Set timeout to clear pending PDF after 30 seconds (prevent stuck state)
          if (pendingPdfTimeoutRef.current) {
            clearTimeout(pendingPdfTimeoutRef.current);
          }
          pendingPdfTimeoutRef.current = setTimeout(() => {
            setPendingPdfUrl((current) => {
              if (current) {
                log('PDF', 'Pending PDF timeout - clearing stuck pending state');
                return null;
              }
              return current;
            });
            pendingPdfTimeoutRef.current = null;
          }, 30000);
        }
        break;

      // ========== PDF NAVIGATION TOOLS ==========
      // These tools are called by Tavus LLM during PDF presentations
      // Each has a guard to ensure presentation is active

      case 'navigate_pdf_next':
        console.log('\n🎯 [PDF-TOOL-HANDLER] navigate_pdf_next CASE HIT');
        console.log('   isPresenting:', pdfPresentationRef.current.isPresenting);
        console.log('   currentSlideIndex:', pdfPresentationRef.current.currentSlideIndex);
        console.log('   totalSlides:', pdfPresentationRef.current.totalSlides);
        if (!pdfPresentationRef.current.isPresenting) {
          addDebugLog('[PDF-TOOL] Ignored navigate_pdf_next - no active presentation');
          console.log('   ❌ IGNORED - no active presentation');
          break;
        }
        addDebugLog('[PDF-TOOL] navigate_pdf_next called');
        {
          const currentIndex = pdfPresentationRef.current.currentSlideIndex;
          const totalSlides = pdfPresentationRef.current.totalSlides;
          console.log(`   ✅ EXECUTING: Going from slide ${currentIndex} to ${currentIndex + 1}`);
          if (currentIndex < totalSlides - 1) {
            // Queue navigation to wait for avatar acknowledgment to finish
            // Avatar will say "okay, going to next slide" - we navigate after it finishes
            const targetIndex = currentIndex + 1;
            pendingPdfNavigationRef.current = { action: 'next', targetIndex };
            // CRITICAL: If avatar is already speaking (tool call comes during speech),
            // mark acknowledged immediately since we missed the started_speaking event
            pdfNavigationAcknowledgedRef.current = isAvatarSpeakingRef.current;
            console.log(`   ⏳ Queued navigation to slide ${targetIndex + 1} - acknowledged: ${pdfNavigationAcknowledgedRef.current}`);
          } else {
            console.log('   ⚠️ Already at last slide');
            // CRITICAL: Mark this as NOT a narration - it's an info message
            // This prevents auto-advance after the avatar speaks this message
            expectingNarrationRef.current = false;
            console.log('   🚫 Set expectingNarrationRef = false to prevent auto-advance after info message');
            dailyEventManagerRef.current?.sendEchoMessage("This is the last slide. Say 'finish' when you're ready to move on.");
          }
        }
        break;

      case 'navigate_pdf_back':
        console.log('\n🎯 [PDF-TOOL-HANDLER] navigate_pdf_back CASE HIT');
        console.log('   isPresenting:', pdfPresentationRef.current.isPresenting);
        console.log('   currentSlideIndex:', pdfPresentationRef.current.currentSlideIndex);
        console.log('   totalSlides:', pdfPresentationRef.current.totalSlides);
        if (!pdfPresentationRef.current.isPresenting) {
          addDebugLog('[PDF-TOOL] Ignored navigate_pdf_back - no active presentation');
          console.log('   ❌ IGNORED - no active presentation');
          break;
        }
        addDebugLog('[PDF-TOOL] navigate_pdf_back called');
        {
          const currentIndex = pdfPresentationRef.current.currentSlideIndex;
          console.log(`   ✅ EXECUTING: Going from slide ${currentIndex} to ${currentIndex - 1}`);
          if (currentIndex > 0) {
            // Queue navigation to wait for avatar acknowledgment to finish
            const targetIndex = currentIndex - 1;
            pendingPdfNavigationRef.current = { action: 'back', targetIndex };
            // CRITICAL: If avatar is already speaking (tool call comes during speech),
            // mark acknowledged immediately since we missed the started_speaking event
            pdfNavigationAcknowledgedRef.current = isAvatarSpeakingRef.current;
            console.log(`   ⏳ Queued navigation to slide ${targetIndex + 1} - acknowledged: ${pdfNavigationAcknowledgedRef.current}`);
          } else {
            console.log('   ⚠️ Already at first slide');
            // CRITICAL: Mark this as NOT a narration - it's an info message
            // This prevents auto-advance after the avatar speaks this message
            expectingNarrationRef.current = false;
            console.log('   🚫 Set expectingNarrationRef = false to prevent auto-advance after info message');
            dailyEventManagerRef.current?.sendEchoMessage("This is the first slide.");
          }
        }
        break;

      case 'navigate_pdf_goto':
        console.log('\n🎯 [PDF-TOOL-HANDLER] navigate_pdf_goto CASE HIT');
        console.log('   isPresenting:', pdfPresentationRef.current.isPresenting);
        console.log('   args.slide_number:', args.slide_number);
        if (!pdfPresentationRef.current.isPresenting) {
          addDebugLog('[PDF-TOOL] Ignored navigate_pdf_goto - no active presentation');
          console.log('   ❌ IGNORED - no active presentation');
          break;
        }
        if (!args.slide_number) {
          addDebugLog('[PDF-TOOL] navigate_pdf_goto missing slide_number');
          console.log('   ❌ IGNORED - missing slide_number');
          break;
        }
        addDebugLog(`[PDF-TOOL] navigate_pdf_goto called - slide ${args.slide_number}`);
        {
          const slideIndex = args.slide_number - 1; // Convert to 0-based
          const totalSlides = pdfPresentationRef.current.totalSlides;
          console.log(`   ✅ EXECUTING: Going to slide index ${slideIndex} (1-based: ${args.slide_number})`);
          if (slideIndex >= 0 && slideIndex < totalSlides) {
            // Queue navigation to wait for avatar acknowledgment to finish
            const targetIndex = slideIndex;
            pendingPdfNavigationRef.current = { action: 'goto', targetIndex };
            // CRITICAL: If avatar is already speaking (tool call comes during speech),
            // mark acknowledged immediately since we missed the started_speaking event
            pdfNavigationAcknowledgedRef.current = isAvatarSpeakingRef.current;
            console.log(`   ⏳ Queued navigation to slide ${targetIndex + 1} - acknowledged: ${pdfNavigationAcknowledgedRef.current}`);
          } else {
            console.log(`   ⚠️ Invalid slide number: ${args.slide_number} (total: ${totalSlides})`);
            // CRITICAL: Mark this as NOT a narration - it's an error response
            // This prevents auto-advance after the avatar speaks this message
            expectingNarrationRef.current = false;
            console.log(`   🚫 Set expectingNarrationRef = false to prevent auto-advance after error message`);
            dailyEventManagerRef.current?.sendEchoMessage(
              `There is no slide ${args.slide_number}. This presentation has ${totalSlides} slides.`
            );
          }
        }
        break;

      case 'navigate_pdf_repeat':
        console.log('\n🎯 [PDF-TOOL-HANDLER] navigate_pdf_repeat CASE HIT');
        console.log('   isPresenting:', pdfPresentationRef.current.isPresenting);
        console.log('   currentSlideIndex:', pdfPresentationRef.current.currentSlideIndex);
        if (!pdfPresentationRef.current.isPresenting) {
          addDebugLog('[PDF-TOOL] Ignored navigate_pdf_repeat - no active presentation');
          console.log('   ❌ IGNORED - no active presentation');
          break;
        }
        addDebugLog('[PDF-TOOL] navigate_pdf_repeat called');
        {
          const currentIndex = pdfPresentationRef.current.currentSlideIndex;
          // Queue repeat to wait for avatar acknowledgment to finish
          pendingPdfNavigationRef.current = { action: 'repeat', targetIndex: currentIndex };
          // CRITICAL: If avatar is already speaking (tool call comes during speech),
          // mark acknowledged immediately since we missed the started_speaking event
          pdfNavigationAcknowledgedRef.current = isAvatarSpeakingRef.current;
          console.log(`   ⏳ Queued repeat for slide ${currentIndex + 1} - acknowledged: ${pdfNavigationAcknowledgedRef.current}`);
        }
        break;

      case 'end_pdf_presentation':
        console.log('\n🎯 [PDF-TOOL-HANDLER] end_pdf_presentation CASE HIT');
        console.log('   isPresenting:', pdfPresentationRef.current.isPresenting);
        if (!pdfPresentationRef.current.isPresenting) {
          addDebugLog('[PDF-TOOL] Ignored end_pdf_presentation - no active presentation');
          console.log('   ❌ IGNORED - no active presentation');
          break;
        }
        addDebugLog('[PDF-TOOL] end_pdf_presentation called');
        console.log('   ✅ EXECUTING: Ending PDF presentation');
        // Interrupt any ongoing narration
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.interruptReplica();
        }
        pdfEndPresentationRef.current?.();
        console.log('   ✅ Called pdfEndPresentationRef');
        break;

      case 'answer_pdf_question':
        console.log('\n🎯 [PDF-TOOL-HANDLER] answer_pdf_question CASE HIT');
        console.log('   isPresenting:', pdfPresentationRef.current.isPresenting);
        console.log('   args.question:', args.question);
        // Tavus LLM answers the question directly using slide context in conversation
        // We just log it - no action needed as Tavus handles the response
        if (!pdfPresentationRef.current.isPresenting) {
          addDebugLog('[PDF-TOOL] answer_pdf_question called but no presentation active');
          console.log('   ⚠️ Warning: No presentation active');
        } else {
          // Mark that we're in Q&A mode - this prevents auto-advance after the response
          isQandAResponseRef.current = true;
          addDebugLog('[PDF-TOOL] 🔄 Q&A mode enabled - auto-advance will be skipped after response');
          console.log('   🔄 Q&A mode enabled - auto-advance will be skipped');
        }
        addDebugLog(`[PDF-TOOL] User question: ${args.question || 'unknown'}`);
        console.log('   ✅ Tavus LLM will answer based on slide context');
        // The LLM will generate a response based on the slide context we sent
        break;

      default:
        log('TOOL_CALL', `Unhandled tool: ${name}`);
    }
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Restore widget state after demo ends
  useEffect(() => {
    if (!isDemoPlaying && preDemoWidgetStateRef.current !== null) {
      // Note: Avatar audio is restored by onVideoStop callback in useDemoVideo
      log('DEMO', 'Demo ended - state will be restored');

      if (sessionManagerRef.current?.isInitialized) {
        log('DEMO', 'Returning to maximized state after demo closed');
        setState("maximized");
      } else {
        log('DEMO', 'No active session - keeping minimized');
        setState("minimized");
      }
      preDemoWidgetStateRef.current = null;
    }
  }, [isDemoPlaying, log]);

  // Restore widget state after calendly closes
  useEffect(() => {
    if (!showCalendly && preCalendlyWidgetStateRef.current !== null) {
      if (sessionManagerRef.current?.isInitialized) {
        log('CALENDLY', 'Returning to maximized state after calendly closed');
        setState("maximized");
      } else {
        log('CALENDLY', 'No active session - keeping minimized');
        setState("minimized");
      }
      preCalendlyWidgetStateRef.current = null;
    }
  }, [showCalendly, log]);

  // Wait for both user and avatar to finish speaking before opening Calendly
  useEffect(() => {
    if (pendingCalendlyRef.current && !isAvatarSpeaking && !isUserSpeaking) {
      log('CALENDLY', 'Both user and replica finished speaking - opening Calendly now');
      preCalendlyWidgetStateRef.current = state;
      if (state !== "maximized") {
        setState("maximized");
      }
      setShowCalendly(true);
      pendingCalendlyRef.current = false;
    }
  }, [isAvatarSpeaking, isUserSpeaking, state, log]);

  // Wait for avatar to finish speaking before playing demo video
  // This applies to ALL videos including founder-video - avatar should finish intro first
  // CRITICAL: Only play after avatar has STARTED and FINISHED the announcement
  useEffect(() => {
    if (pendingDemoVideoRef.current && videoAnnouncementStartedRef.current) {
      const videoUrl = pendingDemoVideoRef.current;

      // Wait for avatar to finish speaking before playing any video
      // videoAnnouncementStartedRef ensures avatar has started the intro
      // !isAvatarSpeaking ensures avatar has finished the intro
      if (!isAvatarSpeaking && !isUserSpeaking) {
        log('DEMO', 'Avatar finished speaking announcement - playing video now');

        // Reset the announcement flag
        videoAnnouncementStartedRef.current = false;

        // Save current state for restoration later
        preDemoWidgetStateRef.current = state;

        // Maximize if not already, then play
        // Note: Avatar audio will be muted by onVideoStart callback in useDemoVideo
        // Store the video URL for potential replay
        lastVideoUrlRef.current = videoUrl;

        if (state !== "maximized") {
          setState("maximized");
          setTimeout(() => {
            playDemoVideo(videoUrl);
            pendingDemoVideoRef.current = null;
          }, 300);
        } else {
          playDemoVideo(videoUrl);
          pendingDemoVideoRef.current = null;
        }
      }
    }
  }, [isAvatarSpeaking, isUserSpeaking, state, log, playDemoVideo, activeModule]);

  // Wait for avatar to finish intro before starting PDF presentation
  useEffect(() => {
    if (pendingPresentationRef.current && !isAvatarSpeaking && !isUserSpeaking && !startingPresentationRef.current) {
      // Double-check this presentation module is still the active module
      const presentationModuleId = pendingPresentationRef.current.moduleId;
      if (activeModuleRef.current !== presentationModuleId) {
        addDebugLog(`[PDF] Skipping presentation start - module changed from ${presentationModuleId} to ${activeModuleRef.current}`);
        pendingPresentationRef.current = null;
        return;
      }

      startingPresentationRef.current = true;
      const presentationData = pendingPresentationRef.current;
      pendingPresentationRef.current = null;

      addDebugLog('[PDF] Intro finished - starting PDF presentation now');

      // Clear inactivity timeout - user is in PDF presentation with mic enabled for voice commands
      clearInactivityTimeouts();

      // 🎤 Keep Tavus listening ENABLED during PDF for NLU-powered tool calls
      // User can navigate slides by speaking (e.g., "next slide", "go back")
      if (dailyEventManagerRef.current) {
        dailyEventManagerRef.current.enableListening();
        listeningStateRef.current = 'enabled';
        addDebugLog('[PDF] 🎤 Tavus listening ENABLED for NLU tool calls');
      }

      // 🔇 Mute microphone initially during PDF presentation (user can unmute to speak)
      if (sessionManagerRef.current?.isInitialized) {
        sessionManagerRef.current.setMicrophoneMuted(true).catch(err => {
          addDebugLog(`[PDF] Failed to mute mic: ${err.message}`);
        });
        setIsMuted(true);
        addDebugLog('[PDF] 🔇 Mic muted during presentation');
      }

      // Start the PDF presentation
      pdfPresentation.startPresentation(presentationData).then(() => {
        // Voice commands disabled - using auto-advance instead
        console.log('\n🎬 [PDF-START] startPresentation resolved - setting up first slide');

        // CRITICAL: Set ref directly to avoid React state sync delay
        // The useEffect that syncs pdfPresentationRef.current may not run until next render
        pdfPresentationRef.current.isPresenting = true;
        pdfPresentationRef.current.totalSlides = presentationData.slides?.length || 0;
        console.log('   ✅ pdfPresentationRef.current.isPresenting = true');

        // DON'T set expectingNarrationRef here - the SYSTEM message in startPresentation
        // may trigger a Tavus conversational response. We only want to set the flag
        // right before the actual narration echo is sent.
        isQandAResponseRef.current = false; // Reset Q&A mode
        console.log('   ⏳ expectingNarrationRef stays false until narration echo is sent');

        // Narrate first slide - set expectingNarrationRef RIGHT BEFORE sending echo
        setTimeout(() => {
          console.log('   🎤 [PDF-START] 800ms timer fired - setting expectingNarrationRef and calling narrateSlide(0)');
          // CRITICAL: Set this flag RIGHT BEFORE narration so any Tavus response
          // to the SYSTEM message doesn't trigger auto-advance
          expectingNarrationRef.current = true;
          console.log('   ✅ expectingNarrationRef.current = true (now ready for narration)');
          // CRITICAL: Use pdfNarrateSlideRef (not pdfPresentation from closure) to avoid stale closure bug
          pdfNarrateSlideRef.current?.(0);
          startingPresentationRef.current = false;
        }, 800);
      }).catch((error) => {
        addDebugLog(`[PDF] Failed to start presentation: ${error.message}`);
        startingPresentationRef.current = false;
        // Reset state on error
        if (mountedRef.current) {
          // Optionally notify user or try to recover
        }
      });
    }
  }, [isAvatarSpeaking, isUserSpeaking, pdfPresentation, addDebugLog, clearInactivityTimeouts]);

  // Wait for both user and avatar to finish speaking before showing PDF
  useEffect(() => {
    if (pendingPdfUrl && !isAvatarSpeaking && !isUserSpeaking) {
      log('PDF', 'Both user and replica finished speaking - showing PDF now');

      // Save current state for restoration later
      prePdfWidgetStateRef.current = state;

      // Maximize if not already, then show PDF
      if (state !== "maximized") {
        setState("maximized");
        setTimeout(() => {
          setPdfUrl(pendingPdfUrl);
          setShowPdf(true);
          setPendingPdfUrl(null);
        }, 300);
      } else {
        setPdfUrl(pendingPdfUrl);
        setShowPdf(true);
        setPendingPdfUrl(null);
      }
    }
  }, [isAvatarSpeaking, isUserSpeaking, pendingPdfUrl, state, log]);

  // Execute pending PDF navigation when avatar finishes speaking acknowledgment
  // This allows avatar to say "okay, going to next slide" before actually navigating
  useEffect(() => {
    if (pendingPdfNavigationRef.current && pdfNavigationAcknowledgedRef.current && !isAvatarSpeaking) {
      const { action, targetIndex } = pendingPdfNavigationRef.current;

      console.log(`\n🎯 [PDF-NAV] Avatar finished acknowledgment - executing ${action} to slide ${targetIndex + 1}`);
      addDebugLog(`[PDF-NAV] Avatar finished - executing ${action} to slide ${targetIndex + 1}`);

      // Clear pending state
      pendingPdfNavigationRef.current = null;
      pdfNavigationAcknowledgedRef.current = false;

      // Mark user-initiated navigation to prevent auto-muting and auto-advance
      userNavigatedToSlideRef.current = targetIndex;

      // CRITICAL: Set expectingNarrationRef = true because navigation will send narration echo
      // This allows auto-advance to work after the narration completes
      expectingNarrationRef.current = true;
      console.log(`   ✅ Set expectingNarrationRef = true for upcoming narration`);

      // Interrupt any lingering speech and navigate
      if (dailyEventManagerRef.current) {
        dailyEventManagerRef.current.interruptReplica();
      }

      if (action === 'repeat') {
        pdfNarrateSlideRef.current?.(targetIndex);
      } else {
        pdfGoToSlideRef.current?.(targetIndex);
      }
    }
  }, [isAvatarSpeaking, addDebugLog]);

  // Restore widget state after PDF closes
  useEffect(() => {
    if (!showPdf && prePdfWidgetStateRef.current !== null) {
      if (sessionManagerRef.current?.isInitialized) {
        log('PDF', 'Returning to maximized state after PDF closed');
        setState("maximized");
      } else {
        log('PDF', 'No active session - keeping minimized');
        setState("minimized");
      }
      prePdfWidgetStateRef.current = null;
    }
  }, [showPdf, log]);

  // Clone avatar video to PDF PIP
  // Note: showPdf is for simple PDF/image display, pdfPresentation.isPresenting is for narrated presentations
  useEffect(() => {
    if ((showPdf || pdfPresentation.isPresenting) && hasLiveVideo) {
      const sourceVideo = document.querySelector('#tavus-video-container video');
      const pipContainer = document.getElementById('pdf-avatar-pip');

      if (sourceVideo && pipContainer) {
        // Check if video is already cloned (to avoid re-cloning on every render)
        const existingVideo = pipContainer.querySelector('video');
        if (existingVideo) {
          return; // Video already cloned, controls are already in DOM via React
        }

        const pipVideo = sourceVideo.cloneNode(true);
        pipVideo.style.width = '100%';
        pipVideo.style.height = '100%';
        pipVideo.style.objectFit = 'cover';
        pipVideo.style.position = 'absolute';
        pipVideo.style.top = '0';
        pipVideo.style.left = '0';
        pipVideo.style.zIndex = '10'; // Below controls (z-30)
        pipVideo.muted = false;

        if (sourceVideo.srcObject) {
          pipVideo.srcObject = sourceVideo.srcObject;
        }

        // Prepend video (so controls rendered by React stay on top)
        pipContainer.prepend(pipVideo);
        pipVideo.play().catch(e => console.log('PDF PIP video play failed:', e));
      }
    }

    // Cleanup: Remove cloned video when presentation ends
    return () => {
      if (!pdfPresentation.isPresenting && !showPdf) {
        const pipContainer = document.getElementById('pdf-avatar-pip');
        if (pipContainer) {
          const clonedVideo = pipContainer.querySelector('video');
          if (clonedVideo) {
            clonedVideo.pause();
            clonedVideo.srcObject = null;
            clonedVideo.parentNode.removeChild(clonedVideo);
            addDebugLog('[PDF] Cleaned up cloned video element');
          }
        }
      }
    };
  }, [showPdf, pdfPresentation.isPresenting, hasLiveVideo, addDebugLog]);

  // Clone avatar video to calendly PIP
  useEffect(() => {
    if (showCalendly && hasLiveVideo) {
      const sourceVideo = document.querySelector('#tavus-video-container video');
      const pipContainer = document.getElementById('calendly-avatar-pip');

      if (sourceVideo && pipContainer) {
        const pipVideo = sourceVideo.cloneNode(true);
        pipVideo.style.width = '100%';
        pipVideo.style.height = '100%';
        pipVideo.style.objectFit = 'cover';
        pipVideo.muted = false;

        if (sourceVideo.srcObject) {
          pipVideo.srcObject = sourceVideo.srcObject;
        }

        pipContainer.innerHTML = '';
        pipContainer.appendChild(pipVideo);
        pipVideo.play().catch(e => console.log('PIP video play failed:', e));
      }
    }
  }, [showCalendly, hasLiveVideo]);

  // Mute mic and avatar audio when calendly opens
  useEffect(() => {
    if (showCalendly) {
      preCalendlyMutedRef.current = isMuted;
      preCalendlyAudioEnabledRef.current = audioEnabled;

      if (!isMuted && sessionManagerRef.current) {
        sessionManagerRef.current.setMicrophoneMuted(true);
        setIsMuted(true);
      }

      if (audioEnabled) {
        setAudioEnabled(false);
      }
    } else {
      // Restore audio when calendly closes
      if (sessionManagerRef.current?.isInitialized) {
        sessionManagerRef.current.setMicrophoneMuted(false);
        setIsMuted(false);
      }

      if (!audioEnabled) {
        setAudioEnabled(true);
      }
    }
  }, [showCalendly]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync audio enabled state with session manager
  useEffect(() => {
    addDebugLog(`[SYNC-EFFECT] audioEnabled=${audioEnabled}, hasAudio=${hasAudio}`);

    const hasAudioElement = sessionManagerRef.current?.audioElement;

    if (hasAudioElement) {
      addDebugLog(`[SYNC-EFFECT] Calling setAudioMuted(${!audioEnabled})`);
      sessionManagerRef.current.setAudioMuted(!audioEnabled);
    }
  }, [audioEnabled, hasAudio]);

  // Auto-expand effect
  useEffect(() => {
    if (autoExpand && state === "minimized") {
      console.log('[TAVUS-AUTO-EXPAND] Setting state to small');
      setState("small");
    }
  }, [autoExpand, state]);

  // Auto-start session
  useEffect(() => {
    const debugInfo = {
      autoExpand,
      isConnecting,
      hasSession: sessionManagerRef.current?.isInitialized,
      hasAutoExpanded: hasAutoExpandedRef.current,
      state,
    };
    console.log('[TAVUS-AUTO-EXPAND] Effect triggered', debugInfo);

    if (autoExpand && !isConnecting && !sessionManagerRef.current?.isInitialized && !hasAutoExpandedRef.current) {
      console.log('[TAVUS-AUTO-EXPAND] Starting Tavus session...');
      addDebugLog('[AUTO-EXPAND] Starting Tavus session');
      hasAutoExpandedRef.current = true;
      startTavusSession();
    }
  }, [autoExpand]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep refs in sync
  useEffect(() => {
    sessionInfoRef.current = sessionInfo;
  }, [sessionInfo]);

  // Track if cleanup has already been performed to prevent duplicate calls
  const cleanupPerformedRef = useRef(false);

  // Async cleanup with retry logic
  const performCleanupWithRetry = useCallback(async (conversationId, source, retries = 3) => {
    console.log(`[CLEANUP-RETRY] Starting cleanup for ${conversationId} (source: ${source}, retries: ${retries})`);

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(getEndConversationUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
          keepalive: true,
        });

        if (response.ok || response.status === 404 || response.status === 400) {
          // 404/400 means already ended - that's fine
          console.log(`[CLEANUP-RETRY] Success on attempt ${i + 1} (status: ${response.status})`);
          return true;
        }
        console.log(`[CLEANUP-RETRY] Attempt ${i + 1} failed with status: ${response.status}`);
      } catch (e) {
        console.log(`[CLEANUP-RETRY] Attempt ${i + 1} failed: ${e.message}`);
      }

      // Wait before retry (except on last attempt)
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }

    // Final fallback: sendBeacon (fire-and-forget for page unload)
    console.log(`[CLEANUP-RETRY] All retries failed, using sendBeacon fallback`);
    try {
      navigator.sendBeacon(
        getEndConversationUrl(),
        new Blob([JSON.stringify({ conversationId })], { type: 'application/json' })
      );
    } catch (e) {
      console.log(`[CLEANUP-RETRY] sendBeacon also failed: ${e.message}`);
    }
    return false;
  }, []);

  // Centralized cleanup function - uses sendBeacon immediately for page unload scenarios
  // and async retry for normal cleanup
  const performCleanup = useCallback((source, useAsyncRetry = false) => {
    // Prevent duplicate cleanup calls
    if (cleanupPerformedRef.current) {
      console.log(`[CLEANUP] Already performed, skipping (source: ${source})`);
      return;
    }

    const currentSessionInfo = sessionInfoRef.current;
    if (!currentSessionInfo?.conversationId) {
      console.log(`[CLEANUP] No active session to cleanup (source: ${source})`);
      return;
    }

    cleanupPerformedRef.current = true;
    console.log(`[CLEANUP] Performing cleanup (source: ${source}), conversationId: ${currentSessionInfo.conversationId}`);

    const conversationId = currentSessionInfo.conversationId;
    const payload = JSON.stringify({ conversationId });

    // For page unload scenarios (beforeunload, pagehide, freeze), use sendBeacon immediately
    // It's the most reliable method when page is closing
    if (source === 'beforeunload' || source === 'pagehide' || source === 'unload' || source === 'freeze') {
      console.log(`[CLEANUP] Using sendBeacon for page unload scenario`);
      try {
        const beaconSent = navigator.sendBeacon(
          getEndConversationUrl(),
          new Blob([payload], { type: 'application/json' })
        );
        console.log(`[CLEANUP] sendBeacon result: ${beaconSent}`);
      } catch (e) {
        console.log(`[CLEANUP] sendBeacon failed: ${e.message}`);
      }
    } else if (useAsyncRetry) {
      // For non-unload scenarios with retry requested, use async retry
      performCleanupWithRetry(conversationId, source, 3);
    } else {
      // For normal cleanup (unmount, disconnect), use sendBeacon + async backup
      try {
        const beaconSent = navigator.sendBeacon(
          getEndConversationUrl(),
          new Blob([payload], { type: 'application/json' })
        );
        console.log(`[CLEANUP] sendBeacon result: ${beaconSent}`);
      } catch (e) {
        console.log(`[CLEANUP] sendBeacon failed: ${e.message}, using fetch fallback`);
      }

      // Also fire async fetch as backup (for React navigation scenarios)
      fetch(getEndConversationUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }

    // Remove from localStorage since we've cleaned up
    localStorage.removeItem('tavus_conversation_id');
    console.log(`[CLEANUP] Removed conversation ID from localStorage`);

    // Cleanup session manager
    if (sessionManagerRef.current) {
      try {
        sessionManagerRef.current.cleanup();
      } catch (e) {
        console.log(`[CLEANUP] Session manager cleanup error: ${e.message}`);
      }
    }

    // Cleanup event manager
    if (dailyEventManagerRef.current) {
      try {
        dailyEventManagerRef.current.detachFromDaily();
      } catch (e) {
        console.log(`[CLEANUP] Event manager cleanup error: ${e.message}`);
      }
    }
  }, [performCleanupWithRetry]);

  // Component lifecycle
  useEffect(() => {
    console.log('[TAVUS-LIFECYCLE] Component mounted');
    mountedRef.current = true;
    cleanupPerformedRef.current = false; // Reset cleanup flag on mount
    addDebugLog('[LIFECYCLE] Component MOUNTED');

    // Handler for page unload (tab close, browser close, refresh)
    const handlePageUnload = (event) => {
      addDebugLog(`[PAGE-UNLOAD] ${event.type} triggered`);
      performCleanup(event.type);
    };

    // Handler for visibility change (tab switch, mobile app switch, tab close on mobile)
    // Instead of immediate cleanup, start a 3-minute timeout
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Only start timeout if we have an active session
        if (sessionInfoRef.current?.conversationId) {
          addDebugLog(`[VISIBILITY] Page hidden - starting ${SESSION_TIMEOUT_MS / 1000 / 60} minute timeout`);
          hiddenTimestampRef.current = Date.now();

          // Clear any existing timeout
          if (visibilityTimeoutRef.current) {
            clearTimeout(visibilityTimeoutRef.current);
          }

          // Start new timeout - will end session after 3 minutes away
          visibilityTimeoutRef.current = setTimeout(() => {
            addDebugLog('[VISIBILITY-TIMEOUT] User away for 3 minutes - ending session');
            performCleanup('visibility-timeout');
            setSessionTimedOut(true);

            // Reset UI state
            setSessionInfo(null);
            sessionInfoRef.current = null;
            setHasLiveVideo(false);
            setHasAudio(false);
            setIsMuted(true);
            setIsConnecting(false);
            setAvatarState("idle");
            setIsAvatarSpeaking(false);
            setIsUserSpeaking(false);
          }, SESSION_TIMEOUT_MS);
        }
      } else if (document.visibilityState === 'visible') {
        // User returned - cancel the timeout if it hasn't fired yet
        if (visibilityTimeoutRef.current) {
          const awayDuration = hiddenTimestampRef.current
            ? Math.round((Date.now() - hiddenTimestampRef.current) / 1000)
            : 0;
          addDebugLog(`[VISIBILITY] Page visible again - user was away for ${awayDuration}s, cancelling timeout`);
          clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = null;
          hiddenTimestampRef.current = null;
        }

        // Quiz uses click-only answers, no speech recognition needed
      }
    };

    // Handler for page freeze (mobile browsers may freeze tabs)
    const handlePageFreeze = () => {
      addDebugLog('[FREEZE] Page frozen - performing cleanup');
      performCleanup('freeze');
    };

    // Add all event listeners
    window.addEventListener('beforeunload', handlePageUnload);
    window.addEventListener('pagehide', handlePageUnload);
    window.addEventListener('unload', handlePageUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Page Lifecycle API (if supported) - for mobile tab freezing
    if ('onfreeze' in document) {
      document.addEventListener('freeze', handlePageFreeze);
    }

    return () => {
      addDebugLog('[LIFECYCLE] Component UNMOUNTING');
      mountedRef.current = false;

      // Remove all event listeners
      window.removeEventListener('beforeunload', handlePageUnload);
      window.removeEventListener('pagehide', handlePageUnload);
      window.removeEventListener('unload', handlePageUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if ('onfreeze' in document) {
        document.removeEventListener('freeze', handlePageFreeze);
      }

      // Perform cleanup on unmount (React Router navigation, conditional rendering, etc.)
      performCleanup('unmount');

      // Clear proactive timeout
      if (proactiveTimeoutRef.current) {
        clearTimeout(proactiveTimeoutRef.current);
        proactiveTimeoutRef.current = null;
      }

      // Clear visibility timeout
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }

      // Clear inactivity timeouts
      clearInactivityTimeouts();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performCleanup, clearInactivityTimeouts]);

  // Handle disconnect (user clicks disconnect button)
  const handleDisconnect = async () => {
    addDebugLog('[DISCONNECT] handleDisconnect called');

    // Use centralized cleanup for Tavus conversation
    performCleanup('disconnect-button');

    // Stop overlays
    if (isDemoPlaying) {
      stopDemoVideo();
    }
    if (showCalendly) {
      setShowCalendly(false);
    }
    if (showPdf) {
      setShowPdf(false);
    }

    // Reset state
    setSessionInfo(null);
    sessionInfoRef.current = null;
    setHasLiveVideo(false);
    setHasAudio(false);
    setIsMuted(true);
    setAudioEnabled(true);
    setState("minimized");
    setIsConnecting(false);
    setConnectionError(null);
    setDebugLogs([]);
    setTranscripts([]);
    setDetectedIntents([]);
    setAvatarState("idle");
    setIsAvatarSpeaking(false);
    setIsUserSpeaking(false);

    // Clear refs
    lastAvatarSpeechRef.current = '';
    preDemoWidgetStateRef.current = null;
    preCalendlyWidgetStateRef.current = null;
    preCalendlyMutedRef.current = false;
    preCalendlyAudioEnabledRef.current = true;
    pendingCalendlyRef.current = false;
    pendingDemoVideoRef.current = null;
    videoAnnouncementStartedRef.current = false;
    pendingPdfNavigationRef.current = null;
    pdfNavigationAcknowledgedRef.current = false;
    prePdfWidgetStateRef.current = null;
    hasAutoExpandedRef.current = false;
    entriOnboardingStartedRef.current = false;
    sessionManagerRef.current = null;
    dailyEventManagerRef.current = null;

    // Reset cleanup flag so a new session can be started
    cleanupPerformedRef.current = false;

    // Reset session starting lock so a new session can be started
    isStartingSessionRef.current = false;

    // Reset module confirmation state
    setWaitingForModuleConfirmation(false);
    waitingForModuleConfirmationRef.current = false;

    // Reset MCQ quiz state
    setMcqQuizState({
      isActive: false,
      moduleId: null,
      currentQuestionIndex: 0,
      selectedIndex: null,
      isAnswered: false,
      isCorrect: false,
      score: { correct: 0, total: 0 },
      quizData: null,
      waitingForAvatarToFinish: false,
    });

    // Clear pending operation timeouts
    if (pendingVideoTimeoutRef.current) {
      clearTimeout(pendingVideoTimeoutRef.current);
      pendingVideoTimeoutRef.current = null;
    }
    if (pendingPdfTimeoutRef.current) {
      clearTimeout(pendingPdfTimeoutRef.current);
      pendingPdfTimeoutRef.current = null;
    }

    // Clear dynamic URLs and pending states
    setCalendlyUrl('');
    setPdfUrl('');
    setPendingPdfUrl(null);

    // Clear proactive timeout
    if (proactiveTimeoutRef.current) {
      clearTimeout(proactiveTimeoutRef.current);
      proactiveTimeoutRef.current = null;
    }

    if (onDisconnect) {
      onDisconnect();
    }
  };

  // Start Tavus session
  const startTavusSession = async () => {
    console.log('[START-SESSION] Called - isConnecting:', isConnecting, 'isStartingSessionRef:', isStartingSessionRef.current);

    // Use ref-based lock to prevent race condition (synchronous check)
    if (isStartingSessionRef.current || isConnecting || sessionManagerRef.current?.isInitialized) {
      console.log('[START-SESSION] Aborting - already connecting or session exists');
      return;
    }

    // Set lock immediately (synchronous - prevents race condition)
    isStartingSessionRef.current = true;

    addDebugLog('Setting isConnecting=true');
    setIsConnecting(true);

    try {
      // Step 1: Create Tavus conversation via API
      const apiUrl = getCreateConversationUrl();
      addDebugLog(`Calling API: ${apiUrl}`);
      addDebugLog(`Persona ID: ${personaId}`);

      let resp;
      try {
        // Build request payload based on persona type
        // Entri needs custom context to prevent auto-responses during module flow
        // Qatar and others use Tavus Cloud persona config as-is
        const isEntriPersona = personaId !== 'pf5e3d8bef4a';

        const requestBody = { personaId };

        if (isEntriPersona) {
          // Suppress default greeting - Entri sends its own via module prompts
          requestBody.customGreeting = ' ';
          // Override context to prevent Tavus from responding on its own during module flow
          requestBody.conversationalContext = `You are Ann, an AI onboarding guide. IMPORTANT: Do NOT proactively speak or give information unless specifically instructed via an echo message. Wait for echo messages to know what to say. When users say simple confirmations like "continue", "yes", "okay", "next", "ready" - do NOT respond with information. Just acknowledge briefly or stay silent. The frontend application controls all module content delivery.`;
        }
        // For Qatar and other personas: use Tavus Cloud config (greeting + context)

        resp = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
      } catch (fetchError) {
        addDebugLog(`Network Error: ${fetchError.message}`);
        addDebugLog(`This usually means the dev server at ${apiUrl} is not running`);
        addDebugLog(`Please start it with: cd frontend && node dev-server.mjs`);
        throw new Error(`Failed to connect to API server: ${fetchError.message}. Make sure dev-server.mjs is running on port 5000.`);
      }

      addDebugLog(`API Status: ${resp.status}`);

      if (!resp.ok) {
        const errorText = await resp.text();
        addDebugLog(`API Error: ${errorText.substring(0, 100)}`);
        throw new Error(`API returned ${resp.status}: ${errorText.substring(0, 200)}`);
      }

      const response = await resp.json();
      addDebugLog('API Success, got credentials');

      const { conversationId, conversationUrl } = response;

      if (!conversationUrl) {
        throw new Error('Missing conversation URL in response');
      }

      setSessionInfo({ conversationId, conversationUrl });

      // Save to localStorage for stale session cleanup on next page load
      localStorage.setItem('tavus_conversation_id', conversationId);
      addDebugLog(`[SESSION] Saved conversation ID to localStorage: ${conversationId}`);

      // Step 2: Create and initialize TavusSessionManager
      addDebugLog('Initializing TavusSessionManager...');
      sessionManagerRef.current = new TavusSessionManager();
      sessionManagerRef.current.setLogger(addDebugLog);

      // Set error callback to handle Daily.co disconnection/errors
      sessionManagerRef.current.setOnError((errorType, errorMessage) => {
        addDebugLog(`[SESSION-ERROR] ${errorType}: ${errorMessage}`);

        if (errorType === 'disconnected' || errorType === 'daily-error') {
          // Critical error - show to user and trigger cleanup
          setConnectionError(`Connection lost: ${errorMessage}`);
          // Don't auto-cleanup here - let user decide to retry
        } else if (errorType === 'network-warning') {
          // Just log for now, could show a toast/warning
          console.warn('[NETWORK] Poor connection quality:', errorMessage);
        }
      });

      const daily = await sessionManagerRef.current.initialize(
        conversationUrl,
        conversationId,
        'tavus-video-container'
      );

      // Safety check
      if (!mountedRef.current) {
        console.log('[START-SESSION] Component unmounted, aborting');
        sessionManagerRef.current.cleanup();
        setIsConnecting(false);
        return;
      }

      // Step 3: Create and attach DailyEventManager
      addDebugLog('Creating DailyEventManager...');
      dailyEventManagerRef.current = new DailyEventManager();
      dailyEventManagerRef.current.setLogger(log);

      // Setup initial callbacks - NOTE: These get overwritten by the useEffect callback setup
      // This initial setup is needed for immediate functionality before the effect runs
      dailyEventManagerRef.current.setCallbacks({
        onReplicaStartSpeaking: () => {
          // Ignore avatar speech when video is playing
          if (isDemoPlayingRef.current) {
            log('DEMO', 'Ignoring avatar speech - video is playing');
            return;
          }
          setIsAvatarSpeaking(true);
          isAvatarSpeakingRef.current = true;
          setAvatarState("speaking");

          // Clear inactivity timeout - avatar is speaking, so we're not waiting for user input
          clearInactivityTimeouts();

          // Mark that video announcement has started (avatar is now speaking the intro)
          if (pendingDemoVideoRef.current && !videoAnnouncementStartedRef.current) {
            videoAnnouncementStartedRef.current = true;
            log('DEMO', 'Video announcement started - will wait for avatar to finish');
          }
        },
        onReplicaStopSpeaking: (lastSpeech, interrupted) => {
          // Ignore avatar speech when video is playing
          if (isDemoPlayingRef.current) {
            log('DEMO', 'Ignoring avatar speech end - video is playing');
            return;
          }

          // ⚡ PRIORITY CHECK: If MCQ quiz instructions are being spoken (quiz not yet active)
          // After instructions finish, activate the quiz panel and ask first question
          // CRITICAL: If speaking instructions and interrupted, ignore this event
          // This prevents premature activation when user clicks quiz and interrupt arrives after state is set
          if (mcqQuizStateRef.current.speakingInstructions && interrupted) {
            addDebugLog('[MCQ-QUIZ] Ignoring interrupted event during instructions phase');
            return;
          }

          if (mcqQuizStateRef.current.speakingInstructions && pendingQuizDataRef.current) {
            addDebugLog('[MCQ-QUIZ] Avatar finished speaking instructions - now activating quiz panel');

            const pending = pendingQuizDataRef.current;
            const { moduleId, quizData } = pending;
            pendingQuizDataRef.current = null;

            // Create new state with quiz panel active
            const activeQuizState = {
              isActive: true, // NOW show the quiz panel
              moduleId: moduleId,
              currentQuestionIndex: 0,
              selectedIndex: null,
              isAnswered: false,
              isCorrect: false,
              score: { correct: 0, total: 0 },
              quizData: quizData,
              waitingForAvatarToFinish: true, // Wait for avatar to read the first question
              speakingInstructions: false,
            };

            // CRITICAL: Update ref IMMEDIATELY (synchronously)
            mcqQuizStateRef.current = activeQuizState;

            // Also update React state for UI
            setMcqQuizState(activeQuizState);

            // Ask the first question
            const firstQuestion = quizData.questions[0];
            const questionMessage = `Question 1: ${firstQuestion.question} Your options are: A: ${firstQuestion.options[0]}. B: ${firstQuestion.options[1]}. C: ${firstQuestion.options[2]}. D: ${firstQuestion.options[3]}.`;

            setTimeout(() => {
              if (dailyEventManagerRef.current) {
                dailyEventManagerRef.current.sendEchoMessage(questionMessage);
              }
            }, 500); // Brief pause before asking first question

            setIsAvatarSpeaking(false);
            isAvatarSpeakingRef.current = false;
            setAvatarState("idle");
            return;
          }

          // ⚡ PRIORITY CHECK: If MCQ quiz is active, handle quiz flow FIRST before any module logic
          if (mcqQuizStateRef.current.isActive) {
            const quizState = mcqQuizStateRef.current;
            addDebugLog(`[MCQ-QUIZ] Avatar stopped speaking during quiz - pendingNextQuestion: ${quizState.pendingNextQuestion}, pendingQuizComplete: ${quizState.pendingQuizComplete}`);

            // Clear waitingForAvatarToFinish when avatar finishes speaking feedback
            // (Advancement is now handled by calculated timeout in handleMcqAnswerSelect)
            if (quizState.waitingForAvatarToFinish && (quizState.pendingNextQuestion || quizState.pendingQuizComplete)) {
              addDebugLog('[MCQ-QUIZ] Avatar finished feedback - clearing flags (advancement handled by timeout)');
              setMcqQuizState(prev => ({
                ...prev,
                waitingForAvatarToFinish: false,
                pendingNextQuestion: false,
                pendingQuizComplete: false,
              }));

              // Keep listening disabled
              if (dailyEventManagerRef.current) {
                dailyEventManagerRef.current.disableListening();
                listeningStateRef.current = 'disabled';
              }
            }
            // Enable MCQ selection when avatar finishes speaking question (not feedback)
            else if (quizState.waitingForAvatarToFinish) {
              addDebugLog('[MCQ-QUIZ] Avatar finished speaking question - enabling selection');
              setMcqQuizState(prev => ({ ...prev, waitingForAvatarToFinish: false }));

              // CRITICAL: Keep Tavus listening disabled during MCQ quiz
              if (dailyEventManagerRef.current) {
                dailyEventManagerRef.current.disableListening();
                listeningStateRef.current = 'disabled';
              }

              // Start inactivity timeout - waiting for user to select an answer
              startInactivityTimeout();
            }

            setIsAvatarSpeaking(false);
            isAvatarSpeakingRef.current = false;
            setAvatarState("idle");
            return; // Skip all module completion logic - quiz handles its own flow
          }

          // Check for pending module transition
          // This handles transitions after quiz completion or when Tavus auto-responds
          if (pendingModuleTransitionRef.current) {
            const nextModuleId = pendingModuleTransitionRef.current;

            addDebugLog(`[MODULE-TRANSITION] Pending transition detected after Tavus speech: "${lastSpeech}" - proceeding to: ${nextModuleId}`);

            // Clear the pending transition
            pendingModuleTransitionRef.current = null;

            // Mark avatar as not speaking
            setIsAvatarSpeaking(false);
            isAvatarSpeakingRef.current = false;
            setAvatarState("idle");

            // Execute the module transition after a brief delay
            setTimeout(() => {
              if (mountedRef.current && handleModuleSelectRef.current) {
                addDebugLog(`[MODULE-TRANSITION] Executing transition to: ${nextModuleId}`);
                handleModuleSelectRef.current(nextModuleId);
              }
            }, 500);

            return;
          }

          setIsAvatarSpeaking(false);
          isAvatarSpeakingRef.current = false;

          // Proactive flow: When avatar stops speaking, trigger module completion
          const currentModule = activeModuleRef.current;

          // Handle module completion for all modules except video modules (handled by video callback) and final-quiz
          // Also skip if MCQ quiz is active or speaking instructions
          // Also skip if PDF presentation is active - PDF has its own completion flow via onPresentationEnd callback
          if (currentModule && !videoModules.includes(currentModule) && currentModule !== 'final-quiz' && moduleSpeechLockRef.current && !interrupted && !mcqQuizStateRef.current.isActive && !mcqQuizStateRef.current.speakingInstructions && !pdfPresentationRef.current.isPresenting) {
            // Check if this module requires user confirmation before advancing
            if (modulesRequiringConfirmation.includes(currentModule)) {
              addDebugLog(`[MODULE-CONFIRM] ⏸️ Module ${currentModule} finished - waiting for user confirmation`);

              // Unlock module speech lock so user can respond
              moduleSpeechLockRef.current = false;
              currentModulePromptRef.current = '';

              // Set waiting state
              setWaitingForModuleConfirmation(true);
              waitingForModuleConfirmationRef.current = true;

              // Unmute microphone so user can respond
              if (sessionManagerRef.current?.isInitialized) {
                sessionManagerRef.current.setMicrophoneMuted(false).catch(err => {
                  addDebugLog(`[MODULE-CONFIRM] Failed to unmute: ${err.message}`);
                });
                setIsMuted(false);
              }

              // CRITICAL: Keep Tavus listening DISABLED during confirmation
              // We still receive user transcripts via Daily.co events, but Tavus won't auto-respond
              // This prevents Tavus from generating its own response to "continue"
              if (dailyEventManagerRef.current) {
                listeningStateRef.current = 'disabled';
                dailyEventManagerRef.current.disableListening();
                addDebugLog('[MODULE-CONFIRM] 🎤 Mic unmuted but Tavus listening DISABLED - we handle confirmation manually');
              }

              // Start inactivity timeout - will ask check-in after 30s, end after 60s
              startInactivityTimeout();

              // Do NOT call finishModuleSpeech - wait for user confirmation
            } else {
              // Module doesn't require confirmation - proceed with auto-completion
              addDebugLog(`[MODULE-LOCK] ✅ Module ${currentModule} complete - triggering completion for proactive flow`);
              const acc = moduleSpeechAccumulatorRef.current;
              if (!acc.completed && finishModuleSpeechRef.current) {
                acc.completed = true;
                finishModuleSpeechRef.current();
              }
            }
          }

          // Don't set to "listening" when microphone is muted or module lock is active
          if (moduleSpeechLockRef.current || isMuted) {
            setAvatarState("idle");
            log('AVATAR-STATE', 'Setting to "idle" - microphone muted or module lock active');
          } else {
          setAvatarState("listening");
          }
        },
        onUserStartSpeaking: () => {
          if (isDemoPlayingRef.current) return;
          setIsUserSpeaking(true);
        },
        onUserStopSpeaking: () => {
          if (isDemoPlayingRef.current) return;
          setIsUserSpeaking(false);
        },
        onUserTranscript: (text, source) => {
          if (isDemoPlayingRef.current) {
            log('DEMO', 'Ignoring user transcript - video is playing');
            return;
          }
          // Ignore user transcripts when avatar is speaking (especially important for quiz)
          if (isAvatarSpeakingRef.current) {
            log('QUIZ', 'Ignoring user transcript - avatar is speaking');
            return;
          }
          handleUserSpeech(text, source);
        },
        onReplicaTranscript: (text, source) => {
          if (isDemoPlayingRef.current) {
            log('DEMO', 'Ignoring avatar transcript - video is playing');
            return;
          }
          
          // 📝 ACCUMULATE SPEECH when module lock is active
          if (moduleSpeechLockRef.current) {
            const acc = moduleSpeechAccumulatorRef.current;
            const cleanedChunk = stripMarkdown(text);
            acc.text += ' ' + cleanedChunk;
            acc.lastChunkAt = Date.now();
            if (!acc.startedAt) {
              acc.startedAt = Date.now();
            }
            addDebugLog(`[MODULE-LOCK] 📝 Accumulated speech: ${acc.text.length} chars - chunk: "${cleanedChunk.substring(0, 50)}..."`);
            console.log('[MODULE-LOCK] 📝 Accumulated speech:', { length: acc.text.length, chunk: cleanedChunk.substring(0, 50) });
          } else {
            addDebugLog(`[MODULE-LOCK] ⚠️ Transcript received but module lock is NOT active - not accumulating`);
            console.log('[MODULE-LOCK] ⚠️ Transcript received but module lock inactive');
          }
          
          handleReplicaSpeech(text, source);
        },
        onToolCall: (name, args) => {
          // Allow tool calls even during video (e.g., to close video)
          // But prevent new video from starting if one is already playing
          if (isDemoPlayingRef.current && name === 'show_demo_video') {
            log('DEMO', 'Ignoring show_demo_video tool call - video already playing');
            return;
          }
          handleToolCall(name, args);
        },
        onReplicaJoined: (replicaId) => log('SYSTEM', 'Replica joined', { replicaId }),
        onUnhandledMessage: (msg) => log('DATA_CHANNEL', 'Unhandled message', msg)
      });

      // Attach to Daily
      dailyEventManagerRef.current.attachToDaily(daily, conversationId);

      // 🔴 CRITICAL: Disable Tavus listening immediately to prevent any listening
      if (dailyEventManagerRef.current) {
        dailyEventManagerRef.current.disableListening();
        listeningStateRef.current = 'disabled';
        addDebugLog('[INIT] 🔇 Tavus listening disabled from start - will stay disabled until user enables mic');
      }

      // Step 4: Wait for session to be ready
      addDebugLog('Waiting for session to be ready...');
      await sessionManagerRef.current.waitForReady();

      setHasLiveVideo(sessionManagerRef.current.hasVideoTrack());
      setHasAudio(sessionManagerRef.current.hasAudioTrack());
      setIsConnecting(false);
      addDebugLog('Session fully ready!');

      // Step 5: DO NOT auto-enable microphone - keep it muted
      // Microphone will only be enabled when user manually toggles it
      addDebugLog('Microphone will remain muted - user must manually enable it');
            setIsMuted(true);
      
      // Step 6: Auto-start onboarding if persona has proactive module flow
      if (persona.hasFeature('proactiveModuleFlow') && !entriOnboardingStartedRef.current) {
        setTimeout(() => {
          if (mountedRef.current && sessionManagerRef.current?.isInitialized) {
            addDebugLog('[ONBOARDING] Starting proactive onboarding with welcome module');
            entriOnboardingStartedRef.current = true;
            // Ensure microphone is muted before starting onboarding
            sessionManagerRef.current.setMicrophoneMuted(true).catch(err => {
              addDebugLog(`[ONBOARDING] Failed to mute microphone: ${err.message}`);
            });
            setIsMuted(true);
            // Start with first module from persona config
            const firstModule = moduleOrder[0];
            if (firstModule) {
              handleModuleSelect(firstModule);
            }
          }
        }, 2000); // Wait 2 seconds for session to stabilize
      }

    } catch (err) {
      const errorMsg = err.message || 'Failed to connect. Please try again.';
      addDebugLog(`ERROR: ${errorMsg}`);
      setConnectionError(errorMsg);
      setIsConnecting(false);
      // Reset lock on error so user can retry
      isStartingSessionRef.current = false;
    }
  };

  // Retry connection
  const retryConnection = () => {
    addDebugLog('Retrying connection...');
    setConnectionError(null);
    setDebugLogs([]);
    hasAutoExpandedRef.current = false;
    startTavusSession();
  };

  // Toggle audio output
  const toggleAudio = () => {
    addDebugLog('Speaker button clicked!');
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    addDebugLog(`Speaker ${newState ? 'enabled' : 'muted'}`);
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    addDebugLog('Mic button clicked!');
    if (!sessionManagerRef.current?.isInitialized) {
      addDebugLog('No session, mic toggle ignored');
      return;
    }

    const newMuted = !isMuted;
    await sessionManagerRef.current.setMicrophoneMuted(newMuted);
    setIsMuted(newMuted);
    addDebugLog(`Microphone ${newMuted ? 'muted' : 'unmuted'}`);
    
    // The useEffect will automatically sync Tavus listening with microphone state
    // No need to manually call disableListening/enableListening here
  };

  // Intent detection
  const intentActions = [
    {
      keywords: [
        "set up a meet",
        "schedule a meeting",
        "book a call",
        "arrange a meeting",
        "schedule a call",
        "book a meeting",
      ],
      action: () => {
        log('CALENDLY', 'Schedule meeting intent detected');
        pendingCalendlyRef.current = true;
        setDetectedIntents((prev) => [...prev, "schedule_meeting"].slice(-5));
      },
      description: "Schedule meeting",
    },
  ];

  const detectIntent = (transcript, fullData, source) => {
    const lowerTranscript = transcript.toLowerCase();

    // Demo triggers are handled via Tavus tool calls (show_demo_video)
    // Only process scheduling intents here as fallback for speech-based detection
    intentActions.forEach((intent) => {
      const matched = intent.keywords.some((keyword) =>
        lowerTranscript.includes(keyword.toLowerCase())
      );
      if (matched) {
        log('INTENT_DETECTED', `${intent.description}`, { transcript, source });
        intent.action();
      }
    });
  };

  // Get topic explanation for teacher-like feedback
  const getTopicExplanation = (topic) => {
    const explanations = {
      "Natural Selection": "Natural selection is the process where animals that are better adapted to their environment survive and pass on their traits to their offspring. It's like nature choosing the best traits over time.",
      "Genetic Drift": "Genetic drift happens when random chance affects which traits get passed down in a small population. It's like flipping a coin - sometimes certain traits become more common just by luck.",
      "Fossil Record": "The fossil record shows us evidence of evolution over millions of years. Fossils are like nature's history book, showing us how living things have changed over time.",
      "Evolution Timeline": "Human evolution took millions of years. Our ancestors gradually changed from ape-like creatures to modern humans over a very long period of time."
    };
    return explanations[topic] || "This is an important concept in evolution.";
  };

  // Complete quiz with teacher-like summary
  const completeQuiz = (questionResults, finalScore) => {
    const totalQuestions = quizState.questions.length;
    const correctCount = questionResults.filter(r => r.status === 'correct').length;
    const incorrectCount = questionResults.filter(r => r.status === 'incorrect' || r.status === 'partial').length;
    const unansweredCount = questionResults.filter(r => r.status === 'unanswered').length;
    const percentage = Math.round((finalScore / totalQuestions) * 100);
    
    // Find all incorrect/unanswered questions with their details
    const incorrectQuestions = questionResults
      .filter(r => r.status !== 'correct')
      .map(r => {
        const question = quizState.questions[r.questionIndex];
        return {
          question: question.question,
          correctAnswer: question.correctAnswer,
          topic: question.topic,
          explanation: getTopicExplanation(question.topic),
          status: r.status
        };
      });
    
    let summaryMessage = `Great job completing the quiz! Let me give you a summary of how you did:\n\n`;
    summaryMessage += `📊 **Quiz Results:**\n`;
    summaryMessage += `- Total Questions: ${totalQuestions}\n`;
    summaryMessage += `- Correct Answers: ${correctCount}\n`;
    summaryMessage += `- Incorrect/Partial Answers: ${incorrectCount}\n`;
    summaryMessage += `- Unanswered: ${unansweredCount}\n`;
    summaryMessage += `- Final Score: ${finalScore} out of ${totalQuestions} (${percentage}%)\n\n`;
    
    if (incorrectQuestions.length > 0) {
      summaryMessage += `📚 **Here are the correct answers and explanations for the questions you missed:**\n\n`;
      incorrectQuestions.forEach((item, index) => {
        summaryMessage += `${index + 1}. **${item.question}**\n`;
        summaryMessage += `   ✅ Correct Answer: ${item.correctAnswer}\n`;
        summaryMessage += `   💡 Explanation: ${item.explanation}\n\n`;
      });
      summaryMessage += `I recommend going back to the learning modules and reviewing these topics. Practice makes perfect!`;
    } else {
      summaryMessage += `🎉 **Excellent work!** You answered all questions correctly. You have a strong understanding of human evolution!`;
    }
    
    summaryMessage += `\n\nDo you have any questions about what we covered, or would you like to review any specific topic?`;
    
    setQuizState(prev => ({
      ...prev,
      isActive: false,
      score: finalScore,
      waitingForAnswer: false,
      waitingForConfirmation: false,
      isAskingQuestion: false,
      questionResults: questionResults
    }));
    setCompletedModules(prev => [...prev, 'final-quiz']);
    // Only show learning modules if persona supports them
    if (shouldShowLearningModules()) {
      setShowLearningModules(true);
    }
    
    sendMessageToReplica(summaryMessage);
  };

  // ========== MCQ QUIZ FUNCTIONS ==========
  // Quiz uses click-only answers for reliability (no Web Speech API)

  // Start MCQ quiz for a module - first speaks instructions, then shows quiz panel
  const startMcqQuiz = useCallback((moduleId) => {
    // Get quiz data from persona config
    const quizData = persona.getModuleQuiz(moduleId);
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
      addDebugLog(`[MCQ-QUIZ] No quiz found for module: ${moduleId}`);
      return false;
    }

    addDebugLog(`[MCQ-QUIZ] Starting quiz for module: ${moduleId} with ${quizData.questions.length} questions`);
    addDebugLog(`[MCQ-QUIZ] Step 1: Speaking quiz instructions first...`);

    // Check if intro exists
    if (!quizData.intro || quizData.intro.trim() === '') {
      addDebugLog(`[MCQ-QUIZ] ⚠️ Quiz intro is empty or missing`);
    }

    // Store quiz data for later activation
    pendingQuizDataRef.current = { moduleId, quizData };

    // MUTE microphone during quiz - click-only answers for reliability
    if (sessionManagerRef.current?.isInitialized) {
      console.log('[VOICE-DEBUG] 🔇 startMcqQuiz - Muting mic (quiz is click-only)');
      sessionManagerRef.current.setMicrophoneMuted(true);
      setIsMuted(true);
    }

    // Also disable Tavus listening during quiz
    if (dailyEventManagerRef.current) {
      dailyEventManagerRef.current.disableListening();
      listeningStateRef.current = 'disabled';
      addDebugLog('[MCQ-QUIZ] Muted mic and disabled Tavus listening (click-only quiz)');
    }

    // Create the new quiz state
    const newQuizState = {
      isActive: false, // Quiz panel NOT visible yet
      moduleId: moduleId,
      currentQuestionIndex: 0,
      selectedIndex: null,
      isAnswered: false,
      isCorrect: false,
      score: { correct: 0, total: 0 },
      quizData: quizData,
      waitingForAvatarToFinish: true,
      speakingInstructions: true, // Flag: avatar is speaking instructions
    };

    // CRITICAL: Update ref IMMEDIATELY (synchronously) before sending message
    // This ensures onReplicaStopSpeaking sees the correct state
    // (useEffect sync is async and may not run before avatar finishes speaking)
    mcqQuizStateRef.current = newQuizState;
    addDebugLog(`[MCQ-QUIZ] Set speakingInstructions=true in ref (synchronous)`);

    // Also update React state for UI
    setMcqQuizState(newQuizState);

    // Quiz is click-only - no speech recognition needed

    // Speak ONLY the quiz instructions first
    // The quiz panel will be shown when avatar finishes speaking (in onReplicaStopSpeaking)
    sendMessageToReplica(quizData.intro, 'echo');
    return true;
  }, [addDebugLog, sendMessageToReplica]);

  // Activate quiz panel and ask first question (called after instructions are spoken)
  const activateQuizPanel = useCallback(() => {
    const pending = pendingQuizDataRef.current;
    if (!pending) {
      addDebugLog('[MCQ-QUIZ] No pending quiz data to activate');
      return;
    }

    const { moduleId, quizData } = pending;
    pendingQuizDataRef.current = null;

    addDebugLog(`[MCQ-QUIZ] Step 2: Activating quiz panel and asking first question`);

    // Now activate the quiz panel
    setMcqQuizState({
      isActive: true, // NOW show the quiz panel
      moduleId: moduleId,
      currentQuestionIndex: 0,
      selectedIndex: null,
      isAnswered: false,
      isCorrect: false,
      score: { correct: 0, total: 0 },
      quizData: quizData,
      waitingForAvatarToFinish: true, // Wait for avatar to read the first question
      speakingInstructions: false,
    });

    // Now ask the first question
    const firstQuestion = quizData.questions[0];
    const questionMessage = `Question 1: ${firstQuestion.question} Your options are: A: ${firstQuestion.options[0]}. B: ${firstQuestion.options[1]}. C: ${firstQuestion.options[2]}. D: ${firstQuestion.options[3]}.`;

    sendMessageToReplica(questionMessage, 'echo');
  }, [addDebugLog, sendMessageToReplica]);

  // Update ref for startMcqQuiz
  startMcqQuizRef.current = startMcqQuiz;

  // Handle MCQ option selection
  const handleMcqSelect = useCallback((selectedIndex) => {
    const state = mcqQuizStateRef.current;
    if (!state.isActive || state.isAnswered || state.waitingForAvatarToFinish) {
      addDebugLog(`[MCQ-QUIZ] Selection ignored - isActive: ${state.isActive}, isAnswered: ${state.isAnswered}, waiting: ${state.waitingForAvatarToFinish}`);
      return;
    }

    // Guard against null quizData (e.g., quiz was ended via voice command)
    if (!state.quizData || !state.quizData.questions) {
      addDebugLog('[MCQ-QUIZ] Selection ignored - quizData is null');
      return;
    }

    // User responded - reset inactivity timeout
    resetInactivityTimeout();

    const currentQuestion = state.quizData.questions[state.currentQuestionIndex];
    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    const optionLabels = ['A', 'B', 'C', 'D'];

    addDebugLog(`[MCQ-QUIZ] User selected option ${optionLabels[selectedIndex]}: "${currentQuestion.options[selectedIndex]}" - ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

    // Check if there are more questions
    const isLastQuestion = state.currentQuestionIndex >= state.quizData.questions.length - 1;

    // Update state with answer and set pending flags for next action
    setMcqQuizState(prev => ({
      ...prev,
      selectedIndex: selectedIndex,
      isAnswered: true,
      isCorrect: isCorrect,
      score: {
        correct: prev.score.correct + (isCorrect ? 1 : 0),
        total: prev.score.total + 1,
      },
      waitingForAvatarToFinish: true, // Wait for avatar feedback to complete
      pendingNextQuestion: !isLastQuestion, // Flag to ask next question when feedback completes
      pendingQuizComplete: isLastQuestion, // Flag to complete quiz when feedback completes
    }));

    // Send feedback to avatar
    let feedbackMessage;
    if (isCorrect) {
      feedbackMessage = `That's correct! ${currentQuestion.explanation}`;
    } else {
      const correctAnswer = currentQuestion.options[currentQuestion.correctIndex];
      feedbackMessage = `That's not quite right. The correct answer is ${optionLabels[currentQuestion.correctIndex]}: ${correctAnswer}. ${currentQuestion.explanation}`;
    }

    if (!isLastQuestion) {
      feedbackMessage += " Let me read the next question.";
    }

    addDebugLog(`[MCQ-QUIZ] Sending feedback (${feedbackMessage.length} chars), pendingNextQuestion: ${!isLastQuestion}, pendingQuizComplete: ${isLastQuestion}`);

    // Use ECHO mode - avatar speaks exactly this feedback without LLM processing
    sendMessageToReplica(feedbackMessage, 'echo');

    // Calculate speaking time based on message length
    // Avatar speaks faster than average human: ~180 words/min = 3 words/sec
    // Average word length: ~5 chars, so ~15 chars/sec
    // Add minimal buffer (500ms) for natural pauses
    const estimatedSpeakingTime = Math.ceil((feedbackMessage.length / 15) * 1000) + 500;
    addDebugLog(`[MCQ-QUIZ] Estimated speaking time: ${estimatedSpeakingTime}ms`);

    // Schedule next action after avatar finishes speaking
    setTimeout(() => {
      if (!isLastQuestion) {
        addDebugLog('[MCQ-QUIZ] Asking next question after feedback');
        if (askNextMcqQuestionRef.current) {
          askNextMcqQuestionRef.current();
        }
      } else {
        addDebugLog('[MCQ-QUIZ] Completing quiz after last feedback');
        if (completeMcqQuizRef.current) {
          completeMcqQuizRef.current();
        }
      }
    }, estimatedSpeakingTime);
  }, [addDebugLog, sendMessageToReplica]);

  // Ask the next MCQ question
  const askNextMcqQuestion = useCallback(() => {
    setMcqQuizState(prev => {
      // Guard against null quizData (e.g., quiz was ended via voice command)
      if (!prev.quizData || !prev.quizData.questions) {
        return prev;
      }

      const nextIndex = prev.currentQuestionIndex + 1;
      const nextQuestion = prev.quizData.questions[nextIndex];

      if (!nextQuestion) {
        return prev; // No more questions
      }

      // Send next question to avatar using ECHO mode
      const questionMessage = `Question ${nextIndex + 1}: ${nextQuestion.question} Your options are: A: ${nextQuestion.options[0]}. B: ${nextQuestion.options[1]}. C: ${nextQuestion.options[2]}. D: ${nextQuestion.options[3]}.`;
      sendMessageToReplica(questionMessage, 'echo');

      return {
        ...prev,
        currentQuestionIndex: nextIndex,
        selectedIndex: null,
        isAnswered: false,
        isCorrect: false,
        waitingForAvatarToFinish: true,
      };
    });
  }, [sendMessageToReplica]);

  // Complete the MCQ quiz
  const completeMcqQuiz = useCallback(() => {
    const state = mcqQuizStateRef.current;
    const { score, quizData, moduleId } = state;

    // Guard against null quizData (e.g., quiz was ended via voice command)
    if (!quizData) {
      addDebugLog('[MCQ-QUIZ] completeMcqQuiz called but quizData is null - quiz was ended');
      return;
    }

    const passed = quizData.passingScore ? score.correct >= quizData.passingScore : true;

    addDebugLog(`[MCQ-QUIZ] Quiz complete for ${moduleId} - Score: ${score.correct}/${score.total}, Passed: ${passed}`);

    // Build completion message with score
    let completionMessage = quizData.completionMessage || "You've completed the quiz!";
    completionMessage += ` You scored ${score.correct} out of ${score.total}.`;

    if (!passed && quizData.passingScore) {
      completionMessage += ` You needed ${quizData.passingScore} correct answers to pass. Don't worry, the important thing is that you're learning!`;
    }

    // Determine next module before resetting state
    const currentIndex = moduleOrder.indexOf(moduleId);
    const nextModuleId = (currentIndex >= 0 && currentIndex < moduleOrder.length - 1)
      ? moduleOrder[currentIndex + 1]
      : null;

    // Check if this quiz is section-ending (not for final-quiz)
    const isSectionEnding = sectionEndingModules.includes(moduleId);

    if (isSectionEnding && nextModuleId) {
      // Section-ending quiz - add transition prompt and wait for user confirmation
      addDebugLog(`[MCQ-QUIZ] ${moduleId} is section-ending - will wait for confirmation before ${nextModuleId}`);

      // Add transition prompt to completion message (from persona's prompts)
      const transitionPrompt = persona.prompts.moduleTransitionPrompts?.[moduleId];
      if (transitionPrompt) {
        completionMessage += ` ... ${transitionPrompt}`;
      }

      // Enable listening for user confirmation
      if (dailyEventManagerRef.current) {
        dailyEventManagerRef.current.enableListening();
        listeningStateRef.current = 'enabled';
        addDebugLog('[MCQ-QUIZ] 🎤 Enabled listening for section transition confirmation');
      }

      // Unmute microphone after quiz
      if (sessionManagerRef.current?.isInitialized) {
        sessionManagerRef.current.setMicrophoneMuted(false);
        setIsMuted(false);
      }

      // Set up waiting for confirmation (NOT using pendingModuleTransitionRef)
      waitingForSectionConfirmationRef.current = true;
      pendingSectionTransitionRef.current = nextModuleId;

      // Start inactivity timeout - will ask check-in after 30s, end after 60s
      startInactivityTimeout();
    } else if (nextModuleId) {
      // Not section-ending - auto-transition after avatar speaks
      addDebugLog(`[MCQ-QUIZ] Setting pending module transition to: ${nextModuleId}`);
      pendingModuleTransitionRef.current = nextModuleId;
    }

    // Quiz was click-only, no speech recognition to stop

    // Use ECHO mode for completion message
    // The module transition will happen in onReplicaStopSpeaking when avatar finishes (if not section-ending)
    sendMessageToReplica(completionMessage, 'echo');

    // Reset quiz state (but pending refs persist)
    setMcqQuizState({
      isActive: false,
      moduleId: null,
      currentQuestionIndex: 0,
      selectedIndex: null,
      isAnswered: false,
      isCorrect: false,
      score: { correct: 0, total: 0 },
      quizData: null,
      waitingForAvatarToFinish: false,
      pendingNextQuestion: false,
      pendingQuizComplete: false,
    });
  }, [addDebugLog, sendMessageToReplica, moduleOrder, sectionEndingModules]);

  // Skip/End MCQ quiz
  const skipMcqQuiz = useCallback(() => {
    const state = mcqQuizStateRef.current;
    if (!state.isActive) return;

    addDebugLog(`[MCQ-QUIZ] Quiz skipped for module: ${state.moduleId}`);

    // Determine next module before resetting state
    const currentIndex = moduleOrder.indexOf(state.moduleId);
    const nextModuleId = (currentIndex >= 0 && currentIndex < moduleOrder.length - 1)
      ? moduleOrder[currentIndex + 1]
      : null;

    if (nextModuleId) {
      addDebugLog(`[MCQ-QUIZ] Setting pending module transition to: ${nextModuleId}`);
      pendingModuleTransitionRef.current = nextModuleId;
    }

    // Quiz was click-only, no speech recognition to stop

    // Use ECHO mode - transition will happen in onReplicaStopSpeaking
    sendMessageToReplica("Okay, let's skip the quiz and move on to the next topic.", 'echo');

    // Reset quiz state
    setMcqQuizState({
      isActive: false,
      moduleId: null,
      currentQuestionIndex: 0,
      selectedIndex: null,
      isAnswered: false,
      isCorrect: false,
      score: { correct: 0, total: 0 },
      quizData: null,
      waitingForAvatarToFinish: false,
      pendingNextQuestion: false,
      pendingQuizComplete: false,
    });
  }, [addDebugLog, sendMessageToReplica, moduleOrder]);

  // Skip current MCQ question (move to next without answering)
  const skipMcqQuestion = useCallback(() => {
    const state = mcqQuizStateRef.current;
    if (!state.isActive || !state.quizData || !state.quizData.questions || state.waitingForAvatarToFinish) return;

    addDebugLog(`[MCQ-QUIZ] Skipping question ${state.currentQuestionIndex + 1}`);

    const isLastQuestion = state.currentQuestionIndex >= state.quizData.questions.length - 1;

    if (isLastQuestion) {
      // Last question - complete the quiz
      addDebugLog('[MCQ-QUIZ] Last question skipped - completing quiz');
      sendMessageToReplica("Skipping this question. Let me give you your final results.", 'echo');

      // Set pending completion
      setMcqQuizState(prev => ({
        ...prev,
        waitingForAvatarToFinish: true,
        pendingQuizComplete: true,
      }));
    } else {
      // Move to next question
      const nextIndex = state.currentQuestionIndex + 1;
      const nextQuestion = state.quizData.questions[nextIndex];
      const questionMessage = `Skipping this one. Question ${nextIndex + 1}: ${nextQuestion.question} Your options are: A: ${nextQuestion.options[0]}. B: ${nextQuestion.options[1]}. C: ${nextQuestion.options[2]}. D: ${nextQuestion.options[3]}.`;

      setMcqQuizState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        selectedIndex: null,
        isAnswered: false,
        isCorrect: false,
        waitingForAvatarToFinish: true,
      }));

      // Also update ref for callbacks
      mcqQuizStateRef.current = {
        ...mcqQuizStateRef.current,
        currentQuestionIndex: nextIndex,
        selectedIndex: null,
        isAnswered: false,
        isCorrect: false,
        waitingForAvatarToFinish: true,
      };

      sendMessageToReplica(questionMessage, 'echo');
    }
  }, [addDebugLog, sendMessageToReplica]);

  // Update refs for quiz functions (used in onReplicaStopSpeaking callback)
  askNextMcqQuestionRef.current = askNextMcqQuestion;
  completeMcqQuizRef.current = completeMcqQuiz;

  // Repeat current MCQ question
  const repeatMcqQuestion = useCallback(() => {
    const state = mcqQuizStateRef.current;
    if (!state.isActive || !state.quizData || !state.quizData.questions || state.waitingForAvatarToFinish) {
      addDebugLog(`[MCQ-QUIZ] ⚠️ repeatMcqQuestion blocked - isActive: ${state.isActive}, hasQuizData: ${!!state.quizData}, waitingForAvatar: ${state.waitingForAvatarToFinish}`);
      return;
    }

    // 🔴 CRITICAL: Ensure Tavus listening stays disabled
    if (dailyEventManagerRef.current) {
      dailyEventManagerRef.current.disableListening();
      listeningStateRef.current = 'disabled';
      addDebugLog('[MCQ-QUIZ] 🔇 Confirmed Tavus listening disabled in repeatMcqQuestion');
    }

    const currentQuestion = state.quizData.questions[state.currentQuestionIndex];
    const questionMessage = `Let me repeat that. Question ${state.currentQuestionIndex + 1}: ${currentQuestion.question} Your options are: A: ${currentQuestion.options[0]}. B: ${currentQuestion.options[1]}. C: ${currentQuestion.options[2]}. D: ${currentQuestion.options[3]}.`;

    // Set waiting state
    setMcqQuizState(prev => ({
      ...prev,
      waitingForAvatarToFinish: true,
    }));
    mcqQuizStateRef.current.waitingForAvatarToFinish = true;

    // Use ECHO mode
    sendMessageToReplica(questionMessage, 'echo');
    addDebugLog(`[MCQ-QUIZ] Repeated question ${state.currentQuestionIndex + 1}`);
  }, [sendMessageToReplica, addDebugLog]);

  // Enable selection after avatar finishes speaking the question
  const enableMcqSelection = useCallback(() => {
    setMcqQuizState(prev => ({
      ...prev,
      waitingForAvatarToFinish: false,
    }));
    addDebugLog('[MCQ-QUIZ] Selection enabled - avatar finished speaking');
  }, [addDebugLog]);

  // ========== END MCQ QUIZ FUNCTIONS ==========

  // 🔒 Start module speech lock - MUST be called before sending module prompt
  const startModuleSpeech = useCallback((moduleId) => {
    addDebugLog(`[MODULE-LOCK] 🔒 Starting speech lock for module: ${moduleId}`);
    moduleSpeechLockRef.current = true;
    speechEpochRef.current += 1;

    moduleSpeechAccumulatorRef.current = {
      text: '',
      startedAt: Date.now(),
      lastChunkAt: Date.now(),
      completed: false,
    };
    
    // No timeout for welcome-intro - will complete when avatar stops speaking

    // Mute microphone at transport level (Daily.co)
    // The useEffect will automatically disable Tavus listening when isMuted becomes true
    if (sessionManagerRef.current?.isInitialized) {
      sessionManagerRef.current.setMicrophoneMuted(true).catch(err => {
        addDebugLog(`[MODULE-LOCK] Failed to mute: ${err.message}`);
      });
      setIsMuted(true);
    }
    
    // Also explicitly disable listening immediately (useEffect will handle it, but this ensures immediate effect)
    if (dailyEventManagerRef.current) {
      dailyEventManagerRef.current.disableListening();
      listeningStateRef.current = 'disabled'; // Update ref to prevent redundant calls
      addDebugLog('[MODULE-LOCK] 🔇 Tavus listening disabled (barge-in prevented)');
    }
  }, [addDebugLog]);

  // ✅ Finish module speech - ONLY place to unlock
  const finishModuleSpeech = useCallback(() => {
    const acc = moduleSpeechAccumulatorRef.current;
    const currentModule = activeModuleRef.current || activeModule; // Use ref first, fallback to state
    
    // Get playDemoVideo from the hook - it should be in scope
    // If not accessible, we'll use the ref-based approach in handleModuleSelect
    
    // ✅ Module speech finished - mark as completed and unlock
    addDebugLog(`[MODULE-LOCK] ✅ finishModuleSpeech called for: ${currentModule}`);
    acc.completed = true;

    // Unlock speech lock
    moduleSpeechLockRef.current = false;
    currentModulePromptRef.current = '';

    // Mark current module as complete
    if (currentModule && !completedModules.includes(currentModule)) {
      addDebugLog(`[MODULE-LOCK] Marking module complete: ${currentModule}`);
      setCompletedModules(prev => {
        if (prev.includes(currentModule)) {
          return prev;
        }
        return [...prev, currentModule];
      });
    }

    // Special handling for video modules: Transition handled by video stop callback
    if (videoModules.includes(currentModule)) {
      addDebugLog(`[MODULE-LOCK] Video module ${currentModule} - transition handled by handleVideoModuleStop`);
      return;
    }

    // For ALL other modules: Transition is handled by onReplicaStopSpeaking
    // which checks modulesRequiringConfirmation and either:
    // - Waits for user confirmation (if module requires it)
    // - Auto-advances to next module (if proactiveModuleFlow and no confirmation needed)
    addDebugLog('[MODULE-LOCK] Module speech finished - transition handled by onReplicaStopSpeaking');
  }, [activeModule, completedModules, addDebugLog]);

  // 🧠 Check module completion based on sentinel phrase or content length
  const checkModuleCompletion = useCallback(() => {
    if (!moduleSpeechLockRef.current) return;

    const acc = moduleSpeechAccumulatorRef.current;
    if (acc.completed) return;

    const text = acc.text.toLowerCase();
    const duration = acc.startedAt ? (Date.now() - acc.startedAt) : 0;
    
    // Special handling for welcome-intro: Completion handled when avatar stops speaking (in onReplicaStopSpeaking callback)
    if (activeModule === 'welcome-intro') {
      // Don't trigger from periodic checks - completion happens when avatar stops speaking
      return;
    } else if (videoModules.includes(activeModule) || activeModule === 'final-quiz') {
      // Video modules: Complete when announcement is spoken (short phrase)
      const hasVideoAnnouncement =
        text.includes("success stories") ||
        text.includes("founder's video") ||
        text.includes('founder video') ||
        text.includes("here is our founder") ||
        text.includes("please watch") ||
        text.includes("posh") ||
        text.includes("sexual harassment");

      if (hasVideoAnnouncement && text.length > 20) {
        addDebugLog(`[MODULE-LOCK] ✅ Video module announcement complete detected: ${activeModule}`);
        acc.completed = true;
        finishModuleSpeech();
        return;
      }
    } else {
      // For other modules: Check for sentinel phrase (case-insensitive, handles variations)
      const sentinelPhrases = [
        'end of module',
        '—end of module—',
        'end of module—',
        '—end of module',
        'endofmodule'
      ];
      
      const foundSentinel = sentinelPhrases.some(phrase => text.includes(phrase));
      if (foundSentinel) {
        addDebugLog('[MODULE-LOCK] ✅ Sentinel phrase detected - module complete');
        acc.completed = true;
        finishModuleSpeech();
      }
    }
  }, [finishModuleSpeech, addDebugLog, activeModule]);

  // ⏰ Periodic completion check while lock is active - check more frequently for proactive flow
  useEffect(() => {
    const interval = setInterval(() => {
      if (moduleSpeechLockRef.current) {
        checkModuleCompletion();
      }
    }, 200); // Check every 200ms for faster, more proactive detection

    return () => clearInterval(interval);
  }, [checkModuleCompletion]);

  // Store checkModuleCompletion in ref for use in callbacks
  useEffect(() => {
    checkModuleCompletionRef.current = checkModuleCompletion;
  }, [checkModuleCompletion]);

  // Store finishModuleSpeech in ref for use in callbacks
  useEffect(() => {
    finishModuleSpeechRef.current = finishModuleSpeech;
  }, [finishModuleSpeech]);

  // 🔴 Sync Tavus listening with microphone state
  // Listening is ONLY enabled when microphone is unmuted (user manually enabled it)
  useEffect(() => {
    if (!dailyEventManagerRef.current) return;

    // Prevent redundant calls - only update if state actually changed
    const targetState = isMuted ? 'disabled' : 'enabled';
    if (listeningStateRef.current === targetState) {
      return; // Already in the correct state, skip
    }

    // 🔒 Set ref BEFORE making the call to prevent race condition
    // If effect runs twice rapidly, second call will be blocked by the check above
    listeningStateRef.current = targetState;

    if (isMuted) {
      // Microphone muted → disable listening EXCEPT during PDF presentation
      // During PDF, we need Tavus listening enabled for NLU tool calls (navigation commands)
      if (pdfPresentationRef.current.isPresenting) {
        dailyEventManagerRef.current.enableListening();
        console.log('[TAVUS-DEBUG] [SYNC] 🎤 Tavus listening ENABLED (mic muted but PDF presentation active - need NLU tools)');
        // Keep avatar idle during PDF when mic is muted
        if (!isAvatarSpeakingRef.current) {
          setAvatarState("idle");
        }
      } else {
        dailyEventManagerRef.current.disableListening();
        console.log('[TAVUS-DEBUG] [SYNC] 🔇 Tavus listening disabled (microphone is muted)');
        // Update avatar state to idle when mic is muted (if not speaking and no lock)
        if (!moduleSpeechLockRef.current && !isAvatarSpeakingRef.current) {
          setAvatarState("idle");
          console.log('[TAVUS-DEBUG] [AVATAR-STATE] Setting to "idle" - microphone muted (sync)');
        }
      }
    } else {
      // Microphone unmuted → enable listening (but NOT during MCQ quiz, PDF presentation, or confirmation waiting)
      if (mcqQuizStateRef.current.isActive || mcqQuizStateRef.current.speakingInstructions) {
        // During MCQ quiz (including instruction phase), keep Tavus listening disabled
        // Quiz uses click-only answers
        dailyEventManagerRef.current.disableListening();
        console.log('[TAVUS-DEBUG] [SYNC] 🔇 Tavus listening kept DISABLED (MCQ quiz active or speaking instructions)');
        setAvatarState("idle");
      } else if (waitingForModuleConfirmationRef.current) {
        // During module confirmation, keep listening disabled - we handle confirmation manually
        dailyEventManagerRef.current.disableListening();
        console.log('[TAVUS-DEBUG] [SYNC] 🔇 Tavus listening kept DISABLED (waiting for module confirmation)');
        setAvatarState("idle");
      } else if (pdfPresentationRef.current.isPresenting) {
        // During PDF presentation, ENABLE Tavus listening for NLU-powered tool calls
        dailyEventManagerRef.current.enableListening();
        console.log('[TAVUS-DEBUG] [SYNC] 🎤 Tavus listening ENABLED (PDF presentation - NLU tool calls)');
        // Keep avatar state as idle during PDF narration
        if (!isAvatarSpeakingRef.current) {
          setAvatarState("listening");
        }
      } else {
        dailyEventManagerRef.current.enableListening();
        console.log('[TAVUS-DEBUG] [SYNC] 👂 Tavus listening enabled (microphone is unmuted)');
        // Update avatar state to listening when mic is unmuted (if not speaking and no lock)
        if (!moduleSpeechLockRef.current && !isAvatarSpeakingRef.current) {
          setAvatarState("listening");
          console.log('[TAVUS-DEBUG] [AVATAR-STATE] Setting to "listening" - microphone unmuted (sync)');
        }
      }
    }
  }, [isMuted]); // Only depend on isMuted - refs don't need to be in deps

  // Check if module is unlocked - delegate to persona config
  const isModuleUnlocked = (moduleId) => {
    return persona.isModuleUnlocked(moduleId, completedModules);
  };

  // Handle learning module selection
  const handleModuleSelect = useCallback(async (moduleId) => {
    // 🔒 CRITICAL: Block module selection if MCQ quiz is active
    // This prevents accidental module switches during quiz (e.g., from stale callbacks or race conditions)
    if (mcqQuizStateRef.current.isActive || mcqQuizStateRef.current.speakingInstructions) {
      addDebugLog(`[MODULE-SELECT] ⛔ BLOCKED - MCQ quiz is active or speaking instructions. Requested: ${moduleId}`);
      console.error(`[MODULE-SELECT] ⛔ BLOCKED module switch to ${moduleId} - quiz is active!`);
      return;
    }

    // Check if module is unlocked before proceeding
    if (!isModuleUnlocked(moduleId)) {
      // Send message to avatar explaining the module is locked
      sendMessageToReplica(
        `You need to complete the previous topics first before you can access this module. ` +
        `Please complete the earlier topics in order.`
      );
      return;
    }

    // Clear inactivity timeout - we're transitioning to a new module
    clearInactivityTimeouts();

    // 🛑 Interrupt any ongoing avatar speech when switching modules
    if (dailyEventManagerRef.current) {
      addDebugLog('[MODULE-SWITCH] 🛑 Interrupting avatar for module switch');
      dailyEventManagerRef.current.interruptReplica();
    }

    // 🔴 CRITICAL: Close any active MCQ quiz OR pending quiz instructions when switching modules
    if (mcqQuizStateRef.current.isActive || mcqQuizStateRef.current.speakingInstructions) {
      addDebugLog('[MCQ] Closing active quiz or pending instructions due to module switch');

      // Quiz was click-only, no speech recognition to stop

      // Clear pending quiz data ref
      pendingQuizDataRef.current = null;

      // Reset both state and ref
      const resetState = {
        isActive: false,
        moduleId: null,
        currentQuestionIndex: 0,
        selectedIndex: null,
        isAnswered: false,
        isCorrect: false,
        score: { correct: 0, total: 0 },
        quizData: null,
        waitingForAvatarToFinish: false,
        speakingInstructions: false,
      };
      mcqQuizStateRef.current = resetState;
      setMcqQuizState(resetState);
    }

    // 🔴 CRITICAL: End any active PDF presentation when switching modules
    if (pdfPresentation.isPresenting) {
      addDebugLog('[PDF] Ending presentation due to module switch');
      await pdfPresentation.endPresentation(false); // Don't trigger callback to prevent infinite loop
    }

    // Clear any pending state
    pendingPresentationRef.current = null;
    pendingDemoVideoRef.current = null;
    videoAnnouncementStartedRef.current = false;
    pendingPdfNavigationRef.current = null;
    pdfNavigationAcknowledgedRef.current = false;
    startingPresentationRef.current = false;
    transitioningSlideRef.current = false;

    setActiveModule(moduleId);
    activeModuleRef.current = moduleId; // Update ref immediately for callbacks

    // Clear any existing transcripts when selecting a new module
    setTranscripts([]);

    // 🔒 START MODULE SPEECH LOCK - MUST be called before sending prompt
    startModuleSpeech(moduleId);

    // ⏳ CRITICAL: Delay to ensure Tavus processes disableListening before prompt
    // This prevents Tavus from treating the prompt as user input
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get module prompt from persona config
    const prompt = persona.getModulePrompt(moduleId);

    // Check if this is a quiz module (either final quiz or module quiz)
    const moduleConfig = moduleDefinitions[moduleId];
    const isQuizModule = moduleConfig?.type === 'quiz';

    if (isQuizModule && persona.hasFeature('mcqQuiz')) {
      // Use MCQ quiz system for all quiz modules (both module quizzes and final quiz)
      addDebugLog(`[MODULE-LOCK] Quiz module detected: ${moduleId} - using MCQ quiz system`);

      // Start MCQ quiz (this will handle muting, listening disable, etc.)
      if (startMcqQuizRef.current) {
        startMcqQuizRef.current(moduleId);
      } else {
        addDebugLog(`[MODULE-LOCK] ⚠️ startMcqQuiz not initialized yet`);
      }

      // Module lock will be released when quiz completes
      return; // Don't execute any other module handling logic for quiz modules
    } else if (videoModules.includes(moduleId)) {
      // Special handling for video modules: Announce and play video automatically
      const moduleConfig = moduleDefinitions[moduleId];
      const videoUrl = moduleConfig?.videoUrl;

      if (!videoUrl) {
        addDebugLog(`[MODULE-LOCK] ⚠️ No video URL for module: ${moduleId}`);
        return;
      }

      addDebugLog(`[MODULE-LOCK] Video module ${moduleId} - announcing and playing video`);

      // 🔇 Ensure microphone is muted
      if (sessionManagerRef.current?.isInitialized) {
        addDebugLog(`[MODULE-LOCK] 🔇 Ensuring microphone is muted for ${moduleId}`);
        sessionManagerRef.current.setMicrophoneMuted(true).catch(err => {
          addDebugLog(`[MODULE-LOCK] Failed to mute microphone: ${err.message}`);
        });
        setIsMuted(true);
      }

      // 🔴 Keep Tavus listening disabled
      if (dailyEventManagerRef.current) {
        dailyEventManagerRef.current.disableListening();
        addDebugLog(`[MODULE-LOCK] 🔇 Keeping Tavus listening disabled for ${moduleId}`);
      }

      // Queue video for playback - will play after avatar finishes speaking
      addDebugLog(`[MODULE-LOCK] 🎬 Queuing video for playback: ${videoUrl}`);
      pendingDemoVideoRef.current = videoUrl;

      // Send announcement message
      if (prompt) {
        currentModulePromptRef.current = prompt;
        setTimeout(() => {
          if (mountedRef.current) {
            addDebugLog(`[MODULE-LOCK] Sending video module announcement as ECHO`);
            sendMessageToReplica(prompt, 'echo');
          }
        }, 100);
      }
    } else {
      // Get module config to check for presentation
      const moduleConfig = moduleDefinitions[moduleId];

      if (moduleConfig?.hasPresentation && moduleConfig.presentationConfig) {
        // Special handling for presentation modules: Speak intro first, then show PDF and narrate slides
        addDebugLog(`[MODULE-LOCK] Presentation module ${moduleId} - will speak intro then load PDF`);

        // Get presentation config from registry
        const presentationData = PRESENTATION_REGISTRY[moduleConfig.presentationConfig] || null;

      if (!presentationData) {
        addDebugLog(`[MODULE-LOCK] ⚠️ No presentation data for ${moduleId}`);
        return;
      }

      // 🛑 Interrupt any ongoing avatar speech
      if (dailyEventManagerRef.current) {
        addDebugLog(`[MODULE-LOCK] 🛑 Interrupting avatar to start presentation`);
        dailyEventManagerRef.current.interruptReplica();
      }

      // 🔇 Ensure microphone is muted
      if (sessionManagerRef.current?.isInitialized) {
        addDebugLog(`[MODULE-LOCK] 🔇 Muting microphone for presentation`);
        sessionManagerRef.current.setMicrophoneMuted(true).catch(err => {
          addDebugLog(`[MODULE-LOCK] Failed to mute microphone: ${err.message}`);
        });
        setIsMuted(true);
      }

      // 🔴 Keep Tavus listening disabled
      if (dailyEventManagerRef.current) {
        dailyEventManagerRef.current.disableListening();
        addDebugLog(`[MODULE-LOCK] 🔇 Keeping Tavus listening disabled for presentation`);
      }

      // First, speak the intro prompt (avatar visible, no PDF yet)
      if (prompt) {
        currentModulePromptRef.current = prompt;
        addDebugLog(`[MODULE-LOCK] 📢 Speaking presentation intro first`);
        sendMessageToReplica(prompt, 'echo');

        // Store presentation data to start after intro completes
        pendingPresentationRef.current = {
          ...presentationData,
          moduleId,
        };
      } else {
        // No intro, start presentation immediately
        addDebugLog(`[MODULE-LOCK] 📊 No intro prompt, starting PDF presentation immediately`);

        // 🎤 Keep Tavus listening ENABLED during PDF for NLU-powered tool calls
        // User can navigate slides by speaking (e.g., "next slide", "go back")
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.enableListening();
          listeningStateRef.current = 'enabled';
          addDebugLog('[PDF] 🎤 Tavus listening ENABLED for NLU tool calls');
        }

        // 🔇 Mute microphone initially during PDF presentation (user can unmute to speak)
        if (sessionManagerRef.current?.isInitialized) {
          sessionManagerRef.current.setMicrophoneMuted(true).catch(err => {
            addDebugLog(`[PDF] Failed to mute mic: ${err.message}`);
          });
          setIsMuted(true);
          addDebugLog('[PDF] 🔇 Mic muted during presentation');
        }

        await pdfPresentation.startPresentation({
          ...presentationData,
          moduleId,
        });

        // Voice commands disabled - using auto-advance instead

        // CRITICAL: Set ref directly to avoid React state sync delay
        // The useEffect that syncs pdfPresentationRef.current may not run until next render
        pdfPresentationRef.current.isPresenting = true;
        pdfPresentationRef.current.totalSlides = presentationData.slides?.length || 0;

        // Mark that we're expecting narration (for auto-advance logic)
        expectingNarrationRef.current = true;
        isQandAResponseRef.current = false; // Reset Q&A mode

        setTimeout(() => {
          // CRITICAL: Use pdfNarrateSlideRef (not pdfPresentation from closure) to avoid stale closure bug
          pdfNarrateSlideRef.current?.(0);
        }, 800);
      }
      } else {
        // 🔴 CRITICAL: Send module prompt as ECHO (not RESPOND) to prevent Tavus from treating it as user input
        // ECHO makes agent speak exactly what we send without processing it as user speech
        if (prompt) {
          // Store prompt text to detect and ignore matching user utterances
          currentModulePromptRef.current = prompt;
          addDebugLog(`[MODULE-LOCK] Sending module prompt as ECHO (not RESPOND) to prevent user speech detection`);
          sendMessageToReplica(prompt, 'echo'); // Use 'echo' type for module prompts
        }
        // Mark module as completed after avatar finishes (handled via transcript)
      }
    }
  }, [personaId, quizState.isActive, sendMessageToReplica, setQuizState, setActiveModule, setTranscripts, isModuleUnlocked, pdfPresentation, addDebugLog, setMcqQuizState]);
  
  // Store handleModuleSelect in ref for proactive continuation
  useEffect(() => {
    handleModuleSelectRef.current = handleModuleSelect;
  }, [handleModuleSelect]);

  // Store activeModule in ref for use in callbacks
  useEffect(() => {
    activeModuleRef.current = activeModule;
  }, [activeModule]);

  // Store playDemoVideo in ref
  useEffect(() => {
    playDemoVideoRef.current = playDemoVideo;
  }, [playDemoVideo]);

  // Handle replica speech - detect when avatar asks quiz questions
  const handleReplicaSpeechForQuiz = (text) => {
    if (!quizState.isActive) return;
    
    const lowerText = text.toLowerCase();
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    
    if (!currentQuestion) return;
    
    // Check if avatar is asking the current quiz question
    // Look for question patterns
    const questionKeywords = currentQuestion.question.toLowerCase().split(' ').filter(w => w.length > 3);
    const isAskingQuestion = questionKeywords.some(keyword => lowerText.includes(keyword)) ||
                             (lowerText.includes('?') && 
                             (lowerText.includes(currentQuestion.question.split(' ')[0].toLowerCase()) ||
                              lowerText.includes('what is') || lowerText.includes('how long') ||
                              lowerText.includes('what does')));
    
    if (isAskingQuestion) {
      // Avatar is asking the question - mark it
      setQuizState(prev => ({
        ...prev,
        isAskingQuestion: true,
        waitingForAnswer: false // Not ready for answer yet
      }));
      log('QUIZ', `Avatar is asking question ${quizState.currentQuestionIndex + 1}: ${currentQuestion.question}`);
    }
  };

  // Interrupt replica
  const interruptReplica = () => {
    if (dailyEventManagerRef.current) {
      dailyEventManagerRef.current.interruptReplica();
    }
  };

  // Clear proactive timeout when user starts speaking
  useEffect(() => {
    if (isUserSpeaking && proactiveTimeoutRef.current) {
      clearTimeout(proactiveTimeoutRef.current);
      proactiveTimeoutRef.current = null;
      addDebugLog('[PROACTIVE] User started speaking, cleared proactive timeout');
    }
  }, [isUserSpeaking]);

  // Handle activity
  const handleActivity = () => {
    // Placeholder for activity tracking
  };

  // Handle expand
  const handleExpand = () => {
    handleActivity();
    setState((prev) => {
      if (prev === "minimized") {
        if (!sessionManagerRef.current?.isInitialized && !isConnecting) {
          startTavusSession();
        }
        return "small";
      }
      return prev === "small" ? "maximized" : "small";
    });
    if (onExpand) onExpand();
  };

  // Close widget
  const handleClose = () => {
    if (sessionManagerRef.current?.isInitialized) {
      handleDisconnect();
    } else {
      setState("minimized");
    }
  };

  // Get state indicator color
  const getStateColor = () => {
    switch (avatarState) {
      case "speaking":
        return "bg-emerald-500/80 border border-emerald-400/30";
      case "listening":
        return "bg-sky-500/80 border border-sky-400/30";
      case "thinking":
        return "bg-amber-500/80 border border-amber-400/30";
      default:
        return "bg-white/10 border border-white/20";
    }
  };

  // Get state icon
  const getStateIcon = () => {
    switch (avatarState) {
      case "speaking":
        return <Volume2 className="w-3 h-3" />;
      case "listening":
        return <Ear className="w-3 h-3" />;
      case "thinking":
        return <Brain className="w-3 h-3" />;
      default:
        return <Smile className="w-3 h-3" />;
    }
  };

  // Render functions for different states
  const renderMinimizedState = () => (
    <motion.div
      className="fixed bottom-4 right-4 z-50 cursor-pointer"
      onClick={handleExpand}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
        <Video className="w-8 h-8 text-white" />
      </div>
    </motion.div>
  );

  const renderConnectingState = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 text-white p-4 overflow-hidden">
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-blue-500/20"
            style={{
              width: `${150 + i * 80}px`,
              height: `${150 + i * 80}px`,
              animation: `pulse-ring ${2 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              opacity: 0.3 - i * 0.05,
            }}
          />
        ))}
      </div>

      {/* Central animated element */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Outer glow ring */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl"
            style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}
          />

          {/* Avatar silhouette / icon container */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
            {/* Inner spinning ring */}
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/50 border-r-white/30"
              style={{ animation: 'spin 1.5s linear infinite' }}
            />

            {/* Pulsing dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-white"
                  style={{
                    animation: 'bounce-dot 1.4s ease-in-out infinite',
                    animationDelay: `${i * 0.16}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Text with fade animation */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-lg font-medium text-white/90"
        >
          Connecting
          <span className="inline-flex ml-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="opacity-0"
                style={{
                  animation: 'dot-fade 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.3}s`,
                }}
              >
                .
              </span>
            ))}
          </span>
        </motion.p>

      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0.1; }
        }
        @keyframes glow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes dot-fade {
          0%, 20% { opacity: 0; }
          40%, 100% { opacity: 1; }
        }
      `}</style>
    </div>
  );

  const renderErrorState = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="text-red-500 text-4xl mb-4">!</div>
      <p className="text-sm mb-2">Connection Error</p>
      <p className="text-xs text-gray-400 mb-4 text-center">{connectionError}</p>
      <button
        onClick={retryConnection}
        className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 text-sm"
      >
        Retry
      </button>

      {/* Debug logs */}
      <div className="w-full max-h-32 overflow-y-auto text-xs font-mono bg-black/50 rounded p-2 mt-4">
        {debugLogs.map((log, i) => (
          <div key={i} className="text-red-400">{log}</div>
        ))}
      </div>
    </div>
  );

  // Handler to restart session after timeout
  const handleRestartSession = () => {
    addDebugLog('[RESTART] User clicked restart after session timeout');
    setSessionTimedOut(false);
    cleanupPerformedRef.current = false; // Reset cleanup flag to allow new session
    isStartingSessionRef.current = false; // Reset session start lock
    // The existing auto-start logic will trigger a new session
    startTavusSession();
  };

  const renderSessionTimedOutState = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 text-white p-6">
      {/* Icon */}
      <div className="w-20 h-20 mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Message */}
      <h3 className="text-xl font-semibold mb-2">Session Ended</h3>
      <p className="text-gray-400 text-center text-sm mb-6 max-w-xs">
        Your session was ended because the tab was inactive for more than 3 minutes.
      </p>

      {/* Restart button */}
      <button
        onClick={handleRestartSession}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Start New Session
      </button>
    </div>
  );

  const renderVideoContainer = () => (
    <>
      {/* Main video container */}
      <div
        id="tavus-video-container"
        className={`absolute inset-0 bg-black transition-all duration-300 ${
          shouldShowLearningModules() && showLearningModules && !isConnecting && !connectionError && hasLiveVideo && !isDemoPlaying && !showCalendly && !showPdf
            ? 'left-80' 
            : 'left-0'
        }`}
        style={{ zIndex: 0 }}
      />

      {/* Demo video overlay */}
      {isDemoPlaying && (
        <div className="absolute inset-0 z-10 bg-black">
          {/* Main Video - centered, landscape */}
          <div className="absolute inset-6 right-[420px] rounded-2xl overflow-hidden border border-white/30 shadow-[0_0_60px_rgba(255,255,255,0.25)]">
            {/* ReactPlayer for YouTube/video with onEnded support */}
            <ReactPlayer
              url={currentVideoUrl}
              playing={true}
              controls={true}
              width="100%"
              height="100%"
              style={{ position: 'absolute', top: 0, left: 0 }}
              onEnded={() => {
                log('DEMO', '🏁 Video playback ended - closing video player');
                stopDemoVideo();
              }}
              onError={(e) => {
                log('ERROR', '❌ Video player error', { error: e, url: currentVideoUrl });
              }}
              onReady={() => {
                log('DEMO', '✅ Video player ready', { url: currentVideoUrl });
              }}
              config={{
                youtube: {
                  playerVars: {
                    autoplay: 1,
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                  }
                }
              }}
            />
            {/* Close demo button */}
            <button
              onClick={() => stopDemoVideo()}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white z-20 border border-white/30 hover:bg-black/70 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Avatar PIP - bottom right, exact same position as "small" widget state */}
          <div
            id="avatar-pip"
            className={`absolute bottom-4 right-4 overflow-hidden rounded-2xl border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.2)] bg-black ${
              isMobile ? 'w-80 h-96' : 'w-96 h-[500px]'
            }`}
          >
            {/* PIP controls inside avatar */}
            {renderPipControlBar()}
          </div>
        </div>
      )}

      {/* Calendly overlay */}
      {showCalendly && (
        <div className="absolute inset-0 z-20 bg-black">
          {/* Calendly - main area, landscape */}
          <div className="absolute inset-6 right-[420px] rounded-2xl overflow-hidden border border-white/30 shadow-[0_0_60px_rgba(255,255,255,0.25)] bg-white">
            {/* Calendly iframe */}
            <iframe
              src={calendlyUrl}
              className="w-full h-full"
              style={{ border: 'none' }}
              title="Schedule Meeting"
            />
            {/* Close calendly button */}
            <button
              onClick={() => setShowCalendly(false)}
              className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white z-30 border border-white/30 hover:bg-black/70 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Avatar PIP - bottom right, exact same position as "small" widget state */}
          <div
            id="calendly-avatar-pip"
            className={`absolute bottom-4 right-4 overflow-hidden rounded-2xl border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.2)] bg-black ${
              isMobile ? 'w-80 h-96' : 'w-96 h-[500px]'
            }`}
          >
            {/* PIP controls inside avatar */}
            {renderPipControlBar()}
          </div>
        </div>
      )}

      {/* PDF/Image overlay */}
      {showPdf && (
        <div className="absolute inset-0 z-20 bg-black">
          {/* PDF/Image - main area, landscape */}
          <div className="absolute inset-6 right-[420px] rounded-2xl overflow-hidden border border-white/30 shadow-[0_0_60px_rgba(255,255,255,0.25)] bg-white flex items-center justify-center">
            {/* Check if it's an image file */}
            {pdfUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i) ? (
              // Display image directly
              <img
                src={pdfUrl.startsWith('/') ? pdfUrl : pdfUrl.replace(/^https?:\/\/[^/]+/, '')}
                alt="Document"
                className="max-w-full max-h-full object-contain"
                style={{ width: '100%', height: '100%' }}
              />
            ) : pdfUrl.startsWith('/') || pdfUrl.includes('localhost') ? (
              // PDF iframe for relative/localhost URLs
              <iframe
                src={pdfUrl.startsWith('/') ? pdfUrl : pdfUrl.replace(/^https?:\/\/[^/]+/, '')}
                className="w-full h-full"
                style={{ border: 'none' }}
                title="PDF Document"
                type="application/pdf"
              />
            ) : (
              // PDF iframe using Google Docs viewer for public URLs
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                className="w-full h-full"
                style={{ border: 'none' }}
                title="PDF Document"
              />
            )}
            {/* Close PDF/Image button */}
            <button
              onClick={() => setShowPdf(false)}
              className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white z-30 border border-white/30 hover:bg-black/70 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Avatar PIP - bottom right, exact same position as "small" widget state */}
          <div
            id="pdf-avatar-pip"
            className={`absolute bottom-4 right-4 overflow-hidden rounded-2xl border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.2)] bg-black ${
              isMobile ? 'w-80 h-96' : 'w-96 h-[500px]'
            }`}
          >
            {/* PIP controls inside avatar */}
            {renderPipControlBar()}
          </div>
        </div>
      )}
    </>
  );

  // Compact control bar for PIP mode (inside avatar during video/calendly)
  const renderPipControlBar = () => (
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent z-30">
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={toggleMicrophone}
          className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
            isMuted
              ? 'bg-red-500/80 border border-red-400/30 text-white'
              : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
          }`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          onClick={toggleAudio}
          className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
            !audioEnabled
              ? 'bg-red-500/80 border border-red-400/30 text-white'
              : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
          }`}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        <button
          onClick={handleDisconnect}
          className="p-2.5 rounded-full backdrop-blur-md bg-red-500/80 border border-red-400/30 text-white hover:bg-red-600/80 transition-all"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderControlBar = () => (
    <>
      {/* State indicators - top right */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md ${getStateColor()} text-white text-xs font-medium shadow-lg`}>
          {getStateIcon()}
          <span className="capitalize">{avatarState}</span>
        </div>
        {isUserSpeaking && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white text-xs font-medium shadow-lg">
            <User className="w-3 h-3" />
            <span>You're speaking</span>
          </div>
        )}
      </div>

      {/* Toggle sidebar button - top left (only for Entri and Evolution personas) */}
      {shouldShowLearningModules() && !isConnecting && !connectionError && !sessionTimedOut && hasLiveVideo && !isDemoPlaying && !showCalendly && !showPdf && (
        <button
          onClick={() => setShowLearningModules(!showLearningModules)}
          className="absolute top-4 left-4 z-40 p-2.5 rounded-full backdrop-blur-md bg-white/15 border border-white/25 text-white hover:bg-white/25 transition-all shadow-lg"
          title={showLearningModules ? "Hide Contents" : "Show Contents"}
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Control buttons - bottom center (adjusts for sidebar on desktop) */}
      <div
        className="absolute bottom-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/60 to-transparent z-30 transition-all duration-300"
        style={{ left: !isMobile && showLearningModules ? '320px' : '0px' }}
      >
        <div className="flex items-center justify-center gap-5">
          {/* Mic toggle */}
          <button
            onClick={toggleMicrophone}
            className={`p-3.5 rounded-full backdrop-blur-md transition-all ${
              isMuted
                ? 'bg-red-500/80 border border-red-400/30 text-white'
                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Speaker toggle */}
          <button
            onClick={toggleAudio}
            className={`p-3.5 rounded-full backdrop-blur-md transition-all ${
              !audioEnabled
                ? 'bg-red-500/80 border border-red-400/30 text-white'
                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Disconnect */}
          <button
            onClick={handleDisconnect}
            className="p-3.5 rounded-full backdrop-blur-md bg-red-500/80 border border-red-400/30 text-white hover:bg-red-600/80 transition-all"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Transcripts - Only show current conversation (last user + current avatar) */}
        {transcripts.length > 0 && (
          <div className="mt-4 max-h-32 overflow-y-auto max-w-md mx-auto">
            {transcripts.map((t, i) => (
              <div
                key={`${t.timestamp}-${i}`}
                className={`text-xs py-1.5 px-3 rounded mb-1.5 ${
                  t.type === 'user_speech'
                    ? 'bg-white/10 text-white/80'
                    : 'bg-white/5 text-white/70'
                }`}
              >
                {t.type === 'user_speech' ? '👤 ' : '🤖 '}
                {t.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  // Render expanded state (small or maximized)
  const renderExpandedState = () => {
    const isMaximized = state === "maximized";

    return (
      <motion.div
        className={`fixed z-50 bg-gray-900 overflow-hidden ${
          isMaximized
            ? 'inset-0'
            : isMobile
            ? 'bottom-4 right-4 w-80 h-96 rounded-2xl shadow-2xl'
            : 'bottom-4 right-4 w-96 h-[500px] rounded-2xl shadow-2xl'
        }`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Close button for small state */}
        {!isMaximized && (
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-40 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Content */}
        {/* Always render video container so it's in DOM for TavusSessionManager */}
        {renderVideoContainer()}

        {/* Overlay states on top of video container */}
        {isConnecting && renderConnectingState()}
        {connectionError && renderErrorState()}
        {sessionTimedOut && renderSessionTimedOutState()}

        {/* Learning Modules - show only for personas with learning modules enabled */}
        {/* Also show during PDF presentation (z-index handles layering) */}
        {shouldShowLearningModules() && !isConnecting && !connectionError && !sessionTimedOut && hasLiveVideo && showLearningModules && !isDemoPlaying && !showCalendly && (
          persona.hasFeature('proactiveModuleFlow') ? (
            <EntriLearningModules
              persona={persona}
              onModuleSelect={handleModuleSelect}
              activeModule={activeModule}
              completedModules={completedModules}
              onClose={() => setShowLearningModules(false)}
              isMobile={isMobile}
            />
          ) : (
            <LearningModules
              onModuleSelect={handleModuleSelect}
              activeModule={activeModule}
              completedModules={completedModules}
              onClose={() => setShowLearningModules(false)}
              isMobile={isMobile}
            />
          )
        )}

        {/* Quiz indicator - show when quiz is active (no popup, just indicator) */}
        {quizState.isActive && !sessionTimedOut && !isDemoPlaying && !showCalendly && !showPdf && (
          <div className="absolute top-20 left-4 z-30 bg-blue-600/90 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span className="font-semibold">
                Quiz: Question {quizState.currentQuestionIndex + 1} of {quizState.questions.length}
              </span>
              <span className="text-sm opacity-80">
                (Score: {quizState.score}/{quizState.currentQuestionIndex})
              </span>
            </div>
          </div>
        )}

        {/* Control bar - only show when connected and NOT in PIP mode (demo/calendly/pdf) and NOT during MCQ quiz */}
        {!isConnecting && !connectionError && !sessionTimedOut && !isDemoPlaying && !showCalendly && !showPdf && !pdfPresentation.isPresenting && !mcqQuizState.isActive && renderControlBar()}

        {/* MCQ Quiz Overlay - show when MCQ quiz is active */}
        {mcqQuizState.isActive && mcqQuizState.quizData && mcqQuizState.quizData.questions && mcqQuizState.currentQuestionIndex < mcqQuizState.quizData.questions.length && (
          <MCQQuizOverlay
            question={mcqQuizState.quizData.questions[mcqQuizState.currentQuestionIndex]}
            questionNumber={mcqQuizState.currentQuestionIndex + 1}
            totalQuestions={mcqQuizState.quizData.questions.length}
            onSelect={handleMcqSelect}
            selectedIndex={mcqQuizState.selectedIndex}
            isAnswered={mcqQuizState.isAnswered}
            isCorrect={mcqQuizState.isCorrect}
            disabled={mcqQuizState.waitingForAvatarToFinish}
            score={mcqQuizState.score}
            onRepeatQuestion={repeatMcqQuestion}
            onSkipQuestion={skipMcqQuestion}
            onEndQuiz={skipMcqQuiz}
            sidebarVisible={shouldShowLearningModules() && showLearningModules && !isConnecting && !connectionError && hasLiveVideo && !isDemoPlaying && !showCalendly && !showPdf}
            sidebarWidth={320}
          />
        )}

        {/* PDF Presentation overlay - PIP mode like video */}
        {pdfPresentation.isPresenting && pdfPresentation.currentPdfUrl && (
          <div className="absolute inset-0 z-10 bg-black">
            {/* Sidebar toggle button during PDF presentation */}
            {shouldShowLearningModules() && !isMobile && (
              <button
                onClick={() => setShowLearningModules(!showLearningModules)}
                className="absolute top-4 left-4 z-30 p-2.5 rounded-full backdrop-blur-md bg-white/15 border border-white/25 text-white hover:bg-white/25 transition-all shadow-lg"
                title={showLearningModules ? "Hide Contents" : "Show Contents"}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {/* PDF viewer - responsive layout based on sidebar visibility and screen size */}
            <div
              className="absolute rounded-2xl overflow-hidden border border-white/30 shadow-[0_0_60px_rgba(255,255,255,0.25)] bg-white transition-all duration-300"
              style={{
                top: isMobile ? '8px' : '24px',
                bottom: isMobile ? '200px' : '24px',
                left: isMobile ? '8px' : (showLearningModules ? '340px' : '24px'),
                right: isMobile ? '8px' : '420px',
              }}
            >
              <PdfPresentation
                pdfUrl={pdfPresentation.currentPdfUrl}
                slides={pdfPresentation.presentationConfig?.slides || []}
                currentSlideIndex={pdfPresentation.currentSlideIndex}
                onSlideChange={(index) => {
                  addDebugLog(`[PDF] User clicked navigation to slide: ${index}`);
                  // Interrupt current narration
                  if (dailyEventManagerRef.current) {
                    dailyEventManagerRef.current.interruptReplica();
                  }
                  // Set target slide to prevent auto-advance until narration completes
                  userNavigatedToSlideRef.current = index;
                  // CRITICAL: Set expectingNarrationRef so auto-advance works after narration
                  expectingNarrationRef.current = true;
                  pdfPresentation.goToSlide(index);
                }}
                onRepeatSlide={(index) => {
                  addDebugLog(`[PDF] User clicked repeat slide: ${index}`);
                  // Interrupt current narration
                  if (dailyEventManagerRef.current) {
                    dailyEventManagerRef.current.interruptReplica();
                  }
                  // Set target slide to prevent auto-advance until narration completes
                  userNavigatedToSlideRef.current = index;
                  // CRITICAL: Set expectingNarrationRef so auto-advance works after narration
                  expectingNarrationRef.current = true;
                  pdfPresentation.narrateSlide(index);
                }}
                onPresentationEnd={() => {
                  addDebugLog('[PDF] User clicked finish presentation');
                  pdfPresentation.endPresentation();
                }}
              />
              {/* Close presentation button */}
              <button
                onClick={() => {
                  addDebugLog('[PDF] User closed presentation');
                  pdfPresentation.endPresentation();
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white z-20 border border-white/30 hover:bg-black/70 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Avatar PIP - responsive positioning */}
            <div
              id="pdf-avatar-pip"
              className={`absolute overflow-hidden rounded-2xl border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.2)] bg-black transition-all duration-300 ${
                isMobile
                  ? 'bottom-2 right-2 left-2 h-44'
                  : 'bottom-4 right-4 w-96 h-[500px]'
              }`}
            >
              {/* PIP controls inside avatar */}
              {renderPipControlBar()}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {state === "minimized" ? renderMinimizedState() : renderExpandedState()}
    </AnimatePresence>
  );
};

export default TavusAvatarWidget;
