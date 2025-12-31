/**
 * Vercel Serverless Function
 * Ends a Tavus CVI conversation
 *
 * Endpoint: /api/tavus/end-conversation
 *
 * Supports both regular fetch and navigator.sendBeacon requests.
 * sendBeacon may send with different content-types, so we handle both.
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
    console.log('📱 TAVUS END CONVERSATION REQUEST');
    console.log('========================================');
    console.log('Content-Type:', req.headers['content-type']);

    // Parse body - handle both regular JSON and sendBeacon requests
    // sendBeacon with Blob may come as text/plain or application/json
    let body = req.body;

    // If body is a string (text/plain from sendBeacon), try to parse it as JSON
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
        console.log('Parsed string body as JSON');
      } catch (e) {
        console.error('Failed to parse body as JSON:', e.message);
      }
    }

    const { conversationId } = body || {};

    if (!conversationId) {
      console.error('❌ Missing conversationId in request body');
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing conversationId'
      });
    }

    console.log('Conversation ID:', conversationId);

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

    console.log('\n🛑 Ending Tavus conversation...');

    // End conversation via Tavus API
    const response = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
      method: 'POST',
      headers: {
        'x-api-key': TAVUS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Tavus API error:', response.status, errorData);

      // If conversation already ended or not found, treat as success
      if (response.status === 404 || response.status === 400) {
        console.log('⚠️ Conversation may already be ended or not found - treating as success');
        return res.status(200).json({
          success: true,
          conversationId,
          message: 'Conversation ended (or already ended)',
        });
      }

      return res.status(response.status).json({
        error: 'Failed to end conversation',
        details: errorData,
      });
    }

    console.log('✅ Conversation ended successfully');

    return res.status(200).json({
      success: true,
      conversationId,
      message: 'Conversation ended successfully',
    });

  } catch (error) {
    console.error('Error ending Tavus conversation:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
