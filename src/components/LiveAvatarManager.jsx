import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  LiveAvatarSession,
  SessionEvent,
  SessionState,
  VoiceChatEvent,
  VoiceChatState,
  ConnectionQuality,
  Language
} from '@heygen/liveavatar-web-sdk';
import { getVideoApiUrl, getNodeApiUrl } from '../config/api';

/**
 * LiveAvatarManager - Manages HeyGen StreamingAvatar SDK integration
 * 
 * This component handles:
 * - Session initialization with backend
 * - WebRTC connection management
 * - Speaking tasks (text-to-speech)
 * - Event handling (start/stop talking)
 * - Cleanup and reconnection logic
 * 
 * @param {object} props
 * @param {string} props.qudemoId - QuDemo ID for session creation
 * @param {string} props.companyName - Company name
 * @param {string} props.avatarId - HeyGen avatar ID (optional)
 * @param {string} props.voiceId - HeyGen voice ID (optional)
 * @param {string} props.quality - Video quality: 'low', 'medium', 'high'
 * @param {function} props.onReady - Callback when avatar is ready (receives speak function)
 * @param {function} props.onStartTalking - Callback when avatar starts speaking
 * @param {function} props.onStopTalking - Callback when avatar stops speaking
 * @param {function} props.onError - Callback for errors
 * @param {function} props.onConnectionChange - Callback when connection status changes
 */
const LiveAvatarManager = ({
  qudemoId,
  companyName,
  avatarId = null,
  voiceId = null,
  quality = 'medium',
  onReady = () => {},
  onStartTalking = () => {},
  onStopTalking = () => {},
  onError = () => {},
  onConnectionChange = () => {},
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  
  const avatarRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const initializingRef = useRef(false); // Prevent duplicate initialization
  
  /**
   * Initialize the streaming avatar session
   */
  const initializeSession = useCallback(async () => {
    if (initializingRef.current) {
      console.log('⚠️ Already initializing, skipping...');
      return;
    }
    
    try {
      initializingRef.current = true;
      console.log('🎬 Initializing LiveAvatar session...');
      console.log('📋 Config:', { qudemoId, companyName, avatarId, voiceId, quality });
      
      // Step 1: Create session token from backend (Node.js endpoint)
      const tokenResponse = await fetch(
        `${getNodeApiUrl()}/api/liveavatar/create-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qudemo_id: qudemoId,
            company_name: companyName,
            avatar_id: avatarId,
            voice_id: voiceId,
          }),
        }
      );
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        const errorMsg = errorData.detail || errorData.message || 'Failed to create session token';
        
        // Check if it's an Interactive Avatar access issue (code 10003)
        if (errorData.code === 10003 || errorMsg.includes('Interactive Avatar')) {
          console.error('❌ HeyGen account lacks Interactive Avatar access');
          setError('Interactive Avatar not available. Please upgrade your HeyGen subscription or contact support@heygen.com');
          return;
        }
        
        throw new Error(errorMsg);
      }
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.success || !tokenData.data) {
        const errorMsg = tokenData.message || tokenData.error || 'Invalid token response';
        
        // Check if it's an Interactive Avatar access issue
        if (tokenData.code === 10003 || errorMsg.includes('Interactive Avatar')) {
          console.error('❌ HeyGen account lacks Interactive Avatar access');
          setError('Interactive Avatar not available. Please upgrade your HeyGen subscription.');
          return;
        }
        
        throw new Error(errorMsg);
      }
      
      console.log('✅ Session created:', tokenData.data);
      setSessionData(tokenData.data);
      
      // Step 2: Initialize LiveAvatar SDK with LiveKit client token
      // The Node backend returns livekitClientToken which is what we need for the SDK
      const livekitToken = tokenData.data.livekitClientToken || tokenData.data.token;
      
      if (!livekitToken) {
        throw new Error('Missing LiveKit client token from backend');
      }
      
      console.log('🎬 Initializing LiveAvatarSession with LiveKit token');
      
      const avatar = new LiveAvatarSession({
        token: livekitToken,
        url: tokenData.data.livekitUrl, // LiveKit server URL
      });
      
      avatarRef.current = avatar;
      
      // Debug: Check what methods are available
      console.log('🔍 Avatar instance:', avatar);
      console.log('🔍 Avatar methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(avatar)));
      console.log('🔍 Has connect?', typeof avatar.connect);
      console.log('🔍 Has start?', typeof avatar.start);
      console.log('🔍 Has startSession?', typeof avatar.startSession);
      console.log('🔍 Has createStartAvatar?', typeof avatar.createStartAvatar);
      
      // Step 3: Set up event listeners
      avatar.on(SessionEvent.STREAM_READY, (e) => {
        console.log('🎥 Stream ready');
      });
      
      avatar.on(SessionEvent.STREAM_DISCONNECTED, (e) => {
        console.log('❌ Stream disconnected');
        setIsConnected(false);
        onConnectionChange(false);
      });
      
      avatar.on(SessionEvent.AVATAR_START_TALKING, (e) => {
        console.log('🎤 Avatar started talking');
        setIsSpeaking(true);
        onStartTalking(e);
      });
      
      avatar.on(SessionEvent.AVATAR_STOP_TALKING, (e) => {
        console.log('🤐 Avatar stopped talking');
        setIsSpeaking(false);
        onStopTalking(e);
      });
      
      avatar.on(VoiceChatEvent.USER_START_TALKING, (e) => {
        console.log('👤 User talking detected:', e);
      });
      
      avatar.on(VoiceChatEvent.USER_STOP_TALKING, (e) => {
        console.log('🤫 User silence detected:', e);
      });
      
      // Step 4: Start the avatar session and attach video stream
      console.log('🎬 Starting avatar session...');
      
      await avatar.connect();
      
      // Get the video stream from the session
      const mediaStream = avatar.getMediaStream();
      if (mediaStream && videoRef.current) {
        console.log('📹 Attaching video stream to element');
        mediaStreamRef.current = mediaStream;
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(err => {
          console.warn('⚠️ Video autoplay prevented:', err);
        });
      }
      
      console.log('✅ Avatar session connected');
      setIsInitialized(true);
      setIsConnected(true);
      onConnectionChange(true);
      
      // Provide functions to parent:
      // 1. sendMessage - Send user's text message to avatar for chat (avatar will respond)
      // 2. speak - Make avatar repeat/speak text (for answers from backend)
      onReady({
        // Send user message to avatar - avatar will process and respond
        sendMessage: async (userMessage) => {
          if (!avatarRef.current || !isConnected) {
            console.error('❌ Avatar not ready to receive message');
            return false;
          }
          
          try {
            console.log('💬 Sending user message to avatar:', userMessage.substring(0, 50) + '...');
            // Send user's message - avatar will process it using context and respond
            // In FULL mode, LiveAvatar handles conversational elements
            // Just send the text - avatar will process and respond
            await avatarRef.current.speak({
              text: userMessage
              // No taskType needed - in FULL mode, avatar handles conversation
            });
            return true;
          } catch (err) {
            console.error('❌ Error sending message to avatar:', err);
            onError(err);
            return false;
          }
        },
        // Make avatar speak/repeat text (for pre-generated answers)
        speak: async (text) => {
        if (!avatarRef.current || !isConnected) {
          console.error('❌ Avatar not ready to speak');
          return false;
        }
        
        try {
          console.log('🗣️ Speaking:', text.substring(0, 50) + '...');
          await avatarRef.current.speak({
            text: text,
            taskType: 'repeat'
          });
          return true;
        } catch (err) {
          console.error('❌ Error speaking:', err);
          onError(err);
          return false;
          }
        }
      });
      
      initializingRef.current = false;
      
    } catch (err) {
      console.error('❌ Error initializing LiveAvatar:', err);
      setError(err.message);
      onError(err);
      initializingRef.current = false;
    }
  }, [qudemoId, companyName, avatarId, voiceId, quality, onReady, onStartTalking, onStopTalking, onError, onConnectionChange, isConnected]);
  
  /**
   * Cleanup function - stop session and release resources
   */
  const cleanup = useCallback(async () => {
    console.log('🧹 Cleaning up LiveAvatar session...');
    
    try {
      if (avatarRef.current && sessionData) {
        // Stop the avatar stream
        await avatarRef.current.stopAvatar();
        console.log('⏹️ Avatar stopped');
        
        // Notify backend to stop session
        await fetch(getVideoApiUrl('/liveavatar/stop'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionData.session_id,
          }),
        });
        
        console.log('✅ Backend session stopped');
      }
      
      // Clean up video element
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      // Reset state
      setIsInitialized(false);
      setIsConnected(false);
      setIsSpeaking(false);
      avatarRef.current = null;
      mediaStreamRef.current = null;
      setSessionData(null);
      
    } catch (err) {
      console.error('❌ Error during cleanup:', err);
    }
  }, [sessionData]);
  
  // Initialize on mount
  useEffect(() => {
    if (qudemoId && !isInitialized && !initializingRef.current) {
      initializeSession();
    }
    
    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [qudemoId, isInitialized, initializeSession, cleanup]);
  
  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Video Element for Avatar Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // Mirror the video for natural appearance
      />
      
      {/* Loading Overlay */}
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-sm">
              {error ? 'Connection Error' : 'Connecting to avatar...'}
            </p>
            {error && (
              <p className="text-red-400 text-xs mt-2">{error}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Speaking Indicator */}
      {isSpeaking && isConnected && (
        <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-blue-500 bg-opacity-90 px-3 py-2 rounded-full">
          <div className="flex space-x-1">
            <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-white text-xs font-medium">Speaking...</span>
        </div>
      )}
      
      {/* Connection Status Indicator */}
      <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
        isConnected ? 'bg-green-500' : 'bg-red-500'
      } shadow-lg`} title={isConnected ? 'Connected' : 'Disconnected'}></div>
    </div>
  );
};

export default LiveAvatarManager;

