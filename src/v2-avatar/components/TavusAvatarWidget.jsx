import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  PhoneOff,
  Calendar,
  Mic,
  MicOff,
  MessageSquare,
  Ear,
  Brain,
  Smile,
  User,
  Bot,
  Video,
  Award,
  Menu,
} from "lucide-react";
import { getApiUrl, getCreateConversationUrl, getEndConversationUrl } from '../config/api';
import { useEventLogger } from '../hooks/useEventLogger';
import { useDemoVideo } from '../hooks/useDemoVideo';
import TavusSessionManager from '../utils/TavusSessionManager';
import DailyEventManager from '../utils/DailyEventManager';
import LearningModules from './LearningModules';
import EntriLearningModules from './EntriLearningModules';
import MCQQuizOverlay from './MCQQuizOverlay';
import { getPersona } from '../personas';

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

  // Get module configuration from persona (empty arrays for personas without modules)
  const moduleOrder = persona.modules.order || [];
  const modulesRequiringConfirmation = persona.modules.requiresConfirmation || [];

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
  });
  const mcqQuizStateRef = useRef(mcqQuizState); // Ref for use in callbacks

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
      
      // Check if user hasn't spoken and avatar isn't speaking (use refs for current values)
      if (!isUserSpeakingRef.current && !isAvatarSpeakingRef.current && dailyEventManagerRef.current) {
        // For personas with proactive module flow, move to next module when current is completed
        if (persona.hasFeature('proactiveModuleFlow') && activeModule && !quizState.isActive) {
          const currentIndex = moduleOrder.indexOf(activeModule);
          if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
            const nextModuleId = moduleOrder[currentIndex + 1];
            addDebugLog(`[PROACTIVE] Moving to next Entri module: ${nextModuleId}`);
            // Automatically move to next module using ref
            if (handleModuleSelectRef.current) {
              handleModuleSelectRef.current(nextModuleId);
            }
            return;
          }
        }
        
        addDebugLog('[PROACTIVE] 5 seconds passed, triggering continuation');
        // Send a message to trigger proactive continuation
        // Using respond message to trigger LLM to continue conversation
        dailyEventManagerRef.current.sendRespondMessage("Continue the conversation naturally with a related topic or question.");
      }
      proactiveTimeoutRef.current = null;
    }, 5000);
  }, [addDebugLog, personaId, activeModule, quizState.isActive]);

  // Ref to track video playing state for callbacks
  const isDemoPlayingRef = useRef(false);

  // Callback for when founder video stops - move to next module
  const handleFounderVideoStop = useCallback(() => {
    if (activeModuleRef.current === 'founder-video' && persona.hasFeature('founderVideo')) {
      addDebugLog('[DEMO] Founder video finished');

      // Unlock the module lock
      moduleSpeechLockRef.current = false;
      currentModulePromptRef.current = '';

      // Mark founder-video as complete
      setCompletedModules(prev => {
        if (prev.includes('founder-video')) {
          return prev;
        }
        return [...prev, 'founder-video'];
      });

      // Check if founder-video has a quiz (use persona config)
      if (persona.hasFeature('mcqQuiz') && persona.hasModuleQuiz('founder-video')) {
        addDebugLog('[DEMO] Founder video has quiz - starting MCQ quiz');

        // Keep microphone muted during quiz
        if (sessionManagerRef.current?.isInitialized) {
          sessionManagerRef.current.setMicrophoneMuted(true);
          setIsMuted(true);
        }

        // Keep Tavus listening disabled during quiz
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.disableListening();
          listeningStateRef.current = 'disabled';
        }

        // Start the quiz after a short delay
        setTimeout(() => {
          if (mountedRef.current && startMcqQuizRef.current) {
            startMcqQuizRef.current('founder-video');
          }
        }, 1000);
      } else {
        // No quiz - move to next module (posh-info)
        addDebugLog('[DEMO] No quiz for founder video - moving to next module');

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

        // Move to next main module (posh-info)
        const nextModuleId = moduleOrder[1]; // posh-info
        addDebugLog(`[DEMO] Scheduling transition to next module: ${nextModuleId}`);
        setTimeout(() => {
          if (mountedRef.current && !quizState.isActive && handleModuleSelectRef.current) {
            addDebugLog(`[DEMO] ✅ Moving to next module after founder video: ${nextModuleId}`);
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
    }
  }, [personaId, moduleOrder, quizState.isActive, addDebugLog]);

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
      addDebugLog('[DEMO] Video stopped - restoring avatar audio');
      setAudioEnabled(true);
      
      // Handle founder video completion (video will be closed and next module will start)
      handleFounderVideoStop();
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

    if (type === 'echo') {
      dailyEventManagerRef.current.sendEchoMessage(cleanedMessage);
    } else {
      dailyEventManagerRef.current.sendRespondMessage(cleanedMessage);
    }
  }, []);

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
        
        // If module lock is active, ensure Tavus listening is disabled
        if (moduleSpeechLockRef.current && dailyEventManagerRef.current) {
          dailyEventManagerRef.current.disableListening();
          addDebugLog('[MODULE-LOCK] 🔇 Re-confirmed Tavus listening disabled');
        }

        // CRITICAL: If MCQ quiz is active, ensure Tavus listening is disabled
        if (mcqQuizStateRef.current.isActive && dailyEventManagerRef.current) {
          dailyEventManagerRef.current.disableListening();
          listeningStateRef.current = 'disabled';
          addDebugLog('[MCQ-QUIZ] 🔇 Re-confirmed Tavus listening disabled during quiz');
        }
        
        // Mute microphone at Daily.co level (backup)
        if (sessionManagerRef.current?.isInitialized) {
          sessionManagerRef.current.setMicrophoneMuted(true).catch(err => {
            addDebugLog(`[MIC] ❌ Failed to mute: ${err.message}`);
          });
          setIsMuted(true);
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

        // ⚡ PRIORITY CHECK: If MCQ quiz is active, handle quiz flow FIRST before any module logic
        if (mcqQuizStateRef.current.isActive) {
          addDebugLog(`[MCQ-QUIZ] Avatar stopped speaking during quiz - quiz is in control`);

          // Enable MCQ selection when avatar finishes speaking during quiz
          if (mcqQuizStateRef.current.waitingForAvatarToFinish) {
            addDebugLog('[MCQ-QUIZ] Avatar finished speaking - enabling selection, keeping listening DISABLED');
            setMcqQuizState(prev => ({ ...prev, waitingForAvatarToFinish: false }));

            // CRITICAL: Keep Tavus listening disabled during MCQ quiz
            if (dailyEventManagerRef.current) {
              dailyEventManagerRef.current.disableListening();
              listeningStateRef.current = 'disabled';
            }
          }

          setIsAvatarSpeaking(false);
          isAvatarSpeakingRef.current = false;
          setAvatarState("idle");
          return; // Skip all module completion logic - quiz handles its own flow
        }

        // When avatar stops speaking during welcome module, transition to founder video immediately
        // For other modules (non-welcome, non-founder-video), completion is handled by finishModuleSpeech
        if (activeModuleRef.current === 'welcome-intro' && moduleSpeechLockRef.current && !interrupted) {
          addDebugLog('[FOUNDER-VIDEO] ✅ Welcome module complete - transitioning to founder video');
          const acc = moduleSpeechAccumulatorRef.current;
          acc.completed = true;
          if (finishModuleSpeechRef.current) {
            addDebugLog('[FOUNDER-VIDEO] Calling finishModuleSpeech to transition to founder-video');
            finishModuleSpeechRef.current();
          } else {
            addDebugLog('[FOUNDER-VIDEO] ❌ finishModuleSpeechRef.current is null!');
          }
        } else if (activeModuleRef.current && activeModuleRef.current !== 'welcome-intro' && activeModuleRef.current !== 'founder-video' && activeModuleRef.current !== 'final-quiz' && moduleSpeechLockRef.current && !interrupted) {
          // Skip module completion if MCQ quiz is active (quiz handles its own flow)
          if (mcqQuizStateRef.current.isActive) {
            addDebugLog(`[MODULE-LOCK] Skipping module completion - MCQ quiz is active`);
            // Don't process module completion - quiz is in control
          } else {
            // For other regular modules: Check if confirmation is required before completing
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

              // Enable Tavus listening so it can hear user's response
              if (dailyEventManagerRef.current) {
                listeningStateRef.current = 'enabled';
                dailyEventManagerRef.current.enableListening();
                addDebugLog('[MODULE-CONFIRM] 🎤 Listening enabled - waiting for user confirmation');
              }

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
        // EXCEPTION: Allow transcripts when waiting for module confirmation or MCQ quiz
        if (moduleSpeechLockRef.current && !waitingForModuleConfirmationRef.current && !mcqQuizStateRef.current.isActive) {
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
    
    // IMPORTANT: Ignore user speech when avatar is speaking (especially during quiz)
    if (isAvatarSpeakingRef.current) {
      log('USER_SPEECH', `Ignored - avatar is speaking: "${text}"`, { text });
      return;
    }
    
    log('USER_SPEECH', `User said (${source})`, { text });
    
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

        // Reset confirmation state
        setWaitingForModuleConfirmation(false);
        waitingForModuleConfirmationRef.current = false;

        // Get current module
        const currentModule = activeModuleRef.current;

        // Check if this module has a quiz (use persona config)
        if (persona.hasFeature('mcqQuiz') && persona.hasModuleQuiz(currentModule)) {
          addDebugLog(`[MODULE-CONFIRM] Module ${currentModule} has quiz - starting MCQ quiz`);

          // Mute microphone before starting quiz
          if (sessionManagerRef.current?.isInitialized) {
            sessionManagerRef.current.setMicrophoneMuted(true);
            setIsMuted(true);
          }

          // Disable listening during quiz
          if (dailyEventManagerRef.current) {
            listeningStateRef.current = 'disabled';
            dailyEventManagerRef.current.disableListening();
          }

          // Start the MCQ quiz for this module
          setTimeout(() => {
            startMcqQuiz(currentModule);
          }, 500);

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

          // Disable listening
          if (dailyEventManagerRef.current) {
            listeningStateRef.current = 'disabled';
            dailyEventManagerRef.current.disableListening();
          }

          // Send acknowledgment and transition
          sendMessageToReplica(`Great! Let's move on to the next topic.`);

          setTimeout(() => {
            if (mountedRef.current && handleModuleSelectRef.current) {
              addDebugLog(`[MODULE-CONFIRM] Transitioning to: ${nextModuleId}`);
              handleModuleSelectRef.current(nextModuleId);
            }
          }, 2000); // Wait for acknowledgment to be spoken
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

    // Check if MCQ quiz is active - handle voice commands
    if (mcqQuizStateRef.current.isActive) {
      const lowerText = text.toLowerCase().trim();

      // Skip/End quiz commands
      if (lowerText.includes('skip') || lowerText.includes('end quiz') || lowerText.includes('stop quiz') || lowerText.includes('exit quiz')) {
        addDebugLog(`[MCQ-QUIZ] Voice command: skip/end quiz - "${text}"`);
        skipMcqQuiz();
        return;
      }

      // Repeat question commands
      if (lowerText.includes('repeat') || lowerText.includes('say again') || lowerText.includes('again please') || lowerText.includes('one more time')) {
        addDebugLog(`[MCQ-QUIZ] Voice command: repeat question - "${text}"`);
        repeatMcqQuestion();
        return;
      }

      // Any other voice input during quiz - remind user to click
      addDebugLog(`[MCQ-QUIZ] Unrecognized voice during quiz: "${text}" - reminding to click`);
      sendMessageToReplica("Please select your answer by clicking one of the options on screen. You can say 'repeat' to hear the question again, or 'skip' to move on.");
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
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Remove images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
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
    if (activeModule && activeModule !== 'final-quiz' && !completedModules.includes(activeModule)) {
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
              const currentIndex = moduleOrder.indexOf(moduleId);
              if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
                const nextModuleId = moduleOrder[currentIndex + 1];
                addDebugLog(`[ENTRI-ONBOARDING] Module ${moduleId} completed, moving to ${nextModuleId}`);
                
                // Wait a bit then automatically move to next module
                setTimeout(() => {
                  if (mountedRef.current && !quizState.isActive) {
                    handleModuleSelect(nextModuleId);
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

  // Wait for both user and avatar to finish speaking before playing demo video
  // EXCEPTION: For founder-video module, play immediately without waiting
  useEffect(() => {
    if (pendingDemoVideoRef.current) {
      const videoUrl = pendingDemoVideoRef.current;
      
      // Special handling for founder-video: Play immediately without waiting
      if (activeModule === 'founder-video') {
        log('DEMO', 'Founder video - playing immediately without waiting', { hasPlayDemoVideo: !!playDemoVideo });
        
        // Save current state for restoration later
        preDemoWidgetStateRef.current = state;

        // Maximize if not already, then play immediately
        if (state !== "maximized") {
          setState("maximized");
          setTimeout(() => {
            if (mountedRef.current && playDemoVideo) {
              playDemoVideo(videoUrl);
              pendingDemoVideoRef.current = null;
              log('DEMO', 'Founder video playback started (after maximize)');
            }
          }, 100); // Very short delay
        } else {
          // Play immediately
          if (playDemoVideo) {
            playDemoVideo(videoUrl);
            pendingDemoVideoRef.current = null;
            log('DEMO', 'Founder video playback started (immediate)');
          }
        }
      } else if (!isAvatarSpeaking && !isUserSpeaking) {
        // For other videos: Wait for both user and avatar to finish speaking
      log('DEMO', 'Both user and replica finished speaking - playing video now');

      // Save current state for restoration later
      preDemoWidgetStateRef.current = state;

      // Maximize if not already, then play
      // Note: Avatar audio will be muted by onVideoStart callback in useDemoVideo
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
  
  // Force play founder video immediately when module is selected (fallback)
  useEffect(() => {
    if (activeModule === 'founder-video' && pendingDemoVideoRef.current) {
      const videoUrl = pendingDemoVideoRef.current;
      log('DEMO', 'Founder video - force playing immediately (fallback useEffect)', { isDemoPlaying, hasPlayDemoVideo: !!playDemoVideo });
      
      // Play immediately without any conditions (don't check isDemoPlaying - force play)
      setTimeout(() => {
        if (mountedRef.current && pendingDemoVideoRef.current === videoUrl && playDemoVideo) {
          preDemoWidgetStateRef.current = state;
          if (state !== "maximized") {
            setState("maximized");
            setTimeout(() => {
              if (mountedRef.current && playDemoVideo) {
                playDemoVideo(videoUrl);
                pendingDemoVideoRef.current = null;
                log('DEMO', 'Founder video playback started (after maximize - fallback)');
              }
            }, 100);
          } else {
            playDemoVideo(videoUrl);
            pendingDemoVideoRef.current = null;
            log('DEMO', 'Founder video playback started (immediate - fallback)');
          }
        }
      }, 100); // Reduced delay for faster playback
    }
  }, [activeModule, state, log, playDemoVideo]);

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
  useEffect(() => {
    if (showPdf && hasLiveVideo) {
      const sourceVideo = document.querySelector('#tavus-video-container video');
      const pipContainer = document.getElementById('pdf-avatar-pip');

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
        pipVideo.play().catch(e => console.log('PDF PIP video play failed:', e));
      }
    }
  }, [showPdf, hasLiveVideo]);

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

  // Centralized cleanup function using sendBeacon for reliability
  const performCleanup = useCallback((source) => {
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

    // Always use sendBeacon for reliability - works even when page is closing
    const payload = JSON.stringify({
      conversationId: currentSessionInfo.conversationId,
    });

    try {
      const beaconSent = navigator.sendBeacon(
        getEndConversationUrl(),
        new Blob([payload], { type: 'application/json' })
      );
      console.log(`[CLEANUP] sendBeacon result: ${beaconSent}`);
    } catch (e) {
      console.log(`[CLEANUP] sendBeacon failed: ${e.message}, falling back to fetch`);
      // Fallback to fetch (may not complete if page is closing)
      fetch(getEndConversationUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true, // Allows request to outlive the page
      }).catch(() => {});
    }

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
  }, []);

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
    };
  }, [performCleanup]);

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
        resp = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personaId }),
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

      // Setup callbacks - demo triggers handled via tool calls, no speech detection needed
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
        },
        onReplicaStopSpeaking: (lastSpeech, interrupted) => {
          // Ignore avatar speech when video is playing
          if (isDemoPlayingRef.current) {
            log('DEMO', 'Ignoring avatar speech end - video is playing');
            return;
          }

          // ⚡ PRIORITY CHECK: If MCQ quiz is active, handle quiz flow FIRST before any module logic
          if (mcqQuizStateRef.current.isActive) {
            addDebugLog(`[MCQ-QUIZ] Avatar stopped speaking during quiz - quiz is in control`);

            // Enable MCQ selection when avatar finishes speaking during quiz
            if (mcqQuizStateRef.current.waitingForAvatarToFinish) {
              addDebugLog('[MCQ-QUIZ] Avatar finished speaking - enabling selection, keeping listening DISABLED');
              setMcqQuizState(prev => ({ ...prev, waitingForAvatarToFinish: false }));

              // CRITICAL: Keep Tavus listening disabled during MCQ quiz
              if (dailyEventManagerRef.current) {
                dailyEventManagerRef.current.disableListening();
                listeningStateRef.current = 'disabled';
              }
            }

            setIsAvatarSpeaking(false);
            isAvatarSpeakingRef.current = false;
            setAvatarState("idle");
            return; // Skip all module completion logic - quiz handles its own flow
          }

          setIsAvatarSpeaking(false);
          isAvatarSpeakingRef.current = false;

          // Proactive flow: When avatar stops speaking, trigger module completion
          const currentModule = activeModuleRef.current;

          if (currentModule === 'welcome-intro' && moduleSpeechLockRef.current && !interrupted) {
            // Welcome module: Transition to founder video
            addDebugLog('[FOUNDER-VIDEO] ✅ Welcome module complete - transitioning to founder video');
            const acc = moduleSpeechAccumulatorRef.current;
            acc.completed = true;
            if (finishModuleSpeechRef.current) {
              finishModuleSpeechRef.current();
            }
          } else if (currentModule && currentModule !== 'welcome-intro' && currentModule !== 'founder-video' && currentModule !== 'final-quiz' && moduleSpeechLockRef.current && !interrupted) {
            // Regular modules: Check if confirmation is required before completing
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

              // Enable Tavus listening
              if (dailyEventManagerRef.current) {
                listeningStateRef.current = 'enabled';
                dailyEventManagerRef.current.enableListening();
                addDebugLog('[MODULE-CONFIRM] 🎤 Listening enabled - waiting for user confirmation');
              }

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

  // Start MCQ quiz for a module
  const startMcqQuiz = useCallback((moduleId) => {
    // Get quiz data from persona config
    const quizData = persona.getModuleQuiz(moduleId);
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
      addDebugLog(`[MCQ-QUIZ] No quiz found for module: ${moduleId}`);
      return false;
    }

    addDebugLog(`[MCQ-QUIZ] Starting quiz for module: ${moduleId} with ${quizData.questions.length} questions`);

    // Initialize quiz state
    setMcqQuizState({
      isActive: true,
      moduleId: moduleId,
      currentQuestionIndex: 0,
      selectedIndex: null,
      isAnswered: false,
      isCorrect: false,
      score: { correct: 0, total: 0 },
      quizData: quizData,
      waitingForAvatarToFinish: true, // Wait for avatar to read the question
    });

    // Mute microphone during quiz - user clicks options, not speaks
    if (sessionManagerRef.current?.isInitialized) {
      sessionManagerRef.current.setMicrophoneMuted(true);
      setIsMuted(true);
    }

    // CRITICAL: Disable Tavus listening during MCQ quiz - avatar should NOT respond to audio
    if (dailyEventManagerRef.current) {
      dailyEventManagerRef.current.disableListening();
      listeningStateRef.current = 'disabled';
      addDebugLog('[MCQ-QUIZ] Disabled Tavus listening - waiting for button clicks only');
    }

    // Send quiz intro and first question to avatar using ECHO mode (not respond)
    // Echo mode makes avatar speak exactly this text without LLM processing
    const firstQuestion = quizData.questions[0];
    const introMessage = `${quizData.intro} Question 1: ${firstQuestion.question} Your options are: A: ${firstQuestion.options[0]}. B: ${firstQuestion.options[1]}. C: ${firstQuestion.options[2]}. D: ${firstQuestion.options[3]}.`;

    sendMessageToReplica(introMessage, 'echo');
    return true;
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

    const currentQuestion = state.quizData.questions[state.currentQuestionIndex];
    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    const optionLabels = ['A', 'B', 'C', 'D'];

    addDebugLog(`[MCQ-QUIZ] User selected option ${optionLabels[selectedIndex]}: "${currentQuestion.options[selectedIndex]}" - ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

    // Update state with answer
    setMcqQuizState(prev => ({
      ...prev,
      selectedIndex: selectedIndex,
      isAnswered: true,
      isCorrect: isCorrect,
      score: {
        correct: prev.score.correct + (isCorrect ? 1 : 0),
        total: prev.score.total + 1,
      },
      waitingForAvatarToFinish: true, // Wait for avatar feedback before next question
    }));

    // Send feedback to avatar
    let feedbackMessage;
    if (isCorrect) {
      feedbackMessage = `That's correct! ${currentQuestion.explanation}`;
    } else {
      const correctAnswer = currentQuestion.options[currentQuestion.correctIndex];
      feedbackMessage = `That's not quite right. The correct answer is ${optionLabels[currentQuestion.correctIndex]}: ${correctAnswer}. ${currentQuestion.explanation}`;
    }

    // Check if there are more questions
    const isLastQuestion = state.currentQuestionIndex >= state.quizData.questions.length - 1;
    if (!isLastQuestion) {
      feedbackMessage += " Let me read the next question.";
    }

    // Use ECHO mode - avatar speaks exactly this feedback without LLM processing
    sendMessageToReplica(feedbackMessage, 'echo');

    // If not last question, prepare next question after a delay
    if (!isLastQuestion) {
      setTimeout(() => {
        askNextMcqQuestion();
      }, 4000); // Wait for avatar to finish feedback
    } else {
      // Last question - complete quiz after delay
      setTimeout(() => {
        completeMcqQuiz();
      }, 4000);
    }
  }, [addDebugLog, sendMessageToReplica]);

  // Ask the next MCQ question
  const askNextMcqQuestion = useCallback(() => {
    setMcqQuizState(prev => {
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
    const passed = quizData.passingScore ? score.correct >= quizData.passingScore : true;

    addDebugLog(`[MCQ-QUIZ] Quiz complete for ${moduleId} - Score: ${score.correct}/${score.total}, Passed: ${passed}`);

    // Send completion message
    let completionMessage = quizData.completionMessage || "You've completed the quiz!";
    completionMessage += ` You scored ${score.correct} out of ${score.total}.`;

    if (!passed && quizData.passingScore) {
      completionMessage += ` You needed ${quizData.passingScore} correct answers to pass. Don't worry, the important thing is that you're learning!`;
    }

    // Use ECHO mode for completion message
    sendMessageToReplica(completionMessage, 'echo');

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
    });

    // Advance to next module after quiz completion
    const currentIndex = moduleOrder.indexOf(moduleId);
    if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
      const nextModuleId = moduleOrder[currentIndex + 1];
      addDebugLog(`[MCQ-QUIZ] Advancing to next module: ${nextModuleId}`);

      setTimeout(() => {
        if (mountedRef.current && handleModuleSelectRef.current) {
          handleModuleSelectRef.current(nextModuleId);
        }
      }, 3000); // Wait for completion message to be spoken
    }
  }, [addDebugLog, sendMessageToReplica, moduleOrder]);

  // Skip/End MCQ quiz
  const skipMcqQuiz = useCallback(() => {
    const state = mcqQuizStateRef.current;
    if (!state.isActive) return;

    addDebugLog(`[MCQ-QUIZ] Quiz skipped for module: ${state.moduleId}`);

    // Use ECHO mode
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
    });

    // Advance to next module
    const currentIndex = moduleOrder.indexOf(state.moduleId);
    if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
      const nextModuleId = moduleOrder[currentIndex + 1];
      setTimeout(() => {
        if (mountedRef.current && handleModuleSelectRef.current) {
          handleModuleSelectRef.current(nextModuleId);
        }
      }, 2000);
    }
  }, [addDebugLog, sendMessageToReplica, moduleOrder]);

  // Repeat current MCQ question
  const repeatMcqQuestion = useCallback(() => {
    const state = mcqQuizStateRef.current;
    if (!state.isActive || !state.quizData) return;

    const currentQuestion = state.quizData.questions[state.currentQuestionIndex];
    const questionMessage = `Let me repeat that. Question ${state.currentQuestionIndex + 1}: ${currentQuestion.question} Your options are: A: ${currentQuestion.options[0]}. B: ${currentQuestion.options[1]}. C: ${currentQuestion.options[2]}. D: ${currentQuestion.options[3]}.`;

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
    
    // ✅ Completion checks removed - allow immediate transition
    addDebugLog('[MODULE-LOCK] ✅ Proceeding with module transition (completion checks disabled)');
    acc.completed = true;
    
    // Special handling for welcome-intro: DO NOT unlock - transition directly to founder-video
    if (currentModule === 'welcome-intro') {
      addDebugLog('[MODULE-LOCK] Welcome complete - transitioning to founder video WITHOUT unlocking');
      
      // Mark welcome module as complete
      if (!completedModules.includes(currentModule)) {
        addDebugLog(`[MODULE-LOCK] Marking module complete: ${currentModule}`);
        setCompletedModules(prev => {
          if (prev.includes(currentModule)) {
            return prev;
          }
          return [...prev, currentModule];
        });
      }
      
      // 🔒 KEEP LOCK ACTIVE and microphone muted during transition
      // DO NOT unlock or unmute - transition immediately to founder-video
      // This prevents the gap where microphone turns on and listening starts
      
      // Immediately transition to founder-video sub-module
      console.log('[FOUNDER-VIDEO] Starting transition to founder-video', { 
        mounted: mountedRef.current, 
        hasHandleModuleSelect: !!handleModuleSelectRef.current 
      });
      addDebugLog('[MODULE-LOCK] 🎬 Immediately transitioning to founder-video sub-module');
      
      if (mountedRef.current && handleModuleSelectRef.current) {
        console.log('[FOUNDER-VIDEO] Calling handleModuleSelect for founder-video NOW');
        handleModuleSelectRef.current('founder-video');
      } else {
        console.error('[FOUNDER-VIDEO] ❌ Cannot transition - mounted:', mountedRef.current, 'handleModuleSelect:', !!handleModuleSelectRef.current);
        // Fallback: Try to play video directly if transition fails
        if (mountedRef.current && playDemoVideoRef.current) {
          console.log('[FOUNDER-VIDEO] Fallback: Playing video directly');
          const founderVideoUrl = 'https://www.youtube.com/watch?v=YtB5fjEO1zc';
          pendingDemoVideoRef.current = founderVideoUrl;
          playDemoVideoRef.current(founderVideoUrl);
        }
      }
      return; // Exit early - don't unlock or unmute
    }
    
    addDebugLog('[MODULE-LOCK] ✅ Finishing module speech - unlocking');
    moduleSpeechLockRef.current = false;
    
    // Clear stored prompt
    currentModulePromptRef.current = '';

    // 🔴 DO NOT unmute microphone automatically
    // Microphone stays muted throughout onboarding - user must manually enable it
    addDebugLog('[MODULE-LOCK] ⚠️ Keeping microphone muted - user must manually enable');
    
    // Tavus listening is controlled by the useEffect that syncs with microphone state
    // If microphone is muted → listening will be disabled
    // If microphone is unmuted → listening will be enabled
    // No need to manually control it here - the useEffect handles it

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

    // Special handling for founder-video: After video completes, move to next main module
    // NOTE: This logic is now handled by handleFounderVideoStop callback when video actually ends
    // This code here is kept as a backup but should not execute since founder-video unlock
    // happens via the video stop callback, not via finishModuleSpeech
    if (currentModule === 'founder-video') {
      // Founder video completion is handled by handleFounderVideoStop callback
      // which is called when the video actually ends (via onVideoStop in useDemoVideo)
      addDebugLog('[MODULE-LOCK] Founder video module unlocked - transition handled by video stop callback');
      return; // Exit early, don't process further
    }
    
    // For other modules: Auto-advance to next module
    // NOTE: Modules requiring confirmation are handled in onReplicaStopSpeaking callback
    // and should NOT reach this function. This is only for non-confirmation modules.
    if (persona.hasFeature('proactiveModuleFlow') && currentModule && currentModule !== 'final-quiz') {
      const currentIndex = moduleOrder.indexOf(currentModule);

      // Auto-advance to next module
      if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
        const nextModuleId = moduleOrder[currentIndex + 1];
        addDebugLog(`[MODULE-LOCK] 🎯 Proactive flow: Moving to next module: ${nextModuleId}`);

        // 🔇 Ensure microphone stays muted before transitioning
        if (sessionManagerRef.current?.isInitialized) {
          sessionManagerRef.current.setMicrophoneMuted(true);
          setIsMuted(true);
        }

        // 🔴 Keep Tavus listening disabled
        if (dailyEventManagerRef.current) {
          dailyEventManagerRef.current.disableListening();
        }

        setTimeout(() => {
          if (mountedRef.current && !quizState.isActive && handleModuleSelectRef.current) {
            addDebugLog(`[MODULE-LOCK] ✅ Transitioning to next module: ${nextModuleId}`);
            handleModuleSelectRef.current(nextModuleId);
          }
        }, 1000); // Short delay for smooth transition
      } else if (currentModule === moduleOrder[moduleOrder.length - 2]) {
        // If we just completed the last module before quiz, transition to quiz
        addDebugLog('[MODULE-LOCK] 🎯 All modules complete - transitioning to final quiz');
        setTimeout(() => {
          if (mountedRef.current && handleModuleSelectRef.current) {
            handleModuleSelectRef.current('final-quiz');
          }
        }, 1000);
      }
    }
  }, [activeModule, completedModules, personaId, quizState.isActive, addDebugLog, playDemoVideo, isDemoPlaying, sendMessageToReplica, moduleOrder]);

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
    } else if (activeModule === 'founder-video' || activeModule === 'final-quiz') {
      // Founder video: Complete when announcement is spoken (short phrase)
      const hasFounderVideoAnnouncement = 
        text.includes("founder's video") || 
        text.includes('founder video') ||
        text.includes("here is our founder");
      
      if (hasFounderVideoAnnouncement && text.length > 20) {
        addDebugLog('[MODULE-LOCK] ✅ Founder video announcement complete detected');
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
      // Microphone muted → disable listening
      dailyEventManagerRef.current.disableListening();
      console.log('[TAVUS-DEBUG] [SYNC] 🔇 Tavus listening disabled (microphone is muted)');
      // Update avatar state to idle when mic is muted (if not speaking and no lock)
      if (!moduleSpeechLockRef.current && !isAvatarSpeakingRef.current) {
        setAvatarState("idle");
        console.log('[TAVUS-DEBUG] [AVATAR-STATE] Setting to "idle" - microphone muted (sync)');
      }
    } else {
      // Microphone unmuted → enable listening (but NOT during MCQ quiz)
      if (mcqQuizStateRef.current.isActive) {
        // During MCQ quiz, keep listening disabled even if mic is unmuted
        dailyEventManagerRef.current.disableListening();
        console.log('[TAVUS-DEBUG] [SYNC] 🔇 Tavus listening kept DISABLED (MCQ quiz active)');
        setAvatarState("idle");
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
    // Check if module is unlocked before proceeding
    if (!isModuleUnlocked(moduleId)) {
      // Send message to avatar explaining the module is locked
      sendMessageToReplica(
        `You need to complete the previous topics first before you can access this module. ` +
        `Please complete the earlier topics in order.`
      );
      return;
    }

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
    
    if (moduleId === 'final-quiz' && persona.hasFeature('finalQuiz')) {
      // Get final quiz questions from persona config
      const finalQuizConfig = persona.quizzes.finalQuiz;
      const quizQuestions = finalQuizConfig?.questions || [];
      
      // Initialize quiz state
      setQuizState({
        isActive: true,
        currentQuestionIndex: 0,
        questions: quizQuestions,
        score: 0,
        waitingForAnswer: false,
        waitingForConfirmation: false,
        lastQuestionAsked: null,
        questionResults: [],
        isAskingQuestion: true // Avatar will ask first question
      });
      
      // Send message to avatar to start quiz with first question
      // Use ECHO for quiz prompts too to prevent user speech detection
      const firstQuestion = quizQuestions[0].question;
      sendMessageToReplica(
        `${prompt} Now ask the first question: "${firstQuestion}" IMPORTANT: When the student answers, only say if it's correct, partially correct, or wrong. Do NOT explain the answer or provide corrections. Just say "That's correct!" or "That's not quite right" and immediately ask the next question. Save all explanations for the end of the quiz.`,
        'echo' // Use echo to prevent treating as user input
      );
      
      // Set waiting for answer after avatar finishes speaking (detected via transcript)
    } else if (moduleId === 'founder-video') {
      // Special handling for founder-video: Announce and play video automatically
      // 🔒 LOCK IS ALREADY ACTIVE from welcome-intro - keep it active
      addDebugLog('[MODULE-LOCK] Founder video module - lock already active, announcing and playing video');
      
      const founderVideoUrl = 'https://www.youtube.com/watch?v=YtB5fjEO1zc';
      
      // 🔇 Ensure microphone is muted (should already be muted from welcome-intro)
      if (sessionManagerRef.current?.isInitialized) {
        addDebugLog('[MODULE-LOCK] 🔇 Ensuring microphone is muted for founder video');
        sessionManagerRef.current.setMicrophoneMuted(true).catch(err => {
          addDebugLog(`[MODULE-LOCK] Failed to mute microphone: ${err.message}`);
        });
        setIsMuted(true);
      }
      
      // 🔴 Keep Tavus listening disabled (should already be disabled from welcome-intro)
      if (dailyEventManagerRef.current) {
        dailyEventManagerRef.current.disableListening();
        addDebugLog('[MODULE-LOCK] 🔇 Keeping Tavus listening disabled for founder video');
      }
      
      // Use the video tool mechanism to play the founder video
      // Store video URL in pendingDemoVideoRef - this will trigger the useEffect that plays videos
      // The useEffect at line 1086 has special handling for founder-video to play immediately
      addDebugLog(`[MODULE-LOCK] 🎬 Queuing founder video for playback: ${founderVideoUrl}`);
      pendingDemoVideoRef.current = founderVideoUrl;
      addDebugLog('[MODULE-LOCK] ✅ Founder video queued - useEffect will play it immediately');
      
      // Send announcement message (non-blocking, don't wait for it)
      if (prompt) {
        currentModulePromptRef.current = prompt;
        // Send announcement in background
        setTimeout(() => {
          if (mountedRef.current) {
            addDebugLog(`[MODULE-LOCK] Sending founder video announcement as ECHO`);
            sendMessageToReplica(prompt, 'echo');
          }
        }, 100);
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
  }, [personaId, quizState.isActive, sendMessageToReplica, setQuizState, setActiveModule, setTranscripts, isModuleUnlocked]);
  
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
            {/* YouTube iframe or regular video element */}
            {isYouTube && youTubeEmbedUrl ? (
              <iframe
                src={youTubeEmbedUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="Demo Video"
                onError={(e) => {
                  log('ERROR', '❌ YouTube iframe error', { error: e, url: youTubeEmbedUrl });
                }}
                onLoad={() => {
                  log('DEMO', '✅ YouTube iframe loaded successfully', { url: youTubeEmbedUrl });
                }}
              />
            ) : (
              <video
                ref={demoVideoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                onClick={() => stopDemoVideo()}
              />
            )}
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
          className="absolute top-4 left-4 z-30 p-2 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all shadow-lg"
          title={showLearningModules ? "Hide Contents" : "Show Contents"}
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Control buttons - bottom center */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/60 to-transparent z-30">
        <div className="flex items-center justify-center gap-3">
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

          {/* Expand/minimize */}
          <button
            onClick={handleExpand}
            className="p-3.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
          >
            {state === "maximized" ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
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
        {shouldShowLearningModules() && !isConnecting && !connectionError && !sessionTimedOut && hasLiveVideo && showLearningModules && !isDemoPlaying && !showCalendly && !showPdf && (
          persona.hasFeature('proactiveModuleFlow') ? (
            <EntriLearningModules
              onModuleSelect={handleModuleSelect}
              activeModule={activeModule}
              completedModules={completedModules}
              onClose={() => setShowLearningModules(false)}
            />
          ) : (
            <LearningModules
              onModuleSelect={handleModuleSelect}
              activeModule={activeModule}
              completedModules={completedModules}
              onClose={() => setShowLearningModules(false)}
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
        {!isConnecting && !connectionError && !sessionTimedOut && !isDemoPlaying && !showCalendly && !showPdf && !mcqQuizState.isActive && renderControlBar()}

        {/* MCQ Quiz Overlay - show when MCQ quiz is active */}
        {mcqQuizState.isActive && mcqQuizState.quizData && (
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
            onSkipQuiz={skipMcqQuiz}
            sidebarVisible={shouldShowLearningModules() && showLearningModules && !isConnecting && !connectionError && hasLiveVideo && !isDemoPlaying && !showCalendly && !showPdf}
            sidebarWidth={320}
          />
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
