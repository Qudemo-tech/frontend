/**
 * Qatar History Persona - Quiz Definitions
 *
 * MCQ quizzes for each module and the final assessment.
 */

export const moduleQuizzes = {
  'quiz-geography': {
    intro: "Let's test your understanding of Qatar's geography. Please click your answer on the screen.",
    questions: [
      {
        question: "Why was farming difficult in early Qatar?",
        options: [
          "Poor leadership",
          "Cold climate",
          "Lack of rainfall and freshwater",
          "Overpopulation"
        ],
        correctIndex: 2,
        explanation: "Qatar's desert environment made agriculture difficult, forcing people to rely on the sea."
      },
      {
        question: "How did Qatar's location help its early development?",
        options: [
          "It had forests",
          "It had large rivers",
          "It connected Qatar to sea trade routes",
          "It had fertile valleys"
        ],
        correctIndex: 2,
        explanation: "Qatar's peninsula location connected it to important sea trade routes across the Arabian Gulf."
      }
    ],
    passingScore: 1,
    completionMessage: "Great job! You understand Qatar's geography. Let's continue to learn about pearl diving."
  },

  'quiz-pearl-diving': {
    intro: "Let's test your knowledge of the pearl diving economy. Please click your answer on the screen.",
    questions: [
      {
        question: "Why were pearls important to Qatar's economy?",
        options: [
          "They were used as food",
          "They were only decorative",
          "They were sold internationally for income",
          "They were used for tools"
        ],
        correctIndex: 2,
        explanation: "Pearls were Qatar's main export, sold to merchants from India and Europe for significant income."
      },
      {
        question: "What made pearl diving dangerous?",
        options: [
          "Cold water",
          "Storms only",
          "Long breath-hold dives without equipment",
          "Strong sunlight"
        ],
        correctIndex: 2,
        explanation: "Pearl divers had to hold their breath for long periods while diving deep without oxygen equipment."
      }
    ],
    passingScore: 1,
    completionMessage: "Excellent! You understand the pearl diving era. Let's learn about leadership."
  },

  'quiz-leadership': {
    intro: "Let's test your understanding of governance and stability. Please click your answer on the screen.",
    questions: [
      {
        question: "What role did the Al Thani family play in Qatar?",
        options: [
          "Led pearl diving",
          "Controlled European trade",
          "Provided long-term political leadership",
          "Governed from Britain"
        ],
        correctIndex: 2,
        explanation: "The Al Thani family emerged as Qatar's ruling family, uniting tribes and maintaining stability."
      },
      {
        question: "Why did Qatar accept British protection?",
        options: [
          "To become a colony",
          "To improve farming",
          "To protect trade and security",
          "To gain population"
        ],
        correctIndex: 2,
        explanation: "British protection helped safeguard Qatar's trade routes while allowing local governance."
      }
    ],
    passingScore: 1,
    completionMessage: "Well done! You understand Qatar's governance history. Let's explore independence."
  },

  'quiz-independence': {
    intro: "Let's test your knowledge of Qatar's independence. Please click your answer on the screen.",
    questions: [
      {
        question: "What does sovereignty mean?",
        options: [
          "Economic success",
          "Military strength",
          "Full control over national decisions",
          "Cultural influence"
        ],
        correctIndex: 2,
        explanation: "Sovereignty means a nation has complete control over its own government and foreign relations."
      },
      {
        question: "Why is 1971 a key year in Qatar's history?",
        options: [
          "Oil discovery",
          "End of pearl diving",
          "Qatar became independent",
          "First elections"
        ],
        correctIndex: 2,
        explanation: "In 1971, Qatar declared independence and became a fully sovereign state."
      }
    ],
    passingScore: 1,
    completionMessage: "Great work! You understand Qatar's independence. Let's learn about energy."
  },

  'quiz-oil-gas': {
    intro: "Let's test your knowledge of Qatar's energy sector. Please click your answer on the screen.",
    questions: [
      {
        question: "Which resource had the greatest impact on Qatar's development?",
        options: [
          "Coal",
          "Solar energy",
          "Natural gas",
          "Timber"
        ],
        correctIndex: 2,
        explanation: "Natural gas, especially from the North Field, transformed Qatar into one of the world's wealthiest nations."
      },
      {
        question: "How did Qatar mainly use energy revenues?",
        options: [
          "Military only",
          "Luxury projects only",
          "Public services and infrastructure",
          "Agriculture only"
        ],
        correctIndex: 2,
        explanation: "Qatar invested energy revenues in infrastructure, education, healthcare, and long-term development."
      }
    ],
    passingScore: 1,
    completionMessage: "Excellent! You understand Qatar's energy transformation. Let's explore modern Qatar."
  },

  'quiz-modern-qatar': {
    intro: "Let's test your understanding of modern Qatar. Please click your answer on the screen.",
    questions: [
      {
        question: "What best explains Qatar's global influence?",
        options: [
          "Population size",
          "Agricultural output",
          "Energy resources and diplomacy",
          "Tourism alone"
        ],
        correctIndex: 2,
        explanation: "Qatar's influence comes from strategic energy leadership and active diplomacy, not its small size."
      },
      {
        question: "Why does Qatar protect its traditions while modernizing?",
        options: [
          "To avoid change",
          "To isolate the country",
          "To maintain national identity",
          "To limit education"
        ],
        correctIndex: 2,
        explanation: "Qatar preserves traditions to maintain its unique national identity while embracing modern development."
      }
    ],
    passingScore: 1,
    completionMessage: "Congratulations! You've completed Qatar History Essentials. You now understand Qatar's journey from a pearl-diving society to a modern global nation."
  },
};

export const finalQuiz = {
  intro: "This is the final assessment. Let's see how much you've learned about Qatar's history.",
  questions: [
    {
      question: "When did Qatar gain independence?",
      correctAnswer: "1971",
      keywords: ["1971", "nineteen seventy one"],
      topic: "Independence"
    },
    {
      question: "Which family rules Qatar?",
      correctAnswer: "Al Thani",
      keywords: ["al thani", "thani"],
      topic: "Leadership"
    }
  ],
  passingScore: 1,
  completionMessage: "Congratulations! You've completed Qatar History Essentials. You now understand how geography, leadership, and natural resources shaped Qatar's journey to modern nationhood."
};

const qatarHistoryQuizzes = {
  moduleQuizzes,
  finalQuiz,
};

export default qatarHistoryQuizzes;
