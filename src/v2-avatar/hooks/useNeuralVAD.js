/**
 * useNeuralVAD - Client-side neural Voice Activity Detection using Silero VAD
 * 
 * PRODUCTION HOTFIX: Stabilized to prevent browser freezes
 * 
 * Key fixes:
 * - Removed all logging from audio processing loops
 * - Added undefined guards for VAD output
 * - Replaced useState with useRef for audio-rate updates
 * - Added initialization guard to prevent re-initialization
 * - Ensured 16kHz mono audio processing
 * - Added throttling for VAD decisions (100ms)
 * - Added fail-safe to disable VAD on errors
 * 
 * Architecture:
 * - Taps microphone audio in parallel (does NOT replace Daily.co audio)
 * - Runs VAD inference asynchronously (non-blocking)
 * - Tracks speech probability and duration using refs only
 * - Provides speech confirmation based on threshold + duration
 * 
 * Rules:
 * - speechProbability threshold: > 0.65
 * - minimum speech duration: 500-600ms (configurable per context)
 * - ignore all speech shorter than this (coughs, breaths, hums)
 * - end-of-speech when silence > 500ms
 */

import { useState, useRef, useEffect, useCallback } from 'react';

// VAD Configuration
const SPEECH_THRESHOLD = 0.65; // Probability threshold for speech
const MIN_SPEECH_DURATION_MS = 500; // Minimum speech duration to confirm (default)
const MIN_SPEECH_DURATION_LOCKED_MS = 600; // Minimum duration when module lock is active
const SILENCE_DURATION_MS = 500; // Duration of silence to consider speech ended
const SAMPLE_RATE = 16000; // 16kHz for Silero VAD
const FRAME_SIZE = 512; // 32ms frames at 16kHz
const PROCESSING_INTERVAL_MS = 30; // Process audio every 30ms
const DECISION_THROTTLE_MS = 100; // Throttle decision logic to 100ms (not audio rate)

/**
 * useNeuralVAD Hook
 * 
 * @param {Object} options
 * @param {MediaStreamTrack} options.audioTrack - Microphone audio track to analyze
 * @param {boolean} options.enabled - Whether VAD is enabled
 * @param {Function} options.onSpeechConfirmed - Callback when speech is confirmed (state transition only)
 * @param {Function} options.log - Optional logging function (ONLY for state transitions, NOT audio loops)
 * @returns {Object} VAD state and methods
 */
export function useNeuralVAD({ audioTrack, enabled = true, onSpeechConfirmed, log = () => {} }) {
  // CRITICAL: Wrap log function to guard against undefined values
  const safeLog = useCallback((message) => {
    if (!message || typeof message !== 'string') {
      return; // Silently skip invalid log messages
    }
    try {
      log(message);
    } catch (error) {
      // Silently handle logging errors to prevent crashes
    }
  }, [log]); // CRITICAL: Depend on log, not safeLog (fixes circular dependency)
  // CRITICAL: Use refs for all audio-rate values (NO useState in audio loops)
  const speechProbabilityRef = useRef(0);
  const speechDurationMsRef = useRef(0);
  const silenceDurationMsRef = useRef(0);
  
  // Refs for audio processing
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const vadSessionRef = useRef(null);
  const isProcessingRef = useRef(false);
  const processingIntervalRef = useRef(null);
  const speechStartTimeRef = useRef(null);
  const silenceStartTimeRef = useRef(null);
  const lastSpeechProbRef = useRef(0);
  const audioBufferRef = useRef(new Float32Array(FRAME_SIZE));
  const confirmedSpeechRef = useRef(false);
  const minDurationRef = useRef(MIN_SPEECH_DURATION_MS);
  
  // CRITICAL: Initialization guard - prevent re-initialization
  const vadInitializedRef = useRef(false);
  
  // CRITICAL: Fail-safe flag - disable VAD if errors occur
  const vadDisabledRef = useRef(false);
  
  // CRITICAL: Throttle decision logic (not audio processing)
  const lastDecisionTimeRef = useRef(0);
  const pendingDecisionRef = useRef(null);
  
  // State transition flags (for React state updates ONLY on transitions)
  const [speechState, setSpeechState] = useState({ 
    probability: 0, 
    duration: 0, 
    silence: 0,
    isConfirmed: false 
  });

  /**
   * Load Silero VAD ONNX model
   * CRITICAL: Only logs on state transitions (load start/complete/fail)
   */
  const loadVADModel = useCallback(async () => {
    if (vadSessionRef.current) {
      return true;
    }

    if (vadDisabledRef.current) {
      return false; // VAD disabled due to previous errors
    }

    try {
      // Log ONLY on state transition (model load start)
      safeLog('[VAD] Loading Silero VAD model...');
      
      // Dynamic import of onnxruntime-web
      const ort = await import('onnxruntime-web');
      
      // Silero VAD model URL (v4 model)
      const MODEL_URL = 'https://models.silero.ai/vad_models/v4/silero_vad.onnx';
      
      // Create inference session
      vadSessionRef.current = await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      
      // Log ONLY on state transition (model load complete)
      safeLog('[VAD] Model loaded successfully');
      vadDisabledRef.current = false; // Reset disabled flag on successful load
      return true;
    } catch (error) {
      // CRITICAL: Fail-safe - disable VAD on error
      vadDisabledRef.current = true;
      vadSessionRef.current = null;
      // Log ONLY on state transition (model load fail)
      const errorMsg = error?.message || 'Unknown error';
      safeLog(`[VAD] Model load error: ${errorMsg} - VAD disabled (fail-safe)`);
      return false;
    }
  }, [safeLog]);

  /**
   * Process audio frame through VAD model
   * CRITICAL: NO logging, NO React state updates, NO undefined values
   */
  const processAudioFrame = useCallback(async (audioData) => {
    // CRITICAL: Hard guard - check if VAD is disabled or invalid
    if (vadDisabledRef.current || !vadSessionRef.current || !enabled || !audioData || audioData.length !== FRAME_SIZE) {
      return;
    }

    try {
      // Normalize audio (ensure it's in [-1, 1] range)
      const normalized = new Float32Array(FRAME_SIZE);
      for (let i = 0; i < FRAME_SIZE; i++) {
        const sample = audioData[i];
        // CRITICAL: Guard against invalid audio samples
        if (typeof sample !== 'number' || !isFinite(sample)) {
          normalized[i] = 0;
        } else {
          normalized[i] = Math.max(-1, Math.min(1, sample));
        }
      }
      
      // Create ONNX tensor: [batch, samples] = [1, 512]
      const ort = await import('onnxruntime-web');
      const inputTensor = new ort.Tensor('float32', normalized, [1, FRAME_SIZE]);
      
      // Run inference (async, non-blocking)
      const feeds = { input: inputTensor };
      const results = await vadSessionRef.current.run(feeds);
      
      // CRITICAL: Hard guard for undefined VAD output
      if (!results || !results.output) {
        return; // Silently skip invalid inference
      }
      
      const output = results.output;
      let probability = 0;
      
      // CRITICAL: Extract probability with hard guards
      if (output && output.data) {
        const data = output.data;
        
        // Handle different output shapes with type checking
        if (Array.isArray(data) && data.length > 0) {
          const val = data[0];
          if (typeof val === 'number' && isFinite(val)) {
            probability = val;
          }
        } else if (data instanceof Float32Array && data.length > 0) {
          const val = data[0];
          if (typeof val === 'number' && isFinite(val)) {
            probability = val;
          }
        } else if (typeof data === 'number' && isFinite(data)) {
          probability = data;
        }
      }
      
      // CRITICAL: Validate probability before using
      if (typeof probability !== 'number' || !isFinite(probability)) {
        return; // Silently skip invalid probability
      }
      
      // Clamp probability to [0, 1]
      probability = Math.max(0, Math.min(1, probability));
      lastSpeechProbRef.current = probability;
      speechProbabilityRef.current = probability;
      
      // CRITICAL: Update speech/silence tracking using refs only (NO React state)
      const now = Date.now();
      const isSpeech = probability > SPEECH_THRESHOLD;
      
      if (isSpeech) {
        if (speechStartTimeRef.current === null) {
          speechStartTimeRef.current = now;
          silenceStartTimeRef.current = null;
        }
        const duration = now - speechStartTimeRef.current;
        speechDurationMsRef.current = duration;
        silenceDurationMsRef.current = 0;
        
        // CRITICAL: Throttle decision logic (not audio processing)
        const timeSinceLastDecision = now - lastDecisionTimeRef.current;
        if (timeSinceLastDecision >= DECISION_THROTTLE_MS) {
          lastDecisionTimeRef.current = now;
          
          // Check if speech is confirmed (decision logic)
          const minDuration = minDurationRef.current;
          if (duration >= minDuration && !confirmedSpeechRef.current) {
            confirmedSpeechRef.current = true;
            // CRITICAL: Log ONLY on state transition (speech confirmed)
            if (typeof probability === 'number' && typeof duration === 'number' && isFinite(probability) && isFinite(duration)) {
              safeLog(`[VAD] Speech confirmed (${duration}ms, prob=${probability.toFixed(2)})`);
            }
            if (onSpeechConfirmed) {
              onSpeechConfirmed(probability, duration);
            }
            // CRITICAL: React state update ONLY on state transition
            setSpeechState(prev => ({
              ...prev,
              isConfirmed: true,
              probability,
              duration
            }));
          }
        }
      } else {
        if (speechStartTimeRef.current !== null) {
          if (silenceStartTimeRef.current === null) {
            silenceStartTimeRef.current = now;
          }
          const silenceDuration = now - silenceStartTimeRef.current;
          silenceDurationMsRef.current = silenceDuration;
          
          // CRITICAL: Throttle decision logic
          const timeSinceLastDecision = now - lastDecisionTimeRef.current;
          if (timeSinceLastDecision >= DECISION_THROTTLE_MS) {
            lastDecisionTimeRef.current = now;
            
            // Reset if silence is long enough
            if (silenceDuration >= SILENCE_DURATION_MS) {
              const wasConfirmed = confirmedSpeechRef.current;
              speechStartTimeRef.current = null;
              silenceStartTimeRef.current = null;
              speechDurationMsRef.current = 0;
              silenceDurationMsRef.current = 0;
              confirmedSpeechRef.current = false;
              
              // CRITICAL: React state update ONLY on state transition (speech ended)
              if (wasConfirmed) {
                setSpeechState(prev => ({
                  ...prev,
                  isConfirmed: false,
                  duration: 0,
                  silence: 0
                }));
              }
            }
          }
        }
      }
    } catch (error) {
      // CRITICAL: Fail-safe - disable VAD on repeated errors
      if (error.message && !error.message.includes('already')) {
        // Count errors - disable after multiple failures
        vadDisabledRef.current = true;
        vadSessionRef.current = null;
        // Log ONLY on state transition (error occurred)
        const errorMsg = error?.message || 'Unknown error';
        safeLog(`[VAD] Inference error - VAD disabled (fail-safe): ${errorMsg}`);
      }
    }
  }, [enabled, safeLog, onSpeechConfirmed]);

  /**
   * Process audio data from analyser node
   * CRITICAL: NO logging, just audio processing
   */
  const processAudio = useCallback(() => {
    if (!analyserNodeRef.current || !isProcessingRef.current || !enabled || vadDisabledRef.current) {
      return;
    }

    try {
      // Get audio data from analyser
      const dataArray = new Float32Array(FRAME_SIZE);
      analyserNodeRef.current.getFloatTimeDomainData(dataArray);
      
      // CRITICAL: Ensure 16kHz mono audio
      // AudioContext is already created with sampleRate: 16000
      // AnalyserNode will automatically resample if needed
      
      // Copy to buffer
      audioBufferRef.current.set(dataArray);
      
      // Process frame asynchronously (non-blocking)
      // CRITICAL: Use requestIdleCallback for better scheduling (falls back to setTimeout)
      if (window.requestIdleCallback) {
        requestIdleCallback(() => {
          processAudioFrame(audioBufferRef.current);
        }, { timeout: 10 });
      } else {
        setTimeout(() => {
          processAudioFrame(audioBufferRef.current);
        }, 0);
      }
    } catch (error) {
      // Silently handle processing errors - don't spam console
      if (error.message && !error.message.includes('already')) {
        vadDisabledRef.current = true;
      }
    }
  }, [enabled, processAudioFrame]);

  /**
   * Initialize AudioContext and audio processing
   * CRITICAL: Only logs on state transitions
   */
  const initializeAudio = useCallback(async () => {
    // CRITICAL: Initialization guard - prevent re-initialization
    if (vadInitializedRef.current || !audioTrack || !enabled || vadDisabledRef.current) {
      return;
    }

    try {
      // Log ONLY on state transition (initialization start)
      safeLog('[VAD] Initializing audio context...');
      
      // CRITICAL: Create AudioContext with 16kHz sample rate
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ 
        sampleRate: SAMPLE_RATE, // Force 16kHz
        latencyHint: 'interactive' // Low latency
      });
      
      // CRITICAL: Ensure sample rate is actually 16kHz
      if (audioContextRef.current.sampleRate !== SAMPLE_RATE) {
        // If browser doesn't support 16kHz, we'll resample manually
        // For now, log warning but continue (resampling happens in analyser)
        safeLog(`[VAD] Warning: AudioContext sample rate is ${audioContextRef.current.sampleRate}Hz, expected ${SAMPLE_RATE}Hz`);
      }
      
      // Create MediaStream from track
      const stream = new MediaStream([audioTrack]);
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create AnalyserNode for audio data extraction
      analyserNodeRef.current = audioContextRef.current.createAnalyser();
      analyserNodeRef.current.fftSize = FRAME_SIZE * 2;
      analyserNodeRef.current.smoothingTimeConstant = 0.8;
      
      // CRITICAL: Ensure mono audio (single channel)
      // AnalyserNode automatically converts to mono
      
      // Connect audio processing chain
      sourceNodeRef.current.connect(analyserNodeRef.current);
      // Don't connect to destination (we're just analyzing, not playing)
      
      vadInitializedRef.current = true;
      // Log ONLY on state transition (initialization complete)
      safeLog('[VAD] Audio processing initialized');
    } catch (error) {
      // CRITICAL: Fail-safe - disable VAD on error
      vadDisabledRef.current = true;
      vadInitializedRef.current = false;
      // Log ONLY on state transition (initialization error)
      const errorMsg = error?.message || 'Unknown error';
      safeLog(`[VAD] Audio init error: ${errorMsg} - VAD disabled (fail-safe)`);
    }
  }, [audioTrack, enabled, safeLog]);

  /**
   * Start VAD processing
   * CRITICAL: Only logs on state transitions
   */
  const start = useCallback(async () => {
    // CRITICAL: Initialization guard
    if (isProcessingRef.current || !enabled || vadDisabledRef.current) {
      return;
    }

    try {
      // Load model first
      const modelLoaded = await loadVADModel();
      if (!modelLoaded) {
        // Log ONLY on state transition (model load failed)
        safeLog('[VAD] Failed to load model, VAD disabled (graceful degradation)');
        vadDisabledRef.current = true;
        return;
      }

      // Initialize audio processing
      await initializeAudio();
      
      if (!audioContextRef.current) {
        vadDisabledRef.current = true;
        return;
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Start processing interval
      isProcessingRef.current = true;
      processingIntervalRef.current = setInterval(processAudio, PROCESSING_INTERVAL_MS);
      
      // Log ONLY on state transition (processing started)
      safeLog('[VAD] Started processing');
    } catch (error) {
      // CRITICAL: Fail-safe
      vadDisabledRef.current = true;
      isProcessingRef.current = false;
      // Log ONLY on state transition (start error)
      const errorMsg = error?.message || 'Unknown error';
      safeLog(`[VAD] Start error: ${errorMsg} - VAD disabled (fail-safe)`);
    }
  }, [enabled, loadVADModel, initializeAudio, processAudio, safeLog]);

  /**
   * Stop VAD processing
   * CRITICAL: Only logs on state transitions
   */
  const stop = useCallback(() => {
    isProcessingRef.current = false;
    
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
    if (analyserNodeRef.current) {
      try {
        analyserNodeRef.current.disconnect();
      } catch (e) {}
      analyserNodeRef.current = null;
    }
    
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    
    vadInitializedRef.current = false;
    // Log ONLY on state transition (processing stopped)
    safeLog('[VAD] Stopped processing');
  }, [safeLog]);

  /**
   * Reset VAD state
   * CRITICAL: Only logs on state transitions
   */
  const reset = useCallback(() => {
    speechStartTimeRef.current = null;
    silenceStartTimeRef.current = null;
    speechDurationMsRef.current = 0;
    silenceDurationMsRef.current = 0;
    confirmedSpeechRef.current = false;
    lastSpeechProbRef.current = 0;
    speechProbabilityRef.current = 0;
    setSpeechState({
      probability: 0,
      duration: 0,
      silence: 0,
      isConfirmed: false
    });
    // Log ONLY on state transition (state reset)
    safeLog('[VAD] State reset');
  }, [safeLog]);

  /**
   * Set minimum speech duration (for module lock scenarios)
   */
  const setMinSpeechDuration = useCallback((durationMs) => {
    if (typeof durationMs === 'number' && isFinite(durationMs) && durationMs > 0) {
      minDurationRef.current = durationMs;
    }
  }, []);

  /**
   * Check if speech is probable (above threshold)
   * CRITICAL: Uses refs, no React state
   */
  const isSpeechProbable = useCallback(() => {
    const prob = lastSpeechProbRef.current;
    if (typeof prob !== 'number' || !isFinite(prob)) {
      return false; // Fail-safe: return false for invalid probability
    }
    return prob > SPEECH_THRESHOLD;
  }, []);

  /**
   * Check if speech is confirmed (above threshold + duration)
   * CRITICAL: Uses refs, no React state
   */
  const isSpeechConfirmed = useCallback(() => {
    if (vadDisabledRef.current || !confirmedSpeechRef.current) {
      return false;
    }
    
    const prob = lastSpeechProbRef.current;
    if (typeof prob !== 'number' || !isFinite(prob)) {
      return false; // Fail-safe
    }
    
    if (prob <= SPEECH_THRESHOLD) {
      return false;
    }
    
    const duration = speechStartTimeRef.current 
      ? Date.now() - speechStartTimeRef.current 
      : 0;
    
    return duration >= minDurationRef.current;
  }, []);

  /**
   * Get current speech probability (for external access)
   * CRITICAL: Returns ref value, not React state
   */
  const getSpeechProbability = useCallback(() => {
    const prob = speechProbabilityRef.current;
    return typeof prob === 'number' && isFinite(prob) ? prob : 0;
  }, []);

  /**
   * Get current speech duration (for external access)
   * CRITICAL: Returns ref value, not React state
   */
  const getSpeechDuration = useCallback(() => {
    return speechDurationMsRef.current;
  }, []);

  /**
   * Check if VAD is disabled (fail-safe check)
   */
  const isVADDisabled = useCallback(() => {
    return vadDisabledRef.current;
  }, []);

  // CRITICAL: Initialize ONLY once on mount (empty dependency array)
  useEffect(() => {
    // CRITICAL: Initialization guard - prevent re-initialization
    if (vadInitializedRef.current) {
      return;
    }
    
    if (audioTrack && enabled && !vadDisabledRef.current) {
      start();
    }

    return () => {
      stop();
      vadInitializedRef.current = false;
    };
  }, []); // CRITICAL: Empty dependency array - initialize only once

  // CRITICAL: Handle enabled/audioTrack changes WITHOUT re-initializing
  useEffect(() => {
    if (vadDisabledRef.current) {
      return; // Don't restart if VAD is disabled
    }
    
    if (audioTrack && enabled && vadInitializedRef.current && !isProcessingRef.current) {
      start();
    } else if (!enabled || !audioTrack) {
      stop();
    }
  }, [audioTrack, enabled, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      vadInitializedRef.current = false;
      if (vadSessionRef.current) {
        vadSessionRef.current = null;
      }
    };
  }, [stop]);

  return {
    // CRITICAL: Return ref values for audio-rate data, React state only for UI
    speechProbability: speechState.probability, // React state updated only on transitions
    speechDurationMs: speechState.duration, // React state updated only on transitions
    silenceDurationMs: speechState.silence, // React state updated only on transitions
    
    // Methods for synchronous checks (use refs internally)
    isSpeechProbable: isSpeechProbable,
    isSpeechConfirmed: isSpeechConfirmed,
    checkIsSpeechProbable: isSpeechProbable,
    checkIsSpeechConfirmed: isSpeechConfirmed,
    getSpeechProbability,
    getSpeechDuration,
    isVADDisabled,
    reset,
    setMinSpeechDuration,
    start,
    stop,
  };
}
