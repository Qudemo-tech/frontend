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

After that... we'll explore the different functions at Entri... and our business verticals.

Then... we'll discuss POSH guidelines... employee benefits... and lifestyle perks.

And finally... a short quiz to wrap things up.

...

That's the overview of what we'll cover today.

...

Do you have any questions before we watch the founders' video? ... Just say "yes" or "continue" when you're ready to proceed.`,

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

export const welcomeMessage = "Hello! Welcome to Entri's onboarding. I'm Ann, your AI guide. Let's get started!";

export default {
  modulePrompts,
  welcomeMessage,
};
