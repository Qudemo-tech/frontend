import { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
import { getApiUrl, getCreateConversationUrl, getEndConversationUrl } from '../config/api';
import { useEventLogger } from '../hooks/useEventLogger';
import { useDemoVideo } from '../hooks/useDemoVideo';
import TavusSessionManager from '../utils/TavusSessionManager';
import DailyEventManager from '../utils/DailyEventManager';
import LearningModules from './LearningModules';

/**
 * TavusAvatarWidget - Tavus CVI avatar widget using Daily.co
 *
 * Adapted from MobileAvatarWidget for Tavus/Daily.co instead of HeyGen/LiveKit
 */
export const TavusAvatarWidget = ({ onDisconnect, autoExpand = true, onExpand, personaId } = {}) => {
  console.log('[TAVUS-WIDGET] TavusAvatarWidget rendering - autoExpand:', autoExpand, 'personaId:', personaId, 'hasOnExpand:', !!onExpand);

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
  
  // Learning modules state
  const [activeModule, setActiveModule] = useState(null);
  const [completedModules, setCompletedModules] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showLearningModules, setShowLearningModules] = useState(true);
  
  // Quiz state - for conversation-based quiz
  const [quizState, setQuizState] = useState({
    isActive: false,
    currentQuestionIndex: 0,
    questions: [
      {
        question: "What is natural selection?",
        correctAnswer: "natural selection",
        keywords: ["natural selection", "survival", "fittest", "adaptation", "better at surviving"]
      },
      {
        question: "What is genetic drift?",
        correctAnswer: "genetic drift",
        keywords: ["genetic drift", "random", "chance", "population", "random chance"]
      },
      {
        question: "What does the fossil record show us?",
        correctAnswer: "fossil record",
        keywords: ["fossil", "evidence", "evolution", "history", "fossil record", "millions of years"]
      },
      {
        question: "How long did human evolution take?",
        correctAnswer: "millions of years",
        keywords: ["millions", "years", "long time", "evolution", "millions of years"]
      }
    ],
    score: 0,
    waitingForAnswer: false,
    lastQuestionAsked: null
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
  const isUserSpeakingRef = useRef(false); // Ref for user speaking state
  const isAvatarSpeakingRef = useRef(false); // Ref for avatar speaking state

  // Session manager and event manager refs
  const sessionManagerRef = useRef(null);
  const dailyEventManagerRef = useRef(null);
  const sessionInfoRef = useRef(null);

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
    // Clear any existing timeout
    if (proactiveTimeoutRef.current) {
      clearTimeout(proactiveTimeoutRef.current);
      proactiveTimeoutRef.current = null;
    }

    // Set timeout for 5 seconds
    proactiveTimeoutRef.current = setTimeout(() => {
      // Check if user hasn't spoken and avatar isn't speaking (use refs for current values)
      if (!isUserSpeakingRef.current && !isAvatarSpeakingRef.current && dailyEventManagerRef.current) {
        addDebugLog('[PROACTIVE] 5 seconds passed, triggering continuation');
        // Send a message to trigger proactive continuation
        // Using respond message to trigger LLM to continue conversation
        dailyEventManagerRef.current.sendRespondMessage("Continue the conversation naturally with a related topic or question.");
      }
      proactiveTimeoutRef.current = null;
    }, 5000);
  }, [addDebugLog]);

  // Ref to track video playing state for callbacks
  const isDemoPlayingRef = useRef(false);

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
      setAvatarState("listening");
    },
    onVideoStop: () => {
      // Restore avatar audio when video stops
      addDebugLog('[DEMO] Restoring avatar audio after video playback');
      setAudioEnabled(true);
    },
  });

  // Update ref when isDemoPlaying changes
  useEffect(() => {
    isDemoPlayingRef.current = isDemoPlaying;
  }, [isDemoPlaying]);

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
        setIsAvatarSpeaking(true);
        isAvatarSpeakingRef.current = true;
        setAvatarState("speaking");
      },
      onReplicaStopSpeaking: (lastSpeech, interrupted) => {
        // Ignore avatar speech when video is playing
        if (isDemoPlayingRef.current) {
          addDebugLog('[DEMO] Ignoring avatar speech end - video is playing');
          return;
        }
        setIsAvatarSpeaking(false);
        isAvatarSpeakingRef.current = false;
        setAvatarState("listening");
        // Demo triggers are handled via tool calls in Tavus, no speech detection needed
        // Trigger proactive continuation after 5 seconds if user doesn't speak
        if (!interrupted) {
          triggerProactiveContinuation();
        }
      },
      onUserStartSpeaking: () => {
        // Ignore user speech when video is playing (mic is muted anyway)
        if (isDemoPlayingRef.current) {
          addDebugLog('[DEMO] Ignoring user speech - video is playing');
          return;
        }
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

  // Check if answer is correct (fuzzy matching)
  const checkAnswer = (userAnswer, correctAnswer, keywords) => {
    const userLower = userAnswer.toLowerCase().trim();
    const correctLower = correctAnswer.toLowerCase().trim();
    
    // Exact match
    if (userLower === correctLower) {
      return true;
    }
    
    // Check if answer contains keywords
    for (const keyword of keywords) {
      if (userLower.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    
    // Check if answer contains correct answer
    if (userLower.includes(correctLower) || correctLower.includes(userLower)) {
      return true;
    }
    
    return false;
  };

  // Handle user speech
  const handleUserSpeech = (text, source) => {
    if (!text) return;
    log('USER_SPEECH', `User said (${source})`, { text });
    
    // Check if we're in quiz mode and waiting for an answer
    if (quizState.isActive && quizState.waitingForAnswer && quizState.currentQuestionIndex < quizState.questions.length) {
      const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
      const isCorrect = checkAnswer(text, currentQuestion.correctAnswer, currentQuestion.keywords);
      
      // Update score
      const newScore = isCorrect ? quizState.score + 1 : quizState.score;
      
      // Send feedback to avatar
      if (isCorrect) {
        sendMessageToReplica(
          `Correct! Great answer! The student said: "${text}". ` +
          (quizState.currentQuestionIndex < quizState.questions.length - 1 
            ? `Now ask the next question: "${quizState.questions[quizState.currentQuestionIndex + 1].question}"`
            : `That was the last question! Tell the student they completed the quiz with a score of ${newScore} out of ${quizState.questions.length}.`)
        );
      } else {
        sendMessageToReplica(
          `The student answered: "${text}". That's not quite right. ` +
          `The answer relates to: ${currentQuestion.correctAnswer}. ` +
          `Provide a helpful hint and then ` +
          (quizState.currentQuestionIndex < quizState.questions.length - 1 
            ? `ask the next question: "${quizState.questions[quizState.currentQuestionIndex + 1].question}"`
            : `tell them that was the last question and they scored ${newScore} out of ${quizState.questions.length}.`)
        );
      }
      
      // Move to next question or complete quiz
      if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
        setQuizState(prev => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          score: newScore,
          waitingForAnswer: true,
          lastQuestionAsked: quizState.questions[quizState.currentQuestionIndex + 1].question
        }));
      } else {
        // Quiz completed
        const percentage = Math.round((newScore / quizState.questions.length) * 100);
        setQuizState(prev => ({
          ...prev,
          isActive: false,
          score: newScore,
          waitingForAnswer: false
        }));
        setCompletedModules(prev => [...prev, 'final-quiz']);
        setShowLearningModules(true);
        
        sendMessageToReplica(
          `Quiz complete! The student scored ${newScore} out of ${quizState.questions.length} (${percentage}%). ` +
          `${percentage >= 70 ? 'Excellent work! They understand the concepts well.' : 'Good effort! They can review the topics to improve.'} ` +
          `Congratulate them and ask if they have any other questions about human evolution.`
        );
      }
      
      return; // Don't process as regular speech during quiz
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
  const handleReplicaSpeech = (text, source) => {
    if (!text) return;
    log('REPLICA_SPEECH', `Replica said (${source})`, { text });
    
    // Check if avatar finished speaking about a module topic
    // Mark module as completed when avatar finishes explaining
    if (activeModule && !completedModules.includes(activeModule)) {
      // Check if avatar's speech indicates completion of topic
      const completionIndicators = [
        'does that make sense',
        'any questions',
        'what would you like to know',
        'let\'s discuss another',
        'what else interests you',
        'questions do you have'
      ];
      
      const lowerText = text.toLowerCase();
      const indicatesCompletion = completionIndicators.some(indicator => 
        lowerText.includes(indicator)
      );
      
      // Mark as completed after avatar finishes speaking
      if (indicatesCompletion) {
        // Use a ref to track if we've already scheduled completion
        const moduleId = activeModule;
        setTimeout(() => {
          if (!completedModules.includes(moduleId)) {
            setCompletedModules(prev => [...prev, moduleId]);
            // Don't clear activeModule here - let user continue or select next
          }
        }, 2000);
      }
    }
    
    // Check for quiz question detection
    if (quizState.isActive) {
      handleReplicaSpeechForQuiz(text);
    }
    
    // Update transcripts: keep the last user question and add/update current avatar response
    // Only show current conversation: last user question + current avatar response
    setTranscripts((prev) => {
      // Find the last user question (should be the most recent one)
      const lastUser = prev.filter(t => t.type === 'user_speech').slice(-1);
      // Keep only: last user question + current avatar response
      return [
        ...lastUser,
        {
          type: "avatar_speech",
          text: text,
          timestamp: Date.now(),
        },
      ];
    });
    lastAvatarSpeechRef.current = text;
    detectIntent(text, { text }, "avatar");
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
  useEffect(() => {
    if (pendingDemoVideoRef.current && !isAvatarSpeaking && !isUserSpeaking) {
      const videoUrl = pendingDemoVideoRef.current;
      log('DEMO', 'Both user and replica finished speaking - playing video now');

      // Save current state for restoration later
      preDemoWidgetStateRef.current = state;

      // Maximize if not already, then play
      // Note: Avatar audio will be muted by onVideoStart callback in useDemoVideo
      if (state !== "maximized") {
        setState("maximized");
        setTimeout(() => {
          playDemoVideo(videoUrl);
        }, 300);
      } else {
        playDemoVideo(videoUrl);
      }

      pendingDemoVideoRef.current = null;
    }
  }, [isAvatarSpeaking, isUserSpeaking, state, log, playDemoVideo]);

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

  // Component lifecycle
  useEffect(() => {
    console.log('[TAVUS-LIFECYCLE] Component mounted');
    mountedRef.current = true;
    addDebugLog('[LIFECYCLE] Component MOUNTED');

    const handlePageUnload = () => {
      addDebugLog('[PAGE-UNLOAD] handlePageUnload triggered');

      // End conversation via sendBeacon
      const currentSessionInfo = sessionInfoRef.current;
      if (currentSessionInfo?.conversationId) {
        const payload = JSON.stringify({
          conversationId: currentSessionInfo.conversationId,
        });
        navigator.sendBeacon(
          getEndConversationUrl(),
          new Blob([payload], { type: 'application/json' })
        );
      }

      // Cleanup session manager
      if (sessionManagerRef.current) {
        sessionManagerRef.current.cleanup();
      }

      // Cleanup event manager
      if (dailyEventManagerRef.current) {
        dailyEventManagerRef.current.detachFromDaily();
      }
    };

    window.addEventListener('beforeunload', handlePageUnload);
    window.addEventListener('pagehide', handlePageUnload);

    return () => {
      addDebugLog('[LIFECYCLE] Component UNMOUNTING');
      mountedRef.current = false;

      window.removeEventListener('beforeunload', handlePageUnload);
      window.removeEventListener('pagehide', handlePageUnload);

      // Cleanup
      if (sessionInfoRef.current?.conversationId) {
        endConversation(sessionInfoRef.current.conversationId);
      }

      if (sessionManagerRef.current) {
        sessionManagerRef.current.cleanup();
      }

      if (dailyEventManagerRef.current) {
        dailyEventManagerRef.current.detachFromDaily();
      }

      // Clear proactive timeout
      if (proactiveTimeoutRef.current) {
        clearTimeout(proactiveTimeoutRef.current);
        proactiveTimeoutRef.current = null;
      }
    };
  }, []);

  // End Tavus conversation
  const endConversation = async (conversationId) => {
    if (!conversationId) return;

    try {
      addDebugLog(`[END-CONVERSATION] Ending conversation: ${conversationId}`);
      const response = await fetch(getEndConversationUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (response.ok) {
        addDebugLog('[END-CONVERSATION] Conversation ended successfully');
      } else {
        addDebugLog(`[END-CONVERSATION] Failed: ${response.status}`);
      }
    } catch (error) {
      addDebugLog(`[END-CONVERSATION] Error: ${error.message}`);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    addDebugLog('[DISCONNECT] handleDisconnect called');

    // End Tavus conversation
    if (sessionInfo?.conversationId) {
      await endConversation(sessionInfo.conversationId);
    }

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

    // Cleanup session manager
    if (sessionManagerRef.current) {
      addDebugLog('[DISCONNECT] Cleaning up TavusSessionManager');
      await sessionManagerRef.current.cleanup();
    }

    // Cleanup event manager
    if (dailyEventManagerRef.current) {
      dailyEventManagerRef.current.detachFromDaily();
    }

    // Reset state
    setSessionInfo(null);
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
    console.log('[START-SESSION] Called - isConnecting:', isConnecting);

    if (isConnecting || sessionManagerRef.current?.isInitialized) {
      console.log('[START-SESSION] Aborting - already connecting or session exists');
      return;
    }

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
          setAvatarState("speaking");
        },
        onReplicaStopSpeaking: () => {
          // Ignore avatar speech when video is playing
          if (isDemoPlayingRef.current) {
            log('DEMO', 'Ignoring avatar speech end - video is playing');
            return;
          }
          setIsAvatarSpeaking(false);
          setAvatarState("listening");
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
          handleUserSpeech(text, source);
        },
        onReplicaTranscript: (text, source) => {
          if (isDemoPlayingRef.current) {
            log('DEMO', 'Ignoring avatar transcript - video is playing');
            return;
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

      // Step 4: Wait for session to be ready
      addDebugLog('Waiting for session to be ready...');
      await sessionManagerRef.current.waitForReady();

      setHasLiveVideo(sessionManagerRef.current.hasVideoTrack());
      setHasAudio(sessionManagerRef.current.hasAudioTrack());
      setIsConnecting(false);
      addDebugLog('Session fully ready!');

      // Step 5: Auto-enable microphone
      setTimeout(async () => {
        if (mountedRef.current && sessionManagerRef.current?.isInitialized) {
          addDebugLog('Auto-enabling microphone...');
          try {
            await sessionManagerRef.current.enableMicrophone();
            setIsMuted(false);
            addDebugLog('Microphone enabled!');
          } catch (e) {
            addDebugLog(`Mic failed: ${e.message}`);
            setIsMuted(true);
          }
        }
      }, 1500);

    } catch (err) {
      const errorMsg = err.message || 'Failed to connect. Please try again.';
      addDebugLog(`ERROR: ${errorMsg}`);
      setConnectionError(errorMsg);
      setIsConnecting(false);
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

  // Send message to replica
  const sendMessageToReplica = (message, type = 'respond') => {
    if (!dailyEventManagerRef.current) return;

    if (type === 'echo') {
      dailyEventManagerRef.current.sendEchoMessage(message);
    } else {
      dailyEventManagerRef.current.sendRespondMessage(message);
    }
  };

  // Handle learning module selection
  const handleModuleSelect = (moduleId) => {
    setActiveModule(moduleId);
    
    // Clear any existing transcripts when selecting a new module
    setTranscripts([]);
    
    // Module-specific prompts for the avatar
    const modulePrompts = {
      'natural-selection': "Let's discuss natural selection! This is how living things change over time. Animals that are better at surviving pass on their traits to their babies. Can you think of an example of natural selection?",
      'genetic-drift': "Great! Let's explore genetic drift. This happens when random chance affects which traits get passed down in a population. It's like flipping a coin - sometimes you get heads, sometimes tails. What questions do you have about genetic drift?",
      'fossil-record': "Excellent choice! The fossil record shows us evidence of evolution over millions of years. Fossils are like nature's history book. What would you like to know about fossils?",
      'final-quiz': "Perfect! It's time for the final quiz. I'll ask you a few questions to see how much you've learned. Are you ready to begin?"
    };

    const prompt = modulePrompts[moduleId];
    
    if (moduleId === 'final-quiz') {
      // Define quiz questions
      const quizQuestions = [
        {
          question: "What is natural selection?",
          correctAnswer: "natural selection",
          keywords: ["natural selection", "survival", "fittest", "adaptation", "better at surviving"]
        },
        {
          question: "What is genetic drift?",
          correctAnswer: "genetic drift",
          keywords: ["genetic drift", "random", "chance", "population", "random chance"]
        },
        {
          question: "What does the fossil record show us?",
          correctAnswer: "fossil record",
          keywords: ["fossil", "evidence", "evolution", "history", "fossil record", "millions of years"]
        },
        {
          question: "How long did human evolution take?",
          correctAnswer: "millions of years",
          keywords: ["millions", "years", "long time", "evolution", "millions of years"]
        }
      ];
      
      // Initialize quiz state
      setQuizState({
        isActive: true,
        currentQuestionIndex: 0,
        questions: quizQuestions,
        score: 0,
        waitingForAnswer: false,
        lastQuestionAsked: null
      });
      
      // Send message to avatar to start quiz with first question
      const firstQuestion = quizQuestions[0].question;
      sendMessageToReplica(
        `${prompt} Now ask the first question: "${firstQuestion}" Wait for the student to answer by speaking, then check if their answer is correct and provide feedback before asking the next question.`
      );
      
      // Set waiting for answer after avatar finishes speaking (detected via transcript)
    } else {
      // Send message to avatar to discuss the topic
      if (prompt) {
        sendMessageToReplica(prompt);
      }
      // Mark module as completed after avatar finishes (handled via transcript)
    }
  };

  // Handle replica speech - detect when avatar asks quiz questions
  const handleReplicaSpeechForQuiz = (text) => {
    if (!quizState.isActive) return;
    
    const lowerText = text.toLowerCase();
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    
    if (!currentQuestion) return;
    
    // Check if avatar is asking the current quiz question
    // Look for question keywords or the question text itself
    const questionKeywords = currentQuestion.question.toLowerCase().split(' ').filter(w => w.length > 3);
    const isAskingQuestion = questionKeywords.some(keyword => lowerText.includes(keyword)) ||
                             lowerText.includes('?') && 
                             (lowerText.includes(currentQuestion.question.split(' ')[0].toLowerCase()) ||
                              lowerText.includes('what is') || lowerText.includes('how long'));
    
    if (isAskingQuestion && !quizState.waitingForAnswer) {
      // Avatar just asked the question, now wait for answer
      setQuizState(prev => ({
        ...prev,
        waitingForAnswer: true,
        lastQuestionAsked: currentQuestion.question
      }));
      log('QUIZ', `Avatar asked question ${quizState.currentQuestionIndex + 1}: ${currentQuestion.question}`);
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

  const renderVideoContainer = () => (
    <>
      {/* Main video container */}
      <div
        id="tavus-video-container"
        className="absolute inset-0 bg-black"
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
      {/* State indicators - top left */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
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

        {/* Learning Modules - show when connected and not in overlays */}
        {!isConnecting && !connectionError && hasLiveVideo && showLearningModules && !isDemoPlaying && !showCalendly && !showPdf && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-30">
            <LearningModules
              onModuleSelect={handleModuleSelect}
              activeModule={activeModule}
              completedModules={completedModules}
            />
          </div>
        )}

        {/* Quiz indicator - show when quiz is active (no popup, just indicator) */}
        {quizState.isActive && !isDemoPlaying && !showCalendly && !showPdf && (
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

        {/* Control bar - only show when connected and NOT in PIP mode (demo/calendly/pdf) */}
        {!isConnecting && !connectionError && !isDemoPlaying && !showCalendly && !showPdf && renderControlBar()}
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
