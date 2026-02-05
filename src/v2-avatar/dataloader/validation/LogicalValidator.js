/**
 * LogicalValidator
 *
 * Performs semantic validation beyond JSON schema structure.
 * Catches logical errors that schemas cannot express, such as:
 * - correctIndex within bounds of options array
 * - Duplicate quiz options
 * - Sequential slide pages
 * - Course structure integrity
 */

/**
 * Logical validator for content semantic validation
 */
export class LogicalValidator {
  /**
   * Validate a quiz for logical consistency
   * @param {Object} quiz - Quiz data to validate
   * @returns {Array<Object>} Array of validation issues
   */
  validateQuiz(quiz) {
    const errors = [];

    // Validate each question
    (quiz.questions || []).forEach((q, i) => {
      // correctIndex must be non-negative
      if (q.correctIndex < 0) {
        errors.push({
          field: `questions[${i}].correctIndex`,
          message: 'correctIndex cannot be negative',
          severity: 'error',
        });
      }

      // correctIndex must be within options bounds
      if (q.options && q.correctIndex >= q.options.length) {
        errors.push({
          field: `questions[${i}].correctIndex`,
          message: `correctIndex ${q.correctIndex} exceeds options length ${q.options.length}`,
          severity: 'error',
        });
      }

      // Duplicate options detection
      if (q.options) {
        const uniqueOptions = new Set(q.options);
        if (uniqueOptions.size !== q.options.length) {
          errors.push({
            field: `questions[${i}].options`,
            message: 'Duplicate options detected',
            severity: 'warning',
          });
        }
      }

      // Question should end with ?
      if (q.text && !q.text.trim().endsWith('?')) {
        errors.push({
          field: `questions[${i}].text`,
          message: 'Question text should end with a question mark',
          severity: 'warning',
        });
      }
    });

    // passingScore must be achievable
    const questionCount = quiz.questions?.length || 0;
    if (quiz.passingScore > questionCount) {
      errors.push({
        field: 'passingScore',
        message: `passingScore ${quiz.passingScore} exceeds total questions ${questionCount}`,
        severity: 'error',
      });
    }

    // passingScore should be positive
    if (quiz.passingScore !== undefined && quiz.passingScore < 0) {
      errors.push({
        field: 'passingScore',
        message: 'passingScore cannot be negative',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Validate a presentation for logical consistency
   * @param {Object} presentation - Presentation data to validate
   * @returns {Array<Object>} Array of validation issues
   */
  validatePresentation(presentation) {
    const errors = [];

    const slides = presentation.slides || [];

    // Check for sequential page numbers
    if (slides.length > 0) {
      const pages = slides.map((s) => s.page).sort((a, b) => a - b);

      for (let i = 0; i < pages.length; i++) {
        const expectedPage = i + 1;
        if (pages[i] !== expectedPage) {
          errors.push({
            field: 'slides',
            message: `Missing or duplicate slide page. Expected ${expectedPage}, found ${pages[i]}`,
            severity: 'warning',
          });
          break; // Only report first gap
        }
      }

      // Check for duplicate page numbers
      const uniquePages = new Set(pages);
      if (uniquePages.size !== pages.length) {
        errors.push({
          field: 'slides',
          message: 'Duplicate slide page numbers detected',
          severity: 'error',
        });
      }
    }

    // totalSlides should match slides array length
    if (
      presentation.totalSlides !== undefined &&
      presentation.totalSlides !== slides.length
    ) {
      errors.push({
        field: 'totalSlides',
        message: `totalSlides (${presentation.totalSlides}) doesn't match slides array length (${slides.length})`,
        severity: 'warning',
      });
    }

    return errors;
  }

  /**
   * Validate a course for logical consistency
   * @param {Object} course - Course data to validate
   * @returns {Array<Object>} Array of validation issues
   */
  validateCourse(course) {
    const errors = [];

    const structure = course.structure || {};
    const sections = structure.sections || [];
    const moduleOrder = structure.moduleOrder || [];

    // Collect all modules from sections
    const sectionModules = sections.flatMap((s) => s.modules || []);
    const sectionModuleSet = new Set(sectionModules);

    // Validate all modules in moduleOrder exist in sections
    moduleOrder.forEach((moduleId) => {
      if (!sectionModuleSet.has(moduleId)) {
        errors.push({
          field: 'structure.moduleOrder',
          message: `Module "${moduleId}" in moduleOrder not found in any section`,
          severity: 'error',
        });
      }
    });

    // Check for modules in sections not in moduleOrder
    sectionModules.forEach((moduleId) => {
      if (!moduleOrder.includes(moduleId)) {
        errors.push({
          field: 'structure.sections',
          message: `Module "${moduleId}" in section but not in moduleOrder`,
          severity: 'warning',
        });
      }
    });

    // modulesRequiringConfirmation should be subset of moduleOrder
    (structure.modulesRequiringConfirmation || []).forEach((moduleId) => {
      if (!moduleOrder.includes(moduleId)) {
        errors.push({
          field: 'structure.modulesRequiringConfirmation',
          message: `Module "${moduleId}" not found in moduleOrder`,
          severity: 'error',
        });
      }
    });

    // Check for duplicate modules in moduleOrder
    const uniqueModules = new Set(moduleOrder);
    if (uniqueModules.size !== moduleOrder.length) {
      errors.push({
        field: 'structure.moduleOrder',
        message: 'Duplicate modules in moduleOrder',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Validate a module for logical consistency
   * @param {Object} module - Module data to validate
   * @returns {Array<Object>} Array of validation issues
   */
  validateModule(module) {
    const errors = [];

    // Module-specific validation can be added here
    // Currently modules are validated primarily by schema

    return errors;
  }

  /**
   * Route validation to appropriate method based on type
   * @param {string} type - Content type (quiz, presentation, course, module)
   * @param {Object} data - Data to validate
   * @returns {Array<Object>} Array of validation issues
   */
  validate(type, data) {
    switch (type) {
      case 'quiz':
        return this.validateQuiz(data);
      case 'presentation':
        return this.validatePresentation(data);
      case 'course':
        return this.validateCourse(data);
      case 'module':
        return this.validateModule(data);
      default:
        // No logical validation for unknown types
        return [];
    }
  }

  /**
   * Check if validation result contains any errors
   * @param {Array<Object>} issues - Validation issues array
   * @returns {boolean} True if any errors exist
   */
  hasErrors(issues) {
    return issues.some((issue) => issue.severity === 'error');
  }

  /**
   * Filter issues to errors only
   * @param {Array<Object>} issues - Validation issues array
   * @returns {Array<Object>} Array of errors only
   */
  getErrors(issues) {
    return issues.filter((issue) => issue.severity === 'error');
  }

  /**
   * Filter issues to warnings only
   * @param {Array<Object>} issues - Validation issues array
   * @returns {Array<Object>} Array of warnings only
   */
  getWarnings(issues) {
    return issues.filter((issue) => issue.severity === 'warning');
  }
}

export default LogicalValidator;
