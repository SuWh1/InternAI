import type { RoadmapProgress } from '../types/roadmap';

/**
 * Utility functions for managing week progress and unlock logic
 */

/**
 * Determines if a week is unlocked based on progress data
 * @param weekNumber The week number to check (1-based)
 * @param progress Array of progress data for all weeks
 * @returns boolean indicating if the week is unlocked
 */
export const isWeekUnlocked = (weekNumber: number, progress: RoadmapProgress[]): boolean => {
  // First week is always unlocked
  if (weekNumber === 1) return true;
  
  // No progress data means only first week is unlocked
  if (!progress || progress.length === 0) return false;
  
  // Check if the previous week is 100% complete
  const previousWeekProgress = progress.find(p => p.week_number === weekNumber - 1);
  return previousWeekProgress?.completion_percentage === 100;
};

/**
 * Gets the current active week number based on progress
 * @param progress Array of progress data for all weeks
 * @returns The week number that should be currently active
 */
export const getCurrentActiveWeek = (progress: RoadmapProgress[]): number => {
  if (!progress || progress.length === 0) return 1;
  
  // Find the first incomplete week or the week with partial progress
  for (let i = 0; i < progress.length; i++) {
    if (progress[i].completion_percentage < 100) {
      return progress[i].week_number;
    }
  }
  
  // If all weeks are complete, return the last week
  return progress[progress.length - 1].week_number;
};

/**
 * Gets the furthest unlocked week number
 * @param progress Array of progress data for all weeks
 * @param totalWeeks Total number of weeks in the roadmap
 * @returns The highest week number that is unlocked
 */
export const getFurthestUnlockedWeek = (progress: RoadmapProgress[], totalWeeks: number): number => {
  if (!progress || progress.length === 0) return 1;
  
  // Find the last completed week + 1 (next unlocked week)
  let furthestUnlocked = 1;
  
  for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
    if (isWeekUnlocked(weekNum, progress)) {
      furthestUnlocked = weekNum;
    } else {
      break;
    }
  }
  
  return furthestUnlocked;
};

/**
 * Checks if a week is fully completed
 * @param weekNumber The week number to check
 * @param progress Array of progress data for all weeks
 * @returns boolean indicating if the week is 100% complete
 */
export const isWeekCompleted = (weekNumber: number, progress: RoadmapProgress[]): boolean => {
  const weekProgress = progress.find(p => p.week_number === weekNumber);
  return weekProgress?.completion_percentage === 100 || false;
};

/**
 * Gets the completion percentage for a specific week
 * @param weekNumber The week number to check
 * @param progress Array of progress data for all weeks
 * @returns The completion percentage (0-100)
 */
export const getWeekCompletion = (weekNumber: number, progress: RoadmapProgress[]): number => {
  const weekProgress = progress.find(p => p.week_number === weekNumber);
  return weekProgress?.completion_percentage || 0;
};

/**
 * Gets progress statistics for the entire roadmap
 * @param progress Array of progress data for all weeks
 * @param totalWeeks Total number of weeks in the roadmap
 * @returns Object with completion statistics
 */
export const getRoadmapStats = (progress: RoadmapProgress[], totalWeeks: number) => {
  const completedWeeks = progress.filter(w => w.completion_percentage === 100).length;
  const overallProgress = progress.length > 0 
    ? Math.round(progress.reduce((sum, week) => sum + week.completion_percentage, 0) / progress.length)
    : 0;
  const currentWeek = getCurrentActiveWeek(progress);
  const furthestUnlocked = getFurthestUnlockedWeek(progress, totalWeeks);
  
  return {
    completedWeeks,
    totalWeeks,
    overallProgress,
    currentWeek,
    furthestUnlocked,
    isFullyComplete: completedWeeks === totalWeeks
  };
};

/**
 * Validates if navigation to a week should be allowed
 * @param targetWeek The week number user wants to navigate to
 * @param progress Array of progress data for all weeks
 * @returns Object with validation result and error message
 */
export const validateWeekNavigation = (targetWeek: number, progress: RoadmapProgress[]) => {
  if (targetWeek < 1) {
    return {
      allowed: false,
      error: 'Invalid week number.'
    };
  }
  
  if (!isWeekUnlocked(targetWeek, progress)) {
    return {
      allowed: false,
      error: `Week ${targetWeek} is locked. Complete Week ${targetWeek - 1} to unlock it.`
    };
  }
  
  return {
    allowed: true,
    error: null
  };
}; 