/**
 * Course Schema Definition
 *
 * Validates course manifest JSON files using ajv (JSON Schema draft-07).
 *
 * A course manifest defines:
 * - Course metadata (title, company, language, duration)
 * - Avatar configuration (personaId, name, welcome message)
 * - Feature flags (learningModules, mcqQuiz, pdfViewer, etc.)
 * - Course structure (sections, module order, confirmation requirements)
 */

export const courseSchema = {
  $id: 'course',
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['id', 'meta', 'avatar', 'features', 'structure'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      pattern: '^[a-z0-9-]+$',
      description: 'Unique course identifier in kebab-case'
    },
    meta: {
      type: 'object',
      required: ['title', 'company', 'language', 'estimatedDuration'],
      additionalProperties: false,
      properties: {
        title: {
          type: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Course title for display'
        },
        company: {
          type: 'string',
          minLength: 1,
          description: 'Company name'
        },
        description: {
          type: 'string',
          description: 'Optional course description'
        },
        language: {
          type: 'string',
          enum: ['en', 'hi', 'ml', 'ta'],
          description: 'Primary language code'
        },
        estimatedDuration: {
          type: 'string',
          pattern: '^\\d+m$',
          description: 'Estimated course duration (e.g., "45m")'
        },
        createdAt: {
          type: 'string',
          format: 'date',
          description: 'ISO date of creation'
        },
        updatedAt: {
          type: 'string',
          format: 'date',
          description: 'ISO date of last update'
        }
      }
    },
    avatar: {
      type: 'object',
      required: ['personaId', 'name', 'welcomeMessage'],
      additionalProperties: false,
      properties: {
        personaId: {
          type: 'string',
          pattern: '^p[a-f0-9]+$',
          description: 'Tavus persona ID (e.g., "p54ceeb77022")'
        },
        name: {
          type: 'string',
          minLength: 1,
          description: 'Avatar display name'
        },
        welcomeMessage: {
          type: 'string',
          minLength: 10,
          description: 'Initial greeting from the avatar'
        }
      }
    },
    features: {
      type: 'object',
      additionalProperties: false,
      properties: {
        learningModules: {
          type: 'boolean',
          description: 'Enable module-based learning flow'
        },
        moduleConfirmation: {
          type: 'boolean',
          description: 'Require user confirmation between modules'
        },
        mcqQuiz: {
          type: 'boolean',
          description: 'Enable multiple-choice quizzes'
        },
        pdfViewer: {
          type: 'boolean',
          description: 'Enable PDF presentation viewer'
        },
        videoPlayer: {
          type: 'boolean',
          description: 'Enable embedded video playback'
        },
        progressTracking: {
          type: 'boolean',
          description: 'Track and display user progress'
        },
        sidebar: {
          type: 'boolean',
          description: 'Show course navigation sidebar'
        }
      }
    },
    structure: {
      type: 'object',
      required: ['sections', 'moduleOrder'],
      additionalProperties: false,
      properties: {
        sections: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['id', 'title', 'modules'],
            additionalProperties: false,
            properties: {
              id: {
                type: 'string',
                pattern: '^[a-z0-9-]+$',
                description: 'Section identifier'
              },
              title: {
                type: 'string',
                minLength: 1,
                description: 'Section display title'
              },
              modules: {
                type: 'array',
                items: {
                  type: 'string',
                  pattern: '^[a-z0-9-]+$'
                },
                description: 'Module IDs belonging to this section'
              }
            }
          },
          description: 'Course sections grouping modules'
        },
        moduleOrder: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^[a-z0-9-]+$'
          },
          description: 'Complete ordered list of module IDs (empty for conversational-only personas)'
        },
        modulesRequiringConfirmation: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^[a-z0-9-]+$'
          },
          description: 'Modules that wait for user confirmation before advancing'
        },
        sectionEndingModules: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^[a-z0-9-]+$'
          },
          description: 'Last modules in each section (trigger section transition)'
        }
      }
    }
  }
};

export default courseSchema;
