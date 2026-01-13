import { useState, useRef, useEffect } from 'react';

/**
 * useDemoVideo - Hook for managing demo video playback during Tavus conversations
 *
 * Adapted from mobile version for Daily.co/Tavus integration
 * Supports both direct video URLs and YouTube embeds
 *
 * @param {object} params
 * @param {object} params.sessionManager - TavusSessionManager instance
 * @param {function} params.log - Logging function
 * @param {function} params.setState - State setter for widget state
 */

// Helper to detect and convert YouTube URLs to embed format
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;

  // Match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      // Get origin safely
      const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
      
      // Try regular youtube.com first (more compatible), fallback to nocookie if needed
      // Use youtube.com for better compatibility - some videos don't work with nocookie
      const embedUrl = `https://www.youtube.com/embed/${videoId}?` +
        `autoplay=1&` +
        `rel=0&` + // Don't show related videos from other channels
        `modestbranding=1&` + // Minimal branding
        `controls=1&` + // Show controls
        `fs=1&` + // Allow fullscreen
        `playsinline=1&` + // Play inline on mobile
        `enablejsapi=1` + // Enable JS API
        (origin ? `&origin=${encodeURIComponent(origin)}&widget_referrer=${encodeURIComponent(origin)}` : '');
      return embedUrl;
    }
  }

  return null;
};

const isYouTubeUrl = (url) => {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'));
};

export function useDemoVideo({ sessionManager, log, setState, onVideoStart, onVideoStop }) {
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [isYouTube, setIsYouTube] = useState(false);
  const [youTubeEmbedUrl, setYouTubeEmbedUrl] = useState('');
  const demoVideoRef = useRef(null);
  const stopInProgressRef = useRef(false); // Guard against duplicate stopDemoVideo calls

  // Use refs to always get the latest callbacks (avoid stale closures)
  const onVideoStopRef = useRef(onVideoStop);
  const onVideoStartRef = useRef(onVideoStart);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onVideoStopRef.current = onVideoStop;
    onVideoStartRef.current = onVideoStart;
  }, [onVideoStop, onVideoStart]);

  // Effect to handle video loading when demo starts playing (non-YouTube only)
  useEffect(() => {
    log('DEMO', '🔄 [EFFECT] Video loading effect triggered', {
      isDemoPlaying,
      hasVideoUrl: !!currentVideoUrl,
      hasDemoVideoRef: !!demoVideoRef.current,
      videoUrl: currentVideoUrl,
      isYouTube
    });

    // Skip video element loading for YouTube - it uses iframe
    if (isYouTube) {
      log('DEMO', '⏭️ [EFFECT] Skipping video element - YouTube uses iframe');
      return;
    }

    if (isDemoPlaying && currentVideoUrl && demoVideoRef.current) {
      const demoVideo = demoVideoRef.current;
      log('DEMO', '📹 [EFFECT] Setting video source', {
        videoUrl: currentVideoUrl,
        currentSrc: demoVideo.src,
        readyState: demoVideo.readyState,
        networkState: demoVideo.networkState
      });

      demoVideo.src = currentVideoUrl;
      log('DEMO', '📹 [EFFECT] Video src set, calling load()');
      demoVideo.load();
      log('DEMO', '📹 [EFFECT] Video load() called');

      // Wait for video to be ready before playing
      const onCanPlay = () => {
        log('DEMO', '✅ [EFFECT] Video canplay event fired - attempting play', {
          videoWidth: demoVideo.videoWidth,
          videoHeight: demoVideo.videoHeight,
          clientWidth: demoVideo.clientWidth,
          clientHeight: demoVideo.clientHeight,
          offsetWidth: demoVideo.offsetWidth,
          offsetHeight: demoVideo.offsetHeight,
          readyState: demoVideo.readyState,
          duration: demoVideo.duration,
          currentTime: demoVideo.currentTime,
          paused: demoVideo.paused
        });

        const playPromise = demoVideo.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              log('DEMO', '▶️ [EFFECT] Demo video playing successfully (muted)', {
                currentTime: demoVideo.currentTime,
                paused: demoVideo.paused,
                videoWidth: demoVideo.videoWidth,
                videoHeight: demoVideo.videoHeight,
                duration: demoVideo.duration,
                muted: demoVideo.muted
              });

              // Unmute the video after it starts playing
              log('DEMO', '🔊 [EFFECT] Attempting to unmute demo video');
              demoVideo.muted = false;
              log('DEMO', '🔊 [EFFECT] Demo video unmuted - playing with audio', {
                muted: demoVideo.muted,
                volume: demoVideo.volume
              });
            })
            .catch((error) => {
              log('ERROR', '❌ [EFFECT] Video play failed', {
                error: error.message,
                errorName: error.name,
                videoUrl: currentVideoUrl,
                readyState: demoVideo.readyState,
                networkState: demoVideo.networkState,
                paused: demoVideo.paused
              });
              log('DEMO', '⏹️ [EFFECT] Setting isDemoPlaying=false due to play error');
              setIsDemoPlaying(false);
            });
        } else {
          log('DEMO', '⚠️ [EFFECT] play() returned undefined (synchronous play)');
        }
      };

      log('DEMO', '👂 [EFFECT] Adding canplay event listener');
      demoVideo.addEventListener('canplay', onCanPlay, { once: true });

      // Add additional event listeners for debugging
      const onLoadStart = () => log('DEMO', '📥 [EFFECT] Video loadstart event');
      const onLoadedMetadata = () => log('DEMO', '📊 [EFFECT] Video loadedmetadata event', {
        duration: demoVideo.duration,
        videoWidth: demoVideo.videoWidth,
        videoHeight: demoVideo.videoHeight
      });
      const onLoadedData = () => log('DEMO', '📦 [EFFECT] Video loadeddata event');
      const onPlaying = () => log('DEMO', '▶️ [EFFECT] Video playing event');
      const onPause = () => log('DEMO', '⏸️ [EFFECT] Video pause event');
      const onEnded = () => log('DEMO', '🏁 [EFFECT] Video ended event');
      const onError = (e) => log('ERROR', '❌ [EFFECT] Video error event', {
        error: demoVideo.error,
        errorCode: demoVideo.error?.code,
        errorMessage: demoVideo.error?.message
      });

      demoVideo.addEventListener('loadstart', onLoadStart);
      demoVideo.addEventListener('loadedmetadata', onLoadedMetadata);
      demoVideo.addEventListener('loadeddata', onLoadedData);
      demoVideo.addEventListener('playing', onPlaying);
      demoVideo.addEventListener('pause', onPause);
      demoVideo.addEventListener('ended', onEnded);
      demoVideo.addEventListener('error', onError);

      return () => {
        log('DEMO', '🧹 [EFFECT] Cleanup - removing event listeners');
        demoVideo.removeEventListener('canplay', onCanPlay);
        demoVideo.removeEventListener('loadstart', onLoadStart);
        demoVideo.removeEventListener('loadedmetadata', onLoadedMetadata);
        demoVideo.removeEventListener('loadeddata', onLoadedData);
        demoVideo.removeEventListener('playing', onPlaying);
        demoVideo.removeEventListener('pause', onPause);
        demoVideo.removeEventListener('ended', onEnded);
        demoVideo.removeEventListener('error', onError);
      };
    } else {
      log('DEMO', '⏭️ [EFFECT] Skipping video load - conditions not met');
    }
  }, [isDemoPlaying, currentVideoUrl, log]);

  const playDemoVideo = (videoUrl) => {
    if (isDemoPlaying) {
      log('DEMO', '⚠️ Demo already playing, ignoring request');
      return;
    }

    // Reset the stop guard when starting a new video
    stopInProgressRef.current = false;

    try {
      // Check if this is a YouTube URL
      const ytUrl = isYouTubeUrl(videoUrl);
      const embedUrl = ytUrl ? getYouTubeEmbedUrl(videoUrl) : null;

      log('DEMO', '🎬 [START] playDemoVideo called', {
        videoUrl,
        isYouTube: ytUrl,
        youTubeEmbedUrl: embedUrl,
        hasSessionManager: !!sessionManager
      });

      // Set YouTube state
      setIsYouTube(ytUrl);
      if (embedUrl) {
        setYouTubeEmbedUrl(embedUrl);
        log('DEMO', '📺 [YOUTUBE] Converted to embed URL', { embedUrl });
      }

      // Mute microphone and avatar audio during demo
      if (sessionManager) {
        log('DEMO', '🎤 [MIC] Muting microphone during demo');
        sessionManager.setMicrophoneMuted(true);
        log('DEMO', '🎤 [MIC] Microphone muted successfully');
      } else {
        log('DEMO', '⚠️ [MIC] Cannot mute - sessionManager not ready');
      }

      // Notify parent component to mute avatar audio
      if (onVideoStartRef.current) {
        log('DEMO', '🔊 [AUDIO] Notifying parent to mute avatar audio');
        onVideoStartRef.current();
      }

      // Clone avatar video to PIP container
      setTimeout(() => {
        log('DEMO', '🖼️ [PIP] Starting PiP cloning process');
        const avatarContainer = document.getElementById('tavus-video-container');
        const pipContainer = document.getElementById('avatar-pip');

        log('DEMO', '🖼️ [PIP] Container check', {
          hasAvatarContainer: !!avatarContainer,
          hasPipContainer: !!pipContainer,
          avatarContainerId: avatarContainer?.id,
          pipContainerId: pipContainer?.id
        });

        if (avatarContainer && pipContainer) {
          const avatarVideos = avatarContainer.querySelectorAll('video');
          log('DEMO', `🖼️ [PIP] Found ${avatarVideos.length} video element(s) to clone`);

          // Clone each video track
          avatarVideos.forEach((originalVideo, index) => {
            log('DEMO', `🖼️ [PIP] Cloning video ${index + 1}/${avatarVideos.length}`, {
              hasSrcObject: !!originalVideo.srcObject,
              videoWidth: originalVideo.videoWidth,
              videoHeight: originalVideo.videoHeight,
              readyState: originalVideo.readyState
            });

            const clonedVideo = originalVideo.cloneNode(true);
            clonedVideo.style.width = '100%';
            clonedVideo.style.height = '100%';
            clonedVideo.style.objectFit = 'cover';
            clonedVideo.style.position = 'static';
            clonedVideo.style.border = 'none';
            clonedVideo.style.borderRadius = '0';

            // Copy the srcObject (MediaStream) from original to clone
            if (originalVideo.srcObject) {
              clonedVideo.srcObject = originalVideo.srcObject;
              log('DEMO', `🖼️ [PIP] MediaStream attached to cloned video ${index + 1}`);

              clonedVideo.play()
                .then(() => {
                  log('DEMO', `✅ [PIP] Cloned video ${index + 1} playing successfully`);
                })
                .catch(e => {
                  log('ERROR', `❌ [PIP] Failed to play cloned video ${index + 1}`, {
                    error: e.message,
                    errorName: e.name
                  });
                });
            } else {
              log('DEMO', `⚠️ [PIP] Video ${index + 1} has no srcObject, cannot clone`);
            }

            pipContainer.appendChild(clonedVideo);
            log('DEMO', `🖼️ [PIP] Cloned video ${index + 1} appended to PiP container`);
          });

          log('DEMO', '✅ [PIP] Avatar cloning complete');
        } else {
          log('ERROR', '❌ [PIP] Cannot clone avatar - missing containers', {
            hasAvatarContainer: !!avatarContainer,
            hasPipContainer: !!pipContainer
          });
        }
      }, 100);

      // Set state to trigger video loading in useEffect
      log('DEMO', '📹 [STATE] Setting isDemoPlaying=true and videoUrl', { videoUrl });
      setCurrentVideoUrl(videoUrl);
      setIsDemoPlaying(true);
      log('DEMO', '✅ [START] playDemoVideo completed');

    } catch (e) {
      log('ERROR', '❌ [START] Failed to start demo video', {
        error: e.message,
        stack: e.stack
      });
      setIsDemoPlaying(false);
    }
  };

  const stopDemoVideo = () => {
    // Guard against duplicate calls
    if (stopInProgressRef.current) {
      log('DEMO', '⚠️ [STOP] stopDemoVideo already in progress, skipping duplicate');
      return;
    }
    stopInProgressRef.current = true;

    try {
      log('DEMO', '⏹️ [STOP] stopDemoVideo called', {
        isDemoPlaying,
        hasSessionManager: !!sessionManager
      });

      log('DEMO', '📹 [STOP] Setting isDemoPlaying=false');
      setIsDemoPlaying(false);
      setCurrentVideoUrl('');
      setIsYouTube(false);
      setYouTubeEmbedUrl('');
      log('DEMO', '📹 [STOP] State updated');

      // Unmute microphone and restore avatar audio after demo ends
      if (sessionManager) {
        log('DEMO', '🎤 [STOP] Unmuting microphone after demo ends');
        sessionManager.setMicrophoneMuted(false);
        log('DEMO', '🎤 [STOP] Microphone unmuted - ready for conversation');
      } else {
        log('DEMO', '⚠️ [STOP] Cannot unmute - sessionManager not ready');
      }

      // Notify parent component to restore avatar audio
      if (onVideoStopRef.current) {
        log('DEMO', '🔊 [AUDIO] Notifying parent to restore avatar audio');
        onVideoStopRef.current();
      }

      // Clear PIP container
      log('DEMO', '🧹 [STOP] Clearing PIP container');
      const pipContainer = document.getElementById('avatar-pip');
      if (pipContainer) {
        const childCount = pipContainer.childElementCount;
        log('DEMO', `🧹 [STOP] PIP has ${childCount} child element(s)`);

        while (pipContainer.firstChild) {
          pipContainer.removeChild(pipContainer.firstChild);
        }
        log('DEMO', '🧹 [STOP] PIP container cleared');
      } else {
        log('DEMO', '⚠️ [STOP] PIP container not found');
      }

      // Reset demo video
      log('DEMO', '📹 [STOP] Resetting demo video element');
      const demoVideo = demoVideoRef.current;
      if (demoVideo) {
        log('DEMO', '📹 [STOP] Demo video state before reset', {
          paused: demoVideo.paused,
          currentTime: demoVideo.currentTime,
          duration: demoVideo.duration,
          src: demoVideo.src
        });

        demoVideo.pause();
        demoVideo.currentTime = 0;
        demoVideo.src = '';

        log('DEMO', '📹 [STOP] Demo video reset complete');
      } else {
        log('DEMO', '⚠️ [STOP] Demo video ref is null');
      }

      log('DEMO', '✅ [STOP] Demo video stopped - avatar returned to idle state');

      // Reset the guard after a short delay to allow for cleanup
      setTimeout(() => {
        stopInProgressRef.current = false;
      }, 1000);

    } catch (e) {
      log('ERROR', '❌ [STOP] Failed to stop demo video', {
        error: e.message,
        stack: e.stack
      });
      // Reset guard even on error
      stopInProgressRef.current = false;
    }
  };

  return {
    isDemoPlaying,
    currentVideoUrl,
    isYouTube,
    youTubeEmbedUrl,
    demoVideoRef,
    playDemoVideo,
    stopDemoVideo,
  };
}
