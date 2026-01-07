/**
 * Local development server for testing API routes
 * Run this alongside npm start for full local testing
 *
 * Usage: node dev-server.mjs
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load .env.local file explicitly
// IMPORTANT: override: true forces .env.local values to override system environment variables
// This prevents stale system-level env vars from interfering with development
const result = dotenv.config({ path: '.env.local', override: true });

if (result.error) {
  console.error('❌ Error loading .env.local:', result.error);
} else {
  console.log('✅ Loaded environment variables from .env.local (with override)');
  console.log('   HEYGEN_API_KEY:', process.env.HEYGEN_API_KEY ? `${process.env.HEYGEN_API_KEY.substring(0, 8)}...` : '✗ Missing');
  console.log('   HEYGEN_AVATAR_ID:', process.env.HEYGEN_AVATAR_ID ? '✓ Set' : '✗ Missing');
  console.log('   HEYGEN_VOICE_ID:', process.env.HEYGEN_VOICE_ID ? '✓ Set' : '✗ Missing');
  console.log('   TAVUS_API_KEY:', process.env.TAVUS_API_KEY ? `${process.env.TAVUS_API_KEY.substring(0, 8)}...` : '✗ Missing');
  console.log('   TAVUS_PERSONA_ID:', process.env.TAVUS_PERSONA_ID ? '✓ Set' : '✗ Missing');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Enable CORS for React dev server
app.use(cors());
app.use(express.json());

// Serve static files from build directory
app.use(express.static('build'));

// Import the API handlers dynamically
const { default: createSessionHandler } = await import('./api/liveavatar/create-session.mjs');
const { default: stopSessionHandler } = await import('./api/liveavatar/stop-session.mjs');

// Import Tavus API handlers
const { default: tavusCreateConversationHandler } = await import('./api/tavus/create-conversation.mjs');
const { default: tavusEndConversationHandler } = await import('./api/tavus/end-conversation.mjs');
const { default: tavusCleanupAllSessionsHandler } = await import('./api/tavus/cleanup-all-sessions.mjs');

// Mount the primary API route (current frontend expects this path)
app.post('/api/liveavatar/create-session', async (req, res) => {
  console.log('📡 API Request received:', req.body);

  try {
    await createSessionHandler(req, res);
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mount the stop-session API route
app.post('/api/liveavatar/stop-session', async (req, res) => {
  console.log('📡 Stop Session Request received:', req.body);

  try {
    await stopSessionHandler(req, res);
  } catch (error) {
    console.error('❌ Stop Session API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Also support alternative path for compatibility
app.post('/api/create-liveavatar-session', async (req, res) => {
  console.log('📡 API Request received (alt path):', req.body);

  try {
    await createSessionHandler(req, res);
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mobile logs endpoint
app.post('/api/mobile-logs', (req, res) => {
  try {
    const { log, userAgent } = req.body;
    console.log('\n📱 ========================================');
    console.log('📱 MOBILE LOG:', log);
    if (userAgent) {
      console.log('📱 Device:', userAgent);
    }
    console.log('📱 ========================================\n');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error logging mobile data:', error);
    res.status(500).json({ error: 'Failed to log' });
  }
});

// Tavus API endpoints
app.post('/api/tavus/create-conversation', async (req, res) => {
  console.log('📡 Tavus Create Conversation Request received:', req.body);

  try {
    await tavusCreateConversationHandler(req, res);
  } catch (error) {
    console.error('❌ Tavus Create Conversation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tavus/end-conversation', async (req, res) => {
  console.log('📡 Tavus End Conversation Request received:', req.body);

  try {
    await tavusEndConversationHandler(req, res);
  } catch (error) {
    console.error('❌ Tavus End Conversation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tavus/cleanup-all-sessions', async (req, res) => {
  console.log('📡 Tavus Cleanup All Sessions Request received:', req.body);

  try {
    await tavusCleanupAllSessionsHandler(req, res);
  } catch (error) {
    console.error('❌ Tavus Cleanup All Sessions Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dev server running!' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`
🚀 Development API Server running!

📡 HeyGen API Endpoints:
   - http://localhost:${PORT}/api/liveavatar/create-session (create session)
   - http://localhost:${PORT}/api/liveavatar/stop-session (stop session)
   - http://localhost:${PORT}/api/create-liveavatar-session (alt path)

📡 Tavus API Endpoints:
   - http://localhost:${PORT}/api/tavus/create-conversation (create conversation)
   - http://localhost:${PORT}/api/tavus/end-conversation (end conversation)
   - http://localhost:${PORT}/api/tavus/cleanup-all-sessions (cleanup all sessions)

✅ Health Check: http://localhost:${PORT}/api/health

💡 Make sure to:
1. Set environment variables in .env.local (HEYGEN_* and TAVUS_*)
2. Run React app: npm start (in another terminal)
3. Both servers must run simultaneously

Press Ctrl+C to stop
  `);
});
