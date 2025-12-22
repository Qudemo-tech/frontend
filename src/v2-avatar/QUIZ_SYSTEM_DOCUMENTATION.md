# Quiz System Documentation

## Overview

The quiz system is a conversation-based interactive quiz that works entirely through speech. The avatar asks questions, listens to user answers, validates them using fuzzy matching, tracks scores, and provides a comprehensive summary at the end.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Quiz Initialization Flow](#quiz-initialization-flow)
3. [Question Formation](#question-formation)
4. [Answer Validation System](#answer-validation-system)
5. [Score Tracking](#score-tracking)
6. [Final Summary Generation](#final-summary-generation)
7. [File Structure](#file-structure)
8. [Code References](#code-references)

---

## System Architecture

### Components Involved

1. **LearningModules.jsx** - UI component with clickable quiz box
2. **TavusAvatarWidget.jsx** - Main component containing all quiz logic
3. **DailyEventManager.js** - Handles speech transcription events
4. **TavusSessionManager.js** - Manages avatar connection

### Key State Variables

Located in `TavusAvatarWidget.jsx` (Lines 72-106):

```javascript
const [quizState, setQuizState] = useState({
  isActive: false,                    // Whether quiz is currently running
  currentQuestionIndex: 0,            // Index of current question (0-based)
  questions: [...],                   // Array of quiz questions
  score: 0,                           // Current score (correct answers)
  waitingForAnswer: false,            // Ready to accept user answer
  waitingForConfirmation: false,      // Waiting for user confirmation (not used)
  lastQuestionAsked: null,            // Last question text
  questionResults: [],                // Array tracking results for each question
  isAskingQuestion: false             // Avatar is currently asking a question
});
```

---

## Quiz Initialization Flow

### Step 1: User Clicks "Final Quiz" Box

**File:** `frontend/src/v2-avatar/components/LearningModules.jsx`

**Line 65:** When user clicks the "Final Quiz" box:
```javascript
onModuleSelect(module.id);  // module.id = 'final-quiz'
```

**Line 38:** Module definition:
```javascript
{
  id: 'final-quiz',
  title: 'Final Quiz',
  icon: Award,
  ...
}
```

### Step 2: Handler Receives Click Event

**File:** `frontend/src/v2-avatar/components/TavusAvatarWidget.jsx`

**Line 2032:** LearningModules component passes handler:
```javascript
<LearningModules
  onModuleSelect={handleModuleSelect}
  activeModule={activeModule}
  completedModules={completedModules}
/>
```

**Line 1418:** `handleModuleSelect` function receives `'final-quiz'`:
```javascript
const handleModuleSelect = (moduleId) => {
  setActiveModule(moduleId);
  setTranscripts([]);  // Clear transcripts
  
  // Module-specific prompts
  const modulePrompts = {
    'final-quiz': "Perfect! It's time for the final quiz..."
  };
  
  if (moduleId === 'final-quiz') {
    // Initialize quiz...
  }
}
```

### Step 3: Quiz Questions Defined

**File:** `frontend/src/v2-avatar/components/TavusAvatarWidget.jsx`

**Lines 1436-1461:** Quiz questions are hardcoded in the function:

```javascript
const quizQuestions = [
  {
    question: "What is natural selection?",
    correctAnswer: "natural selection",
    keywords: ["natural selection", "survival", "fittest", "adaptation", "better at surviving"],
    topic: "Natural Selection"
  },
  {
    question: "What is genetic drift?",
    correctAnswer: "genetic drift",
    keywords: ["genetic drift", "random", "chance", "population", "random chance"],
    topic: "Genetic Drift"
  },
  {
    question: "What does the fossil record show us?",
    correctAnswer: "fossil record",
    keywords: ["fossil", "evidence", "evolution", "history", "fossil record", "millions of years"],
    topic: "Fossil Record"
  },
  {
    question: "How long did human evolution take?",
    correctAnswer: "millions of years",
    keywords: ["millions", "years", "long time", "evolution", "millions of years"],
    topic: "Evolution Timeline"
  }
];
```

**Question Structure:**
- `question`: The question text that avatar will ask
- `correctAnswer`: The exact correct answer string
- `keywords`: Array of keywords for fuzzy matching
- `topic`: Topic name for categorization and explanations

### Step 4: Quiz State Initialized

**Lines 1464-1474:** Quiz state is initialized:

```javascript
setQuizState({
  isActive: true,                      // Quiz is now active
  currentQuestionIndex: 0,            // Start with first question
  questions: quizQuestions,           // Store questions array
  score: 0,                           // Start with zero score
  waitingForAnswer: false,            // Not ready yet (avatar will ask first)
  waitingForConfirmation: false,      // Not used
  lastQuestionAsked: null,            // No question asked yet
  questionResults: [],                // Empty results array
  isAskingQuestion: true              // Avatar will ask first question
});
```

### Step 5: Avatar Notified to Start Quiz

**Lines 1478-1480:** Message sent to avatar via Tavus API:

```javascript
const firstQuestion = quizQuestions[0].question;
sendMessageToReplica(
  `${prompt} Now ask the first question: "${firstQuestion}" ` +
  `IMPORTANT: When the student answers, only say if it's correct, ` +
  `partially correct, or wrong. Do NOT explain the answer or provide corrections. ` +
  `Just say "That's correct!" or "That's not quite right" and immediately ` +
  `ask the next question. Save all explanations for the end of the quiz.`
);
```

**Function:** `sendMessageToReplica()` (Lines 1399-1408)
- Sends message to Tavus API via DailyEventManager
- Uses `sendRespondMessage()` to trigger avatar speech

---

## Question Formation

### How Questions Are Asked

1. **Initial Question:** Sent via `sendMessageToReplica()` (Line 1478)
2. **Subsequent Questions:** Sent after each answer validation (Lines 463, 493, 523, 552)

### Question Detection

**File:** `frontend/src/v2-avatar/components/TavusAvatarWidget.jsx`

**Lines 1490-1520:** `handleReplicaSpeechForQuiz()` detects when avatar asks a question:

```javascript
const handleReplicaSpeechForQuiz = (text) => {
  if (!quizState.isActive) return;
  
  const lowerText = text.toLowerCase();
  const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
  
  // Check if avatar is asking the current quiz question
  const questionKeywords = currentQuestion.question.toLowerCase()
    .split(' ')
    .filter(w => w.length > 3);
  
  const isAskingQuestion = 
    questionKeywords.some(keyword => lowerText.includes(keyword)) ||
    (lowerText.includes('?') && 
     (lowerText.includes(currentQuestion.question.split(' ')[0].toLowerCase()) ||
      lowerText.includes('what is') || 
      lowerText.includes('how long') ||
      lowerText.includes('what does')));
  
  if (isAskingQuestion) {
    setQuizState(prev => ({
      ...prev,
      isAskingQuestion: true,      // Mark that avatar is asking
      waitingForAnswer: false       // Not ready for answer yet
    }));
  }
};
```

**Called from:** `handleReplicaSpeech()` (Line 663) when `quizState.isActive === true`

---

## Answer Validation System

### Step 1: User Speech Captured

**File:** `frontend/src/v2-avatar/components/TavusAvatarWidget.jsx`

**Line 305:** `onUserTranscript` callback receives user speech:
```javascript
onUserTranscript: (text, source) => {
  // Ignore if avatar is speaking
  if (isAvatarSpeakingRef.current) {
    addDebugLog('[QUIZ] Ignoring user transcript - avatar is speaking');
    return;
  }
  handleUserSpeech(text, source);
}
```

**Line 316:** Calls `handleUserSpeech(text, source)`

### Step 2: Noise Filtering

**Lines 387-414:** `isNoiseOrInvalid()` function filters out background noise:

```javascript
const isNoiseOrInvalid = (text) => {
  if (!text) return true;
  
  const trimmed = text.trim();
  
  // Too short - likely noise (less than 2 characters)
  if (trimmed.length < 2) {
    return true;
  }
  
  // Common noise patterns
  const noisePatterns = [
    /^[h]+$/i,        // Just "h" or "hhh"
    /^[a]+$/i,        // Just "a" or "aaa"
    /^[uh]+$/i,       // Just "uh" or "uhh"
    /^[mm]+$/i,       // Just "mm" or "mmm"
    /^[eh]+$/i,       // Just "eh" or "ehh"
    /^\s*$/,          // Only whitespace
    /^[\.\?\!]+$/,    // Only punctuation
  ];
  
  if (noisePatterns.some(pattern => pattern.test(trimmed))) {
    return true;
  }
  
  return false;
};
```

**Line 381:** Called in `handleUserSpeech()`:
```javascript
if (isNoiseOrInvalid(text)) {
  log('USER_SPEECH', `Ignored noise: "${text}"`);
  return;
}
```

### Step 3: Quiz Answer Check

**Lines 435-448:** Checks if quiz is active and waiting for answer:

```javascript
if (quizState.isActive && quizState.waitingForAnswer && 
    quizState.currentQuestionIndex < quizState.questions.length) {
  
  // Additional validation - must be meaningful length
  if (text.trim().length < 3) {
    log('QUIZ', `Ignored short answer (likely noise): "${text}"`);
    return;
  }
  
  // Double-check avatar is not speaking
  if (isAvatarSpeakingRef.current) {
    log('QUIZ', `Ignored answer - avatar is speaking: "${text}"`);
    return;
  }
  
  const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
  const answerStatus = checkAnswer(text, currentQuestion.correctAnswer, currentQuestion.keywords);
  // ... handle answer
}
```

### Step 4: Answer Validation Function

**Lines 346-385:** `checkAnswer()` function performs fuzzy matching:

```javascript
const checkAnswer = (userAnswer, correctAnswer, keywords) => {
  const userLower = userAnswer.toLowerCase().trim();
  const correctLower = correctAnswer.toLowerCase().trim();
  
  // 1. Check for "I don't know" responses
  const dontKnowPhrases = [
    "i don't know", "i don't know", "i dunno", 
    "don't know", "no idea", "not sure", "unsure", 
    "i'm not sure", "i have no idea"
  ];
  if (dontKnowPhrases.some(phrase => userLower.includes(phrase))) {
    return 'dont_know';
  }
  
  // 2. Exact match
  if (userLower === correctLower) {
    return 'correct';
  }
  
  // 3. Check if answer contains correct answer
  if (userLower.includes(correctLower) || correctLower.includes(userLower)) {
    return 'correct';
  }
  
  // 4. Keyword matching
  let keywordMatches = 0;
  for (const keyword of keywords) {
    if (userLower.includes(keyword.toLowerCase())) {
      keywordMatches++;
    }
  }
  
  // 5. Calculate keyword match ratio
  if (keywordMatches > 0) {
    const keywordMatchRatio = keywordMatches / keywords.length;
    if (keywordMatchRatio >= 0.5) {
      return 'partial';  // Half correct, half wrong
    } else if (keywordMatchRatio > 0) {
      return 'partial';  // Some keywords but not enough
    }
  }
  
  // 6. No match found
  return 'incorrect';
};
```

**Validation Logic Flow:**

1. **"I Don't Know" Detection:** Checks for phrases indicating uncertainty
   - Returns: `'dont_know'`
   - Example: "I don't know" → `'dont_know'`

2. **Exact Match:** Compares lowercase trimmed strings
   - Returns: `'correct'`
   - Example: "natural selection" === "natural selection" → `'correct'`

3. **Substring Match:** Checks if correct answer is contained in user answer or vice versa
   - Returns: `'correct'`
   - Example: "it's natural selection" contains "natural selection" → `'correct'`

4. **Keyword Matching:** Counts how many keywords appear in user answer
   - Calculates ratio: `keywordMatches / totalKeywords`
   - If ratio ≥ 0.5: Returns `'partial'`
   - If ratio > 0 but < 0.5: Returns `'partial'`
   - Example: Question has 5 keywords, user answer contains 3 keywords → 3/5 = 0.6 → `'partial'`

5. **No Match:** If none of the above match
   - Returns: `'incorrect'`

**Example Validations:**

| User Answer | Correct Answer | Keywords | Result | Reason |
|------------|----------------|----------|--------|--------|
| "natural selection" | "natural selection" | ["natural selection", "survival", ...] | `'correct'` | Exact match |
| "it's about natural selection" | "natural selection" | ["natural selection", ...] | `'correct'` | Contains correct answer |
| "survival of the fittest" | "natural selection" | ["natural selection", "survival", "fittest", ...] | `'partial'` | 2/5 keywords = 0.4, but contains "survival" and "fittest" |
| "I don't know" | "natural selection" | [...] | `'dont_know'` | Matches "don't know" phrase |
| "something else" | "natural selection" | [...] | `'incorrect'` | No match |

---

## Score Tracking

### Answer Status Handling

**File:** `frontend/src/v2-avatar/components/TavusAvatarWidget.jsx`

**Lines 451-572:** Handles different answer statuses:

#### 1. Correct Answer (Lines 455-483)

```javascript
if (answerStatus === 'correct') {
  newScore = quizState.score + 1;  // Increment score
  newResults.push({ 
    questionIndex: quizState.currentQuestionIndex, 
    topic: currentQuestion.topic,
    status: 'correct' 
  });
  
  sendMessageToReplica(
    (quizState.currentQuestionIndex < quizState.questions.length - 1 
      ? `That's correct! Next question: "${quizState.questions[quizState.currentQuestionIndex + 1].question}"`
      : `That's correct! That was the last question!`)
  );
  
  // Move to next question
  if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
    const nextIndex = quizState.currentQuestionIndex + 1;
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      score: newScore,
      waitingForAnswer: false,
      isAskingQuestion: true,
      lastQuestionAsked: prev.questions[nextIndex].question,
      questionResults: newResults
    }));
  } else {
    completeQuiz(newResults, newScore);
  }
}
```

**Actions:**
- ✅ Increments score by 1
- ✅ Adds result: `{ questionIndex, topic, status: 'correct' }`
- ✅ Sends feedback: "That's correct! Next question: [question]"
- ✅ Moves to next question or completes quiz

#### 2. Partial Answer (Lines 485-513)

```javascript
else if (answerStatus === 'partial') {
  newResults.push({ 
    questionIndex: quizState.currentQuestionIndex, 
    topic: currentQuestion.topic,
    status: 'partial' 
  });
  
  sendMessageToReplica(
    (quizState.currentQuestionIndex < quizState.questions.length - 1 
      ? `Partially correct, but not quite right. Next question: "${quizState.questions[quizState.currentQuestionIndex + 1].question}"`
      : `Partially correct, but not quite right. That was the last question!`)
  );
  
  // Move to next question immediately
  if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
    const nextIndex = quizState.currentQuestionIndex + 1;
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      score: newScore,  // Score stays same (not incremented)
      waitingForAnswer: false,
      isAskingQuestion: true,
      lastQuestionAsked: prev.questions[nextIndex].question,
      questionResults: newResults
    }));
  } else {
    completeQuiz(newResults, newScore);
  }
}
```

**Actions:**
- ❌ Does NOT increment score
- ✅ Adds result: `{ questionIndex, topic, status: 'partial' }`
- ✅ Sends feedback: "Partially correct, but not quite right. Next question: [question]"
- ✅ Moves to next question immediately

#### 3. "Don't Know" Answer (Lines 515-542)

```javascript
else if (answerStatus === 'dont_know') {
  newResults.push({ 
    questionIndex: quizState.currentQuestionIndex, 
    topic: currentQuestion.topic,
    status: 'unanswered' 
  });
  
  sendMessageToReplica(
    (quizState.currentQuestionIndex < quizState.questions.length - 1 
      ? `That's okay. Next question: "${quizState.questions[quizState.currentQuestionIndex + 1].question}"`
      : `That's okay. That was the last question!`)
  );
  
  // Move to next question immediately
  if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
    const nextIndex = quizState.currentQuestionIndex + 1;
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      waitingForAnswer: false,
      isAskingQuestion: true,
      lastQuestionAsked: prev.questions[nextIndex].question,
      questionResults: newResults
    }));
  } else {
    completeQuiz(newResults, newScore);
  }
}
```

**Actions:**
- ❌ Does NOT increment score
- ✅ Adds result: `{ questionIndex, topic, status: 'unanswered' }`
- ✅ Sends feedback: "That's okay. Next question: [question]"
- ✅ Moves to next question immediately

#### 4. Incorrect Answer (Lines 544-571)

```javascript
else {
  // Incorrect answer
  newResults.push({ 
    questionIndex: quizState.currentQuestionIndex, 
    topic: currentQuestion.topic,
    status: 'incorrect' 
  });
  
  sendMessageToReplica(
    (quizState.currentQuestionIndex < quizState.questions.length - 1 
      ? `That's not quite right. Next question: "${quizState.questions[quizState.currentQuestionIndex + 1].question}"`
      : `That's not quite right. That was the last question!`)
  );
  
  // Move to next question immediately
  if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
    const nextIndex = quizState.currentQuestionIndex + 1;
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      waitingForAnswer: false,
      isAskingQuestion: true,
      lastQuestionAsked: prev.questions[nextIndex].question,
      questionResults: newResults
    }));
  } else {
    completeQuiz(newResults, newScore);
  }
}
```

**Actions:**
- ❌ Does NOT increment score
- ✅ Adds result: `{ questionIndex, topic, status: 'incorrect' }`
- ✅ Sends feedback: "That's not quite right. Next question: [question]"
- ✅ Moves to next question immediately

### Question Results Array Structure

Each question result is stored as:
```javascript
{
  questionIndex: 0,        // Index of the question (0-based)
  topic: "Natural Selection",  // Topic name
  status: 'correct' | 'partial' | 'incorrect' | 'unanswered'
}
```

**Example `questionResults` array:**
```javascript
[
  { questionIndex: 0, topic: "Natural Selection", status: 'correct' },
  { questionIndex: 1, topic: "Genetic Drift", status: 'partial' },
  { questionIndex: 2, topic: "Fossil Record", status: 'incorrect' },
  { questionIndex: 3, topic: "Evolution Timeline", status: 'unanswered' }
]
```

---

## Final Summary Generation

### Quiz Completion

**File:** `frontend/src/v2-avatar/components/TavusAvatarWidget.jsx`

**Lines 1342-1403:** `completeQuiz()` function generates final summary:

```javascript
const completeQuiz = (questionResults, finalScore) => {
  const totalQuestions = quizState.questions.length;
  
  // Calculate totals
  const correctCount = questionResults.filter(r => r.status === 'correct').length;
  const incorrectCount = questionResults.filter(r => 
    r.status === 'incorrect' || r.status === 'partial'
  ).length;
  const unansweredCount = questionResults.filter(r => r.status === 'unanswered').length;
  const percentage = Math.round((finalScore / totalQuestions) * 100);
  
  // Find all incorrect/unanswered questions with their details
  const incorrectQuestions = questionResults
    .filter(r => r.status !== 'correct')
    .map(r => {
      const question = quizState.questions[r.questionIndex];
      return {
        question: question.question,
        correctAnswer: question.correctAnswer,
        topic: question.topic,
        explanation: getTopicExplanation(question.topic),
        status: r.status
      };
    });
  
  // Build summary message
  let summaryMessage = `Great job completing the quiz! Let me give you a summary of how you did:\n\n`;
  summaryMessage += `📊 **Quiz Results:**\n`;
  summaryMessage += `- Total Questions: ${totalQuestions}\n`;
  summaryMessage += `- Correct Answers: ${correctCount}\n`;
  summaryMessage += `- Incorrect/Partial Answers: ${incorrectCount}\n`;
  summaryMessage += `- Unanswered: ${unansweredCount}\n`;
  summaryMessage += `- Final Score: ${finalScore} out of ${totalQuestions} (${percentage}%)\n\n`;
  
  if (incorrectQuestions.length > 0) {
    summaryMessage += `📚 **Here are the correct answers and explanations for the questions you missed:**\n\n`;
    incorrectQuestions.forEach((item, index) => {
      summaryMessage += `${index + 1}. **${item.question}**\n`;
      summaryMessage += `   ✅ Correct Answer: ${item.correctAnswer}\n`;
      summaryMessage += `   💡 Explanation: ${item.explanation}\n\n`;
    });
    summaryMessage += `I recommend going back to the learning modules and reviewing these topics. Practice makes perfect!`;
  } else {
    summaryMessage += `🎉 **Excellent work!** You answered all questions correctly. You have a strong understanding of human evolution!`;
  }
  
  summaryMessage += `\n\nDo you have any questions about what we covered, or would you like to review any specific topic?`;
  
  // Update quiz state
  setQuizState(prev => ({
    ...prev,
    isActive: false,
    score: finalScore,
    waitingForAnswer: false,
    waitingForConfirmation: false,
    isAskingQuestion: false,
    questionResults: questionResults
  }));
  
  setCompletedModules(prev => [...prev, 'final-quiz']);
  setShowLearningModules(true);
  
  // Send summary to avatar
  sendMessageToReplica(summaryMessage);
};
```

### Summary Calculation Details

**Total Questions:**
```javascript
const totalQuestions = quizState.questions.length;  // Always 4
```

**Correct Count:**
```javascript
const correctCount = questionResults.filter(r => r.status === 'correct').length;
```
- Counts all results with `status === 'correct'`
- This equals `finalScore` (only correct answers increment score)

**Incorrect/Partial Count:**
```javascript
const incorrectCount = questionResults.filter(r => 
  r.status === 'incorrect' || r.status === 'partial'
).length;
```
- Counts results with `status === 'incorrect'` OR `status === 'partial'`
- Both are considered incorrect for summary purposes

**Unanswered Count:**
```javascript
const unansweredCount = questionResults.filter(r => r.status === 'unanswered').length;
```
- Counts results with `status === 'unanswered'`
- These are "I don't know" responses

**Percentage:**
```javascript
const percentage = Math.round((finalScore / totalQuestions) * 100);
```
- Example: 3 correct out of 4 = 75%

### Topic Explanations

**Lines 1324-1336:** `getTopicExplanation()` function provides explanations:

```javascript
const getTopicExplanation = (topic) => {
  const explanations = {
    "Natural Selection": "Natural selection is the process where animals that are better adapted to their environment survive and pass on their traits to their offspring. It's like nature choosing the best traits over time.",
    "Genetic Drift": "Genetic drift happens when random chance affects which traits get passed down in a small population. It's like flipping a coin - sometimes certain traits become more common just by luck.",
    "Fossil Record": "The fossil record shows us evidence of evolution over millions of years. Fossils are like nature's history book, showing us how living things have changed over time.",
    "Evolution Timeline": "Human evolution took millions of years. Our ancestors gradually changed from ape-like creatures to modern humans over a very long period of time."
  };
  return explanations[topic] || "This is an important concept in evolution.";
};
```

**Used in:** Final summary to explain missed questions

---

## File Structure

### Main Files

1. **`frontend/src/v2-avatar/components/TavusAvatarWidget.jsx`**
   - Main quiz logic (2068 lines)
   - Contains all quiz state, validation, and scoring
   - Handles avatar communication

2. **`frontend/src/v2-avatar/components/LearningModules.jsx`**
   - UI component for quiz box (108 lines)
   - Handles click events
   - Passes `onModuleSelect` callback

3. **`frontend/src/v2-avatar/utils/DailyEventManager.js`**
   - Handles speech transcription events
   - Provides `onUserTranscript` and `onReplicaTranscript` callbacks

4. **`frontend/src/v2-avatar/utils/TavusSessionManager.js`**
   - Manages Tavus avatar connection
   - Handles video/audio streams

---

## Code References

### Key Functions and Their Locations

| Function/Feature | File | Lines |
|-----------------|------|-------|
| Quiz State Definition | TavusAvatarWidget.jsx | 72-106 |
| Quiz Initialization | TavusAvatarWidget.jsx | 1418-1489 |
| Question Definitions | TavusAvatarWidget.jsx | 1436-1461 |
| Answer Validation | TavusAvatarWidget.jsx | 346-385 |
| Noise Filtering | TavusAvatarWidget.jsx | 387-414 |
| Answer Handling | TavusAvatarWidget.jsx | 435-575 |
| Score Tracking | TavusAvatarWidget.jsx | 451-572 |
| Final Summary | TavusAvatarWidget.jsx | 1342-1403 |
| Topic Explanations | TavusAvatarWidget.jsx | 1324-1336 |
| Quiz Box UI | LearningModules.jsx | 37-45 |
| Click Handler | LearningModules.jsx | 63-66 |

### Event Flow

```
User Click → LearningModules.jsx:65
  ↓
handleModuleSelect('final-quiz') → TavusAvatarWidget.jsx:1418
  ↓
Define Questions → TavusAvatarWidget.jsx:1436-1461
  ↓
Initialize State → TavusAvatarWidget.jsx:1464-1474
  ↓
Send to Avatar → TavusAvatarWidget.jsx:1478
  ↓
Avatar Speaks → DailyEventManager → onReplicaTranscript → TavusAvatarWidget.jsx:318
  ↓
User Answers → DailyEventManager → onUserTranscript → TavusAvatarWidget.jsx:305
  ↓
Filter Noise → TavusAvatarWidget.jsx:381
  ↓
Validate Answer → TavusAvatarWidget.jsx:448 → checkAnswer() → TavusAvatarWidget.jsx:346
  ↓
Update Score → TavusAvatarWidget.jsx:451-572
  ↓
Move to Next → TavusAvatarWidget.jsx:472/502/532/561
  ↓
Repeat for All Questions
  ↓
Complete Quiz → TavusAvatarWidget.jsx:482/512/541/570 → completeQuiz() → TavusAvatarWidget.jsx:1342
  ↓
Calculate Totals → TavusAvatarWidget.jsx:1350-1353
  ↓
Generate Summary → TavusAvatarWidget.jsx:1369-1389
  ↓
Send to Avatar → TavusAvatarWidget.jsx:1402
```

---

## Validation Examples

### Example 1: Correct Answer

**Question:** "What is natural selection?"
**Correct Answer:** "natural selection"
**Keywords:** ["natural selection", "survival", "fittest", "adaptation", "better at surviving"]

**User Answer:** "It's natural selection"
**Validation:**
1. Check "I don't know" → No match
2. Exact match → "it's natural selection" !== "natural selection" → No
3. Contains check → "it's natural selection".includes("natural selection") → ✅ **YES**
4. Result: `'correct'`
5. Score: +1

### Example 2: Partial Answer

**Question:** "What is natural selection?"
**Correct Answer:** "natural selection"
**Keywords:** ["natural selection", "survival", "fittest", "adaptation", "better at surviving"]

**User Answer:** "survival of the fittest"
**Validation:**
1. Check "I don't know" → No match
2. Exact match → No
3. Contains check → No
4. Keyword matching:
   - "survival" → ✅ Found (1/5)
   - "fittest" → ✅ Found (2/5)
   - Total: 2 keywords found
   - Ratio: 2/5 = 0.4
   - Since ratio > 0 but < 0.5 → Result: `'partial'`
5. Score: +0 (no increment)

### Example 3: Incorrect Answer

**Question:** "What is natural selection?"
**Correct Answer:** "natural selection"
**Keywords:** ["natural selection", "survival", "fittest", "adaptation", "better at surviving"]

**User Answer:** "evolution"
**Validation:**
1. Check "I don't know" → No match
2. Exact match → No
3. Contains check → No
4. Keyword matching:
   - None of the keywords found
   - Ratio: 0/5 = 0
   - Result: `'incorrect'`
5. Score: +0 (no increment)

### Example 4: "I Don't Know"

**Question:** "What is natural selection?"
**Correct Answer:** "natural selection"
**Keywords:** ["natural selection", "survival", "fittest", "adaptation", "better at surviving"]

**User Answer:** "I don't know"
**Validation:**
1. Check "I don't know" → ✅ Matches "don't know" phrase
2. Result: `'dont_know'` (immediate return)
3. Score: +0 (no increment)
4. Status stored as: `'unanswered'`

---

## Summary

The quiz system is a fully conversation-based interactive quiz that:

1. **Initializes** when user clicks "Final Quiz" box
2. **Asks questions** through avatar speech
3. **Validates answers** using fuzzy matching with keywords
4. **Tracks scores** by incrementing only for correct answers
5. **Moves forward** quickly without explanations during quiz
6. **Provides summary** at the end with all correct answers and explanations

All logic is contained in `TavusAvatarWidget.jsx`, making it easy to maintain and modify.

