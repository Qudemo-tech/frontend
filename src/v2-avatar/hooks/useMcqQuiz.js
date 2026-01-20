/**
 * useMcqQuiz - Custom hook for MCQ Quiz functionality
 *
 * Manages all MCQ quiz state, logic, and functions.
 * Quiz uses click-only answers for reliability (no voice commands).
 */

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Initial state for MCQ quiz
 */
const initialQuizState = {
  isActive: false,           // Whether MCQ quiz mode is active
  moduleId: null,            // Which module's quiz is running
  currentQuestionIndex: 0,   // Current question (0-based)
  selectedIndex: null,       // User's selected option for current question
  isAnswered: false,         // Whether current question has been answered
  isCorrect: false,          // Whether selected answer is correct
  score: { correct: 0, total: 0 }, // Running score
  quizData: null,            // Quiz configuration from moduleQuizzes.js
  waitingForAvatarToFinish: false, // Waiting for avatar to finish speaking
  speakingInstructions: false, // Flag: avatar is speaking quiz intro
  pendingNextQuestion: false, // Flag to ask next question when avatar finishes
  pendingQuizComplete: false, // Flag to complete quiz when avatar finishes
};

/**
 * useMcqQuiz hook
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.sendMessageToReplica - Function to send message to avatar
 * @param {Function} options.addDebugLog - Function to log debug messages
 * @param {Function} options.getModuleQuiz - Function to get quiz data for a module
 * @param {Array} options.moduleOrder - Array of module IDs in order
 * @param {Array} options.sectionEndingModules - Array of modules that end a section
 * @param {Object} options.moduleTransitionPrompts - Prompts for section transitions
 * @param {Function} options.setMicMuted - Function to mute/unmute microphone
 * @param {Function} options.setTavusListening - Function to enable/disable Tavus listening
 * @param {Function} options.resetInactivityTimeout - Function to reset inactivity timer
 * @param {Function} options.startInactivityTimeout - Function to start inactivity timer
 * @param {Object} options.refs - External refs that need to be updated
 * @param {Object} options.refs.pendingModuleTransitionRef - Ref for pending module transition
 * @param {Object} options.refs.waitingForSectionConfirmationRef - Ref for section confirmation
 * @param {Object} options.refs.pendingSectionTransitionRef - Ref for pending section transition
 * @param {Object} options.refs.listeningStateRef - Ref for listening state tracking
 */
const useMcqQuiz = ({
  sendMessageToReplica,
  addDebugLog,
  getModuleQuiz,
  moduleOrder,
  sectionEndingModules,
  moduleTransitionPrompts,
  setMicMuted,
  setTavusListening,
  resetInactivityTimeout,
  startInactivityTimeout,
  refs,
}) => {
  // Quiz state
  const [mcqQuizState, setMcqQuizState] = useState(initialQuizState);
  const mcqQuizStateRef = useRef(mcqQuizState);

  // Internal refs
  const pendingQuizDataRef = useRef(null);
  const askNextMcqQuestionRef = useRef(null);
  const completeMcqQuizRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    mcqQuizStateRef.current = mcqQuizState;
  }, [mcqQuizState]);

  /**
   * Reset quiz state to initial values
   */
  const resetQuizState = useCallback(() => {
    setMcqQuizState(initialQuizState);
    mcqQuizStateRef.current = initialQuizState;
    pendingQuizDataRef.current = null;
  }, []);

  /**
   * Start MCQ quiz for a module
   * First speaks instructions, then shows quiz panel when avatar finishes
   */
  const startMcqQuiz = useCallback((moduleId) => {
    const quizData = getModuleQuiz(moduleId);
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
      addDebugLog(`[MCQ-QUIZ] No quiz found for module: ${moduleId}`);
      return false;
    }

    addDebugLog(`[MCQ-QUIZ] Starting quiz for module: ${moduleId} with ${quizData.questions.length} questions`);
    addDebugLog(`[MCQ-QUIZ] Step 1: Speaking quiz instructions first...`);

    if (!quizData.intro || quizData.intro.trim() === '') {
      addDebugLog(`[MCQ-QUIZ] ⚠️ Quiz intro is empty or missing`);
    }

    // Store quiz data for later activation
    pendingQuizDataRef.current = { moduleId, quizData };

    // MUTE microphone during quiz - click-only answers for reliability
    setMicMuted(true);
    addDebugLog('[MCQ-QUIZ] 🔇 Muting mic (quiz is click-only)');

    // Disable Tavus listening during quiz
    setTavusListening(false);
    if (refs.listeningStateRef) {
      refs.listeningStateRef.current = 'disabled';
    }
    addDebugLog('[MCQ-QUIZ] Muted mic and disabled Tavus listening (click-only quiz)');

    // Create the new quiz state
    const newQuizState = {
      ...initialQuizState,
      moduleId: moduleId,
      quizData: quizData,
      waitingForAvatarToFinish: true,
      speakingInstructions: true,
    };

    // Update ref IMMEDIATELY (synchronously) before sending message
    mcqQuizStateRef.current = newQuizState;
    addDebugLog(`[MCQ-QUIZ] Set speakingInstructions=true in ref (synchronous)`);

    // Update React state for UI
    setMcqQuizState(newQuizState);

    // Speak the quiz instructions
    sendMessageToReplica(quizData.intro, 'echo');
    return true;
  }, [addDebugLog, sendMessageToReplica, getModuleQuiz, setMicMuted, setTavusListening, refs]);

  /**
   * Activate quiz panel and ask first question
   * Called when avatar finishes speaking instructions
   */
  const activateQuizPanel = useCallback(() => {
    const pending = pendingQuizDataRef.current;
    if (!pending) {
      addDebugLog('[MCQ-QUIZ] No pending quiz data to activate');
      return;
    }

    const { moduleId, quizData } = pending;
    pendingQuizDataRef.current = null;

    addDebugLog(`[MCQ-QUIZ] Step 2: Activating quiz panel and asking first question`);

    // Activate the quiz panel
    const activeState = {
      ...initialQuizState,
      isActive: true,
      moduleId: moduleId,
      quizData: quizData,
      waitingForAvatarToFinish: true,
      speakingInstructions: false,
    };

    mcqQuizStateRef.current = activeState;
    setMcqQuizState(activeState);

    // Ask the first question
    const firstQuestion = quizData.questions[0];
    const questionMessage = `Question 1: ${firstQuestion.question} Your options are: A: ${firstQuestion.options[0]}. B: ${firstQuestion.options[1]}. C: ${firstQuestion.options[2]}. D: ${firstQuestion.options[3]}.`;

    sendMessageToReplica(questionMessage, 'echo');
  }, [addDebugLog, sendMessageToReplica]);

  /**
   * Ask the next MCQ question
   */
  const askNextMcqQuestion = useCallback(() => {
    setMcqQuizState(prev => {
      if (!prev.quizData || !prev.quizData.questions) {
        return prev;
      }

      const nextIndex = prev.currentQuestionIndex + 1;
      const nextQuestion = prev.quizData.questions[nextIndex];

      if (!nextQuestion) {
        return prev;
      }

      const questionMessage = `Question ${nextIndex + 1}: ${nextQuestion.question} Your options are: A: ${nextQuestion.options[0]}. B: ${nextQuestion.options[1]}. C: ${nextQuestion.options[2]}. D: ${nextQuestion.options[3]}.`;
      sendMessageToReplica(questionMessage, 'echo');

      return {
        ...prev,
        currentQuestionIndex: nextIndex,
        selectedIndex: null,
        isAnswered: false,
        isCorrect: false,
        waitingForAvatarToFinish: true,
        pendingNextQuestion: false,
      };
    });
  }, [sendMessageToReplica]);

  /**
   * Complete the MCQ quiz
   */
  const completeMcqQuiz = useCallback(() => {
    const state = mcqQuizStateRef.current;
    const { score, quizData, moduleId } = state;

    if (!quizData) {
      addDebugLog('[MCQ-QUIZ] completeMcqQuiz called but quizData is null - quiz was ended');
      return;
    }

    const passed = quizData.passingScore ? score.correct >= quizData.passingScore : true;

    addDebugLog(`[MCQ-QUIZ] Quiz complete for ${moduleId} - Score: ${score.correct}/${score.total}, Passed: ${passed}`);

    // Build completion message
    let completionMessage = quizData.completionMessage || "You've completed the quiz!";
    completionMessage += ` You scored ${score.correct} out of ${score.total}.`;

    if (!passed && quizData.passingScore) {
      completionMessage += ` You needed ${quizData.passingScore} correct answers to pass. Don't worry, the important thing is that you're learning!`;
    }

    // Determine next module
    const currentIndex = moduleOrder.indexOf(moduleId);
    const nextModuleId = (currentIndex >= 0 && currentIndex < moduleOrder.length - 1)
      ? moduleOrder[currentIndex + 1]
      : null;

    // Check if section-ending
    const isSectionEnding = sectionEndingModules.includes(moduleId);

    if (isSectionEnding && nextModuleId) {
      addDebugLog(`[MCQ-QUIZ] ${moduleId} is section-ending - will wait for confirmation before ${nextModuleId}`);

      const transitionPrompt = moduleTransitionPrompts[moduleId];
      if (transitionPrompt) {
        completionMessage += ` ... ${transitionPrompt}`;
      }

      // Enable listening for user confirmation
      setTavusListening(true);
      if (refs.listeningStateRef) {
        refs.listeningStateRef.current = 'enabled';
      }
      addDebugLog('[MCQ-QUIZ] 🎤 Enabled listening for section transition confirmation');

      // Unmute microphone after quiz
      setMicMuted(false);

      // Set up waiting for confirmation
      if (refs.waitingForSectionConfirmationRef) {
        refs.waitingForSectionConfirmationRef.current = true;
      }
      if (refs.pendingSectionTransitionRef) {
        refs.pendingSectionTransitionRef.current = nextModuleId;
      }

      // Start inactivity timeout
      if (startInactivityTimeout) {
        startInactivityTimeout();
      }
    } else if (nextModuleId) {
      addDebugLog(`[MCQ-QUIZ] Setting pending module transition to: ${nextModuleId}`);
      if (refs.pendingModuleTransitionRef) {
        refs.pendingModuleTransitionRef.current = nextModuleId;
      }
    }

    // Send completion message
    sendMessageToReplica(completionMessage, 'echo');

    // Reset quiz state
    resetQuizState();
  }, [addDebugLog, sendMessageToReplica, moduleOrder, sectionEndingModules, moduleTransitionPrompts, setMicMuted, setTavusListening, startInactivityTimeout, refs, resetQuizState]);

  // Update refs for use in callbacks
  askNextMcqQuestionRef.current = askNextMcqQuestion;
  completeMcqQuizRef.current = completeMcqQuiz;

  /**
   * Handle MCQ option selection
   */
  const handleMcqSelect = useCallback((selectedIndex) => {
    const state = mcqQuizStateRef.current;
    if (!state.isActive || state.isAnswered || state.waitingForAvatarToFinish) {
      addDebugLog(`[MCQ-QUIZ] Selection ignored - isActive: ${state.isActive}, isAnswered: ${state.isAnswered}, waiting: ${state.waitingForAvatarToFinish}`);
      return;
    }

    if (!state.quizData || !state.quizData.questions) {
      addDebugLog('[MCQ-QUIZ] Selection ignored - quizData is null');
      return;
    }

    // Reset inactivity timeout
    if (resetInactivityTimeout) {
      resetInactivityTimeout();
    }

    const currentQuestion = state.quizData.questions[state.currentQuestionIndex];
    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    const optionLabels = ['A', 'B', 'C', 'D'];

    addDebugLog(`[MCQ-QUIZ] User selected option ${optionLabels[selectedIndex]}: "${currentQuestion.options[selectedIndex]}" - ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

    const isLastQuestion = state.currentQuestionIndex >= state.quizData.questions.length - 1;

    // Update state
    setMcqQuizState(prev => ({
      ...prev,
      selectedIndex: selectedIndex,
      isAnswered: true,
      isCorrect: isCorrect,
      score: {
        correct: prev.score.correct + (isCorrect ? 1 : 0),
        total: prev.score.total + 1,
      },
      waitingForAvatarToFinish: true,
      pendingNextQuestion: !isLastQuestion,
      pendingQuizComplete: isLastQuestion,
    }));

    // Build feedback message
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

    sendMessageToReplica(feedbackMessage, 'echo');

    // Calculate estimated speaking time and schedule next action
    const estimatedSpeakingTime = Math.ceil((feedbackMessage.length / 15) * 1000) + 500;
    addDebugLog(`[MCQ-QUIZ] Estimated speaking time: ${estimatedSpeakingTime}ms`);

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
  }, [addDebugLog, sendMessageToReplica, resetInactivityTimeout]);

  /**
   * Skip/End the entire MCQ quiz
   */
  const skipMcqQuiz = useCallback(() => {
    const state = mcqQuizStateRef.current;
    if (!state.isActive) return;

    addDebugLog(`[MCQ-QUIZ] Quiz skipped for module: ${state.moduleId}`);

    // Determine next module
    const currentIndex = moduleOrder.indexOf(state.moduleId);
    const nextModuleId = (currentIndex >= 0 && currentIndex < moduleOrder.length - 1)
      ? moduleOrder[currentIndex + 1]
      : null;

    if (nextModuleId && refs.pendingModuleTransitionRef) {
      addDebugLog(`[MCQ-QUIZ] Setting pending module transition to: ${nextModuleId}`);
      refs.pendingModuleTransitionRef.current = nextModuleId;
    }

    sendMessageToReplica("Okay, let's skip the quiz and move on to the next topic.", 'echo');

    resetQuizState();
  }, [addDebugLog, sendMessageToReplica, moduleOrder, refs, resetQuizState]);

  /**
   * Skip current question and move to next
   */
  const skipMcqQuestion = useCallback(() => {
    const state = mcqQuizStateRef.current;
    if (!state.isActive || !state.quizData || !state.quizData.questions || state.waitingForAvatarToFinish) return;

    addDebugLog(`[MCQ-QUIZ] Skipping question ${state.currentQuestionIndex + 1}`);

    const isLastQuestion = state.currentQuestionIndex >= state.quizData.questions.length - 1;

    if (isLastQuestion) {
      addDebugLog('[MCQ-QUIZ] Last question skipped - completing quiz');
      sendMessageToReplica("Skipping this question. Let me give you your final results.", 'echo');

      setMcqQuizState(prev => ({
        ...prev,
        waitingForAvatarToFinish: true,
        pendingQuizComplete: true,
      }));
    } else {
      const nextIndex = state.currentQuestionIndex + 1;
      const nextQuestion = state.quizData.questions[nextIndex];
      const questionMessage = `Skipping this one. Question ${nextIndex + 1}: ${nextQuestion.question} Your options are: A: ${nextQuestion.options[0]}. B: ${nextQuestion.options[1]}. C: ${nextQuestion.options[2]}. D: ${nextQuestion.options[3]}.`;

      const newState = {
        ...mcqQuizStateRef.current,
        currentQuestionIndex: nextIndex,
        selectedIndex: null,
        isAnswered: false,
        isCorrect: false,
        waitingForAvatarToFinish: true,
      };

      mcqQuizStateRef.current = newState;
      setMcqQuizState(newState);

      sendMessageToReplica(questionMessage, 'echo');
    }
  }, [addDebugLog, sendMessageToReplica]);

  /**
   * Repeat current question
   */
  const repeatMcqQuestion = useCallback(() => {
    const state = mcqQuizStateRef.current;
    if (!state.isActive || !state.quizData || !state.quizData.questions || state.waitingForAvatarToFinish) {
      addDebugLog(`[MCQ-QUIZ] ⚠️ repeatMcqQuestion blocked - isActive: ${state.isActive}, hasQuizData: ${!!state.quizData}, waitingForAvatar: ${state.waitingForAvatarToFinish}`);
      return;
    }

    // Ensure Tavus listening stays disabled
    setTavusListening(false);
    if (refs.listeningStateRef) {
      refs.listeningStateRef.current = 'disabled';
    }
    addDebugLog('[MCQ-QUIZ] 🔇 Confirmed Tavus listening disabled in repeatMcqQuestion');

    const currentQuestion = state.quizData.questions[state.currentQuestionIndex];
    const questionMessage = `Let me repeat that. Question ${state.currentQuestionIndex + 1}: ${currentQuestion.question} Your options are: A: ${currentQuestion.options[0]}. B: ${currentQuestion.options[1]}. C: ${currentQuestion.options[2]}. D: ${currentQuestion.options[3]}.`;

    setMcqQuizState(prev => ({
      ...prev,
      waitingForAvatarToFinish: true,
    }));
    mcqQuizStateRef.current.waitingForAvatarToFinish = true;

    sendMessageToReplica(questionMessage, 'echo');
    addDebugLog(`[MCQ-QUIZ] Repeated question ${state.currentQuestionIndex + 1}`);
  }, [sendMessageToReplica, addDebugLog, setTavusListening, refs]);

  /**
   * Enable selection after avatar finishes speaking
   */
  const enableMcqSelection = useCallback(() => {
    setMcqQuizState(prev => ({
      ...prev,
      waitingForAvatarToFinish: false,
    }));
    addDebugLog('[MCQ-QUIZ] Selection enabled - avatar finished speaking');
  }, [addDebugLog]);

  /**
   * Handle avatar stop speaking event for quiz flow
   * Returns true if quiz handled the event, false otherwise
   */
  const handleAvatarStopSpeaking = useCallback((interrupted) => {
    const state = mcqQuizStateRef.current;

    // Handle instructions phase
    if (state.speakingInstructions && interrupted) {
      addDebugLog('[MCQ-QUIZ] Ignoring interrupted event during instructions phase');
      return true;
    }

    if (state.speakingInstructions && pendingQuizDataRef.current) {
      addDebugLog('[MCQ-QUIZ] Avatar finished speaking instructions - now activating quiz panel');
      activateQuizPanel();
      return true;
    }

    // Handle active quiz
    if (state.isActive) {
      addDebugLog(`[MCQ-QUIZ] Avatar stopped speaking during quiz - pendingNextQuestion: ${state.pendingNextQuestion}, pendingQuizComplete: ${state.pendingQuizComplete}`);

      if (state.waitingForAvatarToFinish && (state.pendingNextQuestion || state.pendingQuizComplete)) {
        addDebugLog('[MCQ-QUIZ] Avatar finished feedback - clearing flags (advancement handled by timeout)');
        setMcqQuizState(prev => ({
          ...prev,
          waitingForAvatarToFinish: false,
          pendingNextQuestion: false,
          pendingQuizComplete: false,
        }));
        return true;
      }

      // Enable selection when avatar finishes speaking question
      if (state.waitingForAvatarToFinish) {
        addDebugLog('[MCQ-QUIZ] Avatar finished speaking question - enabling selection');
        enableMcqSelection();

        // Keep Tavus listening disabled during quiz
        setTavusListening(false);
        if (refs.listeningStateRef) {
          refs.listeningStateRef.current = 'disabled';
        }
        return true;
      }

      return true; // Quiz is active, handled
    }

    return false; // Quiz didn't handle this event
  }, [addDebugLog, activateQuizPanel, enableMcqSelection, setTavusListening, refs]);

  /**
   * Check if quiz should block a respond message
   */
  const shouldBlockRespondMessage = useCallback(() => {
    const state = mcqQuizStateRef.current;
    return state.isActive || state.speakingInstructions;
  }, []);

  /**
   * Check if quiz is active (including instruction phase)
   */
  const isQuizActive = useCallback(() => {
    const state = mcqQuizStateRef.current;
    return state.isActive || state.speakingInstructions;
  }, []);

  return {
    // State
    mcqQuizState,
    mcqQuizStateRef,

    // Actions
    startMcqQuiz,
    handleMcqSelect,
    skipMcqQuiz,
    skipMcqQuestion,
    repeatMcqQuestion,
    resetQuizState,

    // Event handlers
    handleAvatarStopSpeaking,

    // Helpers
    shouldBlockRespondMessage,
    isQuizActive,

    // For external ref updates
    pendingQuizDataRef,
  };
};

export default useMcqQuiz;
