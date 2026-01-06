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

  'posh-info': `Alright... let's talk about something really important.

POSH, Prevention of Sexual Harassment at the Workplace.

...

At Entri... we take this very seriously. ... We've formed a dedicated POSH committee... as required by law... to ensure our workplace remains safe and respectful for everyone.

...

If you ever find yourself in an uncomfortable situation... please know that you're not alone. ... You can reach out to the committee in person... or via email. ... Everything is handled with complete confidentiality... and respect.

...

Your safety matters to us.

...

That concludes our POSH overview.

...

Do you have any questions about workplace safety... or the POSH committee? ... Say "continue" when you're ready... or ask me anything.`,

  'employee-benefits': `Now... let's talk about something exciting, your benefits!

...

At Entri... we believe in taking care of our people.

First... health insurance. ... You, your spouse, and your children are all covered.

...

We also have YourDost... a platform for free mental health counseling. ... Because your well-being matters.

...

There's a Welfare Fund... for when you need financial support.

Referral bonuses... when you bring in great talent.

And my personal favorite... the Entri Book Club! ... You get a quarterly allowance of 500 rupees for books.

...

Pretty great, right?

...

That's the summary of your employee benefits.

...

Any questions about insurance... counseling... or any of these benefits? ... Just say "continue" to move on... or feel free to ask.`,

  'lifestyle-benefits': `Alright... now for the fun stuff, lifestyle benefits!

...

We have a Wellness Club... to keep you healthy and active.

Employee Happy Hours... because work should also be fun.

...

We celebrate festivals and cultural events together.

There's a Sports Club... a Lunch Program...

...

And recreational facilities, table tennis... carroms... board games... even a library.

...

It's all about balance.

Work hard... and enjoy life too.

...

That covers the lifestyle perks at Entri.

...

Would you like to know more about any of these? ... Say "continue" when ready... or ask away.`,

  'company-rules': `Okay... last topic before the quiz.

Let's go over Entri's company rules and policies.

...

We have a zero-tolerance policy for harassment. ... All employees must follow POSH guidelines.

Professional conduct... is expected in all work situations.

...

If you experience or witness anything uncomfortable... report it immediately to the POSH committee. ... Complete confidentiality is guaranteed.

...

As Entripreneurs... we uphold values of diversity... inclusion... and respect.

...

That's the culture we build together.

...

That wraps up our company policies section.

...

Any questions before we head to the final quiz? ... Say "continue" or "ready" when you want to proceed.`,

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
