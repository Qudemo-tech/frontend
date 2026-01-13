/**
 * TavusSessionManager - Robust Daily.co session manager for Tavus CVI
 *
 * Equivalent to SessionManager.js for HeyGen/LiveKit, but adapted for Daily.co
 *
 * Key Differences from LiveKit:
 * - Uses Daily.co call object instead of LiveKit Room
 * - Tracks are managed differently (Daily provides track objects via events)
 * - Audio/video elements are created and managed similarly
 *
 * Lifecycle: initialize → joinRoom → waitForReady → cleanup
 */

import DailyIframe from '@daily-co/daily-js';

class TavusSessionManager {
  constructor() {
    this.instanceId = Math.random().toString(36).substring(7);
    this.daily = null;
    this.conversationId = null;
    this.conversationUrl = null;
    this.isInitialized = false;
    this.logger = null;

    // Track state
    this.hasVideo = false;
    this.hasAudio = false;
    this.replicaParticipantId = null;

    // Promise resolvers for ready state
    this.videoReadyResolve = null;
    this.audioReadyResolve = null;
    this.videoReadyPromise = null;
    this.audioReadyPromise = null;

    // DOM references
    this.videoElement = null;
    this.videoContainer = null;
    this.audioElement = null;

    // Bound event handlers (for cleanup)
    this._boundHandlers = {};

    // Error callback for notifying React component of disconnection/errors
    this.onErrorCallback = null;
  }

  /**
   * Set logging function
   */
  setLogger(logFn) {
    this.logger = logFn;
  }

  /**
   * Set error callback - called when Daily.co encounters errors or disconnects
   * @param {Function} callback - (errorType, errorMessage) => void
   */
  setOnError(callback) {
    this.onErrorCallback = callback;
  }

  log(message) {
    if (this.logger) {
      this.logger(message);
    }
    console.log('[TavusSessionManager]', message);
  }

  /**
   * Log with call stack - shows who called this function
   */
  logWithStack(message) {
    const stack = new Error().stack;
    const lines = stack.split('\n');
    const caller = lines[3] || 'unknown';
    const callerInfo = caller.trim().replace(/^at\s+/, '');
    this.log(`${message} | CALLED FROM: ${callerInfo}`);
  }

  /**
   * Initialize session manager and join Daily.co room
   */
  async initialize(conversationUrl, conversationId, videoContainerId = 'tavus-video-container') {
    this.log(`[${this.instanceId}] Initializing TavusSessionManager...`);

    this.conversationUrl = conversationUrl;
    this.conversationId = conversationId;
    this.videoContainer = document.getElementById(videoContainerId);

    if (!this.videoContainer) {
      this.log(`⚠️ Video container #${videoContainerId} not found in DOM`);
    }

    // Create ready promises
    this.videoReadyPromise = new Promise(resolve => {
      this.videoReadyResolve = resolve;
    });

    this.audioReadyPromise = new Promise(resolve => {
      this.audioReadyResolve = resolve;
    });

    // Create Daily call object with quality settings
    this.log('Creating Daily.co call object...');
    this.daily = DailyIframe.createCallObject({
      subscribeToTracksAutomatically: true,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
      },
      // Video receive settings for better quality
      receiveSettings: {
        base: {
          video: {
            layer: 2,  // 0=low, 1=medium, 2=high quality layer (SFU simulcast)
          },
        },
      },
    });

    // Setup event handlers
    this._setupEventHandlers();

    // Join the room
    this.log(`Joining Daily.co room: ${conversationUrl.substring(0, 50)}...`);
    try {
      await this.daily.join({
        url: conversationUrl,
        startVideoOff: true,  // We don't send video, just receive
        startAudioOff: true,  // Start with mic off, enable later
      });
      this.log('✅ Joined Daily.co room successfully');
    } catch (error) {
      this.log(`❌ Failed to join Daily.co room: ${error.message}`);
      throw error;
    }

    this.isInitialized = true;
    this.log('✅ TavusSessionManager initialized');
    return this.daily;
  }

  /**
   * Setup Daily.co event handlers
   */
  _setupEventHandlers() {
    // Participant joined
    this._boundHandlers.participantJoined = (event) => {
      this.log(`Participant joined: ${event.participant.user_id} (local: ${event.participant.local})`);

      // Check if this is the replica (not local participant)
      if (!event.participant.local) {
        this.log('🤖 Replica participant joined!');
        this.replicaParticipantId = event.participant.session_id;
      }
    };

    // Participant left
    this._boundHandlers.participantLeft = (event) => {
      this.log(`Participant left: ${event.participant.user_id}`);
      if (event.participant.session_id === this.replicaParticipantId) {
        this.log('🤖 Replica participant left');
        this.replicaParticipantId = null;
      }
    };

    // Track started
    this._boundHandlers.trackStarted = (event) => {
      const { track, participant } = event;
      this.log(`Track started: ${track.kind} from ${participant?.user_id || 'unknown'} (local: ${participant?.local})`);

      // Only attach tracks from remote participants (the replica)
      if (participant && !participant.local) {
        if (track.kind === 'video') {
          this._attachVideoTrack(track, participant);
        } else if (track.kind === 'audio') {
          this._attachAudioTrack(track, participant);
        }
      }
    };

    // Track stopped
    this._boundHandlers.trackStopped = (event) => {
      const { track, participant } = event;
      this.log(`Track stopped: ${track?.kind} from ${participant?.user_id || 'unknown'}`);
    };

    // Error handler - notify React component
    this._boundHandlers.error = (event) => {
      this.log(`❌ Daily.co error: ${event.errorMsg}`);
      if (this.onErrorCallback) {
        this.onErrorCallback('daily-error', event.errorMsg || 'Unknown Daily.co error');
      }
    };

    // Left meeting handler - detect unexpected disconnection
    this._boundHandlers.leftMeeting = (event) => {
      this.log(`📴 Left meeting: ${event?.action || 'unknown reason'}`);
      if (this.onErrorCallback) {
        this.onErrorCallback('disconnected', `Left meeting: ${event?.action || 'unknown reason'}`);
      }
    };

    // Network quality change - warn on poor connection
    this._boundHandlers.networkQualityChange = (event) => {
      const { quality, threshold } = event;
      if (quality === 'low') {
        this.log(`⚠️ Network quality low: ${quality} (threshold: ${threshold})`);
        if (this.onErrorCallback) {
          this.onErrorCallback('network-warning', 'Network quality is low, connection may be unstable');
        }
      }
    };

    // Register handlers
    this.daily.on('participant-joined', this._boundHandlers.participantJoined);
    this.daily.on('participant-left', this._boundHandlers.participantLeft);
    this.daily.on('track-started', this._boundHandlers.trackStarted);
    this.daily.on('track-stopped', this._boundHandlers.trackStopped);
    this.daily.on('error', this._boundHandlers.error);
    this.daily.on('left-meeting', this._boundHandlers.leftMeeting);
    this.daily.on('network-quality-change', this._boundHandlers.networkQualityChange);
  }

  /**
   * Attach video track from replica
   */
  _attachVideoTrack(track, participant) {
    this.logWithStack(`[${this.instanceId}] _attachVideoTrack() called`);

    // Null check for track object to prevent crashes
    if (!track) {
      this.log('⚠️ Received null/undefined track in _attachVideoTrack');
      return false;
    }

    if (this.hasVideo) {
      this.log('Video already attached, skipping');
      return false;
    }

    this.log(`Attaching video track from ${participant?.user_id || 'unknown'}`);

    try {
      // Wait for video container if not ready
      if (!this.videoContainer) {
        this.videoContainer = document.getElementById('tavus-video-container');
        if (!this.videoContainer) {
          this.log('⚠️ Video container still not found');
          return false;
        }
      }

      // Create or reuse video element
      let videoEl = this.videoContainer.querySelector('video');
      if (!videoEl) {
        videoEl = document.createElement('video');
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.muted = true; // Video element muted, audio handled separately
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'cover';
        videoEl.style.backgroundColor = '#000';
        this.videoContainer.appendChild(videoEl);
        this.log('Video element created');
      }

      // Attach track using Daily's track object
      // Daily.co tracks can have different properties depending on version
      this.log(`Track object keys: ${Object.keys(track).join(', ')}`);
      this.log(`Track.track: ${track.track}, Track.persistentTrack: ${track.persistentTrack}`);

      // Try different ways to get the MediaStreamTrack
      let mediaStreamTrack = track.persistentTrack || track.track;

      // If track itself is a MediaStreamTrack, use it directly
      if (track instanceof MediaStreamTrack) {
        mediaStreamTrack = track;
      }

      if (!mediaStreamTrack) {
        this.log('⚠️ Could not find MediaStreamTrack in track object');
        this.log(`Track object: ${JSON.stringify(track, null, 2)}`);
        return false;
      }

      const mediaStream = new MediaStream([mediaStreamTrack]);
      videoEl.srcObject = mediaStream;

      // Force play
      videoEl.play().catch(e => this.log(`Video autoplay blocked: ${e.message}`));

      this.videoElement = videoEl;
      this.hasVideo = true;

      this.log('✅ Video track attached and playing');

      // Resolve ready promise
      if (this.videoReadyResolve) {
        this.videoReadyResolve();
        this.videoReadyResolve = null;
      }

      return true;

    } catch (error) {
      this.log(`❌ Failed to attach video track: ${error.message}`);
      console.error('[TavusSessionManager] Video error:', error);
      return false;
    }
  }

  /**
   * Attach audio track from replica
   */
  async _attachAudioTrack(track, participant) {
    this.logWithStack(`[${this.instanceId}] _attachAudioTrack() called`);

    // Null check for track object to prevent crashes
    if (!track) {
      this.log('⚠️ Received null/undefined track in _attachAudioTrack');
      return false;
    }

    if (this.hasAudio) {
      this.log('Audio already attached, skipping');
      return false;
    }

    this.log(`Attaching audio track from ${participant?.user_id || 'unknown'}`);

    try {
      // Create audio element if it doesn't exist
      if (!this.audioElement) {
        this.audioElement = document.createElement('audio');
        this.audioElement.autoplay = true;
        this.audioElement.playsInline = true;
        this.audioElement.muted = false; // CRITICAL: Must be unmuted to hear audio
        this.audioElement.volume = 1.0;
        this.audioElement.style.display = 'none';
        document.body.appendChild(this.audioElement);
        this.log('Audio element created and added to DOM');
      }

      // Attach track using Daily's track object
      // Daily.co tracks can have different properties depending on version
      this.log(`Audio Track object keys: ${Object.keys(track).join(', ')}`);

      // Try different ways to get the MediaStreamTrack
      let mediaStreamTrack = track.persistentTrack || track.track;

      // If track itself is a MediaStreamTrack, use it directly
      if (track instanceof MediaStreamTrack) {
        mediaStreamTrack = track;
      }

      if (!mediaStreamTrack) {
        this.log('⚠️ Could not find MediaStreamTrack in audio track object');
        return false;
      }

      const mediaStream = new MediaStream([mediaStreamTrack]);
      this.audioElement.srcObject = mediaStream;

      this.log(`📊 Audio BEFORE play: muted=${this.audioElement.muted}, volume=${this.audioElement.volume}, paused=${this.audioElement.paused}, readyState=${this.audioElement.readyState}`);

      // Force play
      try {
        await this.audioElement.play();
        this.log('✅ audioElement.play() succeeded');
      } catch (e) {
        this.log(`⚠️ audioElement.play() error: ${e.name} - ${e.message}`);
      }

      this.log(`📊 Audio AFTER play: muted=${this.audioElement.muted}, volume=${this.audioElement.volume}, paused=${this.audioElement.paused}, readyState=${this.audioElement.readyState}`);

      // Ensure audio is unmuted after attachment (iOS fix)
      if (this.audioElement.muted) {
        this.log('⚠️ Audio element was muted after attachment - forcing unmute');
        this.audioElement.muted = false;
      }

      // Retry play if paused
      if (this.audioElement.paused) {
        this.log('⚠️ Audio element is paused after play() - retrying play()');
        try {
          await this.audioElement.play();
          this.log(`📊 Retry play result: paused=${this.audioElement.paused}`);
        } catch (e) {
          this.log(`⚠️ Retry play error: ${e.name} - ${e.message}`);
        }
      }

      this.hasAudio = true;

      // Resolve ready promise
      if (this.audioReadyResolve) {
        this.audioReadyResolve();
        this.audioReadyResolve = null;
      }

      return true;

    } catch (error) {
      this.log(`❌ Failed to attach audio track: ${error.message}`);
      return false;
    }
  }

  /**
   * Mute/unmute audio output (speaker control)
   */
  setAudioMuted(muted) {
    this.logWithStack(`🔊 setAudioMuted(${muted}) called`);

    if (this.audioElement) {
      this.log(`📊 BEFORE setAudioMuted(${muted}): muted=${this.audioElement.muted}, volume=${this.audioElement.volume}, paused=${this.audioElement.paused}`);

      this.audioElement.muted = muted;

      this.log(`✅ AFTER setAudioMuted(${muted}): muted=${this.audioElement.muted}, volume=${this.audioElement.volume}, paused=${this.audioElement.paused}`);

      // If unmuting and audio is paused, try to play
      if (!muted && this.audioElement.paused) {
        this.log('⚠️ Audio is paused while unmuting - attempting play()');
        this.audioElement.play().then(() => {
          this.log(`✅ play() after unmute succeeded: paused=${this.audioElement.paused}`);
        }).catch(e => {
          this.log(`⚠️ play() after unmute failed: ${e.name} - ${e.message}`);
        });
      }

      return true;
    } else {
      this.log('⚠️ Cannot set audio muted - no audio element');
      return false;
    }
  }

  /**
   * Mute/unmute local microphone
   */
  async setMicrophoneMuted(muted) {
    this.logWithStack(`🎤 setMicrophoneMuted(${muted}) called`);

    if (this.daily) {
      try {
        this.daily.setLocalAudio(!muted);
        this.log(`✅ Local audio set to ${!muted ? 'enabled' : 'disabled'}`);
        return true;
      } catch (error) {
        this.log(`❌ Failed to set local audio: ${error.message}`);
        return false;
      }
    } else {
      this.log('⚠️ Cannot set microphone - no Daily call object');
      return false;
    }
  }

  /**
   * Enable local microphone (for first-time activation)
   */
  async enableMicrophone() {
    this.log('🎤 Enabling microphone...');

    if (this.daily) {
      try {
        // Request microphone access and enable
        await this.daily.setLocalAudio(true);
        this.log('✅ Microphone enabled');
        return true;
      } catch (error) {
        this.log(`❌ Failed to enable microphone: ${error.message}`);
        return false;
      }
    } else {
      this.log('⚠️ Cannot enable microphone - no Daily call object');
      return false;
    }
  }

  /**
   * Get Daily call object (for sending messages)
   */
  getDaily() {
    return this.daily;
  }

  /**
   * Get local microphone audio track for VAD processing
   * Returns the MediaStreamTrack from Daily.co local audio
   * This is a parallel tap - does NOT interfere with Daily.co audio transmission
   * 
   * @returns {MediaStreamTrack|null} Local audio track, or null if not available
   */
  getLocalAudioTrack() {
    if (!this.daily) {
      this.log('⚠️ Cannot get local audio track - no Daily call object');
      return null;
    }

    try {
      // Daily.co exposes local audio via getLocalAudio() method
      // Returns MediaStreamTrack when microphone is enabled
      const localAudio = this.daily.getLocalAudio();
      
      if (localAudio && localAudio instanceof MediaStreamTrack && localAudio.kind === 'audio') {
        this.log('✅ Local audio track retrieved for VAD');
        return localAudio;
      }
      
      // Alternative: Try to get from localParticipant
      const localParticipant = this.daily.localParticipant();
      if (localParticipant && localParticipant.audioTracks) {
        const audioTracks = Object.values(localParticipant.audioTracks);
        if (audioTracks.length > 0) {
          const track = audioTracks[0];
          const mediaStreamTrack = track.persistentTrack || track.track;
          if (mediaStreamTrack && mediaStreamTrack instanceof MediaStreamTrack) {
            this.log('✅ Local audio track retrieved from localParticipant for VAD');
            return mediaStreamTrack;
          }
        }
      }
      
      this.log('⚠️ Local audio track not available (microphone may be muted)');
      return null;
    } catch (error) {
      this.log(`⚠️ Error getting local audio track: ${error.message}`);
      return null;
    }
  }

  /**
   * Set video quality preference
   * @param {string} quality - 'low', 'medium', or 'high'
   */
  setVideoQuality(quality = 'high') {
    if (!this.daily) {
      this.log('⚠️ Cannot set video quality - no Daily call object');
      return;
    }

    const layerMap = {
      low: 0,
      medium: 1,
      high: 2,
    };

    const layer = layerMap[quality] ?? 2;

    this.log(`Setting video quality to ${quality} (layer ${layer})`);

    try {
      this.daily.updateReceiveSettings({
        base: {
          video: {
            layer: layer,
          },
        },
      });
      this.log(`✅ Video quality set to ${quality}`);
    } catch (error) {
      this.log(`❌ Failed to set video quality: ${error.message}`);
    }
  }

  /**
   * Set bandwidth constraints
   * @param {number} kbps - Target bandwidth in kbps (e.g., 2500 for 2.5 Mbps)
   */
  setBandwidth(kbps = 2500) {
    if (!this.daily) {
      this.log('⚠️ Cannot set bandwidth - no Daily call object');
      return;
    }

    this.log(`Setting bandwidth to ${kbps} kbps`);

    try {
      this.daily.setBandwidth({
        kbs: kbps,
      });
      this.log(`✅ Bandwidth set to ${kbps} kbps`);
    } catch (error) {
      this.log(`❌ Failed to set bandwidth: ${error.message}`);
    }
  }

  /**
   * Check if video is ready
   */
  hasVideoTrack() {
    return this.hasVideo;
  }

  /**
   * Check if audio is ready
   */
  hasAudioTrack() {
    return this.hasAudio;
  }

  /**
   * Check if session is fully ready
   */
  isReady() {
    return this.hasVideo && this.hasAudio;
  }

  /**
   * Wait for both audio and video to be ready
   */
  async waitForReady(timeoutMs = 15000) {
    this.log('Waiting for session to be ready (audio + video)...');

    try {
      await Promise.race([
        Promise.all([this.audioReadyPromise, this.videoReadyPromise]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session ready timeout')), timeoutMs)
        )
      ]);

      this.log('✅ Session fully ready (audio + video)');
      return true;

    } catch (error) {
      this.log(`⚠️ Session ready timeout or error: ${error.message}`);
      // Return true anyway if we have at least audio OR video
      return !!(this.hasAudio || this.hasVideo);
    }
  }

  /**
   * Detach video
   */
  detachVideo() {
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
      this.hasVideo = false;
      this.log('Video detached');
    }
  }

  /**
   * Detach audio
   */
  detachAudio() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
      if (this.audioElement.parentNode) {
        this.audioElement.parentNode.removeChild(this.audioElement);
      }
      this.audioElement = null;
      this.hasAudio = false;
      this.log('Audio element removed from DOM');
    }
  }

  /**
   * Complete cleanup - call when session ends
   */
  async cleanup() {
    this.logWithStack(`[${this.instanceId}] cleanup() called`);

    // Don't cleanup if we haven't initialized yet
    if (!this.isInitialized && !this.daily) {
      this.log(`[${this.instanceId}] ⚠️ Cleanup called but not initialized - IGNORING`);
      return;
    }

    this.log(`[${this.instanceId}] Cleaning up TavusSessionManager`);

    // Remove event handlers
    if (this.daily) {
      this.daily.off('participant-joined', this._boundHandlers.participantJoined);
      this.daily.off('participant-left', this._boundHandlers.participantLeft);
      this.daily.off('track-started', this._boundHandlers.trackStarted);
      this.daily.off('track-stopped', this._boundHandlers.trackStopped);
      this.daily.off('error', this._boundHandlers.error);
      this.daily.off('left-meeting', this._boundHandlers.leftMeeting);
      this.daily.off('network-quality-change', this._boundHandlers.networkQualityChange);

      // Leave room and destroy
      try {
        await this.daily.leave();
        this.daily.destroy();
      } catch (e) {
        this.log(`⚠️ Error leaving Daily room: ${e.message}`);
      }
    }

    // Clear error callback
    this.onErrorCallback = null;

    this.detachVideo();
    this.detachAudio();

    this.daily = null;
    this.conversationId = null;
    this.conversationUrl = null;
    this.videoContainer = null;
    this.isInitialized = false;
    this.replicaParticipantId = null;

    // Reset promises
    this.videoReadyResolve = null;
    this.audioReadyResolve = null;
    this.videoReadyPromise = null;
    this.audioReadyPromise = null;

    this.log('✅ TavusSessionManager cleaned up');
  }

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      instanceId: this.instanceId,
      isInitialized: this.isInitialized,
      hasVideo: this.hasVideo,
      hasAudio: this.hasAudio,
      isReady: this.isReady(),
      hasDaily: !!this.daily,
      conversationId: this.conversationId,
      replicaParticipantId: this.replicaParticipantId,
      hasVideoContainer: !!this.videoContainer,
      hasAudioElement: !!this.audioElement
    };
  }
}

export default TavusSessionManager;
