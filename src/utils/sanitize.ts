/**
 * Content Sanitization Utilities
 *
 * Sanitizes markdown and HTML content to prevent XSS attacks.
 * Uses DOMPurify to strip dangerous HTML/JavaScript.
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize markdown content
 *
 * While markdown is generally safe, it can contain HTML which may have XSS vulnerabilities.
 * This function sanitizes any HTML within the markdown.
 */
export function sanitizeMarkdown(content: string): string {
  if (!content || typeof content !== "string") {
    return "";
  }

  // DOMPurify configuration
  const config = {
    // Allow markdown-safe HTML tags
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "strong", "em", "del", "ins",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
    ],

    ALLOWED_ATTR: [
      "href", "title", "alt", "src",
      "class", "id",
      "width", "height",
    ],

    // Block dangerous protocols
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

    // Keep relative URLs safe
    ALLOW_DATA_ATTR: false,

    // Forbid tags
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],

    // Forbid attributes
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],

    // Return safe HTML
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  };

  return DOMPurify.sanitize(content, config);
}

/**
 * Sanitize plain text
 *
 * Strips all HTML tags, leaving only text.
 * Use for fields that should never contain HTML (like meta descriptions, titles).
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Strip all HTML tags
  const withoutHtml = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // Remove control characters
  return withoutHtml
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

/**
 * Sanitize URL
 *
 * Ensures URLs are safe (no javascript: or data: schemes for XSS)
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];

  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      console.warn(`Blocked dangerous URL protocol: ${protocol}`);
      return "";
    }
  }

  // Only allow http, https, mailto
  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    !trimmed.startsWith("mailto:") &&
    !trimmed.startsWith("/")  // Relative URLs OK
  ) {
    console.warn(`Blocked non-HTTP URL: ${trimmed}`);
    return "";
  }

  return url.trim();
}

/**
 * Sanitize agent-generated content
 *
 * AI-generated content can sometimes include unexpected formatting or characters.
 * This ensures it's safe to store and display.
 */
export function sanitizeAgentOutput(content: string, maxLength?: number): string {
  if (!content || typeof content !== "string") {
    return "";
  }

  let sanitized = sanitizeText(content);

  if (maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate and sanitize SEO keywords
 */
export function sanitizeKeywords(keywords: string[]): string[] {
  if (!Array.isArray(keywords)) {
    return [];
  }

  return keywords
    .map((kw) => sanitizeText(kw))
    .filter((kw) => kw.length > 0 && kw.length <= 50)
    .slice(0, 20); // Max 20 keywords
}

/**
 * Validate and sanitize tags
 */
export function sanitizeTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => sanitizeText(tag))
    .filter((tag) => tag.length > 0 && tag.length <= 30)
    .slice(0, 10); // Max 10 tags
}
