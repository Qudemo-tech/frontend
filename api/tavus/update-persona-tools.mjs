/**
 * Vercel Serverless Function
 * Updates Tavus persona tools via PATCH API
 *
 * Endpoint: /api/tavus/update-persona-tools
 *
 * Usage:
 *   POST /api/tavus/update-persona-tools
 *   Body: { personaId: "pf5e3d8bef4a", tools: [...] }
 *
 * Or use the local script: node scripts/update-pdf-tools.js
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
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('\n========================================');
    console.log('🔧 TAVUS PERSONA TOOL UPDATE REQUEST');
    console.log('========================================');

    const { personaId, tools } = req.body;

    // Validate inputs
    if (!personaId) {
      console.error('❌ Missing personaId in request body');
      return res.status(400).json({
        error: 'Missing personaId',
        message: 'Request body must include personaId string'
      });
    }

    if (!tools || !Array.isArray(tools)) {
      console.error('❌ Missing or invalid tools array in request body');
      return res.status(400).json({
        error: 'Missing or invalid tools',
        message: 'Request body must include tools array'
      });
    }

    // Get Tavus API key from environment
    const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
    if (!TAVUS_API_KEY) {
      console.error('❌ Missing TAVUS_API_KEY environment variable');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Missing Tavus API key'
      });
    }

    console.log(`Persona ID: ${personaId}`);
    console.log(`Tools count: ${tools.length}`);
    console.log(`Tool names: ${tools.map(t => t.function?.name || t.name).join(', ')}`);

    // PATCH request to update persona tools
    const response = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY,
      },
      body: JSON.stringify([
        {
          op: 'replace',
          path: '/layers/llm/tools',
          value: tools
        }
      ]),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Tavus API error:', response.status, errorData);
      return res.status(response.status).json({
        error: 'Failed to update persona tools',
        status: response.status,
        details: errorData,
      });
    }

    const data = await response.json();
    console.log('✅ Persona tools updated successfully');

    return res.status(200).json({
      success: true,
      personaId,
      toolsCount: tools.length,
      toolNames: tools.map(t => t.function?.name || t.name),
      response: data
    });

  } catch (error) {
    console.error('Error updating persona tools:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
