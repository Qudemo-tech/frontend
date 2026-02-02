/**
 * 5G Persona - Quiz Definitions
 *
 * MCQ quizzes for each module and the final assessment.
 */

export const moduleQuizzes = {
  'quiz-5g-basics': {
    intro: "Let's test your understanding of 5G basics. I'll read each question with 4 options. Please click your answer on the screen - voice answers are not supported for quizzes.",
    questions: [
      {
        question: "What does the 'G' in 5G stand for?",
        options: [
          "Global",
          "Generation",
          "Gigabit",
          "Gravity"
        ],
        correctIndex: 1,
        explanation: "The 'G' stands for Generation. 5G is the fifth generation of cellular network standards."
      },
      {
        question: "Which of these is NOT a primary service pillar of 5G?",
        options: [
          "eMBB (Enhanced Mobile Broadband)",
          "URLLC (Ultra-Reliable Low Latency Communications)",
          "mMTC (Massive Machine-Type Communications)",
          "Wi-Fi"
        ],
        correctIndex: 3,
        explanation: "The three core 5G service categories are eMBB (high data rates), URLLC (low latency and high reliability), and mMTC (massive device connectivity). Wi-Fi is complementary but not part of 5G's core specification."
      }
    ],
    passingScore: 1,
    completionMessage: "Great job! You understand the fundamentals of 5G. Let's continue to learn about speed and latency."
  },

  'quiz-technical-specs': {
    intro: "Now let's test your knowledge of 5G technical specifications. I'll read each question with 4 options. Please click your answer on the screen.",
    questions: [
      {
        question: "What is the theoretical peak download speed of 5G (per 3GPP standards)?",
        options: [
          "100 Mbps",
          "1 Gbps",
          "20 Gbps",
          "100 Gbps"
        ],
        correctIndex: 2,
        explanation: "The 5G standard defines up to 20 Gbps downlink under ideal conditions. Real-world speeds are much lower but still significantly faster than 4G."
      },
      {
        question: "Why does 5G require small cells in many deployments?",
        options: [
          "They look better in cities",
          "High-frequency signals have limited range and penetration",
          "To save electricity",
          "To improve FM radio coverage"
        ],
        correctIndex: 1,
        explanation: "High-frequency spectrum (especially mmWave) offers very high speeds but travels short distances and is easily blocked by obstacles, requiring denser networks of smaller antennas."
      }
    ],
    passingScore: 1,
    completionMessage: "Excellent! You now understand the technical aspects of 5G. Let's explore real-world applications."
  },

  'final-quiz': {
    intro: "This is the final quiz to test your overall 5G knowledge. I'll read each question with 4 options. Please click your answer on the screen.",
    questions: [
      {
        question: "Which 5G service type best enables remote or robotic surgery?",
        options: [
          "eMBB",
          "URLLC (Ultra-Reliable Low Latency Communications)",
          "mMTC",
          "4G LTE"
        ],
        correctIndex: 1,
        explanation: "Remote surgery requires very low latency and extremely high reliability, which is the core focus of URLLC."
      },
      {
        question: "What does 'Network Slicing' allow in 5G?",
        options: [
          "Cutting physical cables",
          "Multiple virtual networks on the same physical infrastructure",
          "Splitting user billing",
          "Increasing tower size"
        ],
        correctIndex: 1,
        explanation: "Network slicing lets operators create logical networks with different performance guarantees, such as one slice for emergency services and another for consumer video streaming."
      }
    ],
    passingScore: 1,
    completionMessage: "Congratulations! You've completed the 5G Essentials course. You now understand what 5G really is—not hype, but a flexible platform for very different communication needs."
  },
};

export const finalQuiz = {
  intro: "This is the final assessment. Let's see how much you've learned about 5G technology.",
  questions: [
    {
      question: "What are the three service pillars of 5G?",
      correctAnswer: "eMBB, URLLC, mMTC",
      keywords: ["embb", "urllc", "mmtc", "enhanced mobile broadband", "ultra-reliable", "massive machine"],
      topic: "5G Fundamentals"
    },
    {
      question: "What is the theoretical peak download speed of 5G?",
      correctAnswer: "20 Gbps",
      keywords: ["20", "gbps", "20gbps", "gigabits"],
      topic: "5G Specifications"
    }
  ],
  passingScore: 1,
  completionMessage: "Congratulations! You've completed the 5G Essentials course. You now understand what 5G really is—not hype, but a flexible platform for very different communication needs."
};

const fiveGQuizzes = {
  moduleQuizzes,
  finalQuiz,
};

export default fiveGQuizzes;
