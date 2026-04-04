/**
 * DEWA Electrical Safety - Quiz Definitions
 *
 * MCQ quizzes for each module and the final assessment.
 */

export const moduleQuizzes = {
  'quiz-electrical-safety': {
    intro: "Let's test your understanding of electrical safety basics. I'll read each question with 4 options. Please click your answer on the screen - voice answers are not supported for quizzes.",
    questions: [
      {
        question: "What is the minimum voltage level generally considered dangerous to humans?",
        options: [
          "5 volts",
          "50 volts",
          "220 volts",
          "1000 volts"
        ],
        correctIndex: 1,
        explanation: "Voltages as low as 50 volts AC can be lethal under certain conditions, such as wet skin or direct heart-path contact. This is why even low-voltage systems require caution."
      },
      {
        question: "What is the FIRST step before working on any electrical equipment?",
        options: [
          "Put on rubber gloves",
          "Inform your supervisor",
          "Ensure the circuit is de-energized and locked out",
          "Check the weather conditions"
        ],
        correctIndex: 2,
        explanation: "The Lock Out / Tag Out (LOTO) procedure is the most critical first step. You must verify the circuit is de-energized before any work begins to prevent accidental energization."
      }
    ],
    passingScore: 1,
    completionMessage: "Great job! You understand the fundamentals of electrical safety. Let's continue to learn about PPE and site entry rules."
  },

  'quiz-ppe': {
    intro: "Now let's test your knowledge of PPE and site entry rules. I'll read each question with 4 options. Please click your answer on the screen.",
    questions: [
      {
        question: "Which of the following is NOT standard PPE required for entering a DEWA substation?",
        options: [
          "Safety helmet with chin strap",
          "Insulated safety boots",
          "Sunglasses",
          "High-visibility vest"
        ],
        correctIndex: 2,
        explanation: "Standard PPE for substation entry includes a safety helmet, insulated boots, high-visibility vest, and arc-flash rated clothing. Regular sunglasses are not considered safety PPE."
      },
      {
        question: "What must you do before entering a restricted electrical zone?",
        options: [
          "Take a photo for documentation",
          "Obtain a valid Permit to Work (PTW)",
          "Call the control room to say hello",
          "Check your mobile phone signal"
        ],
        correctIndex: 1,
        explanation: "A Permit to Work (PTW) is mandatory before entering any restricted electrical zone. It ensures proper authorization, hazard assessment, and safety measures are in place."
      }
    ],
    passingScore: 1,
    completionMessage: "Excellent! You now understand PPE requirements and site entry rules. Let's explore working inside substations."
  },

  'final-quiz': {
    intro: "This is the final quiz to test your overall electrical safety knowledge. I'll read each question with 4 options. Please click your answer on the screen.",
    questions: [
      {
        question: "What is the safe approach distance for a 33kV energized conductor?",
        options: [
          "0.5 meters",
          "1 meter",
          "3 meters",
          "10 meters"
        ],
        correctIndex: 2,
        explanation: "For 33kV systems, a minimum safe approach distance of approximately 3 meters must be maintained. This distance increases with higher voltage levels to prevent arc flash and electrocution."
      },
      {
        question: "During a substation emergency, what is the correct order of actions?",
        options: [
          "Fix the problem, then report it",
          "Evacuate, alert others, report to control room",
          "Take photos first, then evacuate",
          "Call your manager, wait for instructions"
        ],
        correctIndex: 1,
        explanation: "In any substation emergency, personal safety comes first. Evacuate the area immediately, alert nearby personnel, and report the incident to the control room for coordinated response."
      }
    ],
    passingScore: 1,
    completionMessage: "Congratulations! You've completed the DEWA Electrical Safety course. You now understand the critical safety principles for working with electrical systems at DEWA facilities."
  },
};

export const finalQuiz = {
  intro: "This is the final assessment. Let's see how much you've learned about electrical safety at DEWA.",
  questions: [
    {
      question: "What are the three key safety procedures before working on electrical equipment?",
      correctAnswer: "Lock Out, Tag Out, and Test (LOTO + Verify)",
      keywords: ["lock out", "tag out", "loto", "verify", "test", "de-energize"],
      topic: "Electrical Safety Fundamentals"
    },
    {
      question: "What PPE is mandatory for substation entry?",
      correctAnswer: "Safety helmet, insulated boots, high-visibility vest, arc-flash rated clothing",
      keywords: ["helmet", "boots", "insulated", "arc flash", "high visibility", "vest"],
      topic: "PPE Requirements"
    }
  ],
  passingScore: 1,
  completionMessage: "Congratulations! You've completed the DEWA Electrical Safety course. Stay safe and always follow proper procedures."
};

const dewaQuizzes = {
  moduleQuizzes,
  finalQuiz,
};

export default dewaQuizzes;
