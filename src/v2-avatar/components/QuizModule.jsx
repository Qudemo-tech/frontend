import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, Award } from 'lucide-react';

/**
 * QuizModule - Interactive quiz component that asks questions and checks answers
 */
const QuizModule = ({ onAnswerSubmit, onQuizComplete, questions = [] }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Default questions if none provided
  const defaultQuestions = [
    {
      question: "What is natural selection?",
      correctAnswer: "natural selection",
      keywords: ["natural selection", "survival", "fittest", "adaptation"]
    },
    {
      question: "What is genetic drift?",
      correctAnswer: "genetic drift",
      keywords: ["genetic drift", "random", "chance", "population"]
    },
    {
      question: "What does the fossil record show us?",
      correctAnswer: "fossil record",
      keywords: ["fossil", "evidence", "evolution", "history"]
    },
    {
      question: "How long did human evolution take?",
      correctAnswer: "millions of years",
      keywords: ["millions", "years", "long time", "evolution"]
    }
  ];

  const quizQuestions = questions.length > 0 ? questions : defaultQuestions;
  const currentQuestion = quizQuestions[currentQuestionIndex];

  // Check if answer is correct (fuzzy matching)
  const checkAnswer = (userAnswer, correctAnswer, keywords) => {
    const userLower = userAnswer.toLowerCase().trim();
    const correctLower = correctAnswer.toLowerCase().trim();
    
    // Exact match
    if (userLower === correctLower) {
      return true;
    }
    
    // Check if answer contains keywords
    for (const keyword of keywords) {
      if (userLower.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    
    // Check if answer contains correct answer
    if (userLower.includes(correctLower) || correctLower.includes(userLower)) {
      return true;
    }
    
    return false;
  };

  const handleSubmit = () => {
    if (!userAnswer.trim()) {
      return;
    }

    const correct = checkAnswer(
      userAnswer,
      currentQuestion.correctAnswer,
      currentQuestion.keywords
    );

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(score + 1);
    }

    // Notify parent component
    if (onAnswerSubmit) {
      onAnswerSubmit({
        question: currentQuestion.question,
        userAnswer: userAnswer,
        isCorrect: correct,
        questionIndex: currentQuestionIndex
      });
    }

    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setUserAnswer('');
        setShowResult(false);
      } else {
        // Quiz completed
        setQuizCompleted(true);
        if (onQuizComplete) {
          onQuizComplete({
            totalQuestions: quizQuestions.length,
            score: correct ? score + 1 : score,
            percentage: Math.round(((correct ? score + 1 : score) / quizQuestions.length) * 100)
          });
        }
      }
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showResult) {
      handleSubmit();
    }
  };

  if (quizCompleted) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-2xl mx-auto">
        <div className="text-center">
          <div className="mb-6">
            <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
            <p className="text-xl text-gray-600">
              You scored {score} out of {quizQuestions.length}
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-4">
              {Math.round((score / quizQuestions.length) * 100)}%
            </p>
          </div>
          <div className="mt-6">
            {score === quizQuestions.length ? (
              <p className="text-green-600 font-semibold text-lg">
                Perfect score! Excellent work! 🎉
              </p>
            ) : score >= quizQuestions.length * 0.7 ? (
              <p className="text-blue-600 font-semibold text-lg">
                Great job! You understand the concepts well! 👍
              </p>
            ) : (
              <p className="text-orange-600 font-semibold text-lg">
                Good effort! Keep learning! 💪
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-xl max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Quiz Time!</h2>
          <span className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          {currentQuestion.question}
        </h3>
        
        {showResult ? (
          <div className={`p-4 rounded-lg mb-4 ${
            isCorrect ? 'bg-green-100 border-2 border-green-400' : 'bg-red-100 border-2 border-red-400'
          }`}>
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-green-800 font-semibold">Correct! Well done!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="text-red-800 font-semibold">
                    Not quite. The answer relates to: {currentQuestion.correctAnswer}
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your answer here..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
            autoFocus
          />
        )}
      </div>

      {!showResult && (
        <button
          onClick={handleSubmit}
          disabled={!userAnswer.trim()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          Submit Answer
          <ArrowRight className="w-5 h-5" />
        </button>
      )}

      {showResult && (
        <div className="text-center text-gray-500 text-sm">
          Moving to next question...
        </div>
      )}
    </div>
  );
};

export default QuizModule;

