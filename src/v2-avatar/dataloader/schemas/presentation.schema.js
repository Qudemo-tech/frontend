/**
 * Presentation Schema Definition
 *
 * Validates presentation JSON files using ajv (JSON Schema draft-07).
 *
 * Presentations are PDF slideshows with avatar narration per slide.
 */

export const presentationSchema = {
  $id: 'presentation',
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['id', 'pdfUrl', 'slides'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      pattern: '^[a-z0-9-]+$',
      description: 'Unique presentation identifier in kebab-case'
    },
    pdfUrl: {
      type: 'string',
      format: 'uri',
      description: 'URL to the PDF file'
    },
    totalSlides: {
      type: 'integer',
      minimum: 1,
      description: 'Total number of slides in the PDF'
    },
    slides: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['page', 'narration'],
        additionalProperties: false,
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            description: 'Slide page number (1-based)'
          },
          title: {
            type: 'string',
            description: 'Optional slide title'
          },
          narration: {
            type: 'string',
            minLength: 10,
            description: 'Avatar narration for this slide'
          }
        }
      },
      description: 'Array of slide narrations'
    }
  }
};

export default presentationSchema;
