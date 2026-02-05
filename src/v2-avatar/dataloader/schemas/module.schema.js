/**
 * Module Schema Definition
 *
 * Validates module JSON files using ajv (JSON Schema draft-07).
 *
 * Module types:
 * - lesson: Avatar speaks introduction text
 * - video: YouTube video playback with completion prompt
 * - quiz: MCQ questions (references quizRef)
 * - presentation: PDF with narrated slides (references presentationRef)
 */

export const moduleSchema = {
  $id: 'module',
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['id', 'type', 'title'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      pattern: '^[a-z0-9-]+$',
      description: 'Unique module identifier in kebab-case'
    },
    type: {
      type: 'string',
      enum: ['lesson', 'video', 'quiz', 'presentation'],
      description: 'Module content type'
    },
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
      description: 'Module display title'
    },
    description: {
      type: 'string',
      description: 'Optional module description'
    },
    duration: {
      type: 'string',
      pattern: '^\\d+m$',
      description: 'Estimated duration (e.g., "5m")'
    },
    icon: {
      type: 'string',
      description: 'Icon name for sidebar display'
    },
    // Video module fields
    videoUrl: {
      type: 'string',
      format: 'uri',
      description: 'Video URL (required for video type)'
    },
    videoPlatform: {
      type: 'string',
      enum: ['youtube', 'vimeo', 'custom'],
      description: 'Video hosting platform'
    },
    // Quiz module fields
    quizRef: {
      type: 'string',
      pattern: '^quizzes/[a-z0-9-]+\\.json$',
      description: 'Reference path to quiz JSON (required for quiz type)'
    },
    // Presentation module fields
    presentationRef: {
      type: 'string',
      pattern: '^presentations/[a-z0-9-]+\\.json$',
      description: 'Reference path to presentation JSON (required for presentation type)'
    },
    pdfUrl: {
      type: 'string',
      format: 'uri',
      description: 'PDF URL for presentation (required for presentation type)'
    },
    // Avatar prompts
    prompt: {
      type: 'object',
      additionalProperties: false,
      properties: {
        main: {
          type: 'string',
          minLength: 10,
          description: 'Primary avatar script for this module'
        },
        intro: {
          type: 'string',
          description: 'Introduction before main content'
        },
        transition: {
          type: 'string',
          description: 'Script after module completion'
        },
        completion: {
          type: 'string',
          description: 'Script when video/quiz is completed'
        }
      }
    }
  },
  // Conditional validation based on module type
  allOf: [
    {
      // Video modules require videoUrl
      if: {
        properties: { type: { const: 'video' } }
      },
      then: {
        required: ['videoUrl']
      }
    },
    {
      // Quiz modules require quizRef
      if: {
        properties: { type: { const: 'quiz' } }
      },
      then: {
        required: ['quizRef']
      }
    },
    {
      // Presentation modules require presentationRef and pdfUrl
      if: {
        properties: { type: { const: 'presentation' } }
      },
      then: {
        required: ['presentationRef', 'pdfUrl']
      }
    }
  ]
};

export default moduleSchema;
