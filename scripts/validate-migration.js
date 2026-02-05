#!/usr/bin/env node
/**
 * Migration Validation Script
 *
 * Validates all course bundles against JSON schemas.
 * Uses ajv directly for validation.
 *
 * Usage: node scripts/validate-migration.js
 *
 * Exit codes:
 *   0 - All bundles passed validation
 *   1 - One or more bundles failed validation
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to schemas and course data
const SCHEMAS_DIR = join(__dirname, '../src/v2-avatar/dataloader/schemas');
const COURSES_DIR = join(__dirname, '../src/v2-avatar/data/courses');

// Course bundle files to validate
const COURSE_FILES = ['entri.json', 'qatar.json', 'evolution.json'];

/**
 * Load and parse a JSON schema from the schemas directory
 * @param {string} schemaName - Schema filename without extension
 * @returns {Object} Parsed schema object
 */
function loadSchema(schemaName) {
  const schemaPath = join(SCHEMAS_DIR, `${schemaName}.schema.js`);
  // Schemas are ES modules, so we need to import them dynamically
  // For now, we'll inline the schemas directly
  return null; // Placeholder - we'll handle this differently
}

/**
 * Load course bundle from JSON file
 * @param {string} filename - Course bundle filename
 * @returns {Object} Parsed bundle object
 */
function loadBundle(filename) {
  const bundlePath = join(COURSES_DIR, filename);
  const content = readFileSync(bundlePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Create ajv instance with all schemas compiled
 * @returns {Object} Object containing ajv instance and validators
 */
async function createValidators() {
  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false,
  });
  addFormats(ajv);

  // Import schemas dynamically
  const { courseSchema } = await import('../src/v2-avatar/dataloader/schemas/course.schema.js');
  const { moduleSchema } = await import('../src/v2-avatar/dataloader/schemas/module.schema.js');
  const { quizSchema } = await import('../src/v2-avatar/dataloader/schemas/quiz.schema.js');
  const { presentationSchema } = await import('../src/v2-avatar/dataloader/schemas/presentation.schema.js');

  return {
    course: ajv.compile(courseSchema),
    module: ajv.compile(moduleSchema),
    quiz: ajv.compile(quizSchema),
    presentation: ajv.compile(presentationSchema),
  };
}

/**
 * Format validation errors for display
 * @param {Array} errors - ajv error array
 * @returns {string} Formatted error string
 */
function formatErrors(errors) {
  if (!errors || errors.length === 0) return '';
  return errors
    .map((err) => {
      const path = err.instancePath || 'root';
      return `  - ${path}: ${err.message}`;
    })
    .join('\n');
}

/**
 * Validate a single course bundle
 * @param {string} courseId - Course identifier
 * @param {Object} bundle - Parsed bundle object
 * @param {Object} validators - Object containing compiled validators
 * @returns {Object} Validation result { valid, errors }
 */
function validateBundle(courseId, bundle, validators) {
  const errors = [];

  // Extract manifest fields for course schema validation
  // The course schema validates ONLY: id, meta, avatar, features, structure
  const { id, meta, avatar, features, structure } = bundle;
  const manifest = { id, meta, avatar, features, structure };

  // 1. Validate course manifest
  const courseValid = validators.course(manifest);
  if (!courseValid) {
    errors.push({
      type: 'course',
      id: courseId,
      errors: formatErrors(validators.course.errors),
    });
  }

  // 2. Validate each module
  const modules = bundle.modules || {};
  for (const [moduleId, moduleData] of Object.entries(modules)) {
    const moduleValid = validators.module(moduleData);
    if (!moduleValid) {
      errors.push({
        type: 'module',
        id: moduleId,
        errors: formatErrors(validators.module.errors),
      });
    }
  }

  // 3. Validate each quiz
  const quizzes = bundle.quizzes || {};
  for (const [quizId, quizData] of Object.entries(quizzes)) {
    const quizValid = validators.quiz(quizData);
    if (!quizValid) {
      errors.push({
        type: 'quiz',
        id: quizId,
        errors: formatErrors(validators.quiz.errors),
      });
    }
  }

  // 4. Validate each presentation
  const presentations = bundle.presentations || {};
  for (const [presentationId, presentationData] of Object.entries(presentations)) {
    const presentationValid = validators.presentation(presentationData);
    if (!presentationValid) {
      errors.push({
        type: 'presentation',
        id: presentationId,
        errors: formatErrors(validators.presentation.errors),
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Main validation function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Migration Validation');
  console.log('='.repeat(60));
  console.log('');

  // Create validators
  let validators;
  try {
    validators = await createValidators();
  } catch (err) {
    console.error('Failed to load schemas:', err.message);
    process.exit(1);
  }

  let allPassed = true;
  const results = [];

  // Validate each course bundle
  for (const filename of COURSE_FILES) {
    const courseId = filename.replace('.json', '');
    console.log(`Validating: ${courseId}`);

    let bundle;
    try {
      bundle = loadBundle(filename);
    } catch (err) {
      console.error(`  FAILED: Could not load ${filename}: ${err.message}`);
      allPassed = false;
      results.push({ courseId, valid: false, error: `Load error: ${err.message}` });
      continue;
    }

    const result = validateBundle(courseId, bundle, validators);

    if (result.valid) {
      // Count items validated
      const moduleCount = Object.keys(bundle.modules || {}).length;
      const quizCount = Object.keys(bundle.quizzes || {}).length;
      const presentationCount = Object.keys(bundle.presentations || {}).length;
      console.log(`  PASSED (${moduleCount} modules, ${quizCount} quizzes, ${presentationCount} presentations)`);
    } else {
      console.log(`  FAILED`);
      for (const err of result.errors) {
        console.log(`    [${err.type}] ${err.id}:`);
        console.log(err.errors);
      }
      allPassed = false;
    }

    results.push({ courseId, valid: result.valid, errors: result.errors });
  }

  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));

  const passedCount = results.filter((r) => r.valid).length;
  const totalCount = results.length;

  for (const result of results) {
    const status = result.valid ? 'PASSED' : 'FAILED';
    console.log(`  ${result.courseId}: ${status}`);
  }

  console.log('');
  console.log(`Result: ${passedCount}/${totalCount} bundles passed validation`);
  console.log('');

  if (allPassed) {
    console.log('All bundles PASSED');
    process.exit(0);
  } else {
    console.log('Some bundles FAILED');
    process.exit(1);
  }
}

// Run validation
main().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});

// Export for testing
export { validateBundle };
