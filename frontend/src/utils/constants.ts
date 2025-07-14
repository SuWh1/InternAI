// Application Constants
export const TIMEOUTS = {
  API_REQUEST: 120_000, // 120 seconds for AI content generation
  CACHE_STALE: 5 * 60 * 1000, // 5 minutes
  ANIMATION_DELAY: 100,
  FOCUS_DELAY: 600,
  MODAL_ANIMATION: 300,
} as const;

export const CACHE_LIMITS = {
  LRU_MAX_SIZE: 50,
  QUERY_CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
} as const;

export const ANIMATION_DURATIONS = {
  FAST: 200,
  MEDIUM: 400,
  SLOW: 600,
  SPRING_DAMPING: 25,
  SPRING_STIFFNESS: 300,
} as const;

export const ROADMAP_LAYOUT = {
  NODE_WIDTH: 375,
  NODE_HEIGHT: 200,
  PADDING: 400,
  MIN_ZOOM: 0.375,
  MAX_ZOOM: 2.5,
  DEFAULT_ZOOM: 1.05,
  FOCUS_ZOOM: 1.5,
  FOCUS_DURATION: 1000,
} as const;

export const MESSAGES = {
  LOADING_ROADMAP: "Creating Your Personalized Roadmap",
  REGENERATING_ROADMAP: "Regenerating Your Roadmap",
  ERROR_NETWORK: "Network error occurred",
  ERROR_UNAUTHORIZED: "Please log in to continue",
  ERROR_GENERIC: "Something went wrong. Please try again.",
} as const;

export const ROUTES = {
  HOME: "/",
  ONBOARDING: "/onboarding",
  ROADMAP: "/roadmap",
  MY_ROADMAP: "/my-roadmap",
  WEEK_DETAIL: "/roadmap/week/:weekNumber",
  LESSON: "/lesson/:slug",
  LESSON_CONTEXT: "/lesson/:topic/:context/:weekNumber",
} as const;

export const QUERY_KEYS = {
  ROADMAP: ["roadmap"] as const,
  ROADMAP_PROGRESS: ["roadmap", "progress"] as const,
  PIPELINE_STATUS: ["pipeline", "status"] as const,
  TOPIC_DETAILS: (topic: string, context: string, userLevel: string) => 
    ["topic-details", topic, context, userLevel] as const,
  SUBTOPICS: (topic: string, context: string, userLevel: string) => 
    ["subtopics", topic, context, userLevel] as const,
  LEARNING_CONTENT: (contentType: string) => 
    ["learning-content", contentType] as const,
} as const; 