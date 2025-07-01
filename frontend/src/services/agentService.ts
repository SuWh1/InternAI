import apiService from './apiService';
import { TTLCache } from '../utils/lruCache';
import { TIMEOUTS } from '../utils/constants';
import type { 
  AgentPipelineRequest, 
  AgentPipelineResponse, 
  GPTTopicRequest, 
  GPTTopicResponse 
} from '../types/roadmap';

class AgentService {
  private gptCache = new TTLCache<string, GPTTopicResponse>();

  /**
   * Run the complete agent pipeline to generate roadmap and recommendations
   */
  async runPipeline(request: AgentPipelineRequest): Promise<AgentPipelineResponse> {
    try {
      const response = await apiService.post<AgentPipelineResponse>(
        '/agents/run-pipeline',
        request
      );
      return response;
    } catch (error) {
      console.error('Error running agent pipeline:', error);
      throw new Error('Failed to generate personalized roadmap. Please try again.');
    }
  }

  /**
   * Check if user can run the agent pipeline
   */
  async getPipelineStatus(): Promise<{
    can_run_pipeline: boolean;
    reason: string;
    missing_requirements: string[];
    onboarding_completed: boolean;
    user_profile_summary?: any;
  }> {
    try {
      const response = await apiService.get<{
        can_run_pipeline: boolean;
        reason: string;
        missing_requirements: string[];
        onboarding_completed: boolean;
        user_profile_summary?: any;
      }>('/agents/pipeline-status');
      return response;
    } catch (error) {
      console.error('Error checking pipeline status:', error);
      throw new Error('Failed to check pipeline status.');
    }
  }



  /**
   * Get user's roadmap from database
   */
  async getUserRoadmap(): Promise<any> {
    try {
      const response = await apiService.get<any>('/agents/roadmap');
      return response;
    } catch (error) {
      console.error('Error getting user roadmap:', error);
      throw new Error('Failed to get roadmap from database.');
    }
  }

  /**
   * Update roadmap progress in database
   */
  async updateRoadmapProgress(progressData: any): Promise<any> {
    try {
      // The backend expects the progress data directly, not wrapped in an object
      const response = await apiService.put<any>('/agents/roadmap/progress', progressData);
      return response;
    } catch (error) {
      console.error('Error updating roadmap progress:', error);
      throw new Error('Failed to update progress in database.');
    }
  }

  /**
   * Get detailed explanation for a topic using GPT (with caching)
   */
  async getTopicDetails(request: GPTTopicRequest & { force_regenerate?: boolean }): Promise<GPTTopicResponse> {
    const cacheKey = `${request.topic}_${request.context || ''}_${request.user_level || 'intermediate'}`;
    
    // Clear cache if force regeneration is requested
    if (request.force_regenerate && this.gptCache.has(cacheKey)) {
      this.gptCache.delete(cacheKey);
    }
    
    // Check cache first (unless force regenerating)
    if (!request.force_regenerate && this.gptCache.has(cacheKey)) {
      const cached = this.gptCache.get(cacheKey)!;
      return { 
        ...cached, 
        youtube_videos: cached.youtube_videos || [], // Ensure youtube_videos exists for older cached entries
        cached: true 
      };
    }

    try {
      const response = await apiService.post<GPTTopicResponse>(
        '/agents/topic-details',
        {
          topic: request.topic,
          context: request.context,
          user_level: request.user_level,
          force_regenerate: request.force_regenerate || false
        }
      );
      
      // Ensure response has the correct structure
      const formattedResponse: GPTTopicResponse = {
        success: response.success || false,
        explanation: typeof response.explanation === 'string' ? response.explanation : 'No explanation available',
        resources: Array.isArray(response.resources) ? response.resources : [],
        subtasks: Array.isArray(response.subtasks) ? response.subtasks : [],
        youtube_videos: Array.isArray(response.youtube_videos) ? response.youtube_videos : [],
        cached: false
      };
      
      // Only cache successful responses (don't cache error messages)
      const isErrorContent = (content: string): boolean => {
        const errorPatterns = [
          /Error parsing lesson content/i,
          /Error generating lesson/i,
          /Please try again/i,
          /Failed to generate/i,
          /Content generation failed/i
        ];
        return errorPatterns.some(pattern => pattern.test(content));
      };
      
      if (formattedResponse.success && !isErrorContent(formattedResponse.explanation)) {
        this.gptCache.set(cacheKey, formattedResponse);
      }
      
      return formattedResponse;
    } catch (error) {
      console.error('Error getting topic details:', error);
      // Return a fallback response
      return {
        success: false,
        explanation: 'Unable to load detailed explanation at this time. Please try again later.',
        resources: [],
        subtasks: [],
        youtube_videos: [],
        cached: false
      };
    }
  }

  /**
   * Clear the GPT cache (useful for memory management)
   */
  clearCache(): void {
    this.gptCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return this.gptCache.getStats();
  }

  /**
   * Generate subtopics for a learning topic (with database storage)
   */
  async generateSubtopics(request: {
    topic: string;
    context?: string;
    user_level?: string;
    force_regenerate?: boolean;
  }): Promise<{
    success: boolean;
    subtopics: Array<{ title: string; description: string } | string>;
    cached: boolean;
    generated_at: string;
    access_count: string;
  }> {
    try {
      const response = await apiService.post<{
        success: boolean;
        subtopics: Array<{ title: string; description: string } | string>;
        cached: boolean;
        generated_at: string;
        access_count: string;
      }>('/agents/generate-subtopics', request);
      
      return response;
    } catch (error) {
      console.error('Error generating subtopics:', error);
      // Return fallback subtopics with structured format
      return {
        success: false,
        subtopics: [
          { title: `Introduction to ${request.topic}`, description: `Learn the fundamental concepts and principles of ${request.topic} with hands-on examples` },
          { title: `Core Concepts`, description: `Master the essential concepts and building blocks of ${request.topic} development` },
          { title: `Practical Applications`, description: `Apply ${request.topic} skills through real-world projects and practical implementations` },
          { title: `Best Practices`, description: `Understand industry standards, coding conventions, and optimization techniques for ${request.topic}` },
          { title: `Common Challenges`, description: `Learn to troubleshoot and solve typical problems encountered when working with ${request.topic}` },
          { title: `Advanced Techniques`, description: `Explore advanced patterns, performance optimization, and professional-level ${request.topic} development` }
        ],
        cached: false,
        generated_at: new Date().toISOString(),
        access_count: "0"
      };
    }
  }

  /**
   * Get user's learning content by type
   */
  async getLearningContent(contentType: string): Promise<{
    success: boolean;
    content_type: string;
    content: Array<{
      id: string;
      topic: string;
      context: string;
      content_data: any;
      user_level: string;
      access_count: string;
      last_accessed: string;
      created_at: string;
      updated_at: string;
    }>;
    total_count: number;
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        content_type: string;
        content: Array<{
          id: string;
          topic: string;
          context: string;
          content_data: any;
          user_level: string;
          access_count: string;
          last_accessed: string;
          created_at: string;
          updated_at: string;
        }>;
        total_count: number;
      }>(`/agents/learning-content/${contentType}`);
      
      return response;
    } catch (error) {
      console.error('Error getting learning content:', error);
      return {
        success: false,
        content_type: contentType,
        content: [],
        total_count: 0
      };
    }
  }

  /**
   * Transform roadmap data from backend to frontend format
   */
  transformRoadmapToNodes(roadmap: any): { nodes: any[], edges: any[] } {
    if (!roadmap?.weeks) {
      return { nodes: [], edges: [] };
    }

    const nodes: any[] = [];
    const edges: any[] = [];
    
    const nodeWidth = 250;
    const nodeHeight = 120;
    const verticalSpacing = 200;
    const horizontalSpacing = 320;
    
    // Calculate layout - arrange weeks in a flow from top to bottom
    roadmap.weeks.forEach((week: any, index: number) => {
      const x = (index % 3) * horizontalSpacing + 50; // 3 columns
      const y = Math.floor(index / 3) * verticalSpacing + 50;
      
      // Create main week node
      const weekNode = {
        id: `week-${week.week_number}`,
        type: 'week',
        position: { x, y },
        data: {
          label: `Week ${week.week_number}: ${week.theme}`,
          week_number: week.week_number,
          theme: week.theme,
          focus_area: week.focus_area,
          tasks: week.tasks,
          estimated_hours: week.estimated_hours,
          deliverables: week.deliverables,
          resources: week.resources,
          is_completed: false,
          is_expanded: false
        },
        style: {
          width: nodeWidth,
          height: nodeHeight
        }
      };
      
      nodes.push(weekNode);
      
      // Connect to previous week if not the first
      if (index > 0) {
        const prevWeekId = `week-${roadmap.weeks[index - 1].week_number}`;
        edges.push({
          id: `edge-${prevWeekId}-${weekNode.id}`,
          source: prevWeekId,
          target: weekNode.id,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#3b82f6', strokeWidth: 2 }
        });
      }
    });

    return { nodes, edges };
  }
}

// Create and export a singleton instance
export const agentService = new AgentService();
export default agentService; 