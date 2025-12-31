import React from 'react';
import { CheckCircle, XCircle, HelpCircle, X, SkipForward } from 'lucide-react';

/**
 * MCQQuizOverlay - Displays MCQ options at the bottom of the video panel
 *
 * Props:
 * - question: Current question object { question, options, correctIndex, explanation }
 * - questionNumber: Current question number (1-based)
 * - totalQuestions: Total number of questions
 * - onSelect: Callback when user selects an option (index) => void
 * - selectedIndex: Currently selected option index (null if not answered)
 * - isAnswered: Whether current question has been answered
 * - isCorrect: Whether the selected answer was correct (only valid if isAnswered)
 * - disabled: Whether selection is disabled (e.g., waiting for avatar to finish speaking)
 * - score: Current score { correct: number, total: number }
 * - onSkipQuiz: Callback to skip/exit the quiz
 * - sidebarVisible: Whether the left sidebar is visible (default: false)
 * - sidebarWidth: Width of the sidebar in pixels (default: 320)
 */
const MCQQuizOverlay = ({
  question,
  questionNumber,
  totalQuestions,
  onSelect,
  selectedIndex,
  isAnswered,
  isCorrect,
  disabled,
  score,
  onSkipQuiz,
  sidebarVisible = false,
  sidebarWidth = 320
}) => {
  if (!question) return null;

  const optionLabels = ['A', 'B', 'C', 'D'];

  const getOptionStyle = (index) => {
    const baseStyle = "w-full p-3 rounded-xl text-left transition-all duration-200 flex items-center gap-3 border-2";

    if (!isAnswered) {
      // Not answered yet - show hover states
      if (disabled) {
        return `${baseStyle} bg-white/10 border-white/20 text-white/50 cursor-not-allowed`;
      }
      return `${baseStyle} bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 cursor-pointer`;
    }

    // Answered - show correct/incorrect states
    if (index === question.correctIndex) {
      // This is the correct answer
      return `${baseStyle} bg-green-500/30 border-green-400 text-white`;
    }

    if (index === selectedIndex && !isCorrect) {
      // User selected this but it's wrong
      return `${baseStyle} bg-red-500/30 border-red-400 text-white`;
    }

    // Other options after answering
    return `${baseStyle} bg-white/5 border-white/10 text-white/50`;
  };

  const getOptionIcon = (index) => {
    if (!isAnswered) return null;

    if (index === question.correctIndex) {
      return <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />;
    }

    if (index === selectedIndex && !isCorrect) {
      return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
    }

    return null;
  };

  // Calculate left offset based on sidebar visibility
  const leftOffset = sidebarVisible ? `${sidebarWidth}px` : '0';

  return (
    <div
      className="absolute bottom-0 right-0 z-40 bg-gradient-to-t from-black/95 via-black/90 to-transparent pt-12 pb-4 px-4"
      style={{ left: leftOffset }}
    >
      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-green-400 text-sm">Score: {score.correct}/{score.total}</span>
          {/* Skip/Exit Quiz Button */}
          {onSkipQuiz && (
            <button
              onClick={onSkipQuiz}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-all border border-white/20"
              title="Skip Quiz"
            >
              <SkipForward className="w-4 h-4" />
              <span>Skip</span>
            </button>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-3 p-3 bg-white/10 rounded-lg">
        <p className="text-white text-base font-medium">{question.question}</p>
      </div>

      {/* Options Grid - 2x2 layout */}
      <div className="grid grid-cols-2 gap-2">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !disabled && !isAnswered && onSelect(index)}
            disabled={disabled || isAnswered}
            className={getOptionStyle(index)}
          >
            {/* Option Label */}
            <span className={`
              w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
              ${isAnswered && index === question.correctIndex
                ? 'bg-green-500 text-white'
                : isAnswered && index === selectedIndex && !isCorrect
                  ? 'bg-red-500 text-white'
                  : 'bg-white/20 text-white'}
            `}>
              {optionLabels[index]}
            </span>

            {/* Option Text */}
            <span className="flex-1 text-sm">{option}</span>

            {/* Result Icon */}
            {getOptionIcon(index)}
          </button>
        ))}
      </div>

      {/* Instructions */}
      {!isAnswered && (
        <p className="text-center text-white/50 text-xs mt-3">
          Click an option to answer. Say "repeat" to hear the question again.
        </p>
      )}

      {/* Waiting for next question indicator */}
      {isAnswered && (
        <p className="text-center text-white/70 text-sm mt-3">
          {isCorrect ? '✓ Correct!' : '✗ Incorrect'} — Waiting for next question...
        </p>
      )}
    </div>
  );
};

export default MCQQuizOverlay;
