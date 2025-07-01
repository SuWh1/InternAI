import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import agentService from '../services/agentService';
import { QUERY_KEYS, CACHE_LIMITS } from '../utils/constants';
import type { 
  Roadmap, 
  RoadmapProgress,
  AgentPipelineRequest,
  AgentPipelineResponse
} from '../types/roadmap';

interface UseRoadmapQueryReturn {
  roadmap: Roadmap | null;
  progress: RoadmapProgress[];
  loading: boolean;
  dataReady: boolean;
  error: string | null;
  canRunPipeline: boolean;
  pipelineStatus: any;
  generateRoadmap: (request?: AgentPipelineRequest) => Promise<void>;
  updateProgress: (weekNumber: number, taskId: string, completed: boolean) => Promise<void>;
  refreshStatus: () => Promise<void>;
  refreshRoadmapData: () => Promise<void>;
  clearError: () => void;
}

export const useRoadmapQuery = (): UseRoadmapQueryReturn => {
  const queryClient = useQueryClient();

  // Query for roadmap data
  const {
    data: roadmapData,
    isLoading: roadmapLoading,
    error: roadmapError,
  } = useQuery({
    queryKey: QUERY_KEYS.ROADMAP,
    queryFn: async () => {
      const response = await agentService.getUserRoadmap();
      if (response.success && response.data.roadmap) {
        return {
          roadmap: response.data.roadmap,
          progress: response.data.progress || [],
        };
      }
      return { roadmap: null, progress: [] };
    },
    staleTime: CACHE_LIMITS.STALE_TIME,
    retry: (failureCount, error) => {
      // Don't retry if no roadmap found (user needs to generate one)
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message: string }).message;
        if (message.includes('No roadmap found')) return false;
      }
      return failureCount < 2;
    },
  });

  // Query for pipeline status
  const {
    data: pipelineStatusData,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: QUERY_KEYS.PIPELINE_STATUS,
    queryFn: () => agentService.getPipelineStatus(),
    staleTime: CACHE_LIMITS.STALE_TIME,
  });

  // Mutation for generating roadmap
  const generateRoadmapMutation = useMutation({
    mutationFn: (request: AgentPipelineRequest) => agentService.runPipeline(request),
    onSuccess: (data: AgentPipelineResponse) => {
      if (data.success && data.data.roadmap) {
        // Update cache with new roadmap data
        const initialProgress: RoadmapProgress[] = data.data.roadmap.weeks.map(week => ({
          week_number: week.week_number,
          completed_tasks: [],
          total_tasks: week.tasks.length,
          completion_percentage: 0,
          last_updated: new Date().toISOString()
        }));

        queryClient.setQueryData(QUERY_KEYS.ROADMAP, {
          roadmap: data.data.roadmap,
          progress: initialProgress,
        });
      }
    },
    onError: (error) => {
      console.error('Error generating roadmap:', error);
    },
  });

  // Mutation for updating progress
  const updateProgressMutation = useMutation({
    mutationFn: (progressData: RoadmapProgress[]) => 
      agentService.updateRoadmapProgress(progressData),
    onSuccess: () => {
      // Invalidate and refetch roadmap data to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROADMAP });
    },
    onError: (error) => {
      console.error('Error updating progress:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROADMAP });
    },
  });

  // Callback functions
  const generateRoadmap = useCallback(async (request: AgentPipelineRequest = {}) => {
    if (!pipelineStatusData?.can_run_pipeline) {
      throw new Error('Cannot run pipeline. Please complete onboarding first.');
    }
    await generateRoadmapMutation.mutateAsync(request);
  }, [generateRoadmapMutation, pipelineStatusData?.can_run_pipeline]);

  const updateProgress = useCallback(async (weekNumber: number, taskId: string, completed: boolean) => {
    const currentData = queryClient.getQueryData<{ roadmap: Roadmap; progress: RoadmapProgress[] }>(QUERY_KEYS.ROADMAP);
    if (!currentData) return;

    // Optimistic update
    const newProgress = currentData.progress.map(weekProgress => {
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
        const totalItems = hasSubtopics ? 6 : weekProgress.total_tasks;
        
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

    // Apply optimistic update
    queryClient.setQueryData(QUERY_KEYS.ROADMAP, {
      ...currentData,
      progress: newProgress,
    });

    // Make API call
    await updateProgressMutation.mutateAsync(newProgress);
  }, [queryClient, updateProgressMutation]);

  const refreshStatus = useCallback(async () => {
    await refetchStatus();
  }, [refetchStatus]);

  const refreshRoadmapData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROADMAP });
  }, [queryClient]);

  const clearError = useCallback(() => {
    queryClient.setQueryData(QUERY_KEYS.ROADMAP, (old: any) => ({
      ...old,
      error: null,
    }));
  }, [queryClient]);

  // Extract data
  const roadmap = roadmapData?.roadmap || null;
  const progress = roadmapData?.progress || [];
  const loading = roadmapLoading || statusLoading || generateRoadmapMutation.isPending || updateProgressMutation.isPending;
  const dataReady = !roadmapLoading && !statusLoading;
  const error = roadmapError?.message || generateRoadmapMutation.error?.message || updateProgressMutation.error?.message || null;
  const canRunPipeline = pipelineStatusData?.can_run_pipeline || false;
  const pipelineStatus = pipelineStatusData || null;

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
    clearError,
  };
}; 