import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  ExternalLink, 
  Loader, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Brain,
  Target,
  Youtube,
  FileText,
  RotateCcw,
  Share2,
  AlertTriangle,
  MessageCircle,
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2
} from 'lucide-react';
import agentService from '../services/agentService';
import { topicService } from '../services/topicService';
import { createLessonSlug, parseLessonSlug } from '../utils/slugify';
import MarkdownRenderer from '../components/common/MarkdownRenderer';
import TextAreaWithCounter from '../components/common/TextAreaWithCounter';
import { useTheme } from '../contexts/ThemeContext';
import type { GPTTopicResponse } from '../types/roadmap';
import { OptimizedInterval, debounce, batchDOMOperations } from '../utils/performance';

// Safe wrapper for MarkdownRenderer that handles parsing errors
interface SafeMarkdownRendererProps {
  content: string;
  onRenderingError?: (error: Error) => void;
}

// Semantic color utility for theme-adaptive styling with soft, pleasant colors
const useSemanticColors = (theme: string) => ({
  error: {
    bg: theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50/70',
    border: theme === 'dark' ? 'border-red-500/20' : 'border-red-200/60',
    text: theme === 'dark' ? 'text-red-300' : 'text-red-700'
  },
  warning: {
    bg: theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50/70',
    border: theme === 'dark' ? 'border-amber-500/20' : 'border-amber-200/60',
    text: theme === 'dark' ? 'text-amber-300' : 'text-amber-700'
  },
  success: {
    bg: theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50/70',
    border: theme === 'dark' ? 'border-emerald-500/20' : 'border-emerald-200/60',
    text: theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'
  },
  info: {
    bg: theme === 'dark' ? 'bg-sky-500/10' : 'bg-sky-50/70',
    border: theme === 'dark' ? 'border-sky-500/20' : 'border-sky-200/60',
    text: theme === 'dark' ? 'text-sky-300' : 'text-sky-700'
  },
  youtube: {
    bg: theme === 'dark' ? 'bg-rose-500/8' : 'bg-rose-50/60',
    border: theme === 'dark' ? 'border-rose-500/15' : 'border-rose-200/50',
    text: theme === 'dark' ? 'text-rose-300' : 'text-rose-700'
  }
});

// Utility function to filter out duplicate Resources and Tasks sections from lesson content
const filterLessonContent = (content: string): string => {
  if (!content || typeof content !== 'string') return '';
  
  const lines = content.split('\n');
  const filteredLines: string[] = [];
  let isSkipping = false;
  let currentHeadingLevel = 0;
  
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s*(.+)$/);
    
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim().toLowerCase();
      
      // Check if this is a section we want to skip (Resources, Tasks, Subtasks, etc.)
      if (title.match(/^(resources?|learning\s*resources?|additional\s*resources?|useful\s*resources?|curated\s*.*resources?|tasks?|subtasks?|practice\s*tasks?|progressive\s*practice\s*tasks?|exercises?|activities?|assignments?|homework|to\s*do|action\s*items?)$/i)) {
        isSkipping = true;
        currentHeadingLevel = level;
        continue;
      }
      
      // If we're skipping and hit a heading of same or higher level, stop skipping
      if (isSkipping && level <= currentHeadingLevel) {
        isSkipping = false;
      }
    }
    
    // Only add lines if we're not in a section we're skipping
    if (!isSkipping) {
      filteredLines.push(line);
    }
  }
  
  return filteredLines.join('\n').trim();
};

// Utility function to safely extract content and prevent "undefined" strings
const safeContentExtractor = (content: any): string => {
  // Handle null or undefined
  if (content === null || content === undefined) {
    return '';
  }
  
  // Handle string content directly
  if (typeof content === 'string') {
    return content.trim();
  }
  
  // Handle objects by extracting meaningful content
  if (typeof content === 'object') {
    try {
      // Filter out undefined/null values from objects
      const cleanObject = Object.fromEntries(
        Object.entries(content).filter(([_, value]) => value !== undefined && value !== null)
      );
      
      // If empty object after cleaning, return empty string
      if (Object.keys(cleanObject).length === 0) {
        return '';
      }
      
      // Convert to JSON only if we have valid content
      return JSON.stringify(cleanObject, null, 2);
    } catch (error) {
      console.warn('Error processing object content:', error);
      return '';
    }
  }
  
  // Handle numbers, booleans, etc.
  return String(content);
};

const SafeMarkdownRenderer: React.FC<SafeMarkdownRendererProps> = ({ content, onRenderingError }) => {
  const { theme } = useTheme();
  const colors = useSemanticColors(theme);
  
  // Validate content before rendering
  const safeContent = content?.trim();
  if (!safeContent || safeContent === 'undefined' || safeContent === 'null') {
    return (
      <div className={`p-4 ${colors.warning.bg} border ${colors.warning.border} rounded-lg`}>
        <p className={colors.warning.text}>No content available for this section.</p>
      </div>
    );
  }
  
  try {
    return <MarkdownRenderer content={safeContent} />;
  } catch (error) {
    console.error('Error rendering markdown:', error);
    onRenderingError?.(error as Error);
    return (
      <div className={`p-4 ${colors.error.bg} border ${colors.error.border} rounded-lg`}>
        <p className={colors.error.text}>Error rendering lesson content. Please try refreshing the page.</p>
      </div>
    );
  }
};

const LessonPage: React.FC = () => {
  const params = useParams<{ 
    slug?: string;
    topic?: string; 
    context?: string; 
    weekNumber?: string;
  }>();

  const navigate = useNavigate();
  const { theme } = useTheme();

  // Memoize CSS styles to prevent expensive DOM operations
  const chatStyles = React.useMemo(() => {
    const isDark = theme === 'dark';
    return {
      scrollbarTrack: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      scrollbarThumb: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)',
      scrollbarThumbHover: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.25)',
    };
  }, [theme]);

  // Add CSS for user message text and scrollbars - optimized
  React.useEffect(() => {
    const styleId = 'lesson-page-chat-styles';
    let style = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    
    style.textContent = `
      .user-message-content * { color: inherit; }
      .chat-messages::-webkit-scrollbar { width: 8px; }
      .chat-messages::-webkit-scrollbar-track { 
        background: ${chatStyles.scrollbarTrack}; 
        border-radius: 4px; 
      }
      .chat-messages::-webkit-scrollbar-thumb { 
        background: ${chatStyles.scrollbarThumb}; 
        border-radius: 4px; 
      }
      .chat-messages::-webkit-scrollbar-thumb:hover { 
        background: ${chatStyles.scrollbarThumbHover}; 
      }
      .chat-input::-webkit-scrollbar { width: 6px; }
      .chat-input::-webkit-scrollbar-track { 
        background: ${chatStyles.scrollbarTrack}; 
        border-radius: 3px; 
      }
      .chat-input::-webkit-scrollbar-thumb { 
        background: ${chatStyles.scrollbarThumb}; 
        border-radius: 3px; 
      }
      .chat-input::-webkit-scrollbar-thumb:hover { 
        background: ${chatStyles.scrollbarThumbHover}; 
      }
      .chat-messages { 
        scrollbar-width: thin; 
        scrollbar-color: ${chatStyles.scrollbarThumb} ${chatStyles.scrollbarTrack}; 
      }
      .chat-input { 
        scrollbar-width: thin; 
        scrollbar-color: ${chatStyles.scrollbarThumb} ${chatStyles.scrollbarTrack}; 
      }
    `;
    
    return () => {
      // Only remove on unmount, not on theme change
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [chatStyles]);
  
  const [lesson, setLesson] = useState<GPTTopicResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderingError, setRenderingError] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [estimatedReadTime, setEstimatedReadTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [qualityRegenerationCount, setQualityRegenerationCount] = useState(0);
  const [isQualityEnhancing, setIsQualityEnhancing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    type: 'ai' | 'user';
    content: string;
    timestamp: Date;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatMessagesEndRef, setChatMessagesEndRef] = useState<HTMLDivElement | null>(null);
  
  // State for topic loading
  const [isLoadingTopic, setIsLoadingTopic] = useState(() => {
    // Initialize as true for topic-based lessons to prevent race condition
    return params.slug?.match(/^topic-(.+)-(\d+)$/) ? true : false;
  });
  const [topicData, setTopicData] = useState<{ topic: string; context: string; weekNumber: string } | null>(null);

  // Optimized interval ref for step cycling
  const stepIntervalRef = React.useRef<OptimizedInterval | null>(null);

  // Load topic data for topic-based lessons
  const loadTopicData = async () => {
    if (params.slug) {
      const topicLessonMatch = params.slug.match(/^topic-(.+)-(\d+)$/);
      if (topicLessonMatch) {
        const topicId = topicLessonMatch[1];
        const subtopicIndex = parseInt(topicLessonMatch[2], 10);
        setIsLoadingTopic(true);
        
        try {
          const topicDataResponse = await topicService.getTopic(topicId);
          if (topicDataResponse && topicDataResponse.subtopics && topicDataResponse.subtopics[subtopicIndex]) {
            const subtopic = topicDataResponse.subtopics[subtopicIndex];
            const topicTitle = typeof subtopic === 'string' ? subtopic : subtopic.title;
            const topicContext = `Learning Topic: ${topicDataResponse.name}`;
            const weekNum = ''; // No week number for topic-based lessons
            return { topic: topicTitle, context: topicContext, weekNumber: weekNum };
          }
        } catch (error) {
          console.error('Error loading topic data for lesson:', error);
        } finally {
          setIsLoadingTopic(false);
        }
      }
    }
    return null;
  };

  // Effect to load topic data on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await loadTopicData();
      if (data) {
        setTopicData(data);
      }
    };
    loadData();
  }, [params.slug]);

  // Handle both new slug format and legacy URL format
  let topic = '';
  let context = '';
  let weekNumber = '';

  // Use topic data if available, otherwise parse URL
  if (topicData) {
    topic = topicData.topic;
    context = topicData.context;
    weekNumber = topicData.weekNumber;
  } else if (params.slug) {
    // Check if this is a topic-based lesson (format: topic-{topicId}-{subtopicIndex})
    const topicLessonMatch = params.slug.match(/^topic-(.+)-(\d+)$/);
    if (!topicLessonMatch) {
      // Parse regular week-based lesson slug
      const lessonData = parseLessonSlug(params.slug);
      if (lessonData) {
        topic = lessonData.topic;
        context = `Week ${lessonData.weekNumber}: ${lessonData.topic}`;
        weekNumber = lessonData.weekNumber.toString();
      }
    }
  } else if (params.topic && params.context) {
    // Legacy URL format - decode and use directly
    topic = decodeURIComponent(params.topic);
    context = decodeURIComponent(params.context);
    weekNumber = params.weekNumber || '';
    
    // Create a slug for this lesson and redirect to clean URL
    const weekNum = parseInt(weekNumber || '1');
    const slug = createLessonSlug(topic, weekNum);
    const newUrl = `/lesson/${slug}`;
    
    // Replace the current URL with the clean one
    setTimeout(() => {
      navigate(newUrl, { replace: true });
    }, 100);
  }

  // Always start with loading state - minimum 2 seconds
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For topic-based lessons, wait for topic data to be loaded
    const isTopicBasedLesson = params.slug?.match(/^topic-(.+)-(\d+)$/);
    
    if (isTopicBasedLesson) {
      // If topic data is still loading, wait
      if (isLoadingTopic) {
        return;
      }
      
      // If topic data failed to load or topic is empty, show error
      if (!topicData || !topic) {
        setError('Lesson not found. The lesson may have been moved or deleted.');
        setLoading(false);
        return;
      }
    }
    
    // Only proceed if we have a valid topic
    if (topic) {
      loadLessonContent();
    } else if (params.slug && !isTopicBasedLesson) {
      // For non-topic lessons, show error if no topic found
      setError('Lesson not found. The lesson may have been moved or deleted.');
      setLoading(false);
    }
  }, [topic, context, topicData, isLoadingTopic]);

  // Show timeout warning after 20 seconds of loading
  useEffect(() => {
    let timeoutWarning: number;
    
    if (loading || isLoadingTopic) {
      timeoutWarning = window.setTimeout(() => {
        setShowTimeoutWarning(true);
      }, 20000);
    } else {
      setShowTimeoutWarning(false);
    }

    return () => {
      if (timeoutWarning) {
        clearTimeout(timeoutWarning);
      }
    };
  }, [loading]);

    // Optimized step cycling to prevent performance issues
  useEffect(() => {
    // Clean up existing interval
    stepIntervalRef.current?.destroy();
    
    if (loading || isLoadingTopic) {
      setCurrentStep(0);
      
      // Use OptimizedInterval instead of regular setInterval
      stepIntervalRef.current = new OptimizedInterval(() => {
        setCurrentStep(prev => (prev + 1) % 4);
      }, 7000);
      stepIntervalRef.current.start();
    }

    return () => {
      stepIntervalRef.current?.destroy();
    };
  }, [loading, isLoadingTopic]);

  // Calculate reading progress based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Ensure docHeight is valid to prevent incorrect initial calculations
      if (docHeight <= 0) {
        setReadingProgress(0);
        return;
      }
      
      const scrollPercent = Math.min(Math.max((scrollTop / docHeight) * 100, 0), 100);
      setReadingProgress(scrollPercent);
      
      // Mark as completed when user scrolls to 80%
      if (scrollPercent >= 80 && !isCompleted) {
        setIsCompleted(true);
      }
    };

    // Set initial progress to 0
    setReadingProgress(0);
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isCompleted]);

  const extractTextFromExplanation = (explanation: any): string => {
    if (typeof explanation === 'string') return explanation;
    if (typeof explanation === 'object' && explanation !== null) {
      let text = '';
      if (explanation.title) {
        text += `# ${explanation.title}\n\n`; // Make title a heading
      }
      if (explanation.content) {
        const contentKeys = Object.keys(explanation.content);
        const isLikelyNumberedList = contentKeys.every(key => /^[0-9]+$/.test(key));
        const isLikelyLetteredList = contentKeys.every(key => /^[A-Z]$/.test(key));

        Object.entries(explanation.content).forEach(([key, value]: [string, any]) => {
          if (typeof value === 'string') {
            if (isLikelyNumberedList) {
              text += `${key}. ${value.trim()}\n`; // Format as numbered list
            } else if (isLikelyLetteredList) {
              text += `${key}. ${value.trim()}\n`; // Format as lettered list
            } else {
              text += `### ${key}\n${value.trim()}\n\n`; // Treat as subheading if no list pattern
            }
          } else if (typeof value === 'object' && value !== null) {
            text += `### ${key}\n`; // Treat key as a subheading
            // If nested object, treat keys as sub-subheadings or parts
            Object.entries(value).forEach(([subKey, subValue]: [string, any]) => {
              if (typeof subValue === 'string') {
                const isSubLikelyNumberedList = /^[0-9]+$/.test(subKey);
                const isSubLikelyLetteredList = /^[A-Z]$/.test(subKey);

                if (isSubLikelyNumberedList || isSubLikelyLetteredList) {
                  text += `  - ${subValue.trim()}\n`; // Nested list item
                } else {
                  text += `#### ${subKey}\n${subValue.trim()}\n\n`; // Sub-subheading
                }
              }
            });
          }
        });
      }
      return text;
    }
    return '';
  };

  // Function to check lesson content quality
  const checkLessonQuality = (lesson: GPTTopicResponse): boolean => {
    // First check if lesson is valid and successful
    if (!lesson || lesson.success === false) {
      console.log('Quality check failed: lesson is invalid or unsuccessful');
      return false;
    }
    
    // Check if explanation exists and is not empty
    if (!lesson.explanation || lesson.explanation.trim().length === 0) {
      console.log('Quality check failed: explanation is missing or empty');
      return false;
    }
    
    const explanationText = extractTextFromExplanation(lesson.explanation);
    if (!explanationText || explanationText.trim().length === 0) {
      console.log('Quality check failed: extracted text is empty');
      return false;
    }
    
    const characterCount = explanationText.length;
    console.log(`Quality check: lesson has ${characterCount} characters (minimum: 10000)`);
    
    return characterCount >= 10000;
  };

  const loadLessonContent = async (isRetry = false, attemptNumber = 1, isQualityRegeneration = false) => {
    const startTime = Date.now();
    const minimumLoadingTime = 2000; // 2 seconds (only for freshly generated lessons)
    const maxAutoRetries = 2; // Maximum automatic retries for transient failures
    const maxQualityRetries = 2; // Maximum quality enhancement attempts
    let isCachedResponse = false;
    
    setError(null);
    setRenderingError(null);

    try {
      const details = await agentService.getTopicDetails({
        topic: topic,
        context: context,
        user_level: 'intermediate',
        force_regenerate: isRetry || isQualityRegeneration
      });
      
      // Check if the response indicates a failure
      if (!details.success && attemptNumber <= maxAutoRetries && !isRetry && !isQualityRegeneration) {
        console.log(`Lesson generation attempt ${attemptNumber} failed, retrying automatically...`);
        // Wait a bit before retrying to handle transient issues
        await new Promise(resolve => setTimeout(resolve, 1000 * attemptNumber));
        return loadLessonContent(false, attemptNumber + 1, false);
      }
      
      // Quality check for non-cached lessons
      if (!details.cached && !isQualityRegeneration && qualityRegenerationCount < maxQualityRetries) {
        const isQualityGood = checkLessonQuality(details);
        
        if (!isQualityGood) {
          console.log(`Lesson quality below threshold (${qualityRegenerationCount + 1}/${maxQualityRetries}), enhancing...`);
          setQualityRegenerationCount(prev => prev + 1);
          setIsQualityEnhancing(true);
          
          // Update loading step to show quality enhancement
          setCurrentStep(3); // "Enhancing content quality"
          
          // Wait a moment to show the quality enhancement step
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          return loadLessonContent(false, 1, true);
        }
      }
      
      setLesson(details);
      isCachedResponse = details.cached;

      // Debug logging for lesson content issues
      console.log('Lesson loaded:', {
        success: details.success,
        hasExplanation: !!details.explanation,
        explanationType: typeof details.explanation,
        explanationLength: details.explanation?.length || 0,
        cached: details.cached,
        topic: topic
      });

      // Validate lesson content quality
      if (!details.explanation || details.explanation.trim().length === 0) {
        console.warn('Lesson loaded with empty or missing explanation:', details);
      }

      // If the lesson came from cache (already generated), stop loading immediately
      if (isCachedResponse && !isRetry && !isQualityRegeneration) {
        setLoading(false);
        setIsQualityEnhancing(false);
      }
      
      setRetryCount(0); // Reset retry count on success
      setIsQualityEnhancing(false);
      
      // Calculate estimated reading time (assuming 200 words per minute)
      const explanationText = extractTextFromExplanation(details.explanation);
      if (explanationText) {
        const wordCount = explanationText.split(' ').length;
        const readTime = Math.ceil(wordCount / 200);
        setEstimatedReadTime(readTime);
      }

      // Initialize chat with welcome message if not already done
      setChatMessages(prev => {
        if (prev.length === 0) {
          return [{
            id: 1,
            type: 'ai' as const,
            content: `Hi! I'm here to help you understand this lesson on **${topic}**. Ask me about any concepts, code examples, or practice tasks you'd like me to explain!`,
            timestamp: new Date()
          }];
        }
        return prev;
      });
    } catch (error: any) {
      console.error('Error loading lesson content:', error);
      
      // Auto-retry for transient failures (network issues, timeouts) on first attempt
      if (attemptNumber <= maxAutoRetries && !isRetry && !isQualityRegeneration) {
        console.log(`Network error on attempt ${attemptNumber}, retrying automatically...`);
        // Wait progressively longer between retries
        await new Promise(resolve => setTimeout(resolve, 1500 * attemptNumber));
        return loadLessonContent(false, attemptNumber + 1, false);
      }
      
      if (isRetry) {
        setRetryCount(prev => prev + 1);
      }
      
      setIsQualityEnhancing(false);
      
      // Different error messages based on error type
      if (error?.error?.includes('timeout')) {
        setError(`The lesson is taking longer than expected to generate. This usually means the AI is creating very detailed content. ${retryCount < 2 ? 'Please try again.' : 'You can try again later or continue with other lessons.'}`);
      } else if (error?.statusCode === 500) {
        setError('There was a server error while generating your lesson. Please try again in a few moments.');
      } else {
        setError('Failed to load lesson content. Please check your connection and try again.');
      }
    } finally {
      // If loading is already turned off (cached case) do nothing
      if (!isCachedResponse || isRetry || isQualityRegeneration) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
        setTimeout(() => {
          setLoading(false);
          setIsQualityEnhancing(false);
        }, remainingTime);
      }
    }
  };

  const handleRetryLoad = () => {
    setLoading(true);
    loadLessonContent();
  };

  const handleRegenerateLesson = async () => {
    setIsRegenerating(true);
    setRenderingError(null);
    setLesson(null); // Clear any error content from backend
    setLoading(true);
    await loadLessonContent(true, 1); // Reset attempt counter for manual regeneration
    setIsRegenerating(false);
  };

  const handleRenderingError = (error: Error) => {
    setRenderingError(error.message);
  };

  // Check if lesson response indicates an error (using response structure, not content text)
  const hasLessonError = (lesson: GPTTopicResponse | null): boolean => {
    return lesson !== null && !lesson.success;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Learn about ${topic}`,
          text: `Check out this detailed lesson on ${topic}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  // Chat handlers - optimized with useCallback
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isSendingMessage) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user' as const,
      content: chatInput.trim(),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsSendingMessage(true);
    
    try {
      // Extract lesson content summary (first 500 chars of explanation)
      const lessonSummary = lesson?.explanation 
        ? (typeof lesson.explanation === 'string' 
          ? lesson.explanation.substring(0, 500) 
          : JSON.stringify(lesson.explanation).substring(0, 500))
        : '';
      
      // Call the AI chat API
      const response = await agentService.lessonChat({
        message: userMessage.content,
        topic: topic,
        context: context,
        chat_history: chatMessages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp
        })),
        lesson_content: lessonSummary
      });
      
      if (response.success) {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai' as const,
          content: response.response,
          timestamp: new Date() // Use local time instead of server timestamp for consistency
        };
        setChatMessages(prev => [...prev, aiResponse]);
      } else {
        // Show error message
        const errorResponse = {
          id: Date.now() + 1,
          type: 'ai' as const,
          content: "I apologize, but I'm having trouble processing your request. Please try again in a moment.",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Show fallback error message
      const errorResponse = {
        id: Date.now() + 1,
        type: 'ai' as const,
        content: "I'm sorry, I couldn't connect to the AI service. Please check your connection and try again.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsSendingMessage(false);
    }
  }, [chatInput, isSendingMessage, lesson, topic, context, chatMessages]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Optimized chat input handler - immediate UI update, debounced expensive operations
  const handleChatInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Update state immediately for responsive UI
    setChatInput(e.target.value);
  }, []);

  // Memoize user message styles to prevent re-calculation
  const userMessageStyles = React.useMemo(() => ({
    color: 'inherit',
    '--tw-prose-body': 'inherit',
    '--tw-prose-headings': 'inherit',
    '--tw-prose-lead': 'inherit',
    '--tw-prose-links': 'inherit',
    '--tw-prose-bold': 'inherit',
    '--tw-prose-counters': 'inherit',
    '--tw-prose-bullets': 'inherit',
    '--tw-prose-hr': 'inherit',
    '--tw-prose-quotes': 'inherit',
    '--tw-prose-quote-borders': 'inherit',
    '--tw-prose-captions': 'inherit',
    '--tw-prose-code': 'inherit',
    '--tw-prose-pre-code': 'inherit',
    '--tw-prose-pre-bg': 'inherit',
    '--tw-prose-th-borders': 'inherit',
    '--tw-prose-td-borders': 'inherit'
  } as React.CSSProperties), []);

  // Debounced auto-scroll to prevent performance issues
  const debouncedScrollToBottom = React.useCallback(
    debounce(() => {
      if (chatMessagesEndRef) {
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          chatMessagesEndRef.scrollIntoView({ 
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        });
      }
    }, 100),
    [chatMessagesEndRef]
  );

  // Auto-scroll chat to bottom when new messages arrive - optimized
  useEffect(() => {
    debouncedScrollToBottom();
  }, [chatMessages.length, debouncedScrollToBottom]); // Only trigger on message count change

  // Create clean display title from context (extract just "Week N - Topic")
  const cleanDisplayTitle = context ? (() => {
    const match = context.match(/^(Week \d+)[:\s]*([^-]+)(?:\s*-\s*(.*))?/);
    if (match) {
      const weekPart = match[1]; // "Week N"
      const topicPart = match[2].trim(); // Topic name
      return `${weekPart} - ${topicPart}`;
    }
    return context; // fallback to original if parsing fails
  })() : null;



  const renderStructuredResources = (resources: any) => {
    if (!resources || !Array.isArray(resources)) return null;
    const colors = useSemanticColors(theme);

    return resources.map((resource: any, index: number) => {
      // Handle structured resources with title, link, and type
      if (typeof resource === 'object' && resource.title && resource.link) {
        const isYoutube = resource.link.includes('youtube.com') || resource.link.includes('youtu.be');
        const isGithub = resource.link.includes('github.com');
        const isDocs = resource.type === 'documentation' || resource.link.includes('developer.mozilla.org') || resource.link.includes('/docs');
        const isLeetCode = resource.type === 'leetcode' || resource.link.includes('leetcode.com');
        
        // Get appropriate icon and theme-adaptive colors
        let IconComponent = ExternalLink;
        let iconColor = 'text-theme-accent';
        
        if (isLeetCode) {
          IconComponent = Brain; // Using Brain icon for LeetCode problems
          iconColor = colors.success.text;
        } else if (isYoutube) {
          IconComponent = Youtube;
          iconColor = colors.youtube.text;
        } else if (isGithub) {
          IconComponent = FileText; // Using FileText as a GitHub substitute
          iconColor = 'text-theme-secondary';
        } else if (isDocs) {
          IconComponent = FileText;
          iconColor = colors.info.text;
        }
        
        return (
          <motion.a
            key={index}
            href={resource.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start space-x-3 p-4 rounded-lg bg-theme-hover border border-theme hover:border-theme-accent hover:bg-theme-accent/5 transition-all duration-200 cursor-pointer"
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ 
              scale: 1.02,
              y: -2,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex-shrink-0 mt-1">
              <IconComponent className={`w-5 h-5 ${iconColor} group-hover:scale-110 transition-transform duration-200`} />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="text-theme-accent hover:text-theme-accent-dark font-medium text-sm mb-1 group-hover:underline break-words overflow-hidden">
                <SafeMarkdownRenderer content={safeContentExtractor(resource.title)} />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-theme-secondary opacity-70 break-all">
                  {new URL(resource.link).hostname}
                </span>
                {resource.type && (
                  <>
                    <span className="text-theme-secondary opacity-50">•</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      resource.type === 'leetcode' ? `${colors.success.bg} ${colors.success.text} ${colors.success.border}` :
                      resource.type === 'documentation' ? `${colors.info.bg} ${colors.info.text} ${colors.info.border}` :
                      resource.type === 'tutorial' ? `${colors.success.bg} ${colors.success.text} ${colors.success.border}` :
                      resource.type === 'video' ? `${colors.youtube.bg} ${colors.youtube.text} ${colors.youtube.border}` :
                      'bg-theme-accent/10 text-theme-accent border-theme-accent/20'
                    }`}>
                      {resource.type === 'leetcode' ? 'LeetCode' : resource.type}
                    </span>
                    {resource.type === 'leetcode' && resource.difficulty && (
                      <>
                        <span className="text-theme-secondary opacity-50">•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                          resource.difficulty === 'Easy' ? `${colors.success.bg} ${colors.success.text} ${colors.success.border}` :
                          resource.difficulty === 'Medium' ? `${colors.warning.bg} ${colors.warning.text} ${colors.warning.border}` :
                          resource.difficulty === 'Hard' ? `${colors.error.bg} ${colors.error.text} ${colors.error.border}` :
                          'bg-theme-accent/10 text-theme-accent border-theme-accent/20'
                        }`}>
                          {resource.difficulty}
                    </span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ExternalLink className="w-4 h-4 text-theme-secondary" />
            </div>
          </motion.a>
        );
      }
      
      // Handle simple string resources (fallback) - let MarkdownRenderer handle all parsing
      if (typeof resource === 'string') {
        return (
          <motion.div 
            key={index} 
            className="flex items-start space-x-3 p-4 rounded-lg bg-theme-hover border border-theme hover:border-theme-accent hover:bg-theme-accent/5 transition-all duration-200"
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ 
              scale: 1.02,
              y: -2,
              transition: { duration: 0.2 }
            }}
          >
            <div className="flex-shrink-0 mt-1">
              <FileText className="w-5 h-5 text-theme-secondary" />
            </div>
            <div className="text-sm text-theme-secondary leading-relaxed break-words overflow-hidden">
              <SafeMarkdownRenderer content={safeContentExtractor(resource)} />
            </div>
          </motion.div>
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  const renderStructuredSubtasks = (subtasks: any) => {
    if (!subtasks) return null;

    // Handle both array and object formats
    let tasksArray: any[] = [];
    
    if (Array.isArray(subtasks)) {
      tasksArray = subtasks.map((task, index) => {
        if (typeof task === 'string') {
          return { description: task, level: 'General', hint: null, index };
        } else if (typeof task === 'object' && task !== null) {
          return {
            description: task.task || task.description || (typeof task === 'string' ? task : JSON.stringify(task)),
            level: task.level || 'General',
            hint: task.hint || null,
            index
          };
        }
        return { description: String(task), level: 'General', hint: null, index };
      });
    } else if (typeof subtasks === 'object') {
      tasksArray = Object.entries(subtasks).map(([key, value]: [string, any], index) => {
        if (typeof value === 'string') {
          return { description: value, level: 'General', hint: null, index };
        } else if (typeof value === 'object' && value !== null) {
          return {
            description: value.task || value.description || (typeof value === 'string' ? value : String(value)),
            level: value.level || 'General',
            hint: value.hint || null,
            index
          };
        }
        return { description: String(value), level: 'General', hint: null, index };
      });
    }

    if (tasksArray.length === 0) return null;

    const handleRevealHint = (hintIndex: number) => {
      setRevealedHints(prev => new Set(prev).add(hintIndex));
    };

    return tasksArray.map((task: any, index: number) => {
      const colors = useSemanticColors(theme);
      const levelColors = {
        'Beginner': `${colors.success.bg} ${colors.success.text} ${colors.success.border}`,
        'Intermediate': `${colors.warning.bg} ${colors.warning.text} ${colors.warning.border}`,
        'Advanced': `${colors.error.bg} ${colors.error.text} ${colors.error.border}`,
        'General': 'bg-theme-accent/20 text-theme-accent border-theme-accent/30'
      };

      const levelColor = levelColors[task.level as keyof typeof levelColors] || levelColors.General;
      const isHintRevealed = revealedHints.has(index);

      return (
        <motion.div
          key={index}
          className="flex items-start space-x-3 p-4 rounded-lg bg-theme-hover border border-theme hover:border-theme-accent/30 transition-all duration-200"
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 }
          }}
          whileHover={{ 
            scale: 1.02,
            y: -2,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-6 h-6 bg-theme-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-medium text-theme-accent">{index + 1}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full border ${levelColor}`}>
                {task.level}
              </span>
            </div>
            <div className="text-sm text-theme-secondary leading-relaxed mb-2 break-words overflow-hidden">
              <SafeMarkdownRenderer content={safeContentExtractor(task.description)} />
            </div>
            {task.hint && (
              <div className={`text-xs text-theme-secondary/70 ${colors.info.bg} border ${colors.info.border} rounded-md p-2 mt-2`}>
                <span className="text-theme-accent font-medium">💡 Hint: </span>
                {isHintRevealed ? (
                  <div className="transition-all duration-300 text-theme-secondary break-words overflow-hidden">
                    <SafeMarkdownRenderer content={safeContentExtractor(task.hint)} />
                  </div>
                ) : (
                  <span 
                    onClick={() => handleRevealHint(index)}
                    className="cursor-pointer select-none transition-all duration-300 hover:opacity-80 text-theme-primary"
                    style={{ 
                      filter: 'blur(4px)',
                      WebkitFilter: 'blur(4px)'
                    }}
                    title="Click to reveal hint"
                  >
                    {task.hint}
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      );
    });
  };

  const parseResourcesWithLinks = (text: string) => {
    // Split by lines and process each resource
    return text.split('\n').map((line, index) => {
      if (line.trim()) {
        return (
          <motion.div 
            key={index} 
            className="flex items-start space-x-3 p-3 rounded-lg bg-theme-hover border border-theme hover:border-theme-accent transition-all duration-200"
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ 
              scale: 1.02,
              y: -2,
              transition: { duration: 0.2 }
            }}
          >
            <div className="flex-shrink-0 mt-1">
              {line.includes('youtube.com') || line.includes('youtu.be') ? (
                <Youtube className={`w-5 h-5 ${useSemanticColors(theme).youtube.text}`} />
              ) : line.includes('http') ? (
                <ExternalLink className="w-5 h-5 text-theme-accent" />
              ) : (
                <FileText className="w-5 h-5 text-theme-secondary" />
              )}
            </div>
            <div className="text-sm text-theme-secondary leading-relaxed break-words overflow-hidden">
              <SafeMarkdownRenderer content={safeContentExtractor(line)} />
            </div>
          </motion.div>
        );
      }
      return null;
    }).filter(Boolean);
  };

  if (loading || isLoadingTopic) {
    const loadingSteps = [
      "Breaking down core concepts",
      "Creating code demonstrations", 
      "Designing real-world practice tasks",
      "Enhancing content quality"
    ];

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-theme-primary transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-12 transition-colors duration-300">
            <div className="text-center">
              {/* Animated Jumping Play Icon (same as roadmap) */}
              <div className="mb-8">
                <motion.div
                  className="mx-auto w-20 h-20 flex items-center justify-center"
                  animate={{ 
                    y: [0, -10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Brain className="h-16 w-16 text-theme-accent" />
                </motion.div>
              </div>
              
              <h2 className="text-2xl font-semibold text-theme-primary mb-4 transition-colors duration-300">
                {isQualityEnhancing ? 'Enhancing lesson quality...' : 'Expert AI is crafting your lesson...'}
              </h2>
              <p className="text-theme-secondary max-w-2xl mx-auto mb-8 transition-colors duration-300">
                {isQualityEnhancing 
                  ? <>Ensuring comprehensive coverage and depth for <strong>{topic}</strong> with detailed explanations and examples.</>
                  : <>Creating an in-depth learning guide on <strong>{topic}</strong> with real code examples, practical demonstrations and tasks.</>
                }
              </p>
              
              {/* Progress Steps - matching roadmap style exactly */}
              <div className="max-w-md mx-auto h-20 flex items-center justify-center mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ 
                      duration: 0.6,
                      ease: "easeInOut"
                    }}
                    className="flex items-center justify-center space-x-3 p-4 rounded-xl bg-theme-hover/50 w-full"
                  >
                    {/* Animated dot */}
                    <motion.div
                      className="w-3 h-3 rounded-full bg-theme-accent"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Step text */}
                    <span className="text-sm font-medium text-theme-primary">
                      {loadingSteps[currentStep]}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Simple Info Message */}
              <div className={`p-4 ${useSemanticColors(theme).info.bg} border ${useSemanticColors(theme).info.border} rounded-lg max-w-md mx-auto`}>
                <p className={`text-xs ${useSemanticColors(theme).info.text}`}>
                  ⏱️ <strong>This may take a moment.</strong>
                </p>
              </div>
              
              {/* Timeout Warning (after 20 seconds) */}
              {showTimeoutWarning && (
                <div className={`mt-4 p-4 ${useSemanticColors(theme).warning.bg} border ${useSemanticColors(theme).warning.border} rounded-lg max-w-md mx-auto`}>
                  <p className={`text-xs ${useSemanticColors(theme).warning.text}`}>
                    ⚠️ This is taking longer than usual. The AI might be generating very detailed content. 
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-theme-primary transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-8 transition-colors duration-300">
            <div className="text-center">
              <AlertCircle className={`h-16 w-16 ${useSemanticColors(theme).error.text} mx-auto mb-6`} />
              <h2 className="text-2xl font-semibold text-theme-primary mb-4">Failed to Load Lesson</h2>
              <p className="text-theme-secondary mb-6 max-w-2xl mx-auto">{error}</p>
              
              <div className="flex items-center justify-center space-x-4">
                {retryCount < 3 && (
                  <button
                    onClick={() => loadLessonContent(true)}
                    className="px-6 py-3 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-all duration-300 flex items-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Again ({3 - retryCount} attempts left)</span>
                  </button>
                )}
                
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 bg-theme-hover text-theme-primary rounded-lg hover:bg-theme-accent hover:text-white transition-all duration-300"
                >
                  Go Back
                </button>
              </div>
              
              {retryCount >= 3 && (
                <div className={`mt-6 p-4 ${useSemanticColors(theme).warning.bg} border ${useSemanticColors(theme).warning.border} rounded-lg max-w-md mx-auto`}>
                  <p className={`text-sm ${useSemanticColors(theme).warning.text}`}>
                    💡 <strong>Tip:</strong> The AI is creating in-depth learning guides with real code examples. 
                    Try again later, or explore other topics for now.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-theme-primary transition-colors duration-300 w-screen overflow-x-hidden">
      {/* Reading Progress Bar removed */}

      {/* Header */}
      <motion.div 
        className="bg-theme-secondary shadow-sm border-b border-theme transition-colors duration-300"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            className="flex items-center gap-4 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary transition-colors duration-300"
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              {weekNumber ? `Back to Week ${weekNumber}` : 'Back'}
            </motion.button>
            
            <div className="flex-1" />
            
            <motion.button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-hover rounded-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </motion.button>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <BookOpen className="w-8 h-8 text-theme-accent" />
            <div>
              <h1 className="text-3xl font-bold text-theme-primary transition-colors duration-300">
                {topic}
              </h1>
              {cleanDisplayTitle && (
                <p className="text-theme-secondary mt-2 transition-colors duration-300">
                  {cleanDisplayTitle}
                </p>
              )}
            </div>
          </motion.div>
          </div>
      </motion.div>

      {/* Content */}
      <motion.div 
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className={`grid gap-8 overflow-hidden ${isChatExpanded ? 'lg:grid-cols-2' : 'lg:grid-cols-4'}`}>
          
          {/* Main Content */}
          <motion.div 
            className={`space-y-8 overflow-hidden ${isChatExpanded ? '' : 'lg:col-span-3'}`}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.4
                }
              }
            }}
          >
            
            {/* Lesson Content */}
            <motion.div 
              className="bg-theme-secondary rounded-lg shadow-sm border border-theme transition-colors duration-300"
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Brain className="w-6 h-6 text-theme-accent" />
                  <h2 className="text-xl font-semibold text-theme-primary transition-colors duration-300">
                    In-Depth Learning Guide
                  </h2>
                </div>
                
                {lesson?.success && (
                  <div className="flex items-center space-x-2 mb-6">
                    <CheckCircle className={`w-4 h-4 ${useSemanticColors(theme).success.text}`} />
                    <span className={`text-sm ${useSemanticColors(theme).success.text}`}>
                      {lesson.cached ? 'Retrieved from your learning library' : 'Fresh learning guide generated'}
                    </span>
                  </div>
                )}
                
                {!loading && !isLoadingTopic && (renderingError || hasLessonError(lesson)) ? (
                  <div className="text-center py-12">
                                          <div className="relative mb-8">
                        <AlertTriangle className={`h-16 w-16 ${useSemanticColors(theme).warning.text} mx-auto`} />
                        <div className={`absolute inset-0 ${useSemanticColors(theme).warning.bg} rounded-full animate-pulse opacity-40`}></div>
                      </div>
                    <h3 className="text-2xl font-semibold text-theme-primary mb-4">
                      Oops!
                    </h3>
                    <p className="text-theme-secondary max-w-2xl mx-auto mb-6 leading-relaxed">
                      We sincerely apologize, please try again!
                    </p>
                    
                    <div className="flex items-center justify-center space-x-4">
                      {isRegenerating ? (
                        <div className="flex items-center space-x-3 px-6 py-3 bg-theme-accent text-white rounded-lg">
                          <Brain className="w-5 h-5 animate-pulse" />
                          <span>Regenerating lesson...</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleRegenerateLesson}
                          className="px-6 py-3 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-all duration-300 flex items-center space-x-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Regenerate Lesson</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-theme-hover text-theme-primary rounded-lg hover:bg-theme-accent hover:text-white transition-all duration-300"
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="lesson-content max-w-none overflow-x-hidden">
                    <div className="w-full">
                      {lesson?.explanation && lesson.success !== false ? (
                        <SafeMarkdownRenderer content={safeContentExtractor(filterLessonContent(extractTextFromExplanation(lesson.explanation)))} onRenderingError={handleRenderingError} />
                      ) : lesson && lesson.success === false ? (
                        <div className="text-theme-secondary">
                          <p className="mb-4">Unable to generate lesson content at this time.</p>
                          <p className="text-sm opacity-75">This might be due to high server load or a temporary issue.</p>
                          <button
                            onClick={handleRegenerateLesson}
                            disabled={isRegenerating}
                            className="mt-4 px-4 py-2 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-all duration-300 flex items-center space-x-2"
                          >
                            <RotateCcw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                            <span>{isRegenerating ? 'Retrying...' : 'Retry'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-theme-secondary">
                          <p className="mb-4">No learning guide content available.</p>
                          <p className="text-sm opacity-75 mb-4">This might happen due to network issues or server problems.</p>
                          <button
                            onClick={handleRegenerateLesson}
                            disabled={isRegenerating}
                            className="px-4 py-2 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-all duration-300 flex items-center space-x-2"
                          >
                            <RotateCcw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                            <span>{isRegenerating ? 'Retrying...' : 'Retry'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Subtasks */}
            {lesson?.subtasks && (
              <motion.div 
                className="bg-theme-secondary rounded-lg shadow-sm border border-theme transition-colors duration-300"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Target className="w-6 h-6 text-theme-accent" />
                    <h2 className="text-xl font-semibold text-theme-primary transition-colors duration-300">
                      Progressive Practice Tasks
                    </h2>
                  </div>
                  
                  <motion.div 
                    className="space-y-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1,
                          delayChildren: 0.2
                        }
                      }
                    }}
                  >
                    {renderStructuredSubtasks(lesson.subtasks)}
                  </motion.div>
                  </div>
              </motion.div>
            )}

            {/* Resources */}
            {lesson?.resources && (
              <motion.div 
                className="bg-theme-secondary rounded-lg shadow-sm border border-theme transition-colors duration-300"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <ExternalLink className={`w-6 h-6 ${useSemanticColors(theme).info.text}`} />
                    <h2 className="text-xl font-semibold text-theme-primary transition-colors duration-300">
                      Curated Learning Resources
                    </h2>
                  </div>
                  
                  <motion.div 
                    className="space-y-3"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.08,
                          delayChildren: 0.1
                        }
                      }
                    }}
                  >
                    {renderStructuredResources(lesson.resources)}
                  </motion.div>
                  </div>
              </motion.div>
            )}

            {/* YouTube Videos */}
            {lesson?.youtube_videos && lesson.youtube_videos.length > 0 && (
              <motion.div 
                className="bg-theme-secondary rounded-lg shadow-sm border border-theme transition-colors duration-300"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Youtube className={`w-6 h-6 ${useSemanticColors(theme).youtube.text}`} />
                    <h2 className="text-xl font-semibold text-theme-primary transition-colors duration-300">
                      Useful Video Tutorials
                    </h2>
                  </div>
                  
                  <motion.div 
                    className="space-y-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.12,
                          delayChildren: 0.1
                        }
                      }
                    }}
                  >
                    {lesson.youtube_videos.map((video, index) => (
                      <motion.a
                        key={index}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex items-start space-x-4 p-4 rounded-lg bg-theme-hover border border-theme hover:${useSemanticColors(theme).youtube.border} hover:${useSemanticColors(theme).youtube.bg} transition-all duration-200 cursor-pointer`}
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          visible: { opacity: 1, x: 0 }
                        }}
                        whileHover={{ 
                          scale: 1.02,
                          x: 5,
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          {video.thumbnail ? (
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="w-24 h-18 object-cover rounded-lg border border-theme"
                            />
                          ) : (
                            <div className={`w-24 h-18 ${useSemanticColors(theme).youtube.bg} rounded-lg border ${useSemanticColors(theme).youtube.border} flex items-center justify-center`}>
                              <Youtube className={`w-8 h-8 ${useSemanticColors(theme).youtube.text}`} />
                            </div>
                          )}
                        </div>
                        
                        {/* Video Info */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-theme-primary font-medium text-sm mb-2 group-hover:${useSemanticColors(theme).youtube.text} transition-colors line-clamp-2`}>
                            {video.title}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-theme-secondary mb-2">
                            <span className="flex items-center gap-1">
                              <Youtube className="w-3 h-3" />
                              {video.channel}
                            </span>
                            {video.duration && (
                              <span className="bg-theme-primary/80 text-theme-secondary px-2 py-1 rounded">
                                {video.duration}
                              </span>
                            )}
                            {video.view_count > 0 && (
                              <span>
                                {video.view_count > 1000000 
                                  ? `${(video.view_count / 1000000).toFixed(1)}M views`
                                  : video.view_count > 1000 
                                  ? `${(video.view_count / 1000).toFixed(0)}K views`
                                  : `${video.view_count} views`}
                              </span>
                            )}
                          </div>
                          
                          {video.description && (
                            <p className="text-xs text-theme-secondary opacity-80 line-clamp-2 transition-colors duration-300">
                              {video.description}
                            </p>
                          )}
                        </div>
                        
                        {/* External Link Icon */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <ExternalLink className="w-4 h-4 text-theme-secondary" />
                        </div>
                      </motion.a>
                    ))}
                  </motion.div>
                  </div>
              </motion.div>
            )}
          </motion.div>

          {/* Sidebar - Sticky positioned */}
          <motion.div 
            className="space-y-6 overflow-hidden"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.8
                }
              }
            }}
          >
            {/* AI Chat Assistant - Main Element */}
            <motion.div 
              className="bg-theme-secondary rounded-lg shadow-sm border border-theme transition-colors duration-300 h-fit"
              variants={{
                hidden: { opacity: 0, x: 30 },
                visible: { opacity: 1, x: 0 }
              }}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between p-5 border-b border-theme">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bot className="w-6 h-6 text-theme-accent" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-theme-primary transition-colors duration-300">AI Assistant</h3>
                    <p className="text-xs text-theme-secondary">Ready to help with this lesson</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setIsChatExpanded(!isChatExpanded)}
                  className="text-theme-secondary hover:text-theme-primary transition-colors duration-300 p-1 rounded-md hover:bg-theme-hover"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isChatExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </motion.button>
              </div>

              <AnimatePresence>
                {isChatExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {/* Messages Area - Expanded */}
                    <div className="h-[600px] overflow-y-auto p-5 space-y-4 bg-theme-hover/20 chat-messages">
                      {chatMessages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-start gap-3 max-w-[90%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.type === 'ai' 
                                ? 'bg-theme-accent text-white shadow-lg' 
                                : 'bg-theme-primary text-theme-secondary border-2 border-theme'
                            }`}>
                              {message.type === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>
                            <div 
                            className={`rounded-xl px-4 py-3 shadow-sm ${
                              message.type === 'user'
                                ? 'bg-theme-accent rounded-br-md'
                                : 'bg-theme-secondary border border-theme text-theme-primary rounded-bl-md'
                            }`}
                            style={message.type === 'user' ? userMessageStyles : {}}>
                              <div className={`prose prose-sm max-w-none ${message.type === 'user' ? 'user-message-content' : ''}`}>
                                <MarkdownRenderer content={message.content} />
                              </div>
                              <div className={`text-xs mt-2 ${
                                message.type === 'user' ? '' : 'opacity-70 text-theme-secondary'
                              }`}
                              style={message.type === 'user' ? { color: 'inherit' } : {}}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      
                      {/* Typing indicator */}
                      {isSendingMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-theme-accent text-white flex items-center justify-center shadow-lg">
                              <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-theme-secondary border border-theme text-theme-primary rounded-xl rounded-bl-md px-4 py-3">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-theme-accent rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-theme-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-theme-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Auto-scroll target */}
                      <div ref={setChatMessagesEndRef} />
                    </div>

                    {/* Input Area - Enhanced */}
                    <div className="p-5 border-t border-theme bg-theme-hover/10">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <TextAreaWithCounter
                            value={chatInput}
                            onChange={handleChatInputChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask me anything about this lesson, concepts, or practice tasks..."
                            maxLength={300}
                            rows={2}
                            disabled={isSendingMessage}
                          />
                        </div>
                        <motion.button
                          onClick={handleSendMessage}
                          disabled={!chatInput.trim() || isSendingMessage}
                          className="px-4 py-3 bg-theme-accent text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg self-end"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Send className="w-5 h-5" />
                        </motion.button>
                      </div>
                      <div className="text-xs text-theme-secondary mt-3 opacity-70 flex items-center gap-2">
                        <span>💡</span>
                        <span>Press Enter to send, Shift+Enter for new line</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Navigation */}
            <motion.div 
              className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-5 transition-colors duration-300"
              variants={{
                hidden: { opacity: 0, x: 30 },
                visible: { opacity: 1, x: 0 }
              }}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-semibold text-theme-primary mb-4 transition-colors duration-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-theme-accent" />
                Navigation
              </h3>
              <div className="space-y-2">
                {weekNumber ? (
                  <>
                    <motion.button
                      onClick={() => navigate(`/roadmap/week/${weekNumber}`)}
                      className="w-full text-left px-3 py-2 text-sm text-theme-accent hover:bg-theme-accent/10 rounded-md transition-colors duration-300 font-medium"
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      📚 Week {weekNumber} Overview
                    </motion.button>
                    <motion.button
                      onClick={() => navigate('/my-roadmap')}
                      className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:bg-theme-hover rounded-md transition-colors duration-300"
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🗺️ Full Roadmap
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      onClick={() => navigate(-1)}
                      className="w-full text-left px-3 py-2 text-sm text-theme-accent hover:bg-theme-accent/10 rounded-md transition-colors duration-300 font-medium"
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      📚 Back to Topic
                    </motion.button>
                    <motion.button
                      onClick={() => navigate('/my-topics')}
                      className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:bg-theme-hover rounded-md transition-colors duration-300"
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🗂️ All Topics
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
          </div>
      </motion.div>
    </div>
  );
};

export default LessonPage;