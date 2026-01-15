#!/usr/bin/env node
/**
 * Script to update Tavus persona with PDF navigation tools
 *
 * Run: node scripts/update-pdf-tools.js
 * Or:  TAVUS_API_KEY=your_key TAVUS_PERSONA_ID=your_persona node scripts/update-pdf-tools.js
 *
 * Requires: TAVUS_API_KEY environment variable
 */

const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const PERSONA_ID = process.env.TAVUS_PERSONA_ID || 'p54ceeb77022'; // Default: Entri persona

if (!TAVUS_API_KEY) {
  console.error('❌ Missing TAVUS_API_KEY environment variable');
  console.error('   Usage: TAVUS_API_KEY=your_key node scripts/update-pdf-tools.js');
  process.exit(1);
}

// Define all tools (existing + new PDF tools)
const tools = [
  // ========== EXISTING TOOLS ==========
  {
    type: 'function',
    function: {
      name: 'show_demo_video',
      description: 'ALWAYS call this function when the user asks to see a demo, video, or product walkthrough. Do NOT speak the URL - invoke this function instead. The function will display the video to the user.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Video URL to display' },
          title: { type: 'string', description: 'Brief title describing the video' }
        },
        required: ['url', 'title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'schedule_meeting',
      description: 'ALWAYS call this function when the user wants to schedule a meeting, book a call, set up an appointment, or discuss availability. Do NOT speak the URL - invoke this function instead.',
      parameters: {
        type: 'object',
        properties: {
          calendly_url: { type: 'string', description: 'Calendly or scheduling URL' },
          purpose: { type: 'string', description: 'Brief description of meeting purpose' }
        },
        required: ['calendly_url', 'purpose']
      }
    }
  },

  // ========== PDF NAVIGATION TOOLS ==========
  // These tools control slide navigation during presentations
  {
    type: 'function',
    function: {
      name: 'navigate_pdf_next',
      description: 'Move to the next slide in the presentation. Call this when user says: "next", "next slide", "go forward", "continue to next", "show me the next one", "move on".',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'navigate_pdf_back',
      description: 'Go back to the previous slide. Call this when user says: "back", "previous", "go back", "previous slide", "show me the last one", "can we go back".',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'navigate_pdf_goto',
      description: 'Jump to a specific slide number. Call this when user mentions a slide number like: "go to slide 5", "show slide 10", "jump to page 3", "take me to slide 7".',
      parameters: {
        type: 'object',
        properties: {
          slide_number: { type: 'number', description: 'The slide number to navigate to (1-based)' }
        },
        required: ['slide_number']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'navigate_pdf_repeat',
      description: 'Repeat the current slide narration. Call this when user says: "repeat", "say that again", "one more time", "repeat the slide", "what did you say", "can you repeat".',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'end_pdf_presentation',
      description: 'End the current presentation and move to next module. Call this ONLY when user EXPLICITLY and DIRECTLY requests to exit/finish the presentation using phrases like: "finish presentation", "end this presentation", "close the slides", "exit presentation", "skip this presentation", "I want to stop the presentation". NEVER call this tool when: (1) answering questions, (2) offering to navigate to a different slide, (3) user asks about content not yet covered, (4) any conversational response. When in doubt, do NOT call this tool.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'answer_pdf_question',
      description: 'User is asking a question about the current slide content. Call this when user asks things like: "what does this mean?", "can you explain that?", "why is this important?", "tell me more".',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'The user question about slide content' }
        },
        required: ['question']
      }
    }
  }
];

async function updatePersonaTools() {
  console.log('\n========================================');
  console.log('🔧 TAVUS PERSONA TOOL UPDATE');
  console.log('========================================');
  console.log(`Persona ID: ${PERSONA_ID}`);
  console.log(`Tools to register: ${tools.length}`);
  console.log(`Tool names: ${tools.map(t => t.function.name).join(', ')}`);
  console.log('----------------------------------------\n');

  try {
    const response = await fetch(`https://tavusapi.com/v2/personas/${PERSONA_ID}`, {
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
      console.error('❌ Tavus API Error');
      console.error(`   Status: ${response.status}`);
      console.error(`   Response: ${errorData}`);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ Persona tools updated successfully!\n');
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n========================================');
    console.log('🎉 Done! Tools are now registered.');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error updating persona tools:', error.message);
    process.exit(1);
  }
}

// Run the update
updatePersonaTools();
