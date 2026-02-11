/**
 * Microwave Persona - Avatar Prompts
 *
 * Scripts/prompts for what the avatar says during each module.
 *
 * PACING TIPS:
 * - Use ellipses ( ) for pauses
 * - Keep sentences short for natural breathing room
 * - Add questions to engage the user
 */

export const modulePrompts = {
  'intro-microwaves': `Hi there!   I'm Nex. When most people hear 'microwave,' they think of microwave oven.   But in the world of engineering,   Microwaves are the invisible backbone of modern life—powering everything from your Wi-Fi and GPS   to satellite TV and deep-space exploration.

 

In this module,   we'll define where microwaves sit on the spectrum   and why their 'short' wavelength is a big deal for technology.`,

  'microwave-window-pdf': `Let me show you a reading about The Microwave Window—where microwaves occupy the electromagnetic spectrum between 300 MHz and 300 GHz,   and why their relatively short wavelengths   make them behave more like light than traditional radio waves,   traveling in straight lines,   Line-of-Sight.`,

  'quiz-microwave-basics': `Great!   Now that you've learned about the microwave spectrum,   let's test your understanding with a quick quiz.

 

I'll ask you a couple of questions.   Please select your answer from the options on screen.`,

  'waveguides-components': `At microwave frequencies,   electricity behaves... weirdly.   Standard copper wires start acting like antennas   and leak energy everywhere!   To move these signals around,   we have to use specialized hardware   like waveguides and microstrips.

 

Let's watch a short video about this:   Fundamentals of Waveguide Technology and Microwave Propagation.`,

  'waveguide-video': `Please watch this video on waveguide technology and microwave propagation.   I'll be right here when it's done.`,

  'quiz-hardware-physics': `Excellent!   Now let's test your knowledge of microwave hardware and physics.

 

I'll ask you a couple of questions.   Please select your answer from the options on screen.`,

  'radar-satellite': `Now,   let's see this in action.   Because microwaves can penetrate clouds and rain,   they are perfect for Radar and Satellite Communication.   Whether it's a weather-tracking station   or a satellite 22,000 miles in space,   microwaves are the tool of choice.

 

Reading:   Microwave Use Cases.   RADAR:   Sending a pulse and measuring the "echo" to find distance and speed.   Point-to-Point Links:   Those large drum-shaped antennas you see on cell towers.   Satellite Links:   Using the "C-band" or "Ku-band" to beam data across the globe.`,

  'final-quiz': `Alright!   You've made it to the final quiz.

 

Let's see how much you've learned about microwave technology and its applications.

 

I'll ask you a couple of questions.   Please select your answer from the options on screen.

 

Ready?   Let's begin!`,
};

export const moduleTransitionPrompts = {
  'quiz-microwave-basics': `Great job completing the Introduction to Microwaves section!   You now understand the basics of the microwave spectrum and line-of-sight propagation.

 

Next up,   we'll dive into waveguides and components—the specialized hardware that makes microwave systems work.

 

Any questions about what we've covered so far?   Say "continue" when you're ready to move on.`,

  'quiz-hardware-physics': `Excellent!   You now understand waveguides,   skin effect,   and why standard wires don't work at microwave frequencies.

 

In the final section,   we'll explore radar and satellite communications—the real-world applications of microwaves.

 

Any questions before we move on?   Say "continue" when you're ready.`,
};

export const videoCompletionPrompts = {
  'waveguide-video': `That was a great overview of waveguide technology and microwave propagation!

 

I hope you found that informative.   If you have any questions about what you just watched,   feel free to ask.   If you'd like to watch the video again,   just say "repeat the video".

 

When you're ready for a quick quiz on hardware and physics,   say "continue".`,
};

export const courseCompletionPrompt = `Amazing job!   You've moved from basic frequencies   to complex hardware   and global applications.   You now understand the invisible 'lanes' in the air   that make the modern world possible.   You're officially a Microwave Tech pro!`;

export const welcomeMessage = "Hi there! I'm Nex. Welcome to Microwave Technology. Let's explore the invisible backbone of modern life—from Wi-Fi and GPS to satellite TV and deep-space exploration!";

const microwavePrompts = {
  modulePrompts,
  moduleTransitionPrompts,
  videoCompletionPrompts,
  courseCompletionPrompt,
  welcomeMessage,
};

export default microwavePrompts;
