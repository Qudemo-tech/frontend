/**
 * Vercel Serverless Function
 * Creates a Tavus CVI conversation and returns Daily.co room URL
 *
 * Endpoint: /api/tavus/create-conversation
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
    console.log('📱 TAVUS CONVERSATION REQUEST');
    console.log('========================================');

    const {
      userId = 'default-user',
      personaId,
      customGreeting,
      conversationalContext,
      language = 'english'
    } = req.body;

    console.log('User ID:', userId);
    console.log('Persona ID from request:', personaId);
    console.log('Request method:', req.method);

    // Get Tavus API key from environment
    const TAVUS_API_KEY = process.env.TAVUS_API_KEY;

    // Use persona_id from request body, fall back to env var if not provided
    const TAVUS_PERSONA_ID = personaId || process.env.TAVUS_PERSONA_ID;

    if (!TAVUS_API_KEY) {
      console.error('❌ Missing TAVUS_API_KEY environment variable');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Missing Tavus API key'
      });
    }

    if (!TAVUS_PERSONA_ID) {
      console.error('❌ Missing persona_id in request and no TAVUS_PERSONA_ID env var');
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing persona_id - provide it in URL path (/v2-avatar/:personaId) or set TAVUS_PERSONA_ID env var'
      });
    }

    console.log('✅ API Key found:', TAVUS_API_KEY ? `${TAVUS_API_KEY.substring(0, 8)}...` : 'undefined');
    console.log('✅ Using Persona ID:', TAVUS_PERSONA_ID);

    // Build request payload
    const payload = {
      persona_id: TAVUS_PERSONA_ID,
      properties: {
        language: language
      }
    };

    // Add optional fields if provided
    if (customGreeting) {
      payload.custom_greeting = customGreeting;
    }
    if (conversationalContext) {
      payload.conversational_context = conversationalContext;
    }

    console.log('\n🚀 Creating Tavus conversation...');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Create conversation via Tavus API
    const response = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Tavus API error:', response.status, errorData);
      return res.status(response.status).json({
        error: 'Failed to create conversation',
        details: errorData,
      });
    }

    const data = await response.json();

    console.log('✅ Conversation created successfully');
    console.log('   Conversation ID:', data.conversation_id);
    console.log('   Conversation URL:', data.conversation_url ? `${data.conversation_url.substring(0, 40)}...` : 'MISSING');
    console.log('   Status:', data.status);

    if (!data.conversation_url) {
      console.error('❌ Missing conversation_url in response:', data);
      return res.status(500).json({
        error: 'Malformed response',
        message: 'Missing conversation_url (Daily.co room URL)',
        details: data,
      });
    }

    // Return conversation data
    return res.status(200).json({
      conversationId: data.conversation_id,
      conversationName: data.conversation_name,
      conversationUrl: data.conversation_url,  // Daily.co room URL
      status: data.status,
      createdAt: data.created_at,
      _backend: 'vercel-serverless',
    });

  } catch (error) {
    console.error('Error creating Tavus conversation:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
