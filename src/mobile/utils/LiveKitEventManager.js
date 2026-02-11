/**
 * LiveKitEventManager - Robust event handler for LiveKit room communication
 *
 * Root Problems Solved:
 * - 135-line wireRoomEvents function with nested event handlers
 * - Duplicate message format handling (HeyGen API v1 'type' vs v2 'event_type')
 * - State updates scattered throughout event callbacks
 * - Difficult to test event handling logic
 * - No clean separation between event logic and UI state management
 *
 * Solution:
 * - Message parsers normalize different HeyGen API formats
 * - Event routing maps message types to appropriate handlers
 * - Callback system allows component to provide state update functions
 * - Clean separation: event logic (manager) vs UI state (component)
 * - Testable: Can unit test manager independently of React component
 */

// livekit-client removed — legacy HeyGen code
const RoomEvent = {};

class LiveKitEventManager {
  constructor() {
    this.room = null;
    this.callbacks = {
      // Avatar state callbacks
      onAvatarStartSpeaking: null,
      onAvatarStopSpeaking: null,
      onUserStartSpeaking: null,
      onUserStopSpeaking: null,

      // Transcript callbacks
      onUserTranscript: null,
      onAvatarTranscript: null,
      onGenericTranscript: null,

      // Agent state callback
      onAgentStateChange: null,

      // Fallback for unhandled messages
      onUnhandledMessage: null
    };
    this.logger = null;
    this.lastAvatarSpeech = '';
    this.previousAgentState = 'idle';
  }

  /**
   * Set logging function for debug output
   */
  setLogger(logFn) {
    this.logger = logFn;
  }

  log(category, message, data) {
    if (this.logger) {
      this.logger(category, message, data);
    }
    console.log(`[LiveKitEventManager][${category}]`, message, data || '');
  }

  /**
   * Set callback functions for event handling
   * Component provides these to update its state
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Attach event listeners to LiveKit room
   */
  attachToRoom(room) {
    if (this.room) {
      this.log('SETUP', '⚠️ Already attached to a room, detaching first');
      this.detachFromRoom();
    }

    this.room = room;
    this.log('SETUP', '✅ Attaching event listeners to room');

    this._wireDataReceived();
    this._wireParticipantEvents();
  }

  /**
   * Detach all event listeners from room
   */
  detachFromRoom() {
    if (this.room) {
      this.log('SETUP', 'Detaching event listeners from room');
      this.room.removeAllListeners(RoomEvent.DataReceived);
      this.room.removeAllListeners(RoomEvent.ParticipantAttributesChanged);
      this.room = null;
    }

    // Reset state
    this.lastAvatarSpeech = '';
    this.previousAgentState = 'idle';
  }

  /**
   * Wire DataReceived event - handles all data channel messages from avatar
   * @private
   */
  _wireDataReceived() {
    this.room.on(RoomEvent.DataReceived, (payload, participant, kind) => {
      // Decode binary payload to text
      let decoded;
      try {
        decoded = new TextDecoder().decode(payload);
      } catch (e) {
        return; // Silently ignore decode errors
      }

      // Parse JSON
      let parsedJson = null;
      try {
        parsedJson = JSON.parse(decoded);
      } catch (e) {
        return; // Silently ignore non-JSON messages
      }

      // Route message based on format
      this._routeMessage(parsedJson);
    });
  }

  /**
   * Wire ParticipantAttributesChanged event - tracks agent state changes
   * @private
   */
  _wireParticipantEvents() {
    this.room.on(RoomEvent.ParticipantAttributesChanged, (changedAttributes, participant) => {
      // Check for agent state attribute
      if (changedAttributes && changedAttributes['lk.agent.state']) {
        const newState = changedAttributes['lk.agent.state'];
        const prevState = this.previousAgentState;

        this.log('AGENT_STATE', `Agent state: ${prevState} → ${newState}`);

        // Notify callback
        if (this.callbacks.onAgentStateChange) {
          this.callbacks.onAgentStateChange(newState, prevState, this.lastAvatarSpeech);
        }

        this.previousAgentState = newState;
      }
    });
  }

  /**
   * Route parsed message to appropriate handler
   * Handles both HeyGen API v1 (type field) and v2 (event_type field)
   * @private
   */
  _routeMessage(parsedJson) {
    if (!parsedJson) return;

    // API v1 format - uses 'type' field
    if (parsedJson.type) {
      this._handleV1Message(parsedJson);
    }
    // API v2 format - uses 'event_type' field
    else if (parsedJson.event_type) {
      this._handleV2Message(parsedJson);
    }
    // Unknown format
    else {
      this.log('DATA_CHANNEL', '📨 Unhandled JSON message', parsedJson);
      if (this.callbacks.onUnhandledMessage) {
        this.callbacks.onUnhandledMessage(parsedJson);
      }
    }
  }

  /**
   * Handle HeyGen API v1 messages (type field)
   * @private
   */
  _handleV1Message(msg) {
    const msgType = msg.type;

    switch (msgType) {
      case 'avatar_start_talking':
        if (this.callbacks.onAvatarStartSpeaking) {
          this.callbacks.onAvatarStartSpeaking();
        }
        break;

      case 'avatar_stop_talking':
        if (this.callbacks.onAvatarStopSpeaking) {
          this.callbacks.onAvatarStopSpeaking(this.lastAvatarSpeech);
        }
        break;

      case 'user_start_talking':
        if (this.callbacks.onUserStartSpeaking) {
          this.callbacks.onUserStartSpeaking();
        }
        break;

      case 'user_stop_talking':
        if (this.callbacks.onUserStopSpeaking) {
          this.callbacks.onUserStopSpeaking();
        }
        break;

      case 'transcript':
      case 'transcription':
        {
          const text = msg.text || msg.transcript || '';
          this.log('TRANSCRIPT', '📝 Generic transcript', { text, type: msgType });
          if (text && this.callbacks.onGenericTranscript) {
            this.callbacks.onGenericTranscript(text, msg);
          }
        }
        break;

      case 'user_transcript':
      case 'user_speech':
        {
          const text = msg.text || msg.transcript || '';
          this.log('USER_SPEECH', '🗣️ User said (v1)', { text });
          if (text && this.callbacks.onUserTranscript) {
            this.callbacks.onUserTranscript(text, `type: ${msgType}`);
          }
        }
        break;

      case 'avatar_transcript':
      case 'avatar_speech':
      case 'llm_response':
        {
          const text = msg.text || msg.response || '';
          this.log('AVATAR_SPEECH', '🤖 Avatar said (v1)', { text });
          if (text) {
            this.lastAvatarSpeech = text;
            if (this.callbacks.onAvatarTranscript) {
              this.callbacks.onAvatarTranscript(text, `type: ${msgType}`);
            }
          }
        }
        break;

      default:
        this.log('DATA_CHANNEL', `📨 Unhandled v1 message type: ${msgType}`, msg);
        if (this.callbacks.onUnhandledMessage) {
          this.callbacks.onUnhandledMessage(msg);
        }
    }
  }

  /**
   * Handle HeyGen API v2 messages (event_type field)
   * @private
   */
  _handleV2Message(msg) {
    const eventType = msg.event_type;

    switch (eventType) {
      case 'user.transcription':
        {
          const text = msg.text || '';
          this.log('USER_SPEECH', '🗣️ User said (v2)', { text });
          if (text && this.callbacks.onUserTranscript) {
            this.callbacks.onUserTranscript(text, 'event_type: user.transcription');
          }
        }
        break;

      case 'avatar.transcription':
        {
          const text = msg.text || '';
          this.log('AVATAR_SPEECH', '🤖 Avatar said (v2)', { text });
          if (text) {
            this.lastAvatarSpeech = text;
            if (this.callbacks.onAvatarTranscript) {
              this.callbacks.onAvatarTranscript(text, 'event_type: avatar.transcription');
            }
          }
        }
        break;

      default:
        this.log('DATA_CHANNEL', `📨 Unhandled v2 event type: ${eventType}`, msg);
        if (this.callbacks.onUnhandledMessage) {
          this.callbacks.onUnhandledMessage(msg);
        }
    }
  }

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      hasRoom: !!this.room,
      lastAvatarSpeech: this.lastAvatarSpeech,
      previousAgentState: this.previousAgentState,
      hasCallbacks: Object.keys(this.callbacks).filter(key => !!this.callbacks[key]).length
    };
  }
}

// AIDEV-NOTE: CRITICAL FIX - Export class, not singleton
// AIDEV-NOTE: Each connection needs its own LiveKitEventManager instance
// AIDEV-NOTE: Singleton causes state corruption:
// AIDEV-NOTE: - lastAvatarSpeech shared between users
// AIDEV-NOTE: - previousAgentState shared between users
// AIDEV-NOTE: - callbacks overwritten when second user connects
// AIDEV-NOTE: User A connects → User B connects → User A gets User B's events!
export default LiveKitEventManager;
