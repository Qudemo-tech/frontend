/**
 * useNeuralVAD - Client-side neural Voice Activity Detection using Silero VAD
 * 
 * This hook uses Silero VAD (ONNX) to filter out false positives from Tavus/Daily
 * speech detection events. It prevents interruptions from background noise, coughs,
 * hums, and brief sounds.
 * 
 * Architecture:
 * - Taps microphone audio in parallel (does NOT replace Daily.co audio)
 * - Runs VAD inference asynchronously (non-blocking via requestIdleCallback/queueMicrotask)
 * - Tracks speech probability and duration
 * - Provides speech confirmation based on threshold + duration
 * 
 * Rules:
 * - speechProbability threshold: > 0.65
 * - minimum speech duration: 500-600ms (configurable per context)
 * - ignore all speech shorter than minimum duration
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
const PROCESSING_INTERVAL_MS = 30; // Process audio every 30ms to avoid blocking

/**
 * useNeuralVAD Hook
 * 
 * @param {Object} options
 * @param {MediaStreamTrack} options.audioTrack - Microphone audio track to analyze
 * @param {boolean} options.enabled - Whether VAD is enabled
 * @param {Function} options.onSpeechConfirmed - Callback when speech is confirmed
 * @param {Function} options.log - Optional logging function
 * @returns {Object} VAD state and methods
 */
export function useNeuralVAD({ audioTrack, enabled = true, onSpeechConfirmed, log = () => {} }) {
  // State
  const [speechProbability, setSpeechProbability] = useState(0);
  const [speechDurationMs, setSpeechDurationMs] = useState(0);
  const [silenceDurationMs, setSilenceDurationMs] = useState(0);

  // Refs
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
  const bufferIndexRef = useRef(0);
  const isInitializedRef = useRef(false);
  const confirmedSpeechRef = useRef(false);
  const minDurationRef = useRef(MIN_SPEECH_DURATION_MS);

  /**
   * Load Silero VAD ONNX model
   */
  const loadVADModel = useCallback(async () => {
    if (vadSessionRef.current) {
      return true;
    }

    try {
      log('[VAD] Loading Silero VAD model...');
      
      // Dynamic import of onnxruntime-web
      const ort = await import('onnxruntime-web');
      
      // Silero VAD model URL (v4 model - simpler, no state management needed)
      const MODEL_URL = 'https://models.silero.ai/vad_models/v4/silero_vad.onnx';
      
      // Create inference session
      vadSessionRef.current = await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      
      log('[VAD] Model loaded successfully');
      return true;
    } catch (error) {
      console.error('[VAD] Model loading error:', error);
      log(`[VAD] Model load error: ${error.message}`);
      // Fallback: continue without VAD (graceful degradation)
      return false;
    }
  }, [log]);

  /**
   * Process audio frame through VAD model
   */
  const processAudioFrame = useCallback(async (audioData) => {
    if (!vadSessionRef.current || !enabled || audioData.length !== FRAME_SIZE) {
      return;
    }

    try {
      // Normalize audio (ensure it's in [-1, 1] range)
      const normalized = new Float32Array(FRAME_SIZE);
      for (let i = 0; i < FRAME_SIZE; i++) {
        normalized[i] = Math.max(-1, Math.min(1, audioData[i]));
      }
      
      // Create ONNX tensor: [batch, samples] = [1, 512]
      const ort = await import('onnxruntime-web');
      const inputTensor = new ort.Tensor('float32', normalized, [1, FRAME_SIZE]);
      
      // Run inference (async, non-blocking)
      const feeds = { input: inputTensor };
      const results = await vadSessionRef.current.run(feeds);
      
      // Extract speech probability
      // Silero VAD v4 outputs speech probability directly
      const output = results.output;
      let probability = 0;
      
      if (output && output.data) {
        const data = output.data;
        // Handle different output shapes
        if (Array.isArray(data)) {
          probability = data[0] || 0;
        } else if (data instanceof Float32Array || data instanceof Array) {
          probability = data[0] || 0;
        } else {
          probability = data;
        }
      }
      
      probability = Math.max(0, Math.min(1, probability));
      lastSpeechProbRef.current = probability;
      
      // Update state (throttled to avoid excessive re-renders)
      setSpeechProbability(prev => {
        // Only update if change is significant (0.05 threshold)
        if (Math.abs(prev - probability) > 0.05) {
          return probability;
        }
        return prev;
      });
      
      // Update speech/silence tracking
      const now = Date.now();
      const isSpeech = probability > SPEECH_THRESHOLD;
      
      if (isSpeech) {
        if (speechStartTimeRef.current === null) {
          speechStartTimeRef.current = now;
          silenceStartTimeRef.current = null;
        }
        const duration = now - speechStartTimeRef.current;
        setSpeechDurationMs(duration);
        setSilenceDurationMs(0);
        
        // Check if speech is confirmed
        const minDuration = minDurationRef.current;
        if (duration >= minDuration && !confirmedSpeechRef.current) {
          confirmedSpeechRef.current = true;
          log(`[VAD] Speech confirmed (${duration}ms, prob=${probability.toFixed(2)})`);
          if (onSpeechConfirmed) {
            onSpeechConfirmed(probability, duration);
          }
        }
      } else {
        if (speechStartTimeRef.current !== null) {
          if (silenceStartTimeRef.current === null) {
            silenceStartTimeRef.current = now;
          }
          const silenceDuration = now - silenceStartTimeRef.current;
          setSilenceDurationMs(silenceDuration);
          
          // Reset if silence is long enough
          if (silenceDuration >= SILENCE_DURATION_MS) {
            speechStartTimeRef.current = null;
            silenceStartTimeRef.current = null;
            setSpeechDurationMs(0);
            setSilenceDurationMs(0);
            confirmedSpeechRef.current = false;
          }
        }
      }
    } catch (error) {
      // Silently handle inference errors to avoid spam
      if (error.message && !error.message.includes('already')) {
        console.error('[VAD] Inference error:', error);
      }
    }
  }, [enabled, log, onSpeechConfirmed]);

  /**
   * Process audio data from analyser node
   */
  const processAudio = useCallback(() => {
    if (!analyserNodeRef.current || !isProcessingRef.current || !enabled) {
      return;
    }

    try {
      // Get audio data from analyser
      const dataArray = new Float32Array(FRAME_SIZE);
      analyserNodeRef.current.getFloatTimeDomainData(dataArray);
      
      // Copy to buffer
      audioBufferRef.current.set(dataArray);
      
      // Process frame asynchronously (non-blocking)
      queueMicrotask(() => {
        processAudioFrame(audioBufferRef.current);
      });
    } catch (error) {
      // Silently handle processing errors
    }
  }, [enabled, processAudioFrame]);

  /**
   * Initialize AudioContext and audio processing
   */
  const initializeAudio = useCallback(async () => {
    if (!audioTrack || !enabled || isInitializedRef.current) {
      return;
    }

    try {
      log('[VAD] Initializing audio context...');
      
      // Create AudioContext for processing
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: SAMPLE_RATE });
      
      // Create MediaStream from track
      const stream = new MediaStream([audioTrack]);
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create AnalyserNode for audio data extraction
      analyserNodeRef.current = audioContextRef.current.createAnalyser();
      analyserNodeRef.current.fftSize = FRAME_SIZE * 2;
      analyserNodeRef.current.smoothingTimeConstant = 0.8;
      
      // Connect audio processing chain
      sourceNodeRef.current.connect(analyserNodeRef.current);
      // Don't connect to destination (we're just analyzing, not playing)
      
      isInitializedRef.current = true;
      log('[VAD] Audio processing initialized');
    } catch (error) {
      console.error('[VAD] Audio initialization error:', error);
      log(`[VAD] Audio init error: ${error.message}`);
    }
  }, [audioTrack, enabled, log]);

  /**
   * Start VAD processing
   */
  const start = useCallback(async () => {
    if (isProcessingRef.current || !enabled) {
      return;
    }

    try {
      // Load model first
      const modelLoaded = await loadVADModel();
      if (!modelLoaded) {
        log('[VAD] Failed to load model, VAD disabled (graceful degradation)');
        return;
      }

      // Initialize audio processing
      await initializeAudio();
      
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Start processing interval
      isProcessingRef.current = true;
      processingIntervalRef.current = setInterval(processAudio, PROCESSING_INTERVAL_MS);
      
      log('[VAD] Started processing');
    } catch (error) {
      console.error('[VAD] Start error:', error);
      log(`[VAD] Start error: ${error.message}`);
    }
  }, [enabled, loadVADModel, initializeAudio, processAudio, log]);

  /**
   * Stop VAD processing
   */
  const stop = useCallback(() => {
    isProcessingRef.current = false;
    
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
    if (analyserNodeRef.current) {
      analyserNodeRef.current.disconnect();
      analyserNodeRef.current = null;
    }
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    
    isInitializedRef.current = false;
    log('[VAD] Stopped processing');
  }, [log]);

  /**
   * Reset VAD state
   */
  const reset = useCallback(() => {
    speechStartTimeRef.current = null;
    silenceStartTimeRef.current = null;
    setSpeechDurationMs(0);
    setSilenceDurationMs(0);
    confirmedSpeechRef.current = false;
    bufferIndexRef.current = 0;
    log('[VAD] State reset');
  }, [log]);

  /**
   * Set minimum speech duration (for module lock scenarios)
   */
  const setMinSpeechDuration = useCallback((durationMs) => {
    minDurationRef.current = durationMs;
  }, []);

  /**
   * Check if speech is probable (above threshold)
   */
  const isSpeechProbable = useCallback(() => {
    return lastSpeechProbRef.current > SPEECH_THRESHOLD;
  }, []);

  /**
   * Check if speech is confirmed (above threshold + duration)
   */
  const isSpeechConfirmed = useCallback(() => {
    if (!confirmedSpeechRef.current) {
      return false;
    }
    const duration = speechStartTimeRef.current 
      ? Date.now() - speechStartTimeRef.current 
      : 0;
    return duration >= minDurationRef.current && lastSpeechProbRef.current > SPEECH_THRESHOLD;
  }, []);

  // Initialize when audio track is available
  useEffect(() => {
    if (audioTrack && enabled) {
      start();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [audioTrack, enabled, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (vadSessionRef.current) {
        vadSessionRef.current = null;
      }
    };
  }, [stop]);

  // Computed values (for React state)
  const isSpeechProbableValue = speechProbability > SPEECH_THRESHOLD;
  const isSpeechConfirmedValue = confirmedSpeechRef.current && 
    speechDurationMs >= minDurationRef.current;

  return {
    // State (reactive)
    speechProbability,
    speechDurationMs,
    silenceDurationMs,
    
    // Computed state (reactive)
    isSpeechProbable: isSpeechProbableValue,
    isSpeechConfirmed: isSpeechConfirmedValue,
    
    // Methods (for synchronous checks in callbacks)
    checkIsSpeechProbable: isSpeechProbable,
    checkIsSpeechConfirmed: isSpeechConfirmed,
    reset,
    setMinSpeechDuration,
    start,
    stop,
  };
}
