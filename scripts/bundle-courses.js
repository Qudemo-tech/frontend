#!/usr/bin/env node

/**
 * bundle-courses.js - Aggregate course JSON files into bundle.json
 *
 * This script reads individual JSON files from each course directory
 * and combines them into a single bundle.json for efficient loading.
 *
 * Expected directory structure:
 * src/v2-avatar/data/courses/
 *   {courseId}/
 *     course.json           - Course manifest (required)
 *     modules/              - Module definitions (optional)
 *       {moduleId}.json
 *     quizzes/              - Quiz definitions (optional)
 *       {quizId}.json
 *     presentations/        - Presentation definitions (optional)
 *       {presentationId}.json
 *     prompts/              - Module prompts (optional)
 *       {moduleId}.json
 *
 * Output:
 * src/v2-avatar/data/courses/
 *   {courseId}/
 *     bundle.json           - Combined bundle with all content
 *
 * Usage:
 *   npm run bundle-courses
 *   node scripts/bundle-courses.js
 *   node scripts/bundle-courses.js --course entri  # Bundle specific course
 *   node scripts/bundle-courses.js --verbose       # Verbose output
 */

const fs = require('fs');
const path = require('path');

// Configuration
const COURSES_DIR = path.resolve(__dirname, '../src/v2-avatar/data/courses');
const CONTENT_DIRS = ['modules', 'quizzes', 'presentations', 'prompts'];

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const courseArg = args.find((arg, i) => args[i - 1] === '--course' || args[i - 1] === '-c');
const specificCourse = courseArg || null;

/**
 * Log message if verbose mode is enabled.
 * @param {string} message - Message to log
 */
function logVerbose(message) {
  if (verbose) {
    console.log(`  ${message}`);
  }
}

/**
 * Read and parse a JSON file, returning null if it doesn't exist or is invalid.
 * @param {string} filePath - Path to JSON file
 * @returns {Object|null} Parsed JSON or null
 */
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`  Warning: Failed to read ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Read all JSON files from a directory into an object keyed by filename (without .json).
 * @param {string} dirPath - Path to directory
 * @returns {Object} Object mapping IDs to content
 */
function readJsonDirectory(dirPath) {
  const result = {};

  if (!fs.existsSync(dirPath)) {
    logVerbose(`Directory not found: ${path.basename(dirPath)}/`);
    return result;
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
  logVerbose(`Found ${files.length} files in ${path.basename(dirPath)}/`);

  for (const file of files) {
    const id = path.basename(file, '.json');
    const content = readJsonFile(path.join(dirPath, file));
    if (content !== null) {
      result[id] = content;
    }
  }

  return result;
}

/**
 * Bundle a single course directory into bundle.json.
 * @param {string} courseDir - Path to course directory
 * @returns {boolean} True if bundling succeeded
 */
function bundleCourse(courseDir) {
  const courseId = path.basename(courseDir);
  const manifestPath = path.join(courseDir, 'course.json');

  console.log(`Bundling course: ${courseId}`);

  // Read manifest (required)
  const manifest = readJsonFile(manifestPath);
  if (!manifest) {
    console.error(`  Error: course.json not found or invalid in ${courseId}/`);
    return false;
  }

  logVerbose('Read course.json manifest');

  // Build bundle
  const bundle = {
    id: manifest.id || courseId,
    manifest: manifest,
    modules: {},
    quizzes: {},
    presentations: {},
    prompts: {},
  };

  // Read content directories
  for (const contentDir of CONTENT_DIRS) {
    const dirPath = path.join(courseDir, contentDir);
    bundle[contentDir] = readJsonDirectory(dirPath);
  }

  // Write bundle
  const bundlePath = path.join(courseDir, 'bundle.json');
  try {
    fs.writeFileSync(bundlePath, JSON.stringify(bundle, null, 2), 'utf8');
    console.log(`  Created bundle.json`);
    console.log(`    - modules: ${Object.keys(bundle.modules).length}`);
    console.log(`    - quizzes: ${Object.keys(bundle.quizzes).length}`);
    console.log(`    - presentations: ${Object.keys(bundle.presentations).length}`);
    console.log(`    - prompts: ${Object.keys(bundle.prompts).length}`);
    return true;
  } catch (error) {
    console.error(`  Error writing bundle.json: ${error.message}`);
    return false;
  }
}

/**
 * Get list of course directories to bundle.
 * @returns {string[]} Array of course directory paths
 */
function getCourseDirs() {
  // Check if courses directory exists
  if (!fs.existsSync(COURSES_DIR)) {
    console.log(`Courses directory not found: ${COURSES_DIR}`);
    console.log('Creating directory structure...');
    fs.mkdirSync(COURSES_DIR, { recursive: true });
    return [];
  }

  // Get all directories in courses folder
  const entries = fs.readdirSync(COURSES_DIR, { withFileTypes: true });
  const courseDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(COURSES_DIR, entry.name));

  // Filter by specific course if requested
  if (specificCourse) {
    const targetDir = path.join(COURSES_DIR, specificCourse);
    if (!fs.existsSync(targetDir)) {
      console.error(`Course directory not found: ${specificCourse}`);
      process.exit(1);
    }
    return [targetDir];
  }

  return courseDirs;
}

/**
 * Main entry point.
 */
function main() {
  console.log('========================================');
  console.log('Course Content Bundler');
  console.log('========================================');
  console.log('');

  const courseDirs = getCourseDirs();

  if (courseDirs.length === 0) {
    console.log('No course directories found.');
    console.log('');
    console.log('Expected structure:');
    console.log('  src/v2-avatar/data/courses/');
    console.log('    {courseId}/');
    console.log('      course.json        (required)');
    console.log('      modules/           (optional)');
    console.log('      quizzes/           (optional)');
    console.log('      presentations/     (optional)');
    console.log('      prompts/           (optional)');
    console.log('');
    console.log('To create a new course, add a course.json manifest file.');
    process.exit(0);
  }

  console.log(`Found ${courseDirs.length} course(s) to bundle`);
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const courseDir of courseDirs) {
    const success = bundleCourse(courseDir);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log('');
  }

  // Summary
  console.log('========================================');
  console.log('Summary');
  console.log('========================================');
  console.log(`Total courses: ${courseDirs.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }

  console.log('');
  console.log('Done!');
}

// Run main
main();
