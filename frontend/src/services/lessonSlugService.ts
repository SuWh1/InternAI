import { createLessonSlug, parseLessonSlug } from '../utils/slugify';

interface LessonData {
  topic: string;
  context: string;
  weekNumber: number;
  slug: string;
}

class LessonSlugService {
  private static readonly STORAGE_KEY = 'lesson_slug_mappings';
  private mappings: Map<string, LessonData> = new Map();

  constructor() {
    this.loadMappings();
  }

  /**
   * Creates a slug for a lesson and stores the mapping
   */
  createLessonUrl(topic: string, context: string, weekNumber: number): string {
    const slug = createLessonSlug(topic, weekNumber);
    
    const lessonData: LessonData = {
      topic,
      context,
      weekNumber,
      slug
    };

    // Store the mapping
    this.mappings.set(slug, lessonData);
    this.saveMappings();

    return `/lesson/${slug}`;
  }

  /**
   * Retrieves lesson data from a slug
   */
  getLessonData(slug: string): LessonData | null {
    // First try to get from stored mappings
    const stored = this.mappings.get(slug);
    if (stored) {
      return stored;
    }

    // Fallback: try to parse the slug
    const parsed = parseLessonSlug(slug);
    if (parsed) {
      const lessonData: LessonData = {
        topic: parsed.topic,
        context: `Week ${parsed.weekNumber}: ${parsed.topic}`, // Basic context fallback
        weekNumber: parsed.weekNumber,
        slug
      };

      // Store for next time
      this.mappings.set(slug, lessonData);
      this.saveMappings();

      return lessonData;
    }

    return null;
  }

  /**
   * Load mappings from localStorage
   */
  private loadMappings(): void {
    try {
      const stored = localStorage.getItem(LessonSlugService.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.mappings = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load lesson slug mappings:', error);
    }
  }

  /**
   * Save mappings to localStorage
   */
  private saveMappings(): void {
    try {
      const data = Object.fromEntries(this.mappings.entries());
      localStorage.setItem(LessonSlugService.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save lesson slug mappings:', error);
    }
  }

  /**
   * Clear all mappings (useful for development/testing)
   */
  clearMappings(): void {
    this.mappings.clear();
    localStorage.removeItem(LessonSlugService.STORAGE_KEY);
  }
}

// Export a singleton instance
export const lessonSlugService = new LessonSlugService();
export default lessonSlugService; 