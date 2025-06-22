import { useState, useEffect, useCallback } from 'react';
import agentService from '../services/agentService';
import type { 
  AgentPipelineResponse, 
  Roadmap, 
  RoadmapProgress,
  AgentPipelineRequest 
} from '../types/roadmap';

interface UseRoadmapReturn {
  roadmap: Roadmap | null;
  progress: RoadmapProgress[];
  loading: boolean;
  error: string | null;
  canRunPipeline: boolean;
  pipelineStatus: any;
  generateRoadmap: (request?: AgentPipelineRequest) => Promise<void>;
  updateProgress: (weekNumber: number, taskId: string, completed: boolean) => Promise<void>;
  refreshStatus: () => Promise<void>;
  refreshRoadmapData: () => Promise<void>;
  clearError: () => void;
}

export const useRoadmap = (): UseRoadmapReturn => {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [progress, setProgress] = useState<RoadmapProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canRunPipeline, setCanRunPipeline] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<any>(null);

  // Check pipeline status on mount
  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await agentService.getPipelineStatus();
      setCanRunPipeline(status.can_run_pipeline);
      setPipelineStatus(status);
    } catch (err) {
      console.error('Error checking pipeline status:', err);
      setCanRunPipeline(false);
    }
  }, []);

  // Function to refresh roadmap data from database
  const refreshRoadmapData = useCallback(async () => {
    try {
      const response = await agentService.getUserRoadmap();
      
      if (response.success && response.data.roadmap) {
        setRoadmap(response.data.roadmap);
        setProgress(response.data.progress || []);
        
        // Clean up old localStorage data since we're now using database
        localStorage.removeItem('internai_roadmap');
        localStorage.removeItem('internai_roadmap_progress');
      }
    } catch (err) {
      // If error (like no roadmap found), that's fine - user hasn't generated one yet
      console.debug('No roadmap found in database (user may need to generate one)');
    }
  }, []);

  const generateRoadmap = useCallback(async (request: AgentPipelineRequest = {}) => {
    if (!canRunPipeline) {
      setError('Cannot run pipeline. Please complete onboarding first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: AgentPipelineResponse = await agentService.runPipeline(request);
      
      if (response.success && response.data.roadmap) {
        setRoadmap(response.data.roadmap);
        
        // Initialize progress tracking for all weeks
        const initialProgress: RoadmapProgress[] = response.data.roadmap.weeks.map(week => ({
          week_number: week.week_number,
          completed_tasks: [],
          total_tasks: week.tasks.length,
          completion_percentage: 0,
          last_updated: new Date().toISOString()
        }));
        
        setProgress(initialProgress);
        
        // Note: Roadmap is now automatically saved to database by the backend
        // No need to store in localStorage anymore
      } else {
        throw new Error(response.pipeline_summary.error || 'Failed to generate roadmap');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error generating roadmap:', err);
    } finally {
      setLoading(false);
    }
  }, [canRunPipeline]);

  const updateProgress = useCallback(async (weekNumber: number, taskId: string, completed: boolean) => {
    const newProgress = progress.map(weekProgress => {
        if (weekProgress.week_number === weekNumber) {
          const completedTasks = new Set(weekProgress.completed_tasks);
          
          if (completed) {
            completedTasks.add(taskId);
          } else {
            completedTasks.delete(taskId);
          }
          
          const completedTasksArray = Array.from(completedTasks);
          const completionPercentage = (completedTasksArray.length / weekProgress.total_tasks) * 100;
          
          return {
            ...weekProgress,
            completed_tasks: completedTasksArray,
            completion_percentage: Math.round(completionPercentage),
            last_updated: new Date().toISOString()
          };
        }
        return weekProgress;
      });
      
    // Update local state immediately for responsiveness
    setProgress(newProgress);
    
    // Save progress to database
    try {
      // Send the progress array directly as the request body
      await agentService.updateRoadmapProgress(newProgress);
      // Refresh data from database to ensure consistency
      await refreshRoadmapData();
    } catch (error) {
      console.error('Error saving progress to database:', error);
      // Revert local state on error
      setProgress(progress);
      setError('Failed to save progress. Please try again.');
    }
  }, [progress, refreshRoadmapData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load roadmap and progress from database on mount
  useEffect(() => {
    refreshRoadmapData();
  }, [refreshRoadmapData]);

  // Listen for focus events to refresh data when returning to the page
  useEffect(() => {
    const handleFocus = () => {
      refreshRoadmapData();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        refreshRoadmapData();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [refreshRoadmapData]);

  return {
    roadmap,
    progress,
    loading,
    error,
    canRunPipeline,
    pipelineStatus,
    generateRoadmap,
    updateProgress,
    refreshStatus,
    refreshRoadmapData,
    clearError
  };
}; 