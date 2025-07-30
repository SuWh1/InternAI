/**
 * Utility functions for managing progress on public topics
 * Uses API calls to track user's personal progress on shared topics in database
 */

import { topicService, type UserTopicProgress } from '../services/topicService';

export interface PublicTopicProgress {
  topicId: string;
  completedSubtopics: number[];
  lastUpdated: string;
}

// Cache for storing progress data to avoid frequent API calls
const progressCache = new Map<string, { data: PublicTopicProgress; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get progress for a specific public topic from API
 */
export const getPublicTopicProgress = async (topicId: string): Promise<PublicTopicProgress | null> => {
  try {
    // Check cache first
    const cached = progressCache.get(topicId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const progress = await topicService.getTopicProgress(topicId);
    const publicProgress: PublicTopicProgress = {
      topicId,
      completedSubtopics: progress.completed_subtopics,
      lastUpdated: progress.updated_at || progress.created_at
    };

    // Update cache
    progressCache.set(topicId, { data: publicProgress, timestamp: Date.now() });
    
    return publicProgress;
  } catch (error) {
    console.error('Error getting public topic progress:', error);
    return null;
  }
};

/**
 * Update progress for a public topic via API
 */
export const updatePublicTopicProgress = async (topicId: string, completedSubtopics: number[]): Promise<void> => {
  try {
    const progress = await topicService.updateTopicProgress(topicId, completedSubtopics);
    
    // Update cache
    const publicProgress: PublicTopicProgress = {
      topicId,
      completedSubtopics: progress.completed_subtopics,
      lastUpdated: progress.updated_at || progress.created_at
    };
    progressCache.set(topicId, { data: publicProgress, timestamp: Date.now() });
  } catch (error) {
    console.error('Error updating public topic progress:', error);
    throw error;
  }
};

/**
 * Calculate completion percentage for a public topic (synchronous version)
 */
export const calculatePublicTopicCompletion = (topicId: string, totalSubtopics: number): number => {
  if (totalSubtopics === 0) return 0;
  
  const progress = getPublicTopicProgressSync(topicId);
  if (!progress) return 0;
  
  return Math.round((progress.completedSubtopics.length / totalSubtopics) * 100);
};

/**
 * Toggle subtopic completion for a public topic
 */
export const togglePublicSubtopicCompletion = async (topicId: string, subtopicId: number): Promise<void> => {
  try {
    const progress = await getPublicTopicProgress(topicId);
    const currentCompleted = progress?.completedSubtopics || [];
    
    const isCompleted = currentCompleted.includes(subtopicId);
    const updatedCompleted = isCompleted
      ? currentCompleted.filter(id => id !== subtopicId)
      : [...currentCompleted, subtopicId];
    
    await updatePublicTopicProgress(topicId, updatedCompleted);
  } catch (error) {
    console.error('Error toggling subtopic completion:', error);
    throw error;
  }
};

/**
 * Clear progress cache (for cleanup/reset)
 */
export const clearProgressCache = (): void => {
  progressCache.clear();
};

/**
 * Synchronous version of getPublicTopicProgress for backward compatibility
 * Returns cached data if available, null otherwise
 */
export const getPublicTopicProgressSync = (topicId: string): PublicTopicProgress | null => {
  const cached = progressCache.get(topicId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Legacy functions for backward compatibility (deprecated)
export const getAllPublicTopicProgress = (): PublicTopicProgress[] => {
  console.warn('getAllPublicTopicProgress is deprecated. Use API-based functions instead.');
  return Array.from(progressCache.values()).map(cached => cached.data);
};

export const clearAllPublicTopicProgress = (): void => {
  console.warn('clearAllPublicTopicProgress is deprecated. Use clearProgressCache instead.');
  clearProgressCache();
};