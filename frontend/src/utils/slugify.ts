/**
 * Converts a text to a URL-safe slug while preserving parentheses, slashes and original casing.
 * Strategy:
 *  1. Replace all whitespace sequences with a hyphen
 *  2. Use encodeURIComponent to escape any remaining characters that are unsafe in a path segment
 * This keeps characters like "(" ")" and "/" (encoded as %2F) so they can be restored later.
 */
export function slugify(text: string): string {
  const dashed = text.trim().replace(/\s+/g, '-');
  return encodeURIComponent(dashed);
}

/**
 * Reverses `slugify`: decode the URI component and turn dashes back into spaces.
 * Unlike the previous implementation, it preserves the original casing so that
 * camelCase identifiers such as "useState" remain intact.
 */
export function unslugify(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, ' ');
}

/**
 * Creates a lesson slug from topic and week number
 */
export function createLessonSlug(topic: string, weekNumber: number): string {
  const topicSlug = slugify(topic);
  return `${topicSlug}-week-${weekNumber}`;
}

/**
 * Parses a lesson slug back to components
 */
export function parseLessonSlug(slug: string): { topic: string; weekNumber: number } | null {
  const match = slug.match(/^(.+)-week-(\d+)$/);
  if (!match) return null;
  
  return {
    topic: unslugify(match[1]),
    weekNumber: parseInt(match[2], 10)
  };
} 