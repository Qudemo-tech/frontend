/**
 * Entri Persona - Avatar Prompts
 *
 * Scripts/prompts for what the avatar says during each module.
 *
 * PACING TIPS:
 * - Use ellipses (...) for pauses
 * - Keep sentences short for natural breathing room
 * - Add questions to engage the user
 */

export const modulePrompts = {
  'welcome-intro': `Hello there! ... Welcome to Entri.

I'm so glad you're here. ... My name is Ann, and I'll be your AI onboarding guide today.

...

So let me tell you about our company.

Entri is India's leading learning platform for job seekers. ... We've helped over 1.4 crore users, that's more than 14 million people, achieve their career dreams.

...

We're an education technology company... focused on making learning accessible to everyone. ... We help people prepare for competitive exams... learn new skills... and advance their careers.

As a new Entripreneur, that's what we call ourselves here, ... you're now part of this mission.

...

Here's what we'll cover in this onboarding:

First... a video message from our founders.

Then... some inspiring user success stories.

After that... we'll explore the different functions at Entri.

Next... we'll go through HR Policies covering working hours, leave policies, and more.

Then... we'll cover POSH guidelines... that's Prevention of Sexual Harassment at the Workplace.

And finally... your employee benefits and a short quiz to wrap things up.

...

Ready to get started? ... Just say "continue" when you're ready to proceed.`,

  'founder-video': "Now... let me show you a special video message from our founders. ... Please watch, and I'll be right here when it's done.",

  'founder-video-quiz': `Alright! ... Now that you've watched the founder's video, ... let's test your understanding with a quick quiz. ... I'll ask you a few questions... Please select your answer from the options on screen.`,

  'user-success-stories': "Now... let me show you some inspiring success stories from our users. ... Please watch, and I'll be right here when it's done.",

  'functions-at-entri': `Let's explore the different functions at Entri. ... In this section, you'll learn about the key teams that work together to make our mission possible.`,

  'functions-at-entri-quiz': `Alright! ... It's time to test your knowledge about Entri's functions. ... I'll ask you a few questions... Please select your answer from the options on screen.`,

  'hr-policies': `Let's dive into HR Policies. ... In this section, you'll learn about working hours, leave policies, holidays, and important HR guidelines that apply to you.`,

  'hr-policies-quiz': `Great! ... Now let's test your understanding of HR Policies with a quick quiz. ... I'll ask you a few questions... Please select your answer from the options on screen.`,

  'vertical-types': `Now let's explore the different verticals at Entri.

...

We serve learners across multiple categories.

Government Jobs... helping candidates prepare for PSC, SSC, Banking, and Railway exams.

Spoken English... building communication skills for career growth.

Coding and Tech... preparing learners for IT careers.

Upskilling... helping professionals learn new skills.

...

Each vertical is designed to meet specific career goals of our users.

...

Any questions about our verticals? ... Say "continue" when you're ready.`,

  'posh-info': "Now... let's talk about something really important. ... POSH, Prevention of Sexual Harassment at the Workplace. ... Please watch this video carefully... as it covers essential guidelines for maintaining a safe and respectful work environment. ... I'll be right here when it's done.",

  'posh-quiz': `Great! ... Now that you've watched the POSH video, ... let's test your understanding with a quiz. ... I'll ask you a few questions... Please select your answer from the options on screen.`,

  'employee-benefits': `Now... let's talk about something exciting... your employee benefits! ... In this section, you'll learn about health insurance, wellness programs, and all the perks that make Entri a great place to work.`,

  'employee-benefits-quiz': `Great! ... Now let's test your understanding of Employee Benefits with a quick quiz. ... I'll ask you a few questions... Please select your answer from the options on screen.`,

  'final-quiz': `Alright! ... You've made it to the final step.

...

It's quiz time!

I'll ask you a few questions... to see how much you've learned about Entri.

...

Don't worry, it's not too hard. ... Just pay attention and you'll do great.

...

Ready? ... Let's begin!`
};

/**
 * Module transition prompts - spoken when completing a section before moving to the next
 * These are used when a module is the last item in its section
 */
export const moduleTransitionPrompts = {
  // After founder-video-quiz (end of Welcome & Introduction section)
  'founder-video-quiz': `Great job completing the Welcome section! ... You've learned about Entri and met our founders.

...

Next up, ... we'll watch some inspiring success stories from our users.

...

If you have any questions about what we've covered so far, ... feel free to ask. ... Otherwise, say "continue" when you're ready to move on.`,

  // After user-success-stories (end of User Success Stories section)
  'user-success-stories': `Those were some amazing success stories, weren't they? ... Our users have achieved incredible things.

...

Now we'll explore the different functions and teams at Entri.

...

Any questions about the success stories? ... Say "continue" when you're ready to proceed.`,

  // After functions-at-entri-quiz (end of Functions at Entri section)
  'functions-at-entri-quiz': `Excellent! ... You now have a good understanding of how Entri is organized and the different teams that work together.

...

Next, we'll cover HR Policies, ... including working hours, leave policies, and more important information.

...

Any questions before we move on? ... Say "continue" when you're ready.`,

  // After hr-policies-quiz (end of HR Policies section)
  'hr-policies-quiz': `Well done! ... You now know the key HR policies at Entri.

...

Next up is a very important topic, ... POSH, Prevention of Sexual Harassment at the Workplace.

...

Any questions about HR policies? ... Say "continue" when you're ready to proceed.`,

  // After posh-quiz (end of POSH section)
  'posh-quiz': `Great job! ... Understanding POSH guidelines is essential for maintaining a safe workplace.

...

Now let's talk about something exciting, ... your employee benefits!

...

Any questions about POSH? ... Say "continue" when you're ready.`,

  // After employee-benefits-quiz (end of Employee Benefits section)
  'employee-benefits-quiz': `Wonderful! ... You now know all the great benefits available to you at Entri.

...

We're almost done! ... Just one more step, the final quiz to wrap up your onboarding.

...

Any questions about your benefits? ... Say "continue" when you're ready for the final quiz.`,
};

/**
 * Video completion prompts - spoken when a video ends (before quiz if applicable)
 * These prompts ask for user confirmation before proceeding to the quiz
 */
export const videoCompletionPrompts = {
  'founder-video': `That was a great message from our founders. ... I hope you feel inspired and excited to be part of the Entri family!

...

I hope you understood everything in the video. ... If you have any questions about what you just watched, ... feel free to ask. ... If you'd like to watch the video again, ... just say "repeat the video".

...

When you're ready for a quick quiz on the video, ... say "continue".`,

  'user-success-stories': `Those were some truly inspiring stories! ... Our users have achieved amazing things with Entri's help.

...

I hope you found that inspiring! ... If you have any questions about the success stories, ... feel free to ask. ... If you'd like to watch the video again, ... just say "repeat the video".

...

When you're ready to move on, ... say "continue".`,

  'posh-info': `That covered some very important information about POSH guidelines. ... It's essential that we all understand and follow these policies ... to maintain a safe and respectful workplace.

...

I hope you understood everything in the video. ... If you have any questions about POSH, ... feel free to ask. ... If you'd like to watch the video again, ... just say "repeat the video".

...

When you're ready for a quick quiz, ... say "continue".`,
};

export const welcomeMessage = "Hello! Welcome to Entri's onboarding. I'm Ann, your AI guide. Let's get started!";

export default {
  modulePrompts,
  moduleTransitionPrompts,
  videoCompletionPrompts,
  welcomeMessage,
};
