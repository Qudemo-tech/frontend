/**
 * Get Evolution Persona System Prompt
 * 
 * Fetches and displays the current system prompt for the evolution persona
 * 
 * Usage: node get-evolution-prompt.mjs [personaId]
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get API key
const possiblePaths = [
  join(__dirname, '../../../.env.local'),
  join(__dirname, '../../../.env'),
  join(__dirname, '../../../../backend/node-backend/.env'),
  join(__dirname, '../../../../frontend/.env.local'),
  join(__dirname, '../../../../frontend/.env'),
  'D:\\QuDemo\\qudemo\\frontend\\.env.local',
  'D:\\QuDemo\\qudemo\\frontend\\.env',
  'D:\\QuDemo\\qudemo\\backend\\node-backend\\.env',
];

let tavusApiKey = null;

for (const envPath of possiblePaths) {
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('TAVUS_API_KEY=') && !trimmed.startsWith('#')) {
        tavusApiKey = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
        break;
      }
    }
    if (tavusApiKey) break;
  } catch (error) {
    continue;
  }
}

if (!tavusApiKey) {
  tavusApiKey = process.env.TAVUS_API_KEY;
}

if (!tavusApiKey) {
  console.error('❌ Error: TAVUS_API_KEY not found!');
  process.exit(1);
}

// Get persona ID from command line args
const PERSONA_ID = process.argv[2] || 'p99b6eb28083';

console.log('📋 Fetching system prompt for persona:', PERSONA_ID);
console.log('');

try {
  // Get the current persona configuration
  const getResponse = await fetch(`https://tavusapi.com/v2/personas/${PERSONA_ID}`, {
    method: 'GET',
    headers: {
      'x-api-key': tavusApiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!getResponse.ok) {
    const errorText = await getResponse.text();
    console.error('❌ Error fetching persona:', getResponse.status);
    console.error('Response:', errorText);
    process.exit(1);
  }

  const personaData = await getResponse.json();
  const systemPrompt = personaData.system_prompt || '';
  const greeting = personaData.greeting || '';
  const tools = personaData.layers?.llm?.tools || [];

  console.log('✅ Persona fetched successfully!');
  console.log('');
  console.log('==========================================');
  console.log('📝 SYSTEM PROMPT');
  console.log('==========================================');
  console.log('');
  console.log(systemPrompt);
  console.log('');
  console.log('==========================================');
  console.log('👋 GREETING');
  console.log('==========================================');
  console.log('');
  console.log(greeting);
  console.log('');
  console.log('==========================================');
  console.log('🔧 TOOLS');
  console.log('==========================================');
  console.log('');
  console.log('Number of tools:', tools.length);
  tools.forEach((tool, index) => {
    if (tool.type === 'function' && tool.function) {
      console.log(`${index + 1}. ${tool.function.name}`);
      console.log(`   Description: ${tool.function.description?.substring(0, 100)}...`);
    }
  });
  console.log('');
  console.log('==========================================');
  console.log('📊 STATISTICS');
  console.log('==========================================');
  console.log('');
  console.log('System Prompt Length:', systemPrompt.length, 'characters');
  console.log('Greeting Length:', greeting.length, 'characters');
  console.log('Number of Tools:', tools.length);
  console.log('');

  // Save to file
  const outputPath = join(__dirname, 'evolution-persona-prompt.txt');
  const output = `PERSONA ID: ${PERSONA_ID}
FETCHED: ${new Date().toISOString()}

==========================================
SYSTEM PROMPT
==========================================

${systemPrompt}

==========================================
GREETING
==========================================

${greeting}

==========================================
TOOLS
==========================================

${JSON.stringify(tools, null, 2)}
`;
  
  writeFileSync(outputPath, output, 'utf-8');
  console.log('💾 Full prompt saved to: evolution-persona-prompt.txt');
  console.log('');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}

