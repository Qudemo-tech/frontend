/**
 * DEWA Electrical Safety - Avatar Prompts
 *
 * Scripts/prompts for what the avatar says during each module.
 */

export const modulePrompts = {
  'intro-electrical-safety': `Hello!   I'm your DEWA safety instructor.   Welcome to the Electrical Safety Essentials course.



Electrical safety is the foundation of everything we do at DEWA.   Whether you're a field technician, engineer, or site visitor,   understanding electrical hazards can save your life.



In this module, we'll cover the core principles of electrical safety,   including the dangers of electric shock,   arc flash, and arc blast.



Electric shock occurs when current passes through the body.   Even low voltages, as low as 50 volts,   can be lethal under the right conditions.



Arc flash is an explosive release of energy   caused by an electrical fault.   It can reach temperatures of 35,000 degrees Fahrenheit,   hotter than the surface of the sun.



The key safety principle is always:   de-energize, lock out, tag out, and verify   before touching any electrical equipment.



Ready to continue?   Say "continue" when you're ready to watch a video on electrical hazards.`,

  'electrical-hazards-video': `Let's watch a video that demonstrates common electrical hazards   and why safety procedures are so important.



Please watch carefully,   and I'll be right here when it's done.`,

  'quiz-electrical-safety': `Great!   Now that you've learned about electrical safety fundamentals,   let's test your understanding with a quick quiz.



I'll ask you a couple of questions.   Please select your answer from the options on screen.`,

  'ppe-site-rules': `Now let's talk about Personal Protective Equipment   and site entry rules.



PPE is your last line of defense against electrical hazards.   At DEWA, we take PPE requirements very seriously.



Before entering any DEWA electrical facility, you must wear:   A safety helmet with a chin strap,   insulated safety boots rated for electrical work,   a high-visibility vest,   and arc-flash rated clothing appropriate for the voltage level.



For high-voltage areas,   you may also need insulated gloves,   face shields, and arc-flash suits   rated to the appropriate cal per centimeter squared level.



Site entry rules are equally important.   You must always:   obtain a valid Permit to Work before entering restricted zones,   sign in at the facility register,   attend the site safety briefing,   and be accompanied by authorized personnel if you are a visitor.



Never enter an electrical zone alone   unless you are authorized and your team knows your location.



Any questions about PPE or site entry rules?   Say "continue" when you're ready for the quiz.`,

  'quiz-ppe': `Excellent!   Now let's test your knowledge of PPE requirements   and site entry procedures.



I'll ask you a couple of questions.   Please select your answer from the options on screen.`,

  'working-in-substations': `Now for the most critical module:   working safely inside substations.



DEWA substations house high-voltage transformers, switchgear,   and distribution equipment.   The voltages range from 11kV to 400kV,   making proper procedures absolutely essential.



Before any work inside a substation:   First, ensure a valid Permit to Work is in place.   Second, verify that the equipment is de-energized using LOTO procedures.   Third, test with an approved voltage detector   to confirm zero energy state.   Fourth, apply safety grounds where required.



Maintain safe approach distances at all times.   For 11kV, stay at least 1.5 meters away.   For 33kV, maintain 3 meters.   For 132kV, the distance is 5 meters.   And for 400kV, you must stay at least 8 meters away from energized conductors.



In case of emergency:   evacuate immediately,   alert nearby personnel,   and report to the control room.   Never attempt to fight an electrical fire with water.



Always remember:   no task is so urgent that it cannot be done safely.



Any questions about substation safety?   Say "continue" when you're ready for the final quiz.`,

  'final-quiz': `Alright!   You've made it to the final quiz.



Let's see how much you've learned about electrical safety at DEWA.



I'll ask you a couple of questions.   Please select your answer from the options on screen.



Ready?   Let's begin!`,
};

/**
 * Module transition prompts
 */
export const moduleTransitionPrompts = {
  'quiz-electrical-safety': `Great job completing the Introduction to Electrical Safety section!   You now understand the fundamentals of electrical hazards and safety principles.



Next up,   we'll learn about Personal Protective Equipment   and the rules for entering DEWA electrical sites.



Any questions about what we've covered so far?   Say "continue" when you're ready to move on.`,

  'quiz-ppe': `Excellent!   You now understand PPE requirements   and the procedures for entering DEWA electrical facilities.



In the final section,   we'll explore the specific safety procedures   for working inside substations.



Any questions before we move on?   Say "continue" when you're ready.`,
};

/**
 * Video completion prompts
 */
export const videoCompletionPrompts = {
  'electrical-hazards-video': `That was an important overview of electrical hazards!



I hope you found that informative.   If you have any questions about what you just watched,   feel free to ask.   If you'd like to watch the video again,   just say "repeat the video".



When you're ready for a quick quiz on electrical safety basics,   say "continue".`,
};

/**
 * Course completion prompt
 */
export const courseCompletionPrompt = `Congratulations!   You've completed the DEWA Electrical Safety Essentials course!



You now understand the critical principles of electrical safety,   the PPE requirements for DEWA facilities,   and the procedures for working safely inside substations.



Remember:   safety is not just a set of rules,   it's a mindset.   Always de-energize before you work,   wear proper PPE,   follow Permit to Work procedures,   and never take shortcuts with electrical safety.



Thank you for completing this training.   Stay safe, and if you ever have doubts,   stop and ask.   No job is worth risking your life.



Best of luck in your work at DEWA!`;

export const welcomeMessage = "Hello! Welcome to this course on safety in the workplace. I am an AI and I will be guiding you through this. Feel free to stop and ask any questions at any time. Let's get started!";

const dewaPrompts = {
  modulePrompts,
  moduleTransitionPrompts,
  videoCompletionPrompts,
  courseCompletionPrompt,
  welcomeMessage,
};

export default dewaPrompts;
