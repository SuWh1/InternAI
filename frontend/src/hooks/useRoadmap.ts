import { useState, useEffect, useCallback } from 'react';
import agentService from '../services/agentService';
import { debounce } from '../utils/performance';
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
  dataReady: boolean;
  error: string | null;
  canRunPipeline: boolean;
  pipelineStatus: any;
  generateRoadmap: (request?: AgentPipelineRequest) => Promise<void>;
  updateProgress: (weekNumber: number, taskId: string, completed: boolean, totalSubtopics?: number) => Promise<void>;
  refreshStatus: () => Promise<void>;
  refreshRoadmapData: () => Promise<void>;
  clearError: () => void;
}

export const useRoadmap = (): UseRoadmapReturn => {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [progress, setProgress] = useState<RoadmapProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canRunPipeline, setCanRunPipeline] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<any>(null);

  // Load initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Run both operations in parallel
      await Promise.allSettled([
        (async () => {
          try {
            const status = await agentService.getPipelineStatus();
            setCanRunPipeline(status.can_run_pipeline);
            setPipelineStatus(status);
          } catch (err) {
            console.error('Error checking pipeline status:', err);
            setCanRunPipeline(false);
          }
        })(),
        (async () => {
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
        })()
      ]);
      
      // Mark data as ready after both API calls complete
      setDataReady(true);
    };

    loadInitialData();
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

  const updateProgress = useCallback(async (weekNumber: number, taskId: string, completed: boolean, totalSubtopics?: number) => {
    const newProgress = progress.map(weekProgress => {
        if (weekProgress.week_number === weekNumber) {
          const completedTasks = new Set(weekProgress.completed_tasks);
          
          if (completed) {
            completedTasks.add(taskId);
          } else {
            completedTasks.delete(taskId);
          }
          
          const completedTasksArray = Array.from(completedTasks);
          
          // Determine if we're using subtopics or tasks
          const hasSubtopics = completedTasksArray.some(id => id.startsWith('subtopic-'));
          const totalItems = hasSubtopics && totalSubtopics ? totalSubtopics : weekProgress.total_tasks;
          
          // Only count relevant items for completion percentage
          const relevantCompletedItems = hasSubtopics 
            ? completedTasksArray.filter(id => id.startsWith('subtopic-')).length
            : completedTasksArray.filter(id => id.startsWith('task-')).length;
          
          const completionPercentage = totalItems > 0 ? (relevantCompletedItems / totalItems) * 100 : 0;
          
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

  // Debounced refresh to prevent multiple simultaneous API calls
  const debouncedRefresh = useCallback(
    debounce(() => {
      refreshRoadmapData();
    }, 1000),
    [refreshRoadmapData]
  );

  // Optimized event listeners to prevent performance issues
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if page was hidden for more than 30 seconds
      if (document.hidden === false) {
        debouncedRefresh();
      }
    };

    const handleVisibilityChange = () => {
      // Only refresh when becoming visible, not when hiding
      if (!document.hidden) {
        debouncedRefresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [debouncedRefresh]);

  return {
    roadmap,
    progress,
    loading,
    dataReady,
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