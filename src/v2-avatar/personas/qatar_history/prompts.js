/**
 * Qatar History Persona - Avatar Prompts
 *
 * Scripts/prompts for what the avatar says during each module.
 *
 * PACING TIPS:
 * - Use ellipses ( ) for pauses
 * - Keep sentences short for natural breathing room
 * - Add questions to engage the user
 */

export const modulePrompts = {
  'geography-intro': `Hello!   I'm Nex. I am here to help you learn about Qatar's history.

To understand Qatar's history, we must begin with its geography.

 

Qatar is a small peninsula that extends into the Arabian Gulf.   The land is mostly flat and desert-like,   with very little rainfall and no major rivers.

 

Because of this, farming was difficult for early settlers.   Instead, people relied on the sea for survival.   The Gulf provided fish for food   and sea routes for travel and trade.

 

Over time, Qatar's location helped connect it to nearby regions   such as Arabia, Persia, India, and East Africa.

 

Even though the environment was harsh,   geography quietly placed Qatar at the center of regional exchange.

 

Ready to test your knowledge?   Say "continue" when you're ready for the quiz.`,

  'quiz-geography': `Great!   Let's test your understanding of Qatar's geography.

 

I'll ask you a couple of questions.   Please select your answer from the options on screen.`,

  'pearl-diving-pdf': `Now let's look at Qatar's pearl diving heritage.

 

I'll show you a visual overview of this important era in Qatar's history.`,

  'pearl-diving-intro': `Before oil and gas, the sea was the backbone of Qatar's economy.

 

For many generations, pearl diving provided income for coastal communities.   Divers spent long hours at sea,   repeatedly diving deep underwater without oxygen equipment to retrieve pearls.

 

These pearls were valuable   and traded with merchants from India and Europe.

 

Life during the pearl diving era was difficult and uncertain,   as a family's income depended on each season's success.

 

In the early twentieth century,   the introduction of cultured pearls caused global demand for natural pearls to fall sharply.   This sudden change forced Qatar to look for new economic opportunities.

 

Ready to test your knowledge?   Say "continue" when you're ready for the quiz.`,

  'quiz-pearl-diving': `Let's test your understanding of the pearl diving economy.

 

I'll ask you a couple of questions.   Please select your answer from the options on screen.`,

  'leadership-intro': `As trade increased and regional competition grew,   Qatar needed strong political leadership.

 

During the nineteenth century,   the Al Thani family emerged as the ruling family,   helping to unite local tribes and maintain stability.

 

At the same time, Britain expanded its influence in the Gulf   to protect important sea routes.

 

Qatar entered agreements with Britain   that provided protection from external threats   while allowing local rulers to govern internal affairs.

 

This balance helped Qatar remain stable   during a period of regional uncertainty   and allowed its leadership to strengthen control over the country.

 

Ready to test your knowledge?   Say "continue" when you're ready for the quiz.`,

  'quiz-leadership': `Let's test your understanding of governance and stability.

 

I'll ask you a couple of questions.   Please select your answer from the options on screen.`,

  'independence-intro': `By the mid-twentieth century,   Britain began reducing its presence in the Gulf.

 

This created an important moment for Qatar.   The country chose to become fully independent   rather than join a larger political union.

 

In 1971, Qatar officially declared independence   and became a sovereign state,   meaning it gained full control over its government and foreign relations.

 

Independence marked the start of a new phase,   as Qatar began building modern institutions,   strengthening national identity,   and taking its place in the international community.

 

Ready to test your knowledge?   Say "continue" when you're ready for the quiz.`,

  'quiz-independence': `Let's test your knowledge of Qatar's independence.

 

I'll ask you a couple of questions.   Please select your answer from the options on screen.`,

  'oil-gas-pdf': `Now let's look at how oil and gas transformed Qatar.

 

I'll show you a visual overview of Qatar's energy development.`,

  'oil-gas-intro': `The discovery of oil and natural gas   transformed Qatar faster than almost any country in history.

 

Oil was discovered in the 1940s,   and later, massive natural gas reserves were found in the North Field.

 

These resources brought significant wealth   and allowed Qatar to invest heavily in infrastructure, education, and healthcare.

 

Cities expanded, living standards improved,   and new opportunities emerged.

 

Rather than relying only on natural resources,   Qatar focused on long-term development   and planning for the future.

 

Ready to test your knowledge?   Say "continue" when you're ready for the quiz.`,

  'quiz-oil-gas': `Let's test your knowledge of Qatar's energy sector.

 

I'll ask you a couple of questions.   Please select your answer from the options on screen.`,

  'modern-qatar-intro': `Today, Qatar is a modern nation   that continues to value its traditions.

 

While the country has embraced global trade, education, technology, and diplomacy,   it also preserves cultural and religious practices.

 

Qatar plays an active role in international affairs   and hosts major global events.

 

Its influence comes from careful planning,   energy leadership,   and a strong sense of national identity   rather than size or population.

 

Ready to test your knowledge?   Say "continue" when you're ready for the final quiz.`,

  'quiz-modern-qatar': `Let's test your understanding of modern Qatar.

 

I'll ask you a couple of questions.   Please select your answer from the options on screen.`,
};

/**
 * Module transition prompts - spoken when completing a section before moving to the next
 * These are used when a module is the last item in its section
 */
export const moduleTransitionPrompts = {
  'quiz-geography': `Great job!   You now understand Qatar's geography and how it shaped early life.

 

Next, we'll explore the pearl diving era   and its importance to Qatar's early economy.

 

Say "continue" when you're ready to move on.`,

  'quiz-pearl-diving': `Excellent!   You now understand the pearl diving economy   and its challenges.

 

Next, we'll look at political leadership   and Qatar's relationship with Britain.

 

Say "continue" when you're ready.`,

  'quiz-leadership': `Well done!   You now understand how the Al Thani family   and British agreements shaped Qatar's governance.

 

Next, we'll explore Qatar's path to independence.

 

Say "continue" when you're ready.`,

  'quiz-independence': `Great work!   You now understand Qatar's journey to sovereignty in 1971.

 

Next, we'll see how oil and gas   transformed the nation.

 

Say "continue" when you're ready.`,

  'quiz-oil-gas': `Excellent!   You now understand how energy resources   drove Qatar's rapid development.

 

Finally, we'll look at Qatar's role in the modern world.

 

Say "continue" when you're ready.`,
};

/**
 * Video completion prompts - spoken when a video ends (before quiz if applicable)
 * These prompts ask for user confirmation before proceeding to the quiz
 */
export const videoCompletionPrompts = {
  // No video modules in this course
};

/**
 * Course completion prompt - spoken after the final quiz
 */
export const courseCompletionPrompt = `Congratulations!   You've completed Qatar History Essentials.

 

You now understand how geography, leadership, and natural resources   shaped Qatar's journey from a pearl-diving society   to a modern global nation.

 

Thank you for learning with me today!`;

export const welcomeMessage = "Hello! Welcome to Qatar History Essentials. I'm Nex, your AI guide. Let's explore Qatar's fascinating journey!";

const qatarHistoryPrompts = {
  modulePrompts,
  moduleTransitionPrompts,
  videoCompletionPrompts,
  courseCompletionPrompt,
  welcomeMessage,
};

export default qatarHistoryPrompts;
