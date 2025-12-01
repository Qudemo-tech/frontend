import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import {
  Room,
  createLocalAudioTrack,
  RoomEvent,
  DataPacket_Kind,
  Track,
} from "livekit-client";
import { getNodeApiUrl } from '../config/api';
import { useEventLogger } from '../hooks/useEventLogger';
import { useDemoVideo } from '../hooks/useDemoVideo';
import { checkForDemoTrigger } from '../utils/videoTriggerMatcher';
import videoTriggersConfig from '../config/video-triggers.json';
import bookingConfig from '../config/booking-config.json';

// AIDEV-NOTE: Main widget component - manages LiveAvatar session, voice interaction, demo playback, and intent detection
// AIDEV-NOTE: Architecture: LiveKit WebRTC for video/audio, HeyGen API for avatar session, local state for UI
// AIDEV-NOTE: Why: Single component design keeps all LiveKit room state in one place to prevent sync issues
// AIDEV-NOTE: Key flows: startLiveSession → wireRoomEvents → handleUserSpeech/handleAvatarSpeech → detectIntent
export const AIChatWidget = () => {
  const [state, setState] = useState("minimized");
  const [isMuted, setIsMuted] = useState(true);
  const [isVoiceMode, setIsVoiceMode] = useState(true); // AIDEV-NOTE: Always true - toggle UI removed, shows static avatar instead of LiveKit video
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [email, setEmail] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionToScreenShare, setTransitionToScreenShare] = useState(false);
  const screenShareRef = useRef(false);

  // LiveAvatar states
  const [room, setRoom] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [hasLiveVideo, setHasLiveVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [avatarState, setAvatarState] = useState("idle");
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [detectedIntents, setDetectedIntents] = useState([]);
  const [showCalendly, setShowCalendly] = useState(false); // AIDEV-NOTE: Controls calendly iframe overlay display
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const mountedRef = useRef(true);
  const previousAgentStateRef = useRef('idle');
  const lastAvatarSpeechRef = useRef('');
  const preDemoWidgetStateRef = useRef(null);
  const preCalendlyWidgetStateRef = useRef(null); // AIDEV-NOTE: Saves widget state before calendly opens
  const preCalendlyMutedRef = useRef(false); // AIDEV-NOTE: Saves mic mute state before calendly opens
  const preCalendlyAudioEnabledRef = useRef(true); // AIDEV-NOTE: Saves avatar audio state before calendly opens
  const pendingCalendlyRef = useRef(false); // AIDEV-NOTE: Flags pending calendly open - waits for avatar to finish speaking

  // Event logging hook
  const { logs, log, clearLogs } = useEventLogger();

  // Demo video hook
  const { isDemoPlaying, currentVideoUrl, demoVideoRef, playDemoVideo, stopDemoVideo } = useDemoVideo({
    room,
    localAudioRef,
    log,
    setState,
  });

  // AIDEV-NOTE: Processes user speech transcripts from LiveKit data channel
  // AIDEV-NOTE: How: Updates transcripts array (keeps last 10), triggers intent detection
  // AIDEV-NOTE: Why: Centralized handler for both 'type' and 'event_type' message formats (HeyGen API v1/v2 compatibility)
  // AIDEV-NOTE: Called by: wireRoomEvents for user_transcript, user_speech, and user.transcription events
  const handleUserSpeech = (text, source) => {
    if (!text) return;
    log('USER_SPEECH', `🗣️ User said (${source})`, { text });
    // AIDEV-NOTE: Keep only last 10 transcripts to prevent memory bloat
    setTranscripts((prev) =>
      [
        ...prev,
        {
          type: "user_speech",
          text: text,
          timestamp: Date.now(),
        },
      ].slice(-10)
    );
    detectIntent(text, { text }, "user");
  };

  // AIDEV-NOTE: Processes avatar speech transcripts for intent detection and demo triggers
  // AIDEV-NOTE: How: Updates transcripts array, saves text to lastAvatarSpeechRef for demo trigger detection
  // AIDEV-NOTE: Why: Centralized handler reduces duplication, lastAvatarSpeechRef enables demo check on avatar_stop_talking
  // AIDEV-NOTE: Called by: wireRoomEvents for avatar_transcript, avatar_speech, llm_response, and avatar.transcription
  const handleAvatarSpeech = (text, source) => {
    if (!text) return;
    log('AVATAR_SPEECH', `🤖 Avatar said (${source})`, { text });
    setTranscripts((prev) =>
      [
        ...prev,
        {
          type: "avatar_speech",
          text: text,
          timestamp: Date.now(),
        },
      ].slice(-10)
    );
    // AIDEV-NOTE: Critical for demo triggers - wireRoomEvents checks this ref on avatar_stop_talking event
    lastAvatarSpeechRef.current = text;
    detectIntent(text, { text }, "avatar");
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // AIDEV-NOTE: Restore widget state after demo ends
  // AIDEV-NOTE: Always return to "small" state (initial connected state) after demo closes
  // AIDEV-NOTE: Same behavior as Calendly - returns to normal conversation view, not dead/disconnected state
  useEffect(() => {
    if (!isDemoPlaying && preDemoWidgetStateRef.current !== null) {
      // AIDEV-NOTE: Always return to "small" state (initial connected view) after demo closes
      // AIDEV-NOTE: User wants to resume conversation after demo, not return to previous state
      if (room && sessionInfo) {
        log('DEMO', 'Returning to small state (initial connected view) after demo closed');
        setState("small");
      } else {
        log('DEMO', 'No active session - keeping minimized');
        setState("minimized");
      }
      preDemoWidgetStateRef.current = null;
    }
  }, [isDemoPlaying, log, room, sessionInfo]);

  // AIDEV-NOTE: Restore widget state after calendly closes
  // AIDEV-NOTE: Always return to "small" state (initial connected state) after calendly closes
  // AIDEV-NOTE: This is the normal conversation view that appears when you first connect from minimized
  useEffect(() => {
    if (!showCalendly && preCalendlyWidgetStateRef.current !== null) {
      // AIDEV-NOTE: Always return to "small" state (initial connected view) after calendly closes
      // AIDEV-NOTE: User wants the normal conversation view, not previous state or maximized
      if (room && sessionInfo) {
        log('CALENDLY', 'Returning to small state (initial connected view) after calendly closed');
        setState("small");
      } else {
        log('CALENDLY', 'No active session - keeping minimized');
        setState("minimized");
      }

      preCalendlyWidgetStateRef.current = null;
    }
  }, [showCalendly, log, room, sessionInfo]);

  // AIDEV-NOTE: Wait for avatar to finish speaking before opening Calendly
  // AIDEV-NOTE: When pendingCalendlyRef is set, this effect waits until isAvatarSpeaking becomes false
  // AIDEV-NOTE: Then opens Calendly and clears the pending flag
  useEffect(() => {
    if (pendingCalendlyRef.current && !isAvatarSpeaking) {
      log('CALENDLY', 'Avatar finished speaking - opening Calendly now');

      // AIDEV-NOTE: Save widget state before maximizing - enables restore after calendly closes
      preCalendlyWidgetStateRef.current = state;

      // AIDEV-NOTE: Maximize widget for better calendly viewing experience
      if (state !== "maximized") {
        setState("maximized");
      }

      setShowCalendly(true);
      pendingCalendlyRef.current = false; // AIDEV-NOTE: Clear the pending flag
    }
  }, [isAvatarSpeaking, state, log]);

  // AIDEV-NOTE: Clone avatar video to calendly PIP when calendly opens
  // AIDEV-NOTE: How: Finds main video element, clones it to PIP container
  // AIDEV-NOTE: Why: Keeps avatar visible during calendly booking, same pattern as demo video PIP
  useEffect(() => {
    if (showCalendly && hasLiveVideo) {
      const sourceVideo = document.querySelector('#live-video-container video');
      const pipContainer = document.getElementById('calendly-avatar-pip');

      if (sourceVideo && pipContainer) {
        // AIDEV-NOTE: Clone video element to PIP
        const pipVideo = sourceVideo.cloneNode(true);
        pipVideo.style.width = '100%';
        pipVideo.style.height = '100%';
        pipVideo.style.objectFit = 'cover';
        pipVideo.muted = false; // AIDEV-NOTE: Will be muted separately via audioEnabled state

        // AIDEV-NOTE: Attach same MediaStream to PIP video
        if (sourceVideo.srcObject) {
          pipVideo.srcObject = sourceVideo.srcObject;
        }

        pipContainer.innerHTML = '';
        pipContainer.appendChild(pipVideo);
        pipVideo.play().catch(e => console.log('PIP video play failed:', e));
      }
    }
  }, [showCalendly, hasLiveVideo]);

  // AIDEV-NOTE: Mute mic and avatar audio when calendly opens, restore when closed
  // AIDEV-NOTE: How: Saves current audio states in refs, mutes both, restores on close
  // AIDEV-NOTE: Why: User shouldn't be talking to avatar while booking, prevents audio interference
  useEffect(() => {
    if (showCalendly) {
      // AIDEV-NOTE: Save current states before muting
      preCalendlyMutedRef.current = isMuted;
      preCalendlyAudioEnabledRef.current = audioEnabled;

      // AIDEV-NOTE: Mute microphone if not already muted
      if (!isMuted && localAudioRef.current && room) {
        room.localParticipant.unpublishTrack(localAudioRef.current);
        localAudioRef.current.stop();
        localAudioRef.current = null;
        setIsMuted(true);
      }

      // AIDEV-NOTE: Mute avatar audio if not already muted
      if (audioEnabled && remoteAudioRef.current) {
        remoteAudioRef.current.muted = true;
        setAudioEnabled(false);
      }
    } else {
      // AIDEV-NOTE: Always unmute both microphone and speaker when calendly closes
      // AIDEV-NOTE: User wants to resume conversation after booking, so both should be active
      if (room && !localAudioRef.current) {
        // AIDEV-NOTE: Enable microphone for conversation
        publishLocalAudio();
        setIsMuted(false);
      }

      if (remoteAudioRef.current && !audioEnabled) {
        // AIDEV-NOTE: Enable avatar audio for conversation
        remoteAudioRef.current.muted = false;
        setAudioEnabled(true);
      }
    }
  }, [showCalendly, isMuted, audioEnabled, room]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // AIDEV-NOTE: Stop HeyGen session on unmount to prevent quota waste
      // AIDEV-NOTE: This cleanup only runs on component unmount (empty dependency array)
      if (sessionInfo?.sessionId && sessionInfo?.sessionToken) {
        stopSession();
      }
      if (room) {
        room.disconnect();
      }
      if (localAudioRef.current) {
        localAudioRef.current.stop();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let initialTimer;
    let interval;

    if (state !== "minimized" && !isVoiceMode) {
      initialTimer = setTimeout(() => {
        const toggleScreenShare = () => {
          setIsTransitioning(true);
          const nextState = !screenShareRef.current;
          setTransitionToScreenShare(nextState);

          setTimeout(() => {
            screenShareRef.current = nextState;
            setIsScreenSharing(nextState);
            setTimeout(() => setIsTransitioning(false), 300);
          }, 500);
        };

        toggleScreenShare();
        interval = setInterval(toggleScreenShare, 7000);
      }, 1000);
    } else if (isVoiceMode) {
      screenShareRef.current = false;
      setIsScreenSharing(false);
      setIsTransitioning(false);
    }

    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      if (interval) clearInterval(interval);
    };
  }, [state, isVoiceMode]);

  const timeSlots = ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"];
  const availableDates = [
    new Date().toISOString().split("T")[0],
    new Date(Date.now() + 86400000).toISOString().split("T")[0],
    new Date(Date.now() + 172800000).toISOString().split("T")[0],
  ];


  // AIDEV-NOTE: Handles user activity tracking
  // AIDEV-NOTE: How: Currently a placeholder for future activity tracking features
  // AIDEV-NOTE: Why: Originally managed inactivity timeout (removed), kept as placeholder for future features
  // AIDEV-NOTE: Called by: handleQuickAction, button clicks throughout UI
  // AIDEV-REMOVED: Inactivity timeout feature (30s timeout prompt) removed - not needed for voice-first experience
  const handleActivity = () => {
    // Placeholder for future activity tracking
  };

  // AIDEV-NOTE: Stops HeyGen LiveAvatar session to prevent quota waste
  // AIDEV-NOTE: How: Calls /api/liveavatar/stop-session with sessionId and sessionToken
  // AIDEV-NOTE: Why: HeyGen charges for active sessions, must explicitly stop to avoid wasting quota
  // AIDEV-NOTE: Called by: handleDisconnect, component unmount cleanup
  const stopSession = async () => {
    // AIDEV-NOTE: Only call stop-session if we have valid session credentials
    if (!sessionInfo?.sessionId || !sessionInfo?.sessionToken) {
      console.log("[STOP-SESSION] No session info, skipping stop-session call");
      return;
    }

    try {
      console.log("[STOP-SESSION] Stopping HeyGen session:", sessionInfo.sessionId);
      console.log("[STOP-SESSION] Calling endpoint:", getNodeApiUrl("/api/liveavatar/stop-session"));
      console.log("[STOP-SESSION] Request payload:", {
        sessionId: sessionInfo.sessionId,
        sessionToken: sessionInfo.sessionToken.substring(0, 20) + "...",
      });

      const response = await fetch(getNodeApiUrl("/api/liveavatar/stop-session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionInfo.sessionId,
          sessionToken: sessionInfo.sessionToken,
        }),
      });

      console.log("[STOP-SESSION] Response status:", response.status, response.statusText);

      if (!response.ok) {
        // AIDEV-NOTE: 404 means endpoint doesn't exist (only on non-Vercel deployments)
        if (response.status === 404) {
          console.warn("[STOP-SESSION] ⚠️ Stop-session endpoint not found (404).");
          console.warn("[STOP-SESSION] Make sure you're deploying to Vercel to use serverless functions.");
          console.warn("[STOP-SESSION] Session will auto-expire on HeyGen's end, but may waste quota.");
        } else {
          const errorData = await response.json();
          console.error("[STOP-SESSION] Failed to stop session. Error response:", errorData);
        }
      } else {
        const successData = await response.json();
        console.log("[STOP-SESSION] ✅ Session stopped successfully!");
        console.log("[STOP-SESSION] Server response:", successData);
      }
    } catch (error) {
      console.error("[STOP-SESSION] Error calling stop-session endpoint:", error);
      console.error("[STOP-SESSION] Error details:", error.message);
    }
  };

  // AIDEV-NOTE: Full session cleanup and disconnect from LiveAvatar
  // AIDEV-NOTE: How: Stops HeyGen session first, then disconnects room, stops all tracks, removes audio element from DOM, resets all state to defaults
  // AIDEV-NOTE: Why: Prevents quota waste from HeyGen sessions and memory leaks from tracks/elements, ensures clean state for reconnection
  // AIDEV-NOTE: Called by: Disconnect button (PhoneOff icon), component unmount useEffect cleanup
  const handleDisconnect = async () => {
    // AIDEV-NOTE: Stop HeyGen session first to prevent quota waste
    await stopSession();

    // AIDEV-NOTE: LiveKit room cleanup - disconnect and reset session state
    if (room) {
      room.disconnect();
      setRoom(null);
      setSessionInfo(null);
      setHasLiveVideo(false);
      setHasAudio(false);
    }
    // AIDEV-NOTE: Stop local microphone track to release device access
    if (localAudioRef.current) {
      localAudioRef.current.stop();
      localAudioRef.current = null;
    }
    // AIDEV-NOTE: Remove remote audio element from DOM to prevent memory leak
    if (remoteAudioRef.current) {
      document.body.removeChild(remoteAudioRef.current);
      remoteAudioRef.current = null;
    }
    // AIDEV-NOTE: Reset UI state to initial minimized widget with default settings
    setIsMuted(true);
    setAudioEnabled(true);
    setState("minimized");
  };

  // AIDEV-NOTE: Initializes LiveAvatar session - creates HeyGen session, connects to LiveKit room, wires all events
  // AIDEV-NOTE: How: POST to /api/liveavatar/create-session → get LiveKit credentials → connect → wire events → attach tracks
  // AIDEV-NOTE: Why: Multi-step async flow required by HeyGen API v2 (token → start → livekit credentials)
  // AIDEV-NOTE: Called by: Widget expansion (minimized → small), triggered on initial click
  // AIDEV-TODO: Add user-facing error UI instead of console.error on session creation failure
  const startLiveSession = async () => {
    // AIDEV-NOTE: Prevent duplicate connection attempts
    if (isConnecting || room) return;

    setIsConnecting(true);
    try {
      // AIDEV-NOTE: Step 1 - Create HeyGen LiveAvatar session via serverless API route
      const resp = await fetch(getNodeApiUrl("/api/liveavatar/create-session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "widget-user" }),
      });

      if (!resp.ok) {
        throw new Error("Failed to create session");
      }

      const response = await resp.json();

      // AIDEV-NOTE: Handle nested response format - backend may wrap in response.data
      const data = response.data || response;
      const livekitUrl = data.livekitUrl;
      const livekitClientToken = data.livekitClientToken;
      const sessionId = data.sessionId;
      const sessionToken = data.sessionToken; // AIDEV-NOTE: Need token for stop-session API call

      if (!livekitUrl || !livekitClientToken) {
        throw new Error("Missing LiveKit credentials in response");
      }

      setSessionInfo({ sessionId, sessionToken, livekitUrl });

      // AIDEV-NOTE: Step 2 - Create LiveKit room with disabled adaptive streaming for stable avatar quality
      const r = new Room({
        adaptiveStream: false, // AIDEV-NOTE: Prevents quality changes during session
        dynacast: false,       // AIDEV-NOTE: Disabled for avatar use case
      });

      // AIDEV-NOTE: Step 3 - Connect to LiveKit room using credentials from HeyGen session
      await r.connect(livekitUrl, livekitClientToken);

      // AIDEV-NOTE: Safety check - if component unmounted during async connection, cleanup and abort
      if (!mountedRef.current) {
        r.disconnect();
        setIsConnecting(false);
        return;
      }

      setRoom(r);
      setHasLiveVideo(true);

      // AIDEV-NOTE: Step 4 - Wire all room events (data channel, participant attributes, state changes)
      wireRoomEvents(r);

      // AIDEV-NOTE: Step 5 - Listen for new tracks being published by avatar (video/audio)
      r.on(
        RoomEvent.TrackSubscribed,
        (
          track,
          publication,
          participant
        ) => {
          console.log("Track subscribed:", track.kind, track.sid);
          if (track.kind === Track.Kind.Video) {
            console.log("Video track received, attaching...");
            setTimeout(() => attachTrackToDom(track), 100); // AIDEV-NOTE: 100ms delay ensures DOM ready
          } else if (track.kind === Track.Kind.Audio) {
            console.log("Audio track received, attaching...");
            attachAudioTrack(track);
          }
        }
      );

      // AIDEV-NOTE: Handle track removal when participant leaves or unpublishes
      r.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Video) {
          detachTrackFromDom(track);
        } else if (track.kind === Track.Kind.Audio) {
          detachAudioTrack(track);
        }
      });

      // AIDEV-NOTE: Step 6 - Attach already-existing tracks (handles race condition where tracks arrive before listeners)
      // AIDEV-NOTE: 1000ms delay ensures both DOM and LiveKit room are fully ready
      setTimeout(() => {
        const existingParticipants = Array.from(r.remoteParticipants.values());
        existingParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            if (publication.isSubscribed && publication.track) {
              if (publication.track.kind === Track.Kind.Video) {
                attachTrackToDom(publication.track);
              } else if (publication.track.kind === Track.Kind.Audio) {
                attachAudioTrack(publication.track);
              }
            }
          });
        });
      }, 1000);

      // AIDEV-NOTE: Step 7 - Auto-enable user microphone after session initialization
      // AIDEV-NOTE: 1500ms delay ensures room is fully connected before publishing local audio track
      // AIDEV-NOTE: Why: Better UX - user can start talking immediately without clicking mic button
      setTimeout(async () => {
        if (mountedRef.current && r) {
          console.log("Auto-enabling microphone, room state:", r.state);
          try {
            const track = await createLocalAudioTrack({
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            });
            localAudioRef.current = track;
            await r.localParticipant.publishTrack(track);
            setIsMuted(false);
            console.log("Microphone auto-enabled successfully");
          } catch (e) {
            console.error("Failed to auto-enable microphone:", e);
            setIsMuted(true);
          }
        }
      }, 1500);
    } catch (err) {
      console.error("Failed to start live session:", err);
      // AIDEV-TODO: Show error modal to user instead of silent failure
    }
    setIsConnecting(false);
  };

  // AIDEV-NOTE: Attaches LiveKit video track to DOM - creates <video> element if needed and connects avatar video stream
  // AIDEV-NOTE: How: Finds #live-video-container, creates <video> if missing, attaches track, forces autoplay
  // AIDEV-NOTE: Why: Displays avatar video feed, retry logic handles race condition if DOM not ready during connection
  // AIDEV-NOTE: Called by: TrackSubscribed event listener, existing tracks check in startLiveSession
  const attachTrackToDom = (track) => {
    const videoContainer = document.getElementById("live-video-container");
    // AIDEV-NOTE: Retry logic - if container not found (DOM not ready), retry after 500ms
    if (!videoContainer) {
      console.log("Video container not found, retrying...");
      setTimeout(() => attachTrackToDom(track), 500);
      return;
    }

    // AIDEV-NOTE: Reuse existing <video> element or create new one - prevents multiple video elements
    let videoEl = videoContainer.querySelector("video");
    if (!videoEl) {
      videoEl = document.createElement("video");
      videoEl.autoplay = true;
      videoEl.playsInline = true; // AIDEV-NOTE: Required for iOS Safari to play inline without fullscreen
      videoEl.muted = false;       // AIDEV-NOTE: Not muted - we want to hear avatar audio
      videoEl.style.width = "100%";
      videoEl.style.height = "100%";
      videoEl.style.objectFit = "cover"; // AIDEV-NOTE: Fills container while maintaining aspect ratio
      videoEl.style.backgroundColor = "#000";
      videoContainer.appendChild(videoEl);
      console.log("Video element created and added");
    }

    track.attach(videoEl); // AIDEV-NOTE: LiveKit method - connects MediaStreamTrack to <video> element
    setHasLiveVideo(true);

    // AIDEV-NOTE: Force video to play - sometimes autoplay is blocked by browser, explicit play() ensures playback
    videoEl.play().catch((e) => console.log("Video play failed:", e));
    console.log("Video track attached, video element:", videoEl);
  };

  // AIDEV-NOTE: Detaches video track from DOM element
  // AIDEV-NOTE: How: Calls LiveKit's track.detach() to disconnect MediaStreamTrack
  // AIDEV-NOTE: Why: Cleanup when avatar disconnects or track is unpublished
  // AIDEV-NOTE: Called by: TrackUnsubscribed event listener
  const detachTrackFromDom = (track) => {
    track.detach();
  };

  // AIDEV-NOTE: Attaches avatar audio track to hidden <audio> element in DOM
  // AIDEV-NOTE: How: Creates hidden <audio> in body (if not exists), attaches track, respects audioEnabled state
  // AIDEV-NOTE: Why: Hidden element allows audio playback control, persisted in ref for mute/unmute without recreation
  // AIDEV-NOTE: Called by: TrackSubscribed event listener, existing tracks check in startLiveSession
  const attachAudioTrack = (track) => {
    // AIDEV-NOTE: Create audio element once and persist in ref - allows toggling without destroying/recreating
    if (!remoteAudioRef.current) {
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.style.display = "none"; // AIDEV-NOTE: Hidden - no visual representation needed for audio
      document.body.appendChild(audioEl); // AIDEV-NOTE: Attached to body, not container - survives UI changes
      remoteAudioRef.current = audioEl;
      console.log("Audio element created");
    }
    track.attach(remoteAudioRef.current); // AIDEV-NOTE: LiveKit method - connects audio MediaStreamTrack
    setHasAudio(true);
    remoteAudioRef.current.muted = !audioEnabled; // AIDEV-NOTE: Respects user's audio toggle state

    // AIDEV-NOTE: Force audio to play - ensures playback even if autoplay is blocked by browser policy
    remoteAudioRef.current
      .play()
      .catch((e) => console.log("Audio play failed:", e));
    console.log("Audio track attached, audio enabled:", audioEnabled);
  };

  // AIDEV-NOTE: Detaches audio track and removes element from DOM
  // AIDEV-NOTE: How: Calls track.detach(), removes <audio> from body, clears ref
  // AIDEV-NOTE: Why: Complete cleanup when avatar disconnects, prevents memory leak from lingering audio element
  // AIDEV-NOTE: Called by: TrackUnsubscribed event listener, handleDisconnect
  const detachAudioTrack = (track) => {
    track.detach();
    setHasAudio(false);
    // AIDEV-NOTE: Remove audio element from DOM to prevent memory leak
    if (remoteAudioRef.current) {
      document.body.removeChild(remoteAudioRef.current);
      remoteAudioRef.current = null;
    }
  };

  // AIDEV-NOTE: Toggles avatar audio output (speaker button) - mutes/unmutes remote audio element
  // AIDEV-NOTE: How: Flips audioEnabled state, sets remoteAudioRef.current.muted property
  // AIDEV-NOTE: Why: Allows user to silence avatar without disconnecting, element persists for quick toggle
  // AIDEV-NOTE: Called by: Speaker button (Volume2/VolumeX icon) in control bar
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = audioEnabled; // AIDEV-NOTE: Inverts current state for toggle
    }
  };

  // AIDEV-NOTE: Toggles user microphone (mic button) - publishes/unpublishes local audio track to room
  // AIDEV-NOTE: How: If track exists → unpublish & stop, else → create track with audio processing & publish
  // AIDEV-NOTE: Why: Full publish/unpublish cycle releases device access, audio processing improves quality
  // AIDEV-NOTE: Called by: Microphone button (Mic/MicOff icon) in control bar
  const toggleMicrophone = async () => {
    if (!room) return;

    if (localAudioRef.current) {
      // AIDEV-NOTE: Unpublish path - remove track from room and stop device access
      await room.localParticipant.unpublishTrack(
        localAudioRef.current
      );
      localAudioRef.current.stop(); // AIDEV-NOTE: Releases microphone device access
      localAudioRef.current = null;
      setIsMuted(true);
    } else {
      // AIDEV-NOTE: Publish path - create track with audio processing and publish to room
      try {
        const track = await createLocalAudioTrack({
          echoCancellation: true,    // AIDEV-NOTE: Removes echo for better conversation quality
          noiseSuppression: true,    // AIDEV-NOTE: Reduces background noise
          autoGainControl: true,     // AIDEV-NOTE: Normalizes volume levels
        });
        localAudioRef.current = track;
        await room.localParticipant.publishTrack(track);
        setIsMuted(false);
      } catch (e) {
        console.error("Failed to publish audio:", e);
        // AIDEV-TODO: Show user-facing error if microphone permission denied
      }
    }
  };

  // AIDEV-NOTE: Publishes user microphone without toggle logic - always enables
  // AIDEV-NOTE: How: Creates local audio track with same processing as toggleMicrophone, publishes to room
  // AIDEV-NOTE: Why: Used during session initialization to auto-enable mic, separate from toggle for clarity
  // AIDEV-NOTE: Called by: Auto-enable in startLiveSession after room connection established
  const publishLocalAudio = async () => {
    // AIDEV-NOTE: Guard clauses - exit if no room or track already published
    if (!room) return;
    if (localAudioRef.current) {
      console.log("Microphone already enabled, skipping");
      return;
    }

    try {
      const track = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      localAudioRef.current = track;
      await room.localParticipant.publishTrack(track);
      setIsMuted(false);
      console.log("Microphone enabled successfully");
    } catch (e) {
      console.error("Failed to publish audio:", e);
      setIsMuted(true);
      // AIDEV-TODO: Show user-facing error if microphone permission denied
    }
  };

  // AIDEV-NOTE: Wires all LiveKit room events - handles data channel messages, participant attribute changes
  // AIDEV-NOTE: How: Listens to DataReceived (transcripts, state) and ParticipantAttributesChanged (agent state)
  // AIDEV-NOTE: Why: Central event hub for avatar communication - processes transcripts, state changes, demo triggers
  // AIDEV-NOTE: Called by: startLiveSession after room connection established
  // AIDEV-QUESTION: Demo trigger logic appears both here (line 746) and in detectIntent - consider consolidating?
  const wireRoomEvents = (r) => {
    // AIDEV-NOTE: DataReceived event - processes all data channel messages from avatar (transcripts, state events)
    r.on(
      RoomEvent.DataReceived,
      (
        payload,
        participant,
        kind
      ) => {
        // AIDEV-NOTE: Decode binary payload to text - HeyGen sends JSON messages via data channel
        let decoded;
        try {
          decoded = new TextDecoder().decode(payload);
        } catch (e) {
          return; // AIDEV-NOTE: Silently ignore decode errors (binary messages not meant for us)
        }

        // AIDEV-NOTE: Parse JSON - all HeyGen messages are JSON structured
        let parsedJson = null;
        try {
          parsedJson = JSON.parse(decoded);
        } catch (e) {
          return; // AIDEV-NOTE: Silently ignore non-JSON messages
        }

        // AIDEV-NOTE: Primary message format - uses 'type' field (HeyGen API v1 format)
        if (parsedJson && parsedJson.type) {
          const msgType = parsedJson.type;

          // AIDEV-NOTE: Avatar state changes - speaking/listening indicators for UI visual feedback
          if (msgType === "avatar_start_talking") {
            setIsAvatarSpeaking(true);
            setAvatarState("speaking");
          } else if (msgType === "avatar_stop_talking") {
            setIsAvatarSpeaking(false);
            setAvatarState("listening");
          } else if (msgType === "user_start_talking") {
            setIsUserSpeaking(true);
          } else if (msgType === "user_stop_talking") {
            setIsUserSpeaking(false);
          }
          // AIDEV-NOTE: Generic transcript handling - catches miscellaneous transcript messages
          else if (msgType === "transcript" || msgType === "transcription") {
            const text = parsedJson.text || parsedJson.transcript || "";
            log('TRANSCRIPT', '📝 Generic transcript received', { text, type: msgType });
            if (text) {
              setTranscripts((prev) =>
                [
                  ...prev,
                  {
                    type: "transcript",
                    text: text,
                    timestamp: Date.now(),
                  },
                ].slice(-10) // AIDEV-NOTE: Keep last 10 to prevent memory bloat
              );
              detectIntent(text, parsedJson, "user");
            }
          }
          // AIDEV-NOTE: User speech - routes to handleUserSpeech for centralized processing
          else if (msgType === "user_transcript" || msgType === "user_speech") {
            const text = parsedJson.text || parsedJson.transcript || "";
            handleUserSpeech(text, `type: ${msgType}`);
          }
          // AIDEV-NOTE: Avatar speech - routes to handleAvatarSpeech which saves to lastAvatarSpeechRef for demo triggers
          else if (
            msgType === "avatar_transcript" ||
            msgType === "avatar_speech" ||
            msgType === "llm_response"
          ) {
            const text = parsedJson.text || parsedJson.response || "";
            handleAvatarSpeech(text, `type: ${msgType}`);
          }
        } else if (parsedJson) {
          // AIDEV-NOTE: Fallback format - uses 'event_type' field (HeyGen API v2 format) for backward compatibility
          if (parsedJson.event_type === 'user.transcription') {
            const text = parsedJson.text || '';
            handleUserSpeech(text, 'event_type: user.transcription');
          } else if (parsedJson.event_type === 'avatar.transcription') {
            const text = parsedJson.text || '';
            handleAvatarSpeech(text, 'event_type: avatar.transcription');
          } else {
            // AIDEV-NOTE: Log unhandled messages for debugging new message types from HeyGen
            log('DATA_CHANNEL', '📨 Unhandled JSON message', parsedJson);
          }
        }
      }
    );

    // AIDEV-NOTE: ParticipantAttributesChanged - tracks LiveKit agent state for demo trigger timing
    r.on(
      RoomEvent.ParticipantAttributesChanged,
      (changedAttributes, participant) => {
        // AIDEV-NOTE: Check for agent state attribute - LiveKit sets 'lk.agent.state' on avatar participant
        if (changedAttributes && changedAttributes["lk.agent.state"]) {
          const agentState = changedAttributes["lk.agent.state"];
          setAvatarState(agentState);

          log('AGENT_STATE', `Agent state changed: ${previousAgentStateRef.current} → ${agentState}`);

          // AIDEV-NOTE: Demo trigger on speaking→listening transition - ensures avatar finished speaking before playing demo
          // AIDEV-NOTE: Why here: Guarantees timing (after speech complete), prevents interrupting avatar mid-sentence
          if (previousAgentStateRef.current === 'speaking' && agentState === 'listening') {
            // AIDEV-NOTE: 100ms delay ensures all transcript data processed before checking lastAvatarSpeechRef
            setTimeout(() => {
              const lastSpeech = lastAvatarSpeechRef.current;
              if (lastSpeech) {
                log('DEMO', 'Checking for demo trigger after avatar speech', { lastSpeech });
                const demoTrigger = checkForDemoTrigger(lastSpeech, videoTriggersConfig, log);
                if (demoTrigger && demoTrigger.matched && !isDemoPlaying) {
                  log('DEMO', '🎬 Demo trigger detected from avatar speech', demoTrigger);

                  // AIDEV-NOTE: Save widget state before maximizing - enables restore after demo ends (see useEffect)
                  preDemoWidgetStateRef.current = state;

                  // AIDEV-NOTE: Maximize widget for best demo viewing, 500ms delay prevents black screen bug
                  // AIDEV-NOTE: Why 500ms: Widget needs time to resize before video element is created/played
                  if (state !== "maximized") {
                    setState("maximized");
                    setTimeout(() => {
                      playDemoVideo(demoTrigger.videoUrl);
                    }, 500);
                  } else {
                    playDemoVideo(demoTrigger.videoUrl);
                  }
                }
              }
            }, 100);
          }

          // AIDEV-NOTE: Track previous state for transition detection (speaking→listening)
          previousAgentStateRef.current = agentState;
        }
      }
    );
  };

  // AIDEV-NOTE: Intent detection system - keyword-based actions triggered by user/avatar speech
  // AIDEV-NOTE: How: Array of intent objects with keywords, action functions, and descriptions
  // AIDEV-NOTE: Why: Enables conversational UI control for booking without clicking buttons
  // AIDEV-NOTE: Used by: detectIntent function checks transcript against all intent keywords
  // AIDEV-REMOVED: Screen control intents (maximize/minimize), email, and pricing intents - not needed for voice-first avatar interaction
  // AIDEV-REMOVED: "Book demo" intent - removed per user request, only meeting-related keywords should trigger calendly
  const intentActions = [
    // AIDEV-NOTE: Schedule meeting intent - opens calendly iframe overlay for meeting scheduling
    // AIDEV-NOTE: Waits for avatar to finish speaking before opening Calendly window
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
        // AIDEV-NOTE: Set pending flag - useEffect will wait for avatar to finish speaking, then open Calendly
        log('CALENDLY', 'Schedule meeting intent detected - waiting for avatar to finish speaking');
        pendingCalendlyRef.current = true;
        setDetectedIntents((prev) => [...prev, "schedule_meeting"].slice(-5));
      },
      description: "Schedule meeting",
    },
  ];

  // AIDEV-NOTE: Detects intents from transcripts and triggers corresponding actions
  // AIDEV-NOTE: How: Checks demo triggers first (priority), then loops through intentActions for keyword matches
  // AIDEV-NOTE: Why: Demo triggers take priority to prevent other intents from interrupting video playback
  // AIDEV-NOTE: Called by: handleUserSpeech, handleAvatarSpeech, and generic transcript handlers in wireRoomEvents
  const detectIntent = (
    transcript,
    fullData,
    source
  ) => {
    const lowerTranscript = transcript.toLowerCase();

    // AIDEV-NOTE: Check demo triggers FIRST (priority) - early return prevents other intent conflicts
    // AIDEV-NOTE: Uses token-based matching algorithm for more accurate trigger detection than simple keyword match
    const demoTrigger = checkForDemoTrigger(transcript, videoTriggersConfig, log);
    if (demoTrigger && demoTrigger.matched && !isDemoPlaying) {
      log('DEMO', '🎬 Demo video trigger detected', demoTrigger);

      // AIDEV-NOTE: Maximize for demo viewing (no 500ms delay here, handled in wireRoomEvents avatar_stop_talking)
      if (state !== "maximized") {
        setState("maximized");
      }

      playDemoVideo(demoTrigger.videoUrl);
      setDetectedIntents((prev) => [...prev, 'show_demo'].slice(-5));
      return; // AIDEV-NOTE: Early return prevents processing other intents during demo playback
    }

    // AIDEV-NOTE: Process other intents - loops through intentActions array for keyword matches
    intentActions.forEach((intent) => {
      const matched = intent.keywords.some((keyword) =>
        lowerTranscript.includes(keyword.toLowerCase()) // AIDEV-NOTE: Case-insensitive substring match
      );

      if (matched) {
        log('INTENT_DETECTED', `🎯 ${intent.description}`, { transcript, source });
        intent.action(); // AIDEV-NOTE: Executes action function (opens booking, changes size, shows message)
      }
    });
  };

  // AIDEV-NOTE: Sends text message to avatar via LiveKit data channel
  // AIDEV-NOTE: How: Encodes message as UTF-8 bytes, publishes via room.localParticipant.publishData with RELIABLE delivery
  // AIDEV-NOTE: Why: RELIABLE ensures message delivery (vs LOSSY), critical for chat messages to reach avatar
  // AIDEV-NOTE: Called by: handleSendMessage (chat input), handleQuickAction (quick action buttons)
  const sendDataToAvatar = async (message) => {
    if (!room) return;

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message); // AIDEV-NOTE: Convert string to UTF-8 byte array for LiveKit data channel
      await room.localParticipant.publishData(
        data,
        DataPacket_Kind.RELIABLE // AIDEV-NOTE: RELIABLE guarantees delivery, LOSSY would be faster but may drop messages
      );
    } catch (e) {
      console.error("Failed to send data:", e);
      // AIDEV-TODO: Show user-facing error if message send fails
    }
  };

  // AIDEV-NOTE: Predefined quick action prompts - shown as buttons above avatar to encourage engagement
  // AIDEV-NOTE: Why: Reduces friction for users unsure what to ask, demonstrates avatar capabilities
  const quickActions = [
    "Tell me about Qudemo's pro...",
    "How can I use Qudemo?",
    "What can you do?",
  ];

  // AIDEV-NOTE: Handles quick action button clicks - sends predefined prompts to avatar via voice
  // AIDEV-NOTE: How: Sends action text to avatar via LiveKit data channel, calls handleActivity (placeholder)
  // AIDEV-NOTE: Why: Provides convenient shortcuts for common questions without typing
  // AIDEV-NOTE: Called by: Quick action button clicks in UI (shown when not in live mode)
  const handleQuickAction = (action) => {
    handleActivity(); // AIDEV-NOTE: Activity tracking placeholder (inactivity timeout removed)
    // AIDEV-NOTE: Send prompt to avatar if session is active
    if (hasLiveVideo && room) {
      sendDataToAvatar(action);
    }
  };

  // AIDEV-NOTE: Calculates widget width based on state and device type
  // AIDEV-NOTE: How: Returns pixel values based on state (minimized/small/medium/maximized) and isMobile
  // AIDEV-NOTE: Why: Responsive design - mobile uses viewport width, desktop uses fixed values
  // AIDEV-NOTE: Called by: framer-motion animate prop for smooth width transitions
  const getCurrentWidth = () => {
    if (state === "minimized") return isMobile ? 80 : 120; // AIDEV-NOTE: Tiny circle for minimized state
    if (state === "small")
      return isMobile ? 280 : 320; // AIDEV-NOTE: Compact video size
    if (state === "medium")
      return isMobile ? 320 : 480; // AIDEV-NOTE: Medium video size
    if (state === "maximized") {
      // AIDEV-NOTE: When calendly is open, use wider width (60% viewport, 900px max) for better calendly fit
      if (showCalendly) {
        return isMobile ? window.innerWidth - 32 : Math.min(900, window.innerWidth * 0.6);
      }
      return isMobile ? window.innerWidth - 32 : window.innerWidth * 0.8; // AIDEV-NOTE: 80% of viewport for maximized
    }
    return isMobile ? 280 : 420; // AIDEV-NOTE: Default fallback
  };

  // AIDEV-NOTE: Calculates widget height based on state and device type
  // AIDEV-NOTE: How: Returns pixel values or viewport percentages based on state and isMobile
  // AIDEV-NOTE: Why: Responsive design for different widget states
  // AIDEV-NOTE: Called by: framer-motion animate prop for smooth height transitions
  const getCurrentHeight = () => {
    if (state === "minimized") return isMobile ? 120 : 160; // AIDEV-NOTE: Circular minimized state
    if (state === "small")
      return isMobile ? 360 : 420; // AIDEV-NOTE: Compact video size
    if (state === "medium")
      return isMobile ? 440 : 520; // AIDEV-NOTE: Medium video size
    if (state === "maximized") {
      // AIDEV-NOTE: When calendly is open, use taller height (900px max) for better calendly fit
      if (showCalendly) {
        return isMobile
          ? window.innerHeight - 64 // AIDEV-NOTE: Full height minus top padding for mobile
          : Math.min(900, window.innerHeight * 0.85); // AIDEV-NOTE: Desktop capped at 900px or 85% viewport for calendly
      }
      return isMobile
        ? window.innerHeight - 64 // AIDEV-NOTE: Full height minus top padding for mobile
        : Math.min(720, window.innerHeight * 0.8); // AIDEV-NOTE: Desktop capped at 720px or 80% viewport
    }
    return 420; // AIDEV-NOTE: Default fallback
  };

  // AIDEV-NOTE: Calculates widget position (bottom-right corner positioning)
  // AIDEV-NOTE: How: Returns {bottom, right} pixel values based on state and isMobile
  // AIDEV-NOTE: Why: Maximized state centers more (10% margin), other states stay in corner (16-32px margin)
  // AIDEV-NOTE: Called by: framer-motion style prop for absolute positioning
  const getPosition = () => {
    if (state === "maximized") {
      return {
        bottom: isMobile ? 16 : Math.max(32, window.innerHeight * 0.1), // AIDEV-NOTE: 10% bottom margin on desktop for centering
        right: isMobile ? 16 : Math.max(32, window.innerWidth * 0.1), // AIDEV-NOTE: 10% right margin on desktop for centering
      };
    }
    return { bottom: isMobile ? 16 : 32, right: isMobile ? 16 : 32 }; // AIDEV-NOTE: Fixed corner position for non-maximized
  };

  // AIDEV-NOTE: Main render - widget container with animated size transitions using framer-motion
  // AIDEV-NOTE: transformOrigin bottom-right ensures expansion animates from corner, not center
  return (
    <AnimatePresence>
      <motion.div
        style={{
          position: "fixed",
          zIndex: 50,
          backgroundColor: "#1f2937",
          border: "1px solid #374151",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          transformOrigin: "bottom right", // AIDEV-NOTE: Critical for proper animation - expands from corner
          ...getPosition(),
        }}
        animate={{
          width: getCurrentWidth(),
          height: getCurrentHeight(),
          borderRadius: state === "minimized" ? 16 : 24,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }} // AIDEV-NOTE: Spring animation for natural feel
        onClick={handleActivity}
      >
        {/* AIDEV-NOTE: Minimized view - avatar thumbnail with pulse indicator, clicks to expand and start LiveSession */}
        {state === "minimized" ? (
          <button
            onClick={() => {
              setState("small");
              startLiveSession();
            }}
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              overflow: "hidden",
              borderRadius: "16px",
              border: "none",
              cursor: "pointer",
              background: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage: "url(/ai-avatar.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                borderRadius: "16px",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "12px",
                height: "12px",
                backgroundColor: "#3b82f6",
                borderRadius: "50%",
                animation: "pulse 2s infinite",
              }}
            />
          </button>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "row",
              backgroundColor: "#111827",
            }}
          >
            <div
              style={{
                flex: 1,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: state === "small" ? "8px" : "16px",
                  left: state === "small" ? "8px" : "16px",
                  right: state === "small" ? "8px" : "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  zIndex: 10,
                  gap: "8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {state === "small" && (
                    <button
                      onClick={() => setState("medium")}
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "6px",
                        padding: "8px",
                        cursor: "pointer",
                        color: "white",
                      }}
                    >
                      <Maximize2 style={{ width: "16px", height: "16px" }} />
                    </button>
                  )}

                  {state === "medium" && (
                    <>
                      <button
                        onClick={() => {
                          setState("small");
                        }}
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          backdropFilter: "blur(4px)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "6px",
                          padding: "8px",
                          cursor: "pointer",
                          color: "white",
                        }}
                      >
                        <Minimize2 style={{ width: "16px", height: "16px" }} />
                      </button>
                      <button
                        onClick={() => setState("maximized")}
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          backdropFilter: "blur(4px)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "6px",
                          padding: "8px",
                          cursor: "pointer",
                          color: "white",
                        }}
                      >
                        <Maximize2 style={{ width: "16px", height: "16px" }} />
                      </button>
                    </>
                  )}

                  {state === "maximized" && (
                    <button
                      onClick={() => setState("medium")}
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "6px",
                        padding: "8px",
                        cursor: "pointer",
                        color: "white",
                      }}
                    >
                      <Minimize2 style={{ width: "16px", height: "16px" }} />
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => {
                      handleActivity();
                      // AIDEV-NOTE: Button click opens Calendly immediately without waiting for avatar to finish speaking
                      // AIDEV-NOTE: The useEffect that watches isAvatarSpeaking will handle muting automatically
                      log('CALENDLY', 'Book a Meeting button clicked - opening Calendly immediately');
                      preCalendlyWidgetStateRef.current = state;
                      if (state !== "maximized") {
                        setState("maximized");
                      }
                      setShowCalendly(true);
                    }}
                    style={{
                      backgroundColor: "#3b82f6",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "50px",
                      fontSize: "12px",
                      fontWeight: "500",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Book a Meeting
                  </button>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, rgba(55, 65, 81, 0.3), rgba(17, 24, 39, 1))",
                  position: "relative",
                  minHeight: 0,
                }}
              >
                {isConnecting ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        border: "2px solid white",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        marginBottom: "8px",
                      }}
                    />
                    <p style={{ fontSize: "14px" }}>
                      Qudemo Connecting
                    </p>
                  </div>
                ) : hasLiveVideo || room ? (
                  // AIDEV-NOTE: LiveKit video container - attaches remote video tracks, shows 'waiting for video' fallback
                  // AIDEV-NOTE: attachTrackToDom function creates <video> element inside this container
                  <div
                    id="live-video-container"
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {!document
                      .getElementById("live-video-container")
                      ?.querySelector("video") && (
                      <div
                        style={{
                          color: "white",
                          fontSize: "14px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            marginBottom: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Video style={{ width: "16px", height: "16px" }} />
                          Waiting for video...
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            opacity: 0.7,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Volume2 style={{ width: "12px", height: "12px" }} />
                          Audio
                        </div>
                      </div>
                    )}
                  </div>
                ) : !isVoiceMode ? (
                  <AnimatePresence mode="wait">
                    {isTransitioning ? (
                      <motion.div
                        key="transition"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            border: "2px solid white",
                            borderTop: "2px solid transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            marginBottom: "8px",
                          }}
                        />
                        <p style={{ fontSize: "14px" }}>
                          {transitionToScreenShare
                            ? "Loading preview..."
                            : "Closing preview..."}
                        </p>
                      </motion.div>
                    ) : isScreenSharing ? (
                      <motion.div
                        key="screenshare"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          width: "100%",
                          height: "100%",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "32px",
                          }}
                        >
                          <img
                            src="/screenshare.png"
                            alt="Screen Share"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                              borderRadius: "8px",
                              boxShadow:
                                "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            }}
                          />
                        </div>
                        <motion.div
                          initial={{ opacity: 0, x: 20, y: -20 }}
                          animate={{ opacity: 1, x: 0, y: 0 }}
                          transition={{ delay: 0.2 }}
                          style={{
                            position: "absolute",
                            top: "64px",
                            right: "16px",
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "3px solid white",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              backgroundImage: "url(/ai-avatar.jpg)",
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              backgroundRepeat: "no-repeat",
                            }}
                          />
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="normal"
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundImage: "url(/ai-avatar.jpg)",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </AnimatePresence>
                ) : (
                  <motion.div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundImage: "url(/ai-avatar.jpg)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                )}

                {/* AIDEV-NOTE: Quick action buttons - displayed above control bar when not in live session, triggers handleQuickAction */}
                {/* AIDEV-NOTE: Why hidden during live: User can speak directly to avatar instead of clicking suggestions */}
                {!hasLiveVideo && !isVoiceMode && (
                  <motion.div
                    style={{
                      position: "absolute",
                      bottom:
                        state === "small"
                          ? "64px"
                          : state === "medium"
                          ? "64px"
                          : "80px",
                      left: 0,
                      right: 0,
                      display: "flex",
                      gap:
                        state === "small"
                          ? "4px"
                          : state === "medium"
                          ? "6px"
                          : "8px",
                      justifyContent:
                        state === "small" || state === "medium"
                          ? "flex-start"
                          : "center",
                      padding:
                        state === "small"
                          ? "0 24px"
                          : state === "medium"
                          ? "0 24px"
                          : "0 16px",
                      overflowX: "auto",
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {/* AIDEV-NOTE: Each button has hover/tap scale animations for tactile feedback */}
                    {quickActions.map((action, i) => (
                      <motion.button
                        key={i}
                        onClick={() => handleQuickAction(action)}
                        style={{
                          padding:
                            state === "small"
                              ? "4px 8px"
                              : state === "medium"
                              ? "6px 10px"
                              : "8px 16px",
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          color: "white",
                          borderRadius: "50px",
                          fontWeight: "500",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          backdropFilter: "blur(4px)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          fontSize:
                            state === "small"
                              ? "12px"
                              : state === "medium"
                              ? "12px"
                              : "14px",
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {action}
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* AIDEV-NOTE: Live session status overlay - shows avatar state (speaking/listening/thinking/idle) and user speaking indicator */}
                {hasLiveVideo && sessionInfo && (
                  <div
                    style={{
                      position: "absolute",
                      top: "60px",
                      left: "16px",
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      color: "white",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      backdropFilter: "blur(4px)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    {/* <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Radio style={{ width: '10px', height: '10px', color: '#ef4444' }} />
                      Live Session
                    </div> */}
                    <div
                      style={{
                        fontSize: "10px",
                        opacity: 0.8,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {avatarState === "speaking" && (
                        <>
                          <MessageSquare
                            style={{ width: "10px", height: "10px" }}
                          />{" "}
                          Speaking
                        </>
                      )}
                      {avatarState === "listening" && (
                        <>
                          <Ear style={{ width: "10px", height: "10px" }} />{" "}
                          Listening
                        </>
                      )}
                      {avatarState === "thinking" && (
                        <>
                          <Brain style={{ width: "10px", height: "10px" }} />{" "}
                          Thinking
                        </>
                      )}
                      {avatarState === "idle" && (
                        <>
                          <Smile style={{ width: "10px", height: "10px" }} />{" "}
                          Ready
                        </>
                      )}
                    </div>
                    {isUserSpeaking && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#60a5fa",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Mic style={{ width: "10px", height: "10px" }} />
                        You're speaking
                      </div>
                    )}
                  </div>
                )}

                {/* AIDEV-NOTE: Demo video fullscreen overlay - positioned absolute to prevent shrinking, includes avatar PIP at bottom-right */}
                {/* AIDEV-NOTE: Why absolute positioning outside live-video-container: Prevents demo video from shrinking when avatar moves to corner */}
                {/* AIDEV-NOTE: PIP clones avatar MediaStream to maintain visibility during demo (YouTube-style) */}
                {isDemoPlaying && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      zIndex: 100, // AIDEV-NOTE: High z-index ensures demo covers everything including avatar
                      backgroundColor: "#000",
                    }}
                  >
                    <video
                      ref={demoVideoRef}
                      controls
                      autoPlay
                      playsInline
                      preload="auto"
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        background: "#000",
                      }}
                      onEnded={stopDemoVideo}
                      onLoadStart={() => log('DEMO', '📹 Video load started')}
                      onLoadedMetadata={() => log('DEMO', '📹 Video metadata loaded')}
                      onLoadedData={() => log('DEMO', '📹 Video data loaded')}
                      onCanPlay={() => log('DEMO', '📹 Video can play')}
                      onPlaying={() => log('DEMO', '▶️ Video is playing')}
                      onError={(e) => {
                        const video = demoVideoRef.current;
                        const errorDetails = {
                          error: e,
                          videoSrc: video?.src,
                          networkState: video?.networkState,
                          readyState: video?.readyState,
                          errorCode: video?.error?.code,
                          errorMessage: video?.error?.message,
                        };
                        log('ERROR', 'Demo video failed to load', errorDetails);
                        stopDemoVideo();
                      }}
                    />

                    {/* Avatar Picture-in-Picture */}
                    <div
                      id="avatar-pip"
                      style={{
                        position: "absolute",
                        bottom: "20px",
                        right: "20px",
                        width: "200px",
                        height: "150px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "3px solid rgba(255, 255, 255, 0.9)",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.8)",
                        zIndex: 101,
                        backgroundColor: "#000",
                      }}
                    />

                    <button
                      onClick={stopDemoVideo}
                      style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        padding: "8px 16px",
                        background: "rgba(239, 68, 68, 0.95)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "14px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        zIndex: 102,
                      }}
                    >
                      ⏹️ Stop Demo
                    </button>
                  </div>
                )}

                {/* AIDEV-NOTE: Calendly iframe overlay - fullscreen booking calendar with avatar PIP in bottom-right */}
                {/* AIDEV-NOTE: Why similar to demo: Reuses demo video pattern for consistent UX (fullscreen overlay + avatar PIP) */}
                {/* AIDEV-NOTE: Close button on top-right allows user to dismiss and return to normal avatar view */}
                {showCalendly && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      zIndex: 100, // AIDEV-NOTE: High z-index ensures calendly covers everything including avatar
                      backgroundColor: "#fff",
                    }}
                  >
                    {/* AIDEV-NOTE: Calendly iframe - loads booking page from config file */}
                    <iframe
                      src={bookingConfig.calendlyUrl}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{
                        border: "none",
                        width: "100%",
                        height: "100%",
                      }}
                      title="Book a Meeting"
                    />

                    {/* AIDEV-NOTE: Avatar Picture-in-Picture - shows avatar in bottom-right corner during booking */}
                    {/* AIDEV-NOTE: Why PIP: Maintains avatar presence, mimics demo video UX pattern */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "20px",
                        right: "20px",
                        width: isMobile ? "120px" : "200px",
                        height: isMobile ? "90px" : "150px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "3px solid rgba(59, 130, 246, 0.9)",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.8)",
                        zIndex: 101,
                        backgroundColor: "#000",
                      }}
                    >
                      {/* AIDEV-NOTE: PIP shows LiveKit video if active, otherwise static avatar image */}
                      {hasLiveVideo ? (
                        <div
                          id="calendly-avatar-pip"
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "#000",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundImage: "url(/ai-avatar.jpg)",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                          }}
                        />
                      )}
                    </div>

                    {/* AIDEV-NOTE: Close button - top-right position, dismisses calendly and returns to normal view */}
                    <button
                      onClick={() => setShowCalendly(false)}
                      style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        padding: "8px 16px",
                        background: "rgba(239, 68, 68, 0.95)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "14px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        zIndex: 102,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <X style={{ width: "16px", height: "16px" }} />
                      Close
                    </button>
                  </div>
                )}

                {/* AIDEV-NOTE: Demo playing indicator - shows when demo video is active, informs user mic is paused */}
                {isDemoPlaying && (
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      left: "16px",
                      right: "16px",
                      backgroundColor: "rgba(59, 130, 246, 0.9)",
                      color: "white",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      backdropFilter: "blur(4px)",
                      textAlign: "center",
                      fontWeight: "500",
                    }}
                  >
                    🎬 Demo Playing • Microphone Paused
                  </div>
                )}

                {/* AIDEV-REMOVED: Intent detection badge - removed per user request, no visual intent indicators needed */}

                {/* AIDEV-NOTE: Transcript overlay - shows last 3 transcripts in maximized mode for debugging/visibility */}
                {/* AIDEV-NOTE: Only in maximized state to avoid cluttering smaller widget sizes */}
                {/* AIDEV-NOTE: Hidden when Calendly or demo video is showing to keep UI clean */}
                {transcripts.length > 0 && state === "maximized" && !showCalendly && !isDemoPlaying && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100px",
                      left: "16px",
                      right: "16px",
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      color: "white",
                      padding: "8px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      backdropFilter: "blur(4px)",
                      maxHeight: "120px",
                      overflowY: "auto",
                    }}
                  >
                    {transcripts.slice(-3).map((transcript, i) => (
                      <div
                        key={i}
                        style={{ marginBottom: "2px", opacity: 0.9 }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                        >
                          {transcript.type.includes("user") ? (
                            <User
                              style={{
                                width: "12px",
                                height: "12px",
                                color: "#60a5fa",
                              }}
                            />
                          ) : (
                            <Bot
                              style={{
                                width: "12px",
                                height: "12px",
                                color: "#10b981",
                              }}
                            />
                          )}
                          <span style={{ textAlign: "center" }}>{transcript.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    position: "absolute",
                    bottom: "2px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "300",
                      color: "rgba(255, 255, 255, 0.9)",
                      textShadow:
                        "0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)",
                    }}
                  >
                    Powered by{" "}
                    <a
                      href="https://qudemo.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#60a5fa",
                        fontWeight: "bold",
                        textDecoration: "none",
                        textShadow: "none",
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.color = "#93c5fd";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = "#60a5fa";
                      }}
                    >
                      Qudemo
                    </a>
                  </span>
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    left:
                      state === "small"
                        ? "8px"
                        : state === "medium"
                        ? "12px"
                        : "16px",
                    right:
                      state === "small"
                        ? "8px"
                        : state === "medium"
                        ? "12px"
                        : "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  {/* AIDEV-NOTE: Control panel - action buttons (mic, speaker, disconnect) centered for better UX */}
                  {/* AIDEV-NOTE: Why button states: Red when muted/disabled, green when active/speaking, black when idle */}
                  {/* AIDEV-REMOVED: Voice/Video mode toggle removed - widget now always in voice mode (static avatar image) */}
                  {/* AIDEV-NOTE: Action buttons - mic (user input), speaker (avatar audio), disconnect (end session) */}
                  {/* AIDEV-NOTE: Button sizes scale with widget state - small: 40px, medium: 44px, maximized: 48px */}
                  <div
                    style={{
                      display: "flex",
                      gap:
                        state === "small"
                          ? "8px"
                          : state === "medium"
                          ? "10px"
                          : "12px",
                    }}
                  >
                    {/* AIDEV-NOTE: Mic button - toggles user input via toggleMicrophone (LiveKit) or local mute state */}
                    {/* AIDEV-NOTE: Pulse animation plays when user is speaking to provide visual feedback */}
                    <button
                      onClick={
                        hasLiveVideo
                          ? toggleMicrophone
                          : () => setIsMuted(!isMuted)
                      }
                      style={{
                        width:
                          state === "small"
                            ? "40px"
                            : state === "medium"
                            ? "44px"
                            : "48px",
                        height:
                          state === "small"
                            ? "40px"
                            : state === "medium"
                            ? "44px"
                            : "48px",
                        backgroundColor: isMuted
                          ? "rgba(239, 68, 68, 0.7)"
                          : isUserSpeaking
                          ? "rgba(34, 197, 94, 0.7)"
                          : "rgba(0, 0, 0, 0.7)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(4px)",
                        cursor: "pointer",
                        color: "white",
                        animation: isUserSpeaking
                          ? "pulse 1s infinite"
                          : "none",
                      }}
                    >
                      {isMuted ? (
                        <MicOff style={{ width: "16px", height: "16px" }} />
                      ) : (
                        <Mic style={{ width: "16px", height: "16px" }} />
                      )}
                    </button>

                    {/* AIDEV-NOTE: Speaker button - toggles avatar audio output, only shown when hasAudio is true */}
                    {/* AIDEV-NOTE: Green pulse when avatar is speaking, red when muted, matches mic button pattern */}
                    {hasAudio && (
                      <button
                        onClick={toggleAudio}
                        style={{
                          width:
                            state === "small"
                              ? "40px"
                              : state === "medium"
                              ? "44px"
                              : "48px",
                          height:
                            state === "small"
                              ? "40px"
                              : state === "medium"
                              ? "44px"
                              : "48px",
                          backgroundColor: !audioEnabled
                            ? "rgba(239, 68, 68, 0.7)"
                            : isAvatarSpeaking
                            ? "rgba(34, 197, 94, 0.7)"
                            : "rgba(0, 0, 0, 0.7)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          backdropFilter: "blur(4px)",
                          cursor: "pointer",
                          color: "white",
                          animation: isAvatarSpeaking
                            ? "pulse 1s infinite"
                            : "none",
                        }}
                      >
                        {!audioEnabled ? (
                          <VolumeX
                            style={{ width: "16px", height: "16px" }}
                          />
                        ) : (
                          <Volume2
                            style={{ width: "16px", height: "16px" }}
                          />
                        )}
                      </button>
                    )}

                    {/* AIDEV-NOTE: Disconnect button - ends LiveKit session and resets widget, red color indicates destructive action */}
                    <button
                      onClick={handleDisconnect}
                      style={{
                        width:
                          state === "small"
                            ? "40px"
                            : state === "medium"
                            ? "44px"
                            : "48px",
                        height:
                          state === "small"
                            ? "40px"
                            : state === "medium"
                            ? "44px"
                            : "48px",
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        cursor: "pointer",
                        color: "#ef4444",
                      }}
                    >
                      <PhoneOff style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AIDEV-NOTE: Booking popup modal - triggered by 'book a meeting' intent, shows contact form */}
        {/* AIDEV-NOTE: Why AnimatePresence: Enables fade-out animation on close, z-index 50 keeps it above all other UI */}
        <AnimatePresence>
          {showBookingPopup && (
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* AIDEV-NOTE: Modal card with scale animation - starts at 90% scale for smooth pop-in effect */}
              <motion.div
                style={{
                  backgroundColor: "white",
                  borderRadius: "16px",
                  padding: isMobile ? "16px" : "24px",
                  width: "320px",
                  maxWidth: "90%",
                  margin: "16px",
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <img
                    src="/ai-avatar.jpg"
                    alt="Catherine"
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  <div>
                    <h3
                      style={{ fontWeight: "600", color: "#111827", margin: 0 }}
                    >
                      Book with Catherine
                    </h3>
                    <p
                      style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}
                    >
                      Qudemo Ambassador
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBookingPopup(false)}
                    style={{
                      marginLeft: "auto",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                    }}
                  >
                    <X style={{ width: "20px", height: "20px" }} />
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "white",
                        color: "#111827",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      Select Date
                    </label>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "white",
                        color: "#111827",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="" style={{ color: "#6b7280" }}>
                        Choose a date
                      </option>
                      {availableDates.map((date) => (
                        <option
                          key={date}
                          value={date}
                          style={{ color: "#111827" }}
                        >
                          {new Date(date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      Select Time
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                      }}
                    >
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          style={{
                            padding: "8px",
                            fontSize: "14px",
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            cursor: "pointer",
                            backgroundColor:
                              selectedTime === time ? "#d1d5db" : "#f9fafb",
                            color:
                              selectedTime === time ? "#1f2937" : "#6b7280",
                          }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedDate && selectedTime && email) {
                        setShowBookingPopup(false);
                        // AIDEV-NOTE: In production, this would send booking data to backend API
                        // Avatar will confirm booking via voice response
                        setSelectedDate("");
                        setSelectedTime("");
                        setEmail("");
                      }
                    }}
                    disabled={!selectedDate || !selectedTime || !email}
                    style={{
                      width: "100%",
                      backgroundColor:
                        !selectedDate || !selectedTime || !email
                          ? "#d1d5db"
                          : "#2563eb",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontWeight: "500",
                      border: "none",
                      cursor:
                        !selectedDate || !selectedTime || !email
                          ? "not-allowed"
                          : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <Calendar style={{ width: "16px", height: "16px" }} />
                    Book Meeting
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

