/**
 * Microwave Persona - Quiz Definitions
 *
 * MCQ quizzes for each module and the final assessment.
 */

export const moduleQuizzes = {
  'quiz-microwave-basics': {
    intro: "Let's test your understanding of microwave basics. I'll read each question with 4 options. Please click your answer on the screen - voice answers are not supported for quizzes.",
    questions: [
      {
        question: "What is the typical frequency range for microwaves?",
        options: [
          "30 Hz – 300 Hz",
          "300 MHz – 300 GHz",
          "1 THz – 10 THz",
          "50 kHz – 100 kHz"
        ],
        correctIndex: 1,
        explanation: "Microwaves sit between Radio waves and Infrared waves on the spectrum."
      },
      {
        question: "Which property describes the \"Line-of-Sight\" nature of microwaves?",
        options: [
          "They can bend around the Earth's curvature.",
          "They generally travel in straight paths and require a clear path between antennas.",
          "They only work underwater.",
          "They are unaffected by physical obstacles like buildings."
        ],
        correctIndex: 1,
        explanation: "Unlike lower frequency AM radio, microwaves do not \"surf\" the atmosphere; they require a direct path."
      }
    ],
    passingScore: 1,
    completionMessage: "Great job! You understand the fundamentals of microwaves. Let's continue to learn about waveguides and components."
  },

  'quiz-hardware-physics': {
    intro: "Now let's test your knowledge of microwave hardware and physics. I'll read each question with 4 options. Please click your answer on the screen.",
    questions: [
      {
        question: "Why aren't standard electrical wires used for high-frequency microwave signals?",
        options: [
          "They are too heavy.",
          "They suffer from high \"skin effect\" losses and radiation leakage.",
          "Microwaves only travel through plastic.",
          "Wires are too expensive."
        ],
        correctIndex: 1,
        explanation: "At high frequencies, current only flows on the surface of a wire, and the wire begins to radiate energy into the air like an antenna."
      },
      {
        question: "What is the primary purpose of a Microwave Waveguide?",
        options: [
          "To cool down the circuit.",
          "To amplify the signal.",
          "To transport microwave energy with minimal loss.",
          "To convert microwaves into DC power."
        ],
        correctIndex: 2,
        explanation: "Waveguides are designed to contain the electromagnetic field within a hollow structure to prevent signal degradation."
      }
    ],
    passingScore: 1,
    completionMessage: "Excellent! You now understand waveguides and microwave hardware. Let's explore radar and satellite communications."
  },

  'final-quiz': {
    intro: "This is the final quiz to test your mastery of microwave technology. I'll read each question with 4 options. Please click your answer on the screen.",
    questions: [
      {
        question: "Why are parabolic \"dish\" antennas so common in microwave systems?",
        options: [
          "They catch more rain.",
          "They are easier to paint.",
          "They provide high \"gain\" by focusing signals into a narrow, powerful beam.",
          "They convert microwaves into sound."
        ],
        correctIndex: 2,
        explanation: "Just like a flashlight mirror, the dish shape focuses energy toward a single point."
      },
      {
        question: "Which of these is a daily application of microwave technology?",
        options: [
          "Global Positioning System (GPS)",
          "Standard AC wall outlets",
          "Battery storage",
          "Internal combustion engines"
        ],
        correctIndex: 0,
        explanation: "GPS satellites beam microwave signals to your phone to calculate your exact position on Earth."
      }
    ],
    passingScore: 1,
    completionMessage: "Congratulations! You've completed the Microwave Technology course. You now understand the invisible 'lanes' in the air that make the modern world possible."
  },
};

export const finalQuiz = {
  intro: "This is the final assessment. Let's see how much you've learned about microwave technology.",
  questions: [
    {
      question: "What is the typical frequency range for microwaves?",
      correctAnswer: "300 MHz – 300 GHz",
      keywords: ["300", "mhz", "ghz", "megahertz", "gigahertz"],
      topic: "Microwave Fundamentals"
    },
    {
      question: "What is the primary purpose of a waveguide?",
      correctAnswer: "To transport microwave energy with minimal loss",
      keywords: ["transport", "microwave", "energy", "loss", "minimal"],
      topic: "Waveguides"
    }
  ],
  passingScore: 1,
  completionMessage: "Congratulations! You've completed the Microwave Technology course. You're officially a Microwave Tech pro!"
};

const microwaveQuizzes = {
  moduleQuizzes,
  finalQuiz,
};

export default microwaveQuizzes;
