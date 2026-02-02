/**
 * 5G Persona - Avatar Prompts
 *
 * Scripts/prompts for what the avatar says during each module.
 *
 * PACING TIPS:
 * - Use ellipses ( ) for pauses
 * - Keep sentences short for natural breathing room
 * - Add questions to engage the user
 */

export const modulePrompts = {
  'intro-5g': `Hello!   I'm Ann.

Think of 5G not as just "faster 4G,"   but as a new network architecture designed to support very different types of communication.

 

While 4G focused primarily on mobile internet for people,   5G is built to connect people, machines, and critical systems,   from smartphones to factories and autonomous vehicles.

 

In this module, we'll explore how mobile networks evolved   and the three core service pillars that define 5G.

 

These pillars are:   eMBB, Enhanced Mobile Broadband, for high data rates.   URLLC, Ultra-Reliable Low Latency Communications, for critical applications.   And mMTC, Massive Machine-Type Communications, for connecting billions of devices.

 

Ready to dive in?   Just say "continue" when you're ready to watch a video overview of the 5G revolution.`,

  '5g-revolution-video': `Let's start with a high-level overview of what makes 5G a major shift in mobile communications.

 

Please watch this video, and I'll be right here when it's done.`,

  'quiz-5g-basics': `Great!   Now that you've learned about 5G fundamentals,   let's test your understanding with a quick quiz.

 

I'll ask you a couple of questions.   Please select your answer from the options on screen.`,

  'speed-latency-pdf': `Now let's talk about speed and latency,   two of the most important performance characteristics of 5G.

 

Bandwidth is how much data can flow at once,   like the width of a pipe.

Latency is how long it takes for data to travel from sender to receiver,   the delay.

 

5G dramatically reduces latency and increases capacity compared to 4G,   but performance depends on spectrum, network design, and deployment.

 

Let me show you a presentation that explains this in more detail.`,

  'quiz-technical-specs': `Excellent!   Now let's test your knowledge of 5G technical specifications.

 

I'll ask you a couple of questions.   Please select your answer from the options on screen.`,

  'real-world-applications': `Now for the fun part:   why 5G matters in the real world.

 

5G enables applications that require high reliability, low latency, or massive device density.

 

In healthcare,   5G can enable remote surgery and real-time patient monitoring.

In manufacturing,   smart factories use 5G for automated production lines and predictive maintenance.

In gaming,   cloud gaming becomes seamless with ultra-low latency.

And in smart cities,   millions of sensors can connect to manage traffic, energy, and public safety.

 

The key is that different applications use different 5G service types.   Healthcare needs URLLC for reliability.   Streaming needs eMBB for bandwidth.   IoT sensors need mMTC for massive connectivity.

 

Any questions about 5G applications?   Say "continue" when you're ready for the final quiz.`,

  'final-quiz': `Alright!   You've made it to the final quiz.

 

Let's see how much you've learned about 5G technology and its applications.

 

I'll ask you a couple of questions.   Please select your answer from the options on screen.

 

Ready?   Let's begin!`,
};

/**
 * Module transition prompts - spoken when completing a section before moving to the next
 * These are used when a module is the last item in its section
 */
export const moduleTransitionPrompts = {
  // After quiz-5g-basics (end of Introduction to 5G section)
  'quiz-5g-basics': `Great job completing the Introduction to 5G section!   You now understand the basics of 5G and its three service pillars.

 

Next up,   we'll dive deeper into speed and latency,   the technical aspects that make 5G so powerful.

 

Any questions about what we've covered so far?   Say "continue" when you're ready to move on.`,

  // After quiz-technical-specs (end of Speed and Latency section)
  'quiz-technical-specs': `Excellent!   You now understand the technical foundations of 5G,   including bandwidth, latency, and why small cells are needed.

 

In the final section,   we'll explore real-world applications of 5G across different industries.

 

Any questions before we move on?   Say "continue" when you're ready.`,
};

/**
 * Video completion prompts - spoken when a video ends (before quiz if applicable)
 * These prompts ask for user confirmation before proceeding to the quiz
 */
export const videoCompletionPrompts = {
  '5g-revolution-video': `That was a great overview of the 5G revolution!

 

I hope you found that informative.   If you have any questions about what you just watched,   feel free to ask.   If you'd like to watch the video again,   just say "repeat the video".

 

When you're ready for a quick quiz on 5G basics,   say "continue".`,
};

/**
 * Course completion prompt - spoken after the final quiz
 */
export const courseCompletionPrompt = `Congratulations!   You've completed the 5G Essentials course!

 

You now understand what 5G really is,   not hype, but a flexible platform for very different communication needs.

 

From enhanced mobile broadband to ultra-reliable communications for critical systems,   5G is transforming how we connect.

 

Thank you for learning with me today.   If you have any questions about 5G,   feel free to ask anytime.

 

Best of luck on your 5G journey!`;

export const welcomeMessage = "Hello! Welcome to 5G Essentials. I'm Ann, your AI guide. Let's explore the future of connectivity!";

const fiveGPrompts = {
  modulePrompts,
  moduleTransitionPrompts,
  videoCompletionPrompts,
  courseCompletionPrompt,
  welcomeMessage,
};

export default fiveGPrompts;
