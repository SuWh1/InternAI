import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  ExternalLink, 
  Loader, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Brain,
  Lightbulb,
  Target,
  Youtube,
  FileText,
  RotateCcw,
  Share2,
  AlertTriangle
} from 'lucide-react';
import agentService from '../services/agentService';
import lessonSlugService from '../services/lessonSlugService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import MarkdownRenderer from '../components/common/MarkdownRenderer';
import { useTheme } from '../contexts/ThemeContext';
import type { GPTTopicResponse } from '../types/roadmap';

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

const SafeMarkdownRenderer: React.FC<SafeMarkdownRendererProps> = ({ content, onRenderingError }) => {
  const { theme } = useTheme();
  const colors = useSemanticColors(theme);
  
  try {
    return <MarkdownRenderer content={content} />;
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
  
  const [lesson, setLesson] = useState<GPTTopicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderingError, setRenderingError] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [estimatedReadTime, setEstimatedReadTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Handle both new slug format and legacy URL format
  let topic = '';
  let context = '';
  let weekNumber = '';

  if (params.slug) {
    // New slug-based URL
    const lessonData = lessonSlugService.getLessonData(params.slug);
    if (lessonData) {
      topic = lessonData.topic;
      context = lessonData.context;
      weekNumber = lessonData.weekNumber.toString();
    }
  } else if (params.topic && params.context) {
    // Legacy URL format - decode and use directly
    topic = decodeURIComponent(params.topic);
    context = decodeURIComponent(params.context);
    weekNumber = params.weekNumber || '';
    
    // Create a slug for this lesson and redirect to clean URL
    const weekNum = parseInt(weekNumber || '1');
    const newUrl = lessonSlugService.createLessonUrl(topic, context, weekNum);
    
    // Replace the current URL with the clean one
    setTimeout(() => {
      navigate(newUrl, { replace: true });
    }, 100);
  }

  useEffect(() => {
    if (topic) {
      loadLessonContent();
    } else if (params.slug) {
      setError('Lesson not found. The lesson may have been moved or deleted.');
      setLoading(false);
    }
  }, [topic, context]);

  // Show timeout warning after 20 seconds of loading
  useEffect(() => {
    let timeoutWarning: number;
    
    if (loading) {
      timeoutWarning = setTimeout(() => {
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
      // Handle structured explanation object
      let text = '';
      if (explanation.title) text += explanation.title + '\n\n';
      if (explanation.content) {
        Object.values(explanation.content).forEach((value: any) => {
          if (typeof value === 'string') {
            text += value + ' ';
          } else if (typeof value === 'object' && value !== null) {
            Object.values(value).forEach((subValue: any) => {
              if (typeof subValue === 'string') text += subValue + ' ';
            });
          }
        });
      }
      return text;
    }
    return '';
  };

  const loadLessonContent = async (isRetry = false) => {
    setLoading(true);
    setError(null);
    setRenderingError(null);

    try {
      const details = await agentService.getTopicDetails({
        topic: topic,
        context: context,
        user_level: 'intermediate',
        force_regenerate: isRetry
      });
      
      setLesson(details);
      setRetryCount(0); // Reset retry count on success
      
      // Calculate estimated reading time (assuming 200 words per minute)
      const explanationText = extractTextFromExplanation(details.explanation);
      if (explanationText) {
        const wordCount = explanationText.split(' ').length;
        const readTime = Math.ceil(wordCount / 200);
        setEstimatedReadTime(readTime);
      }
    } catch (error: any) {
      console.error('Error loading lesson content:', error);
      
      if (isRetry) {
        setRetryCount(prev => prev + 1);
      }
      
      // Different error messages based on error type
      if (error?.error?.includes('timeout')) {
        setError(`The lesson is taking longer than expected to generate. This usually means the AI is creating very detailed content. ${retryCount < 2 ? 'Please try again.' : 'You can try again later or continue with other lessons.'}`);
      } else if (error?.statusCode === 500) {
        setError('There was a server error while generating your lesson. Please try again in a few moments.');
      } else {
        setError('Failed to load lesson content. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetryLoad = () => {
    loadLessonContent();
  };

  const handleRegenerateLesson = async () => {
    setIsRegenerating(true);
    setRenderingError(null);
    setLesson(null); // Clear any error content from backend
    await loadLessonContent(true);
    setIsRegenerating(false);
  };

  const handleRenderingError = (error: Error) => {
    setRenderingError(error.message);
  };

  // Check if lesson content contains error messages
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
        
        // Get appropriate icon and theme-adaptive colors
        let IconComponent = ExternalLink;
        let iconColor = 'text-theme-accent';
        
        if (isYoutube) {
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
          <a
            key={index}
            href={resource.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start space-x-3 p-4 rounded-lg bg-theme-hover border border-theme hover:border-theme-accent hover:bg-theme-accent/5 transition-all duration-200 cursor-pointer"
          >
            <div className="flex-shrink-0 mt-1">
              <IconComponent className={`w-5 h-5 ${iconColor} group-hover:scale-110 transition-transform duration-200`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-theme-accent hover:text-theme-accent-dark font-medium text-sm mb-1 group-hover:underline">
                <SafeMarkdownRenderer content={resource.title || ''} />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-theme-secondary opacity-70">
                  {new URL(resource.link).hostname}
                </span>
                {resource.type && (
                  <>
                    <span className="text-theme-secondary opacity-50">•</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      resource.type === 'documentation' ? `${colors.info.bg} ${colors.info.text} ${colors.info.border}` :
                      resource.type === 'tutorial' ? `${colors.success.bg} ${colors.success.text} ${colors.success.border}` :
                      resource.type === 'video' ? `${colors.youtube.bg} ${colors.youtube.text} ${colors.youtube.border}` :
                      'bg-theme-accent/10 text-theme-accent border-theme-accent/20'
                    }`}>
                      {resource.type}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ExternalLink className="w-4 h-4 text-theme-secondary" />
            </div>
          </a>
        );
      }
      
      // Handle simple string resources (fallback) - let MarkdownRenderer handle all parsing
      if (typeof resource === 'string') {
        return (
          <div 
            key={index} 
            className="flex items-start space-x-3 p-4 rounded-lg bg-theme-hover border border-theme hover:border-theme-accent hover:bg-theme-accent/5 transition-all duration-200"
          >
            <div className="flex-shrink-0 mt-1">
              <FileText className="w-5 h-5 text-theme-secondary" />
            </div>
            <div className="text-sm text-theme-secondary leading-relaxed">
              <SafeMarkdownRenderer content={resource || ''} />
            </div>
          </div>
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
        <div
          key={index}
          className="flex items-start space-x-3 p-4 rounded-lg bg-theme-hover border border-theme hover:border-theme-accent/30 transition-all duration-200"
        >
          <div className="w-6 h-6 bg-theme-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-medium text-theme-accent">{index + 1}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full border ${levelColor}`}>
                {task.level}
              </span>
            </div>
            <div className="text-sm text-theme-secondary leading-relaxed mb-2">
              <SafeMarkdownRenderer content={task.description || ''} />
            </div>
            {task.hint && (
              <div className={`text-xs text-theme-secondary/70 ${colors.info.bg} border ${colors.info.border} rounded-md p-2 mt-2`}>
                <span className="text-theme-accent font-medium">💡 Hint: </span>
                {isHintRevealed ? (
                  <div className="transition-all duration-300 text-theme-secondary">
                    <SafeMarkdownRenderer content={task.hint || ''} />
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
        </div>
      );
    });
  };

  const parseResourcesWithLinks = (text: string) => {
    // Split by lines and process each resource
    return text.split('\n').map((line, index) => {
      if (line.trim()) {
        return (
          <div 
            key={index} 
            className="flex items-start space-x-3 p-3 rounded-lg bg-theme-hover border border-theme hover:border-theme-accent transition-all duration-200"
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
            <div className="text-sm text-theme-secondary leading-relaxed">
              <SafeMarkdownRenderer content={line} />
            </div>
          </div>
        );
      }
      return null;
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-theme-primary transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-12 transition-colors duration-300">
            <div className="text-center">
              <div className="relative mb-8">
                <Brain className="h-16 w-16 text-theme-accent mx-auto animate-pulse" />
                <div className="absolute inset-0 bg-theme-accent/10 rounded-full animate-ping opacity-20"></div>
              </div>
              <h2 className="text-2xl font-semibold text-theme-primary mb-4 transition-colors duration-300">
                Expert AI is crafting your lesson...
              </h2>
              <p className="text-theme-secondary max-w-2xl mx-auto mb-8 transition-colors duration-300">
                Creating an in-depth learning guide on <strong>{topic}</strong> 
                with real code examples, practical demonstrations, and 3 progressive practice tasks.
              </p>
              
              {/* Enhanced Loading Steps */}
              <div className="max-w-md mx-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3 p-3 bg-theme-hover rounded-lg">
                    <div className="w-2 h-2 bg-theme-accent rounded-full animate-pulse"></div>
                    <span className="text-sm text-theme-secondary transition-colors duration-300">Breaking down core concepts</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3 p-3 bg-theme-hover rounded-lg">
                    <div className="w-2 h-2 bg-theme-accent rounded-full animate-pulse delay-150"></div>
                    <span className="text-sm text-theme-secondary transition-colors duration-300">Creating code demonstrations</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3 p-3 bg-theme-hover rounded-lg">
                    <div className="w-2 h-2 bg-theme-accent rounded-full animate-pulse delay-300"></div>
                    <span className="text-sm text-theme-secondary transition-colors duration-300">Designing real-world practice tasks</span>
                  </div>
                </div>
                
                <div className={`mt-8 p-4 ${useSemanticColors(theme).info.bg} border ${useSemanticColors(theme).info.border} rounded-lg`}>
                  <p className={`text-xs ${useSemanticColors(theme).info.text}`}>
                    ⏱️ <strong>This may take 30-60 seconds</strong> as we're creating an in-depth learning guide 
                    with practical code demonstrations and real-world applications to prepare you for professional coding.
                  </p>
                </div>
                
                {showTimeoutWarning && (
                  <div className={`mt-4 p-4 ${useSemanticColors(theme).warning.bg} border ${useSemanticColors(theme).warning.border} rounded-lg`}>
                    <p className={`text-xs ${useSemanticColors(theme).warning.text}`}>
                      ⚠️ This is taking longer than usual. The AI might be generating very detailed content. 
                      You can wait a bit more or try refreshing if needed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-16 bg-theme-primary transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
    <div className="min-h-screen pt-16 bg-theme-primary transition-colors duration-300">
      {/* Reading Progress Bar */}
      <div className="fixed top-16 left-0 right-0 z-30 h-1 bg-theme-hover">
        <div 
          className="h-full bg-theme-accent transition-all duration-300 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Header */}
      <div className="bg-theme-secondary shadow-sm border-b border-theme transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              {weekNumber ? `Back to Week ${weekNumber}` : 'Back'}
            </button>
            
            <div className="flex-1" />
            
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-hover rounded-lg transition-all duration-300"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-4">
          
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Lesson Content */}
            <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme transition-colors duration-300 animate-slide-up">
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
                
                {renderingError || (lesson?.explanation && isErrorContent(typeof lesson.explanation === 'string' ? lesson.explanation : JSON.stringify(lesson.explanation))) ? (
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
                      {lesson?.explanation ? (
                        <SafeMarkdownRenderer content={typeof lesson.explanation === 'string' ? lesson.explanation : JSON.stringify(lesson.explanation)} onRenderingError={handleRenderingError} />
                      ) : (
                        <div className="text-theme-secondary">
                          No learning guide content available. Please try refreshing the lesson.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subtasks */}
            {lesson?.subtasks && (
              <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme transition-colors duration-300 animate-slide-up" style={{animationDelay: '0.1s'}}>
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Target className="w-6 h-6 text-theme-accent" />
                    <h2 className="text-xl font-semibold text-theme-primary transition-colors duration-300">
                      Progressive Practice Tasks
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {renderStructuredSubtasks(lesson.subtasks)}
                  </div>
                </div>
              </div>
            )}

            {/* Resources */}
            {lesson?.resources && (
              <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme transition-colors duration-300 animate-slide-up" style={{animationDelay: '0.2s'}}>
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <ExternalLink className={`w-6 h-6 ${useSemanticColors(theme).info.text}`} />
                    <h2 className="text-xl font-semibold text-theme-primary transition-colors duration-300">
                      Curated Learning Resources
                    </h2>
                  </div>
                  
                  <div className="space-y-3">
                    {renderStructuredResources(lesson.resources)}
                  </div>
                </div>
              </div>
            )}

            {/* YouTube Videos */}
            {lesson?.youtube_videos && lesson.youtube_videos.length > 0 && (
              <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme transition-colors duration-300 animate-slide-up" style={{animationDelay: '0.25s'}}>
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Youtube className={`w-6 h-6 ${useSemanticColors(theme).youtube.text}`} />
                    <h2 className="text-xl font-semibold text-theme-primary transition-colors duration-300">
                      Useful Video Tutorials
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {lesson.youtube_videos.map((video, index) => (
                      <a
                        key={index}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex items-start space-x-4 p-4 rounded-lg bg-theme-hover border border-theme hover:${useSemanticColors(theme).youtube.border} hover:${useSemanticColors(theme).youtube.bg} transition-all duration-200 cursor-pointer`}
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
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            


            {/* Quick Tips */}
            <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-6 transition-colors duration-300 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className={`w-5 h-5 ${useSemanticColors(theme).warning.text}`} />
                <h3 className="font-semibold text-theme-primary transition-colors duration-300">Study Tips</h3>
              </div>
              
              <div className="space-y-3 text-sm text-theme-secondary">
                <div className="flex items-start space-x-2">
                  <span className={`${useSemanticColors(theme).warning.text} mt-0.5`}>💡</span>
                  <span>Code along with the examples to build muscle memory</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className={`${useSemanticColors(theme).success.text} mt-0.5`}>✅</span>
                  <span>Complete the progressive practice tasks in order</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className={`${useSemanticColors(theme).info.text} mt-0.5`}>🔗</span>
                  <span>Explore the curated resources for deeper understanding</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-theme-accent mt-0.5">🔄</span>
                  <span>Apply concepts in your own projects for mastery</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            {weekNumber && (
              <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-6 transition-colors duration-300 animate-slide-up" style={{animationDelay: '0.4s'}}>
                <h3 className="font-semibold text-theme-primary mb-4 transition-colors duration-300">Navigation</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/roadmap/week/${weekNumber}`)}
                    className="w-full text-left px-3 py-2 text-sm text-theme-accent hover:bg-theme-accent/10 rounded-md transition-colors duration-300 font-medium"
                  >
                    📚 Week {weekNumber} Overview
                  </button>
                  <button
                    onClick={() => navigate('/my-roadmap')}
                    className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:bg-theme-hover rounded-md transition-colors duration-300"
                  >
                    🗺️ Full Roadmap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPage; 