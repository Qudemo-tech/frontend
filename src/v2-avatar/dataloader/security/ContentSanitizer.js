/**
 * ContentSanitizer
 *
 * Provides XSS prevention by stripping HTML/script tags from content strings.
 * Uses simple regex-based sanitization (no external dependencies like DOMPurify).
 * Suitable for content loading where HTML is not expected in the data.
 */

/**
 * Content sanitizer for XSS prevention
 */
export class ContentSanitizer {
  /**
   * Strip HTML tags from text to prevent XSS
   * @param {string} text - Text to sanitize
   * @returns {string|*} Sanitized text, or original value if not a string
   */
  static sanitizeText(text) {
    if (typeof text !== 'string') {
      return text;
    }

    let sanitized = text;

    // Remove script tags and their content (case insensitive)
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ''
    );

    // Remove style tags and their content
    sanitized = sanitized.replace(
      /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
      ''
    );

    // Remove event handlers (onclick, onerror, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol URLs
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove all remaining HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Decode common HTML entities
    sanitized = sanitized
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#x2F;/g, '/');

    return sanitized;
  }

  /**
   * Recursively sanitize all string values in an object
   * @param {*} obj - Object, array, or primitive to sanitize
   * @returns {*} Sanitized copy (does not mutate original)
   */
  static sanitizeContent(obj) {
    // Handle primitives
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? this.sanitizeText(obj) : obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeContent(item));
    }

    // Handle objects
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeContent(value);
    }
    return sanitized;
  }

  /**
   * Check if text contains potentially dangerous content
   * @param {string} text - Text to check
   * @returns {boolean} True if potentially dangerous content detected
   */
  static containsUnsafeContent(text) {
    if (typeof text !== 'string') {
      return false;
    }

    // Check for script tags
    if (/<script/i.test(text)) {
      return true;
    }

    // Check for event handlers
    if (/\son\w+\s*=/i.test(text)) {
      return true;
    }

    // Check for javascript: protocol
    if (/javascript:/i.test(text)) {
      return true;
    }

    // Check for data: URIs (can be used for XSS)
    if (/data:\s*text\/html/i.test(text)) {
      return true;
    }

    return false;
  }
}

export default ContentSanitizer;
