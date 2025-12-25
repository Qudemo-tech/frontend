/**
 * DailyEventManager - Event handler for Tavus CVI via Daily.co
 *
 * Equivalent to LiveKitEventManager.js but for Daily.co app-message events
 *
 * Key Differences from LiveKit:
 * - Uses Daily.co 'app-message' event instead of LiveKit RoomEvent.DataReceived
 * - Tavus uses consistent 'event_type' field
 * - Supports tool calling (function calling) natively
 * - Can send messages to replica (echo, respond, interrupt)
 *
 * Event Types Handled:
 * - conversation.utterance (transcripts)
 * - conversation.user.started_speaking / stopped_speaking
 * - conversation.replica.started_speaking / stopped_speaking
 * - conversation.tool_call (function calling)
 * - system.replica_joined
 */

class DailyEventManager {
  constructor() {
    this.daily = null;
    this.conversationId = null;
    this.callbacks = {
      // Speaking state callbacks
      onReplicaStartSpeaking: null,
      onReplicaStopSpeaking: null,
      onUserStartSpeaking: null,
      onUserStopSpeaking: null,

      // Transcript callbacks
      onUserTranscript: null,
      onReplicaTranscript: null,

      // Tool call callback
      onToolCall: null,

      // System events
      onReplicaJoined: null,

      // Fallback for unhandled messages
      onUnhandledMessage: null
    };
    this.logger = null;
    this.lastReplicaSpeech = '';
    this.isReplicaSpeaking = false;

    // Bound handler for cleanup
    this._boundAppMessageHandler = null;
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
    console.log(`[DailyEventManager][${category}]`, message, data || '');
  }

  /**
   * Set callback functions for event handling
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Attach event listeners to Daily call object
   */
  attachToDaily(daily, conversationId) {
    if (this.daily) {
      this.log('SETUP', '⚠️ Already attached to Daily, detaching first');
      this.detachFromDaily();
    }

    this.daily = daily;
    this.conversationId = conversationId;
    this.log('SETUP', '✅ Attaching event listeners to Daily call object');

    // Create bound handler
    this._boundAppMessageHandler = (event) => this._handleAppMessage(event);

    // Listen to app-message events
    this.daily.on('app-message', this._boundAppMessageHandler);
  }

  /**
   * Detach event listeners from Daily call object
   */
  detachFromDaily() {
    if (this.daily && this._boundAppMessageHandler) {
      this.log('SETUP', '📌 Detaching event listeners from Daily');
      this.daily.off('app-message', this._boundAppMessageHandler);
    }

    this.daily = null;
    this.conversationId = null;
    this._boundAppMessageHandler = null;

    // Reset state
    this.lastReplicaSpeech = '';
    this.isReplicaSpeaking = false;
  }

  /**
   * Handle app-message events from Daily.co
   */
  _handleAppMessage(event) {
    const data = event?.data;

    if (!data) {
      return;
    }

    // Skip noisy heartbeat messages
    if (data.event_type === 'system.replica_present') {
      return;
    }

    const eventType = data.event_type;
    const properties = data.properties || {};

    // Check for tool_calls at top level (some Tavus versions)
    if (data.tool_calls && Array.isArray(data.tool_calls)) {
      console.log('[DailyEventManager] Found tool_calls at top level:', data.tool_calls);
      data.tool_calls.forEach(tc => {
        const toolName = tc.function?.name || tc.name;
        const toolArgs = tc.function?.arguments || tc.arguments;
        if (toolName) {
          this._handleToolCall({ name: toolName, arguments: toolArgs });
        }
      });
    }

    // Check for tool_calls in properties (some Tavus versions nest it here)
    if (properties.tool_calls && Array.isArray(properties.tool_calls)) {
      console.log('[DailyEventManager] Found tool_calls in properties:', properties.tool_calls);
      properties.tool_calls.forEach(tc => {
        const toolName = tc.function?.name || tc.name;
        const toolArgs = tc.function?.arguments || tc.arguments;
        if (toolName) {
          this._handleToolCall({ name: toolName, arguments: toolArgs });
        }
      });
    }

    // Log raw data for debugging
    console.log(`\n========== TAVUS EVENT: ${eventType} ==========`);
    console.log('RAW DATA:', JSON.stringify(data, null, 2));
    console.log('================================================\n');

    this.log('APP_MESSAGE', `📨 Received: ${eventType}`, { properties });

    switch (eventType) {
      // System events
      case 'system.replica_joined':
        this.log('SYSTEM', '🤖 Replica joined the call', { replicaId: properties.replica_id });
        if (this.callbacks.onReplicaJoined) {
          this.callbacks.onReplicaJoined(properties.replica_id);
        }
        break;

      // User speaking state
      case 'conversation.user.started_speaking':
        this.log('USER_SPEECH', '🗣️ User started speaking');
        if (this.callbacks.onUserStartSpeaking) {
          this.callbacks.onUserStartSpeaking();
        }
        break;

      case 'conversation.user.stopped_speaking':
        this.log('USER_SPEECH', '🗣️ User stopped speaking');
        if (this.callbacks.onUserStopSpeaking) {
          this.callbacks.onUserStopSpeaking();
        }
        break;

      // Replica speaking state
      case 'conversation.replica.started_speaking':
        this.log('REPLICA_SPEECH', '🤖 Replica started speaking');
        this.isReplicaSpeaking = true;
        if (this.callbacks.onReplicaStartSpeaking) {
          this.callbacks.onReplicaStartSpeaking();
        }
        break;

      case 'conversation.replica.stopped_speaking':
        this.log('REPLICA_SPEECH', '🤖 Replica stopped speaking', {
          duration: properties.duration,
          interrupted: properties.interrupted
        });
        this.isReplicaSpeaking = false;
        if (this.callbacks.onReplicaStopSpeaking) {
          this.callbacks.onReplicaStopSpeaking(this.lastReplicaSpeech, properties.interrupted);
        }
        break;

      // Transcripts / Utterances
      case 'conversation.utterance':
        this._handleUtterance(properties);
        break;

      // Tool calls (function calling)
      case 'conversation.tool_call':
      case 'tool_call':
      case 'function_call':
        this._handleToolCall(properties);
        break;

      // Unhandled events
      default:
        this.log('UNHANDLED', `📨 Unhandled event type: ${eventType}`, data);
        if (this.callbacks.onUnhandledMessage) {
          this.callbacks.onUnhandledMessage(data);
        }
    }
  }

  /**
   * Handle utterance (transcript) events
   */
  _handleUtterance(properties) {
    const { role, speech, tool_calls } = properties;

    // Check for tool_calls nested in utterance (some Tavus versions)
    if (tool_calls && Array.isArray(tool_calls)) {
      console.log('[DailyEventManager] Found tool_calls in utterance:', tool_calls);
      tool_calls.forEach(tc => {
        const toolName = tc.function?.name || tc.name;
        const toolArgs = tc.function?.arguments || tc.arguments;
        if (toolName) {
          this._handleToolCall({ name: toolName, arguments: toolArgs });
        }
      });
    }

    if (!speech) {
      return;
    }

    if (role === 'user') {
      this.log('USER_SPEECH', `🗣️ User said: "${speech}"`);
      if (this.callbacks.onUserTranscript) {
        this.callbacks.onUserTranscript(speech, 'conversation.utterance');
      }
    } else if (role === 'replica') {
      this.log('REPLICA_SPEECH', `🤖 Replica said: "${speech}"`);
      this.lastReplicaSpeech = speech;
      if (this.callbacks.onReplicaTranscript) {
        this.callbacks.onReplicaTranscript(speech, 'conversation.utterance');
      }
    }
  }

  /**
   * Handle tool call (function calling) events
   */
  _handleToolCall(properties) {
    const { name, arguments: argsString } = properties;

    this.log('TOOL_CALL', `🔧 Tool called: ${name}`, { argsString });

    let args = {};
    try {
      args = JSON.parse(argsString || '{}');
    } catch (e) {
      this.log('TOOL_CALL', `⚠️ Failed to parse tool arguments: ${e.message}`);
    }

    if (this.callbacks.onToolCall) {
      this.callbacks.onToolCall(name, args, properties);
    }
  }

  /**
   * Send echo message - make replica speak exact text
   */
  sendEchoMessage(text) {
    if (!this.daily || !this.conversationId) {
      this.log('SEND', '⚠️ Cannot send echo - not connected');
      return false;
    }

    this.log('SEND', `📤 Sending echo message: "${text.substring(0, 50)}..."`);

    this.daily.sendAppMessage({
      message_type: 'conversation',
      event_type: 'conversation.echo',
      conversation_id: this.conversationId,
      properties: {
        modality: 'text',
        text: text
      }
    }, '*');

    return true;
  }

  /**
   * Send respond message - LLM processes and responds
   */
  sendRespondMessage(text) {
    if (!this.daily || !this.conversationId) {
      this.log('SEND', '⚠️ Cannot send respond - not connected');
      return false;
    }

    this.log('SEND', `📤 Sending respond message: "${text.substring(0, 50)}..."`);

    this.daily.sendAppMessage({
      message_type: 'conversation',
      event_type: 'conversation.respond',
      conversation_id: this.conversationId,
      properties: {
        text: text
      }
    }, '*');

    return true;
  }

  /**
   * Interrupt replica - stop speaking
   */
  interruptReplica() {
    if (!this.daily || !this.conversationId) {
      this.log('SEND', '⚠️ Cannot interrupt - not connected');
      return false;
    }

    this.log('SEND', '📤 Sending interrupt');

    this.daily.sendAppMessage({
      message_type: 'conversation',
      event_type: 'conversation.interrupt',
      conversation_id: this.conversationId
    }, '*');

    return true;
  }

  /**
   * Disable Tavus listening - prevents barge-in during module speech
   * This is CRITICAL to prevent Tavus from interrupting its own speech
   * Tries multiple message formats for compatibility
   */
  disableListening() {
    if (!this.daily || !this.conversationId) {
      this.log('SEND', '⚠️ Cannot disable listening - not connected');
      return false;
    }

    this.log('SEND', '🔇 Disabling Tavus listening (preventing barge-in)');

    // Try primary format: conversation.control
    try {
      this.daily.sendAppMessage({
        message_type: 'conversation',
        event_type: 'conversation.control',
        conversation_id: this.conversationId,
        properties: {
          action: 'disable_listening',
          listen_mode: false,
          barge_in: false
        }
      }, '*');
    } catch (e) {
      this.log('SEND', `⚠️ Failed to send control message (format 1): ${e.message}`);
    }

    // Try alternative format: direct properties
    try {
      this.daily.sendAppMessage({
        message_type: 'conversation',
        event_type: 'conversation.set_listening',
        conversation_id: this.conversationId,
        properties: {
          enabled: false
        }
      }, '*');
    } catch (e) {
      this.log('SEND', `⚠️ Failed to send control message (format 2): ${e.message}`);
    }

    return true;
  }

  /**
   * Enable Tavus listening - re-enables barge-in after module completes
   * Tries multiple message formats for compatibility
   */
  enableListening() {
    if (!this.daily || !this.conversationId) {
      this.log('SEND', '⚠️ Cannot enable listening - not connected');
      return false;
    }

    this.log('SEND', '👂 Enabling Tavus listening (barge-in enabled)');

    // Try primary format: conversation.control
    try {
      this.daily.sendAppMessage({
        message_type: 'conversation',
        event_type: 'conversation.control',
        conversation_id: this.conversationId,
        properties: {
          action: 'enable_listening',
          listen_mode: true,
          barge_in: true
        }
      }, '*');
    } catch (e) {
      this.log('SEND', `⚠️ Failed to send control message (format 1): ${e.message}`);
    }

    // Try alternative format: direct properties
    try {
      this.daily.sendAppMessage({
        message_type: 'conversation',
        event_type: 'conversation.set_listening',
        conversation_id: this.conversationId,
        properties: {
          enabled: true
        }
      }, '*');
    } catch (e) {
      this.log('SEND', `⚠️ Failed to send control message (format 2): ${e.message}`);
    }

    return true;
  }

  /**
   * Get last replica speech (for demo triggers, etc.)
   */
  getLastReplicaSpeech() {
    return this.lastReplicaSpeech;
  }

  /**
   * Check if replica is currently speaking
   */
  getIsReplicaSpeaking() {
    return this.isReplicaSpeaking;
  }

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      hasDaily: !!this.daily,
      conversationId: this.conversationId,
      lastReplicaSpeech: this.lastReplicaSpeech,
      isReplicaSpeaking: this.isReplicaSpeaking,
      hasCallbacks: Object.keys(this.callbacks).filter(key => !!this.callbacks[key]).length
    };
  }
}

export default DailyEventManager;
