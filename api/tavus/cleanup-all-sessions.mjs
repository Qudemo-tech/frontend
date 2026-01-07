/**
 * Vercel Serverless Function
 * Force cleanup of ALL active Tavus conversations
 *
 * Endpoint: /api/tavus/cleanup-all-sessions
 *
 * This endpoint is used to clean up orphaned sessions on startup.
 * It fetches all active conversations and ends them.
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('\n========================================');
    console.log('🧹 TAVUS CLEANUP ALL SESSIONS REQUEST');
    console.log('========================================');

    // Get Tavus API key from environment
    const TAVUS_API_KEY = process.env.TAVUS_API_KEY;

    if (!TAVUS_API_KEY) {
      console.error('❌ Missing TAVUS_API_KEY environment variable');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Missing Tavus API key'
      });
    }

    console.log('✅ API Key found:', TAVUS_API_KEY ? `${TAVUS_API_KEY.substring(0, 8)}...` : 'undefined');

    // Optional: filter by persona_id from request body
    const { personaId } = req.body || {};
    console.log('Persona ID filter:', personaId || 'none (all personas)');

    console.log('\n📋 Fetching all conversations...');

    // List all conversations
    const listResponse = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'GET',
      headers: {
        'x-api-key': TAVUS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      const errorData = await listResponse.text();
      console.error('❌ Failed to list conversations:', listResponse.status, errorData);
      return res.status(500).json({
        error: 'Failed to list conversations',
        details: errorData,
      });
    }

    const listData = await listResponse.json();
    const conversations = listData.data || listData || [];

    console.log(`📊 Found ${conversations.length} total conversations`);

    // Filter to active conversations only (and optionally by persona)
    const activeConversations = conversations.filter(c => {
      const isActive = c.status === 'active' || c.status === 'in_progress';
      const matchesPersona = !personaId || c.persona_id === personaId;
      return isActive && matchesPersona;
    });

    console.log(`🔍 Found ${activeConversations.length} active conversations to clean up`);

    if (activeConversations.length === 0) {
      console.log('✅ No active conversations to clean up');
      return res.status(200).json({
        success: true,
        message: 'No active conversations to clean up',
        ended: 0,
        total: conversations.length,
      });
    }

    // End all active conversations
    const results = await Promise.allSettled(
      activeConversations.map(async (conversation) => {
        const conversationId = conversation.conversation_id;
        console.log(`🛑 Ending conversation: ${conversationId}`);

        try {
          const endResponse = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
            method: 'POST',
            headers: {
              'x-api-key': TAVUS_API_KEY,
            },
          });

          if (endResponse.ok || endResponse.status === 404 || endResponse.status === 400) {
            // 404/400 means already ended - that's fine
            console.log(`✅ Ended conversation: ${conversationId}`);
            return { conversationId, success: true };
          } else {
            const errorData = await endResponse.text();
            console.error(`❌ Failed to end ${conversationId}:`, errorData);
            return { conversationId, success: false, error: errorData };
          }
        } catch (e) {
          console.error(`❌ Error ending ${conversationId}:`, e.message);
          return { conversationId, success: false, error: e.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`\n📊 Cleanup complete: ${successful} ended, ${failed} failed`);

    return res.status(200).json({
      success: true,
      message: `Cleaned up ${successful} conversation(s)`,
      ended: successful,
      failed: failed,
      total: conversations.length,
      details: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }),
    });

  } catch (error) {
    console.error('Error in cleanup-all-sessions:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
