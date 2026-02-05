/**
 * Quiz Schema Definition
 *
 * Validates quiz JSON files using ajv (JSON Schema draft-07).
 *
 * Quiz formats:
 * - mcq: Multiple choice questions with clickable options
 * - conversation: Open-ended questions with keyword matching (future)
 */

export const quizSchema = {
  $id: 'quiz',
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['id', 'format', 'questions', 'passingScore'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      pattern: '^[a-z0-9-]+$',
      description: 'Unique quiz identifier in kebab-case'
    },
    format: {
      type: 'string',
      enum: ['mcq', 'conversation'],
      description: 'Quiz format type'
    },
    intro: {
      type: 'string',
      minLength: 10,
      description: 'Avatar introduction before quiz starts'
    },
    passingScore: {
      type: 'integer',
      minimum: 1,
      description: 'Minimum correct answers to pass'
    },
    completionMessage: {
      type: 'string',
      description: 'Avatar message after quiz completion'
    },
    questions: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'text', 'options', 'correctIndex'],
        additionalProperties: false,
        properties: {
          id: {
            type: 'string',
            description: 'Question identifier (e.g., "q1")'
          },
          text: {
            type: 'string',
            minLength: 5,
            description: 'Question text'
          },
          options: {
            type: 'array',
            minItems: 2,
            maxItems: 6,
            items: {
              type: 'string',
              minLength: 1
            },
            description: 'Answer options (2-6 items)'
          },
          correctIndex: {
            type: 'integer',
            minimum: 0,
            description: 'Index of correct answer (0-based)'
          },
          explanation: {
            type: 'string',
            description: 'Explanation shown after answering'
          }
        }
      },
      description: 'Array of quiz questions'
    }
  }
};

export default quizSchema;
