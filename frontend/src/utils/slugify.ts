/**
 * Converts a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Converts a slug back to a readable title (best effort)
 */
export function unslugify(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
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