/**
 * Types for the interactive roadmap component and agent pipeline integration
 */

// Week data structure from the agent pipeline
export interface WeekData {
  week_number: number;
  theme: string;
  focus_area: string;
  tasks: string[];
  estimated_hours: number;
  deliverables: string[];
  resources: string[];
}

// Personalization factors from the roadmap agent
export interface PersonalizationFactors {
  experience_level: string;
  focus_areas: string[];
  skill_assessment: {
    overall_score: number;
    level_category: string;
    details?: Record<string, any>;
  };
  timeline_urgency: string;
  target_internships: string[];
  has_resume: boolean;
}

// Complete roadmap structure from the agent
export interface Roadmap {
  weeks: WeekData[];
  personalization_factors: PersonalizationFactors;
  generated_at: string;
  roadmap_type: string;
}

// Agent pipeline response structure
export interface AgentPipelineResponse {
  success: boolean;
  pipeline_summary: {
    success: boolean;
    total_agents_executed: number;
    successful_agents: number;
    failed_agents: string[];
    execution_time: string;
    error?: string;
  };
  data: {
    has_resume: boolean;
    resume_summary?: any;
    roadmap?: Roadmap;
    internship_recommendations?: any[];
    recommendation_criteria?: any;
    personalization_factors?: PersonalizationFactors;
    summary: {
      has_resume: boolean;
      roadmap_weeks: number;
      recommended_internships: number;
      top_focus_areas: string[];
      estimated_weekly_hours: number;
    };
  };
}

// Request structure for the agent pipeline
export interface AgentPipelineRequest {
  resume_text?: string;
  resume_file_path?: string;
}

// Node structure for the interactive roadmap visualization
export interface RoadmapNode {
  id: string;
  type: 'week' | 'task' | 'milestone';
  position: { x: number; y: number };
  data: {
    label: string;
    week_number?: number;
    theme?: string;
    focus_area?: string;
    tasks?: string[];
    estimated_hours?: number;
    deliverables?: string[];
    resources?: string[];
    is_completed?: boolean;
    details?: string; // GPT-generated detailed explanation
    is_expanded?: boolean;
  };
}

// Edge structure for connecting nodes
export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

// GPT integration types
export interface GPTTopicRequest {
  topic: string;
  context?: string;
  user_level?: string;
}

export interface YouTubeVideo {
  title: string;
  url: string;
  description: string;
  channel: string;
  duration: string;
  view_count: number;
  like_count: number;
  thumbnail: string;
  published_at: string;
  relevance_score: number;
}

export interface GPTTopicResponse {
  success: boolean;
  explanation: string;
  resources: string[];
  subtasks: string[];
  youtube_videos?: YouTubeVideo[];
  cached: boolean;
}

// Roadmap progress tracking
export interface RoadmapProgress {
  week_number: number;
  completed_tasks: string[];
  total_tasks: number;
  completion_percentage: number;
  last_updated: string;
}

// Interactive roadmap component props
export interface InteractiveRoadmapProps {
  roadmap?: Roadmap;
  progress?: RoadmapProgress[];
  onNodeClick?: (node: RoadmapNode) => void;
  onProgressUpdate?: (weekNumber: number, taskId: string, completed: boolean) => void;
  className?: string;
} 