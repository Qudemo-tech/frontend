/**
 * Module Quiz Configuration
 *
 * Each module can have its own quiz with MCQ questions.
 * Add new modules by adding a new key to the moduleQuizzes object.
 *
 * Structure:
 * - intro: What avatar says before starting the quiz
 * - questions: Array of MCQ questions
 *   - question: The question text (avatar will read this)
 *   - options: Array of 4 options (avatar will read these)
 *   - correctIndex: Index of correct answer (0-3)
 *   - explanation: Brief explanation (avatar says this after answering)
 * - passingScore: (optional) Minimum correct answers to pass
 * - completionMessage: What avatar says when quiz is complete
 */

const moduleQuizzes = {
  'founder-video': {
    intro: "Now that you have seen the video, let's take a short quiz to test your understanding. I'll read each question with 4 options. Please click your answer on the screen - voice answers are not supported for quizzes.",
    questions: [
      {
        question: "What is the main goal of Entri as a learning platform?",
        options: [
          "Entertainment and content creation",
          "Job oriented learning and skill development",
          "Social Media Engagement",
          "Freelance Opportunities for educators"
        ],
        correctIndex: 1,
        explanation: "Entri is a learning app that caters to job aspirants, offering preparation content to help users secure Government or Private Jobs."
      },
      {
        question: "In which State was Entri started?",
        options: [
          "Tamil Nadu",
          "Karnataka",
          "Kerala",
          "Andhra Pradesh"
        ],
        correctIndex: 2,
        explanation: "Entri was established in Kerala with Malayalam as its primary language before expanding to other languages and regions."
      },
      {
        question: "How does Entri ensure personalized learning?",
        options: [
          "By providing content only in English",
          "Through automatic adaptation to each learner's skill level, time availability and language preference",
          "By focusing only on government jobs",
          "By collaborating with international educators"
        ],
        correctIndex: 1,
        explanation: "Entri ensures personalized learning by automatically adapting its courses to match each learner's skill level, time availability, and language preference."
      },
      {
        question: "When was the Entri App established?",
        options: [
          "2015",
          "2016",
          "2017",
          "2018"
        ],
        correctIndex: 2,
        explanation: "Entri was founded in 2017, marking the beginning of its journey as a learning app focused on providing vernacular content to job aspirants in India."
      },
      {
        question: "In which states does Entri have offices?",
        options: [
          "Kerala, Karnataka, Tamil Nadu, Delhi",
          "Maharashtra, Gujarat, Rajasthan",
          "West Bengal, Odisha, Assam",
          "Delhi, Uttar Pradesh, Madhya Pradesh"
        ],
        correctIndex: 0,
        explanation: "Entri's main headquarters is in Kakkanad, Kerala, where the company began its operations and continues coordinating its core activities, later expanded to other regions."
      },
      {
        question: "What does Entri prioritize in its mission to help users secure jobs?",
        options: [
          "Physical Fitness",
          "Skill Development and Training",
          "Entertainment",
          "High Speed Internet Access"
        ],
        correctIndex: 1,
        explanation: "Entri focuses on skill development and training to help users secure jobs and improve their quality of life."
      },
      {
        question: "What is Entri's vision for the future?",
        options: [
          "To provide learning materials in multiple languages without focusing on job outcome",
          "To become the largest job oriented vernacular learning app in India targeting 4 crore users by 2027",
          "To expand globally and reach 1 crore users in various countries by 2025",
          "To cater exclusively to government job aspirants in India"
        ],
        correctIndex: 1,
        explanation: "Entri's vision is to become the largest job-oriented vernacular learning app in India, targeting 4 crore users by 2027."
      },
      {
        question: "Who are Entripreneurs at Entri?",
        options: [
          "Users who subscribe to Entri's learning platform",
          "Employees of Entri who are driven by a founder mindset and ownership",
          "Trainers who curate exam oriented materials",
          "Employees who have completed five years of service"
        ],
        correctIndex: 1,
        explanation: "The term Entripreneurs refers to Entri employees who embody the values of ownership and a founder-like mindset."
      },
      {
        question: "What does the term Legend represent at Entri?",
        options: [
          "Exceptional employees who have completed 5 years of service",
          "Trainers who have created the most study materials for the platform",
          "Employees who embody the founder mindset at the company",
          "Users who have subscribed to Entri for five years"
        ],
        correctIndex: 0,
        explanation: "Legends at Entri refers to employees who have completed five years of service and made significant contributions to the company's growth."
      }
    ],
    passingScore: 6,
    completionMessage: "Great job completing the Entri quiz! You now have a good understanding of our company. Let's continue with the next topic."
  },

  'posh-info': {
    intro: "Now let's do a quick quiz to check your understanding of POSH. I'll read each question with 4 options. Please click your answer on the screen - voice answers are not supported for quizzes.",
    questions: [
      {
        question: "What does POSH stand for?",
        options: [
          "Prevention of Sexual Harassment",
          "Protection of Staff Health",
          "Policy on Safety and Hygiene",
          "Prevention of Staff Harassment"
        ],
        correctIndex: 0,
        explanation: "POSH stands for Prevention of Sexual Harassment at the Workplace."
      },
      {
        question: "Who can you approach if you face an uncomfortable situation at work?",
        options: [
          "Only your manager",
          "The POSH Committee",
          "External lawyers only",
          "No one, handle it yourself"
        ],
        correctIndex: 1,
        explanation: "You can approach the POSH Committee in person or via email. All concerns are handled with complete confidentiality."
      },
      {
        question: "How are POSH complaints handled at Entri?",
        options: [
          "Publicly announced to all employees",
          "Ignored unless severe",
          "With complete confidentiality and respect",
          "Only if submitted in writing"
        ],
        correctIndex: 2,
        explanation: "All POSH concerns are handled with complete confidentiality and respect."
      }
    ],
    passingScore: 2,
    completionMessage: "Excellent! You've completed the POSH quiz. Let's move on to the next topic."
  },

  // Template for adding more module quizzes:
  // 'employee-benefits': {
  //   intro: "Let's check your understanding of employee benefits.",
  //   questions: [
  //     {
  //       question: "What is the quarterly allowance for Entri Book Club?",
  //       options: ["₹200", "₹500", "₹1000", "₹250"],
  //       correctIndex: 1,
  //       explanation: "The Entri Book Club has a quarterly allowance of ₹500."
  //     },
  //     // Add more questions...
  //   ],
  //   passingScore: 1,
  //   completionMessage: "Great job! You've completed the benefits quiz."
  // },

  // 'lifestyle-benefits': {
  //   intro: "...",
  //   questions: [...],
  //   completionMessage: "..."
  // },

  // 'company-rules': {
  //   intro: "...",
  //   questions: [...],
  //   completionMessage: "..."
  // },
};

/**
 * Get quiz configuration for a module
 * @param {string} moduleId - The module ID (e.g., 'posh-info')
 * @returns {object|null} Quiz configuration or null if no quiz exists
 */
export const getModuleQuiz = (moduleId) => {
  return moduleQuizzes[moduleId] || null;
};

/**
 * Check if a module has a quiz
 * @param {string} moduleId - The module ID
 * @returns {boolean} True if module has a quiz
 */
export const hasModuleQuiz = (moduleId) => {
  return !!moduleQuizzes[moduleId];
};

/**
 * Get all module IDs that have quizzes
 * @returns {string[]} Array of module IDs
 */
export const getModulesWithQuizzes = () => {
  return Object.keys(moduleQuizzes);
};

export default moduleQuizzes;
