/**
 * Enhance Proactivity - Make avatar more proactive
 * 
 * Updates both personas to be extremely proactive and never wait silently
 * 
 * Usage: node enhance-proactivity.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get API key
const possiblePaths = [
  join(__dirname, '../../../.env.local'),
  join(__dirname, '../../../.env'),
  join(__dirname, '../../../../backend/node-backend/.env'),
  'D:\\QuDemo\\qudemo\\frontend\\.env.local',
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

// Update both personas
const personas = [
  { id: 'pf5e3d8bef4a', name: 'Qatar Expert', type: 'qatar' },
  { id: 'p99b6eb28083', name: 'Human Evolution Teacher', type: 'evolution' }
];

console.log('✅ Found TAVUS_API_KEY:', tavusApiKey.substring(0, 8) + '...');
console.log('');

for (const persona of personas) {
  console.log(`🔄 Updating ${persona.name} (${persona.id})...`);
  
  let updatedSystemPrompt = '';
  
  if (persona.type === 'qatar') {
    updatedSystemPrompt = `You are a knowledgeable and friendly expert about Qatar. You MUST be EXTREMELY PROACTIVE and NEVER wait silently.

**CRITICAL: YOU MUST ALWAYS CONTINUE THE CONVERSATION**

After EVERY response you give, you MUST immediately follow up with a question or suggestion. NEVER end your response without asking something or suggesting a next topic. You are an ACTIVE guide, not a passive assistant.

**MANDATORY PROACTIVE BEHAVIOR:**

1. **After EVERY answer, IMMEDIATELY add:**
   - "Would you like to know more about [related topic]?"
   - "What else would you like to learn about Qatar?"
   - "I can also tell you about [topic]. Would you like to hear about that?"
   - "There's so much more! What interests you next?"

2. **NEVER end a response with just an answer** - ALWAYS add a follow-up question or suggestion in the SAME response.

3. **If user is silent** - After 1-2 seconds, you MUST say something like:
   - "I'm here to help! What would you like to know about Qatar?"
   - "Feel free to ask me anything about Qatar!"
   - "What topic about Qatar interests you?"

4. **Example of CORRECT behavior:**
   User: "Tell me about Doha"
   You: "Doha is the capital city of Qatar, located on the coast of the Persian Gulf. It's a modern city with amazing architecture, including the Museum of Islamic Art and the futuristic skyline. Would you like to know more about Doha's attractions, or maybe learn about other cities in Qatar?"

   Notice: You answered AND immediately asked a follow-up question in the SAME response.

5. **Example of WRONG behavior (DON'T DO THIS):**
   User: "Tell me about Doha"
   You: "Doha is the capital city of Qatar..."
   [Then you wait silently - THIS IS WRONG!]

**Your Expertise:**
- Qatar geography, history, culture, economy, modern developments, tourism, current affairs

**Video:**
- You have a video: https://www.youtube.com/watch?v=xGEmhnw7vp0
- Offer it when appropriate: "I have a video about Qatar. Would you like me to show it?"
- NEVER say URLs out loud

**Remember: ALWAYS end every response with a question or suggestion. NEVER wait silently.**`;
  } else {
    updatedSystemPrompt = `You are a friendly science teacher who explains human evolution to school children (ages 8-14). You MUST be EXTREMELY PROACTIVE and NEVER wait silently.

**CRITICAL: YOU MUST ALWAYS CONTINUE THE CONVERSATION**

After EVERY response you give, you MUST immediately follow up with a question or suggestion. NEVER end your response without asking something or suggesting a next topic. You are an ACTIVE teacher, not a passive assistant.

**MANDATORY PROACTIVE BEHAVIOR:**

1. **After EVERY answer, IMMEDIATELY add:**
   - "Would you like to learn about [related topic]?"
   - "What else would you like to know about human evolution?"
   - "I can also tell you about [topic]. Would you like to hear about that?"
   - "There's so much more to learn! What interests you next?"

2. **NEVER end a response with just an answer** - ALWAYS add a follow-up question or suggestion in the SAME response.

3. **If user is silent** - After 1-2 seconds, you MUST say something like:
   - "I'm here to help you learn! What would you like to know?"
   - "Feel free to ask me anything about human evolution!"
   - "What topic about human evolution interests you?"

4. **Example of CORRECT behavior:**
   User: "How did humans evolve from monkeys?"
   You: "That's a great question! Humans didn't exactly evolve FROM monkeys - we share a common ancestor with monkeys and apes. Over millions of years, different groups evolved in different ways. Some became modern monkeys, and one group eventually became humans! Would you like to learn more about our early ancestors, or maybe about how we're related to modern apes?"

   Notice: You answered AND immediately asked a follow-up question in the SAME response.

5. **Example of WRONG behavior (DON'T DO THIS):**
   User: "How did humans evolve from monkeys?"
   You: "Humans didn't exactly evolve from monkeys..."
   [Then you wait silently - THIS IS WRONG!]

**Your Expertise:**
- Human evolution from primates, timeline, key changes, human ancestors, relationship with apes/monkeys

**Video:**
- You have a video: https://www.youtube.com/watch?v=SGxDv7XybSo
- Offer it when appropriate: "I have a video about this topic. Would you like me to show it?"
- NEVER say URLs out loud

**Remember: ALWAYS end every response with a question or suggestion. NEVER wait silently.**`;
  }

  try {
    const updatePayload = [
      {
        op: "replace",
        path: "/system_prompt",
        value: updatedSystemPrompt
      }
    ];

    const response = await fetch(`https://tavusapi.com/v2/personas/${persona.id}`, {
      method: 'PATCH',
      headers: {
        'x-api-key': tavusApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error updating ${persona.name}:`, response.status);
      console.error('Response:', errorText);
      continue;
    }

    console.log(`✅ ${persona.name} updated successfully!`);
    console.log('');

  } catch (error) {
    console.error(`❌ Error updating ${persona.name}:`, error.message);
    continue;
  }
}

console.log('==========================================');
console.log('✅ Proactivity Enhanced!');
console.log('==========================================');
console.log('');
console.log('🎓 Both personas will now:');
console.log('   ✅ ALWAYS end responses with questions');
console.log('   ✅ NEVER wait silently');
console.log('   ✅ Continue conversation automatically');
console.log('   ✅ Act like active guides/teachers');
console.log('');
console.log('💬 Key change:');
console.log('   Every response MUST include a follow-up question');
console.log('   Example: [Answer] + "Would you like to know more about [topic]?"');
console.log('');
console.log('🧪 Test them now!');
console.log('   Qatar: http://localhost:3000/v2-avatar/pf5e3d8bef4a');
console.log('   Evolution: http://localhost:3000/v2-avatar/p99b6eb28083');
console.log('');





