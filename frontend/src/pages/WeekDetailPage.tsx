import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Target, BookOpen, CheckCircle, Circle, ExternalLink, Brain, Lightbulb, RotateCcw, Lock, ChevronRight, LoaderCircle } from 'lucide-react';
import agentService from '../services/agentService';

import ErrorMessage from '../components/common/ErrorMessage';
import TruncatedText from '../components/common/TruncatedText';
import { useRoadmap } from '../hooks/useRoadmap';
import { useTheme } from '../contexts/ThemeContext';
import { isWeekUnlocked, isWeekCompleted, validateWeekNavigation } from '../utils/weekProgress';
import type { WeekData } from '../types/roadmap';

const WeekDetailPage: React.FC = () => {
  const { weekNumber } = useParams<{ weekNumber: string }>();
  const navigate = useNavigate();
  const { roadmap, progress, updateProgress, loading: roadmapLoading, dataReady, error: roadmapError } = useRoadmap();
  const { theme } = useTheme();
  
  const [week, setWeek] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedSubtopics, setCompletedSubtopics] = useState<Set<number>>(new Set());
  const [subtopics, setSubtopics] = useState<Array<{ title: string; description: string } | string>>([]);
  const [isGeneratingSubtopics, setIsGeneratingSubtopics] = useState(false);
  const [userInteracting, setUserInteracting] = useState(false);
  const [forceGeneration, setForceGeneration] = useState(false);

  // Study tips rotation state
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  const studyTips = [
    "Focus on understanding concepts before diving into code.",
    "Take breaks every 25 minutes to maintain focus.",
    "Practice explaining concepts out loud - teaching yourself helps retention.",
    "Write code by hand occasionally - it improves your understanding.",
    "Don't just copy code - understand why each line works.",
    "Review yesterday's learning for 5 minutes before starting new topics.",
    "Build small projects to apply what you've learned immediately.",
    "Use spaced repetition - review concepts at increasing intervals.",
    "Connect new concepts to things you already know.",
    "Ask 'why' and 'how often' questions about everything you learn.",
    "Code without looking at documentation first, then verify.",
    "Sleep well - your brain consolidates learning during rest."
  ];
  
  // Get week progress by week number
  const getWeekProgress = (weekNum: number) => {
    return progress.find(p => p.week_number === weekNum);
  };

  useEffect(() => {
    // Only reset state when week number actually changes (not when roadmap data refreshes)
    console.log(`Week navigation: changing to week ${weekNumber}`);
    setError(null);
    setWeek(null); // Reset week data so second useEffect can trigger
    setCompletedSubtopics(new Set());
    setSubtopics([]);
    setIsGeneratingSubtopics(false);
    setUserInteracting(false);
    setForceGeneration(true); // Force generation when navigating to new week
    
    if (roadmap && progress.length > 0) {
      // Check if current week is unlocked before loading
      const weekNum = parseInt(weekNumber || '1');
      if (!isWeekUnlocked(weekNum, progress)) {
        setError(`Week ${weekNum} is locked. Complete the previous week to unlock it.`);
        return;
      }
      console.log(`Week ${weekNumber}: roadmap and progress ready, calling loadWeekData()`);
      loadWeekData();
    } else {
      console.log(`Week ${weekNumber}: waiting for roadmap and progress data`);
    }
  }, [weekNumber]); // Only depend on weekNumber to prevent unnecessary resets

  // Separate effect to handle roadmap/progress loading without resetting component state
  useEffect(() => {
    if (roadmap && progress.length > 0 && !week) {
      // Only load week data if we don't have it yet
      const weekNum = parseInt(weekNumber || '1');
      console.log(`Second useEffect triggered for week ${weekNumber}: roadmap and progress available, week is null`);
      if (isWeekUnlocked(weekNum, progress)) {
        console.log(`Week ${weekNumber} is unlocked, calling loadWeekData()`);
        loadWeekData();
      } else {
        console.log(`Week ${weekNumber} is locked`);
      }
    }
  }, [roadmap, progress, roadmapLoading, week]);

  // Separate effect to sync progress data without resetting local state
  useEffect(() => {
    if (week && progress.length > 0 && !userInteracting) {
      const weekNum = parseInt(weekNumber || '1');
      const weekProgress = progress.find(p => p.week_number === weekNum);
      if (weekProgress) {
        // Only update if we don't have local state yet (prevents overriding user's immediate changes)
        if (completedSubtopics.size === 0) {
          const subtopicIndices = weekProgress.completed_tasks
            .map((taskId: string) => parseInt(taskId.replace('subtopic-', '')))
            .filter((index: number) => !isNaN(index));
          setCompletedSubtopics(new Set(subtopicIndices));
        }
      }
    }
  }, [progress, week, weekNumber, userInteracting]); // Sync progress without full reset

  // Rotate study tips every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % studyTips.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [studyTips.length]);

  const loadWeekData = () => {
    if (!roadmap) {
      setError('No roadmap data found. Please generate a roadmap first.');
      return;
    }

    const weekNum = parseInt(weekNumber || '1');
    
    // Don't reload if we already have the correct week data
    if (week && week.week_number === weekNum) {
      return;
    }
    
    const weekData = roadmap.weeks?.find((w: WeekData) => w.week_number === weekNum);
    
    if (!weekData) {
      setError(`Week ${weekNumber} not found in roadmap.`);
      return;
    }

    setWeek(weekData);
    
    // Load progress from hook
    const weekProgress = progress.find(p => p.week_number === weekNum);
    if (weekProgress) {
      // Convert subtopic IDs to indices for backward compatibility
      const subtopicIndices = weekProgress.completed_tasks
        .map((taskId: string) => parseInt(taskId.replace('subtopic-', '')))
        .filter((index: number) => !isNaN(index));
      setCompletedSubtopics(new Set(subtopicIndices));
    }
    
    // Generate subtopics if they don't exist OR if force generation is requested (for new week navigation)
    // OR if we're loading a different week than what we currently have data for
    const needsGeneration = subtopics.length === 0 || forceGeneration || (week && week.week_number !== weekNum);
    
    if (needsGeneration) {
      console.log(`Starting subtopics generation for week ${weekNum}: subtopics.length=${subtopics.length}, forceGeneration=${forceGeneration}, currentWeek=${week?.week_number}`);
      setForceGeneration(false); // Reset the flag
      generateSubtopics(weekData.theme, weekData.focus_area);
    } else {
      console.log(`Skipping subtopics generation for week ${weekNum}: subtopics.length=${subtopics.length}, forceGeneration=${forceGeneration}, currentWeek=${week?.week_number}`);
    }
    
    setError(null);
  };

  const generateSubtopics = async (theme: string, focusArea: string) => {
    const weekNum = parseInt(weekNumber || '1');
    
    console.log(`generateSubtopics called for week ${weekNum}, theme: ${theme}, focusArea: ${focusArea}`);
    
    // Set a timeout to show generating state only if request takes longer than 300ms (likely new generation)
    const loadingTimeout = setTimeout(() => {
      setIsGeneratingSubtopics(true);
      console.log(`Request taking longer than 300ms, showing generating state`);
    }, 300);
    
    try {
      console.log(`Making API call to agentService.generateSubtopics...`);
      const response = await agentService.generateSubtopics({
        topic: theme,
        context: `Week ${weekNum} - Focus area: ${focusArea}`,
        user_level: 'intermediate',
        force_regenerate: false
      });
      
      // Clear the loading timeout since we got a response
      clearTimeout(loadingTimeout);
      
      console.log(`API response received:`, response);
      
      if (response.success && response.subtopics && response.subtopics.length > 0) {
        console.log(`Setting ${response.subtopics.length} subtopics from API response`);
        setSubtopics(response.subtopics);
        
        // If we were showing generating state and got cached content, hide it immediately
        if (response.cached) {
          console.log(`Content was cached, hiding generating state immediately`);
          setIsGeneratingSubtopics(false);
        }
      } else {
        console.log(`API response invalid, using fallback subtopics`);
        // Fallback to default subtopics if AI generation fails
        setSubtopics([
          { title: `Introduction to ${theme}`, description: `Learn the fundamental concepts and principles of ${theme} with hands-on examples` },
          { title: `Core Concepts`, description: `Master the essential concepts and building blocks of ${theme} development` },
          { title: `Practical Applications`, description: `Apply ${theme} skills through real-world projects and practical implementations` },
          { title: `Best Practices`, description: `Understand industry standards, coding conventions, and optimization techniques for ${theme}` },
          { title: `Common Challenges`, description: `Learn to troubleshoot and solve typical problems encountered when working with ${theme}` },
          { title: `Advanced Techniques`, description: `Explore advanced patterns, performance optimization, and professional-level ${theme} development` }
        ]);
      }
    } catch (error) {
      // Clear the loading timeout in case of error
      clearTimeout(loadingTimeout);
      
      console.error('Error generating subtopics:', error);
      console.log(`Using fallback subtopics due to error`);
      // Fallback subtopics
      setSubtopics([
        { title: `Introduction to ${theme}`, description: `Learn the fundamental concepts and principles of ${theme} with hands-on examples` },
        { title: `Core Concepts`, description: `Master the essential concepts and building blocks of ${theme} development` },
        { title: `Practical Applications`, description: `Apply ${theme} skills through real-world projects and practical implementations` },
        { title: `Best Practices`, description: `Understand industry standards, coding conventions, and optimization techniques for ${theme}` },
        { title: `Common Challenges`, description: `Learn to troubleshoot and solve typical problems encountered when working with ${theme}` },
        { title: `Advanced Techniques`, description: `Explore advanced patterns, performance optimization, and professional-level ${theme} development` }
      ]);
    } finally {
      // Always clear the generating state when done
      console.log(`generateSubtopics finishing, clearing loading state`);
      setIsGeneratingSubtopics(false);
    }
  };

  const handleSubtopicToggle = (subtopicIndex: number) => {
    try {
      // Set user interaction flag to prevent progress sync interference
      setUserInteracting(true);
      
      const newCompletedSubtopics = new Set(completedSubtopics);
      const isCompleting = !newCompletedSubtopics.has(subtopicIndex);
      
      if (newCompletedSubtopics.has(subtopicIndex)) {
        newCompletedSubtopics.delete(subtopicIndex);
      } else {
        newCompletedSubtopics.add(subtopicIndex);
      }
      
      // Update local state immediately for instant responsiveness
      setCompletedSubtopics(newCompletedSubtopics);
      
      // Update backend in background without blocking UI
      const weekNum = parseInt(weekNumber || '1');
      const subtopicId = `subtopic-${subtopicIndex}`;
      
      updateProgress(weekNum, subtopicId, isCompleting).catch((error) => {
        // Revert local state on error and notify user
        setCompletedSubtopics(completedSubtopics);
        console.error('Error updating progress:', error);
      });
      
      // Clear user interaction flag after a delay to allow progress sync
      setTimeout(() => {
        setUserInteracting(false);
      }, 1000);
    } catch (error) {
      console.error('Error in handleSubtopicToggle:', error);
      setUserInteracting(false);
    }
  };

  const handleGetAIExplanation = (subtopicTitle: string, subtopicDescription?: string) => {
    const weekNum = parseInt(weekNumber || '1');
    // Use description for better context if available, otherwise fall back to title
    const detailedContext = subtopicDescription || subtopicTitle;
    const context = `Week ${weekNum}: ${week?.theme} - ${detailedContext}`;
    
    // Import the lesson slug service dynamically to avoid circular dependencies
    import('../services/lessonSlugService').then(({ lessonSlugService }) => {
      const lessonUrl = lessonSlugService.createLessonUrl(subtopicTitle, context, weekNum);
      navigate(lessonUrl);
    });
  };

  const getCompletionPercentage = () => {
    if (!subtopics.length) return 0;
    
    // Calculate based on actual subtopics completed
    return Math.round((completedSubtopics.size / subtopics.length) * 100);
  };

  const handleNavigation = (targetWeek: number) => {
    const validation = validateWeekNavigation(targetWeek, progress);
    if (!validation.allowed) {
      // Do nothing for locked weeks - no error messages
      return;
    }
    
    // Navigate to the target week
    navigate(`/roadmap/week/${targetWeek}`);
  };

  if (error || roadmapError) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center transition-colors duration-300">
        <ErrorMessage error={error || roadmapError || 'An error occurred'} />
      </div>
    );
  }


  // Only show "not found" if data is ready but still no week (actual error)
  if (!week && dataReady && !loading) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="text-theme-secondary/70 text-lg mb-2 transition-colors duration-300">Week not found</div>
          <button
            onClick={() => navigate('/my-roadmap')}
            className="text-theme-accent hover:opacity-80 underline transition-colors duration-300"
          >
            Return to Roadmap
          </button>
        </div>
      </div>
    );
  }

  // Show loading state if week is not ready yet
  if (!week) {
    return (
      <div className="min-h-screen bg-theme-primary transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="text-theme-secondary/70 text-lg transition-colors duration-300">Loading week data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-theme-primary transition-colors duration-300">
      {/* Header */}
      <div className="bg-theme-secondary shadow-sm border-b border-theme transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/my-roadmap')}
              className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Roadmap
            </button>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-theme-primary mb-2 transition-colors duration-300">
                Week {week.week_number}: {week.theme}
              </h1>
              <p className="text-theme-secondary mb-4 transition-colors duration-300">
                Focus Area: <span className="font-medium text-theme-accent">{week.focus_area}</span>
              </p>
            </div>
            
            <div className="text-right min-w-[100px]">
              <div className="text-2xl font-bold text-theme-accent mb-1 font-mono">
                {completionPercentage}%
              </div>
              <div className="text-sm text-theme-secondary transition-colors duration-300">Complete</div>
              <div className="w-24 h-2 bg-theme-hover rounded-full mt-2">
                <div 
                  className="h-full bg-theme-accent rounded-full transition-[width] duration-200"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Studying Section */}
            <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-6 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-6">
                <Brain className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-theme-primary transition-colors duration-300">
                  Studying ({completedSubtopics.size}/{subtopics.length})
                </h2>
              </div>
              

                {isGeneratingSubtopics && subtopics.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-3">
                      <div className="spin-animation">
                        <LoaderCircle className="w-6 h-6 text-theme-accent" />
                      </div>
                      <span className="text-theme-secondary text-sm">Generating learning content...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subtopics.map((subtopic, index) => {
                      // Handle both string format (old) and object format (new)
                      const subtopicTitle = typeof subtopic === 'string' ? subtopic : subtopic.title;
                      const subtopicDescription = typeof subtopic === 'string' ? subtopic : subtopic.description;
                      
                      return (
                        <div
                          key={index}
                          onClick={() => handleSubtopicToggle(index)}
                          className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-colors duration-200 cursor-pointer ${
                            completedSubtopics.has(index)
                              ? 'bg-green-500/10 border-green-500/30 dark:bg-green-400/10 dark:border-green-400/30'
                              : 'bg-theme-hover border-theme hover:border-theme-accent'
                          }`}
                        >
                          <div className="mt-0.5">
                            {completedSubtopics.has(index) ? (
                              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            ) : (
                              <Circle className="w-6 h-6 text-theme-secondary/50" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <p className={`text-sm font-medium leading-relaxed mb-1 ${
                              completedSubtopics.has(index) 
                                ? 'text-theme-secondary dark:text-green-300 line-through opacity-75' 
                                : 'text-theme-primary'
                            }`}>
                              {subtopicTitle}
                            </p>
                            {typeof subtopic === 'object' && (
                              <div className={`text-xs leading-relaxed mb-2 transition-colors duration-300 ${
                                completedSubtopics.has(index) 
                                  ? theme === 'dark' 
                                    ? 'text-gray-400 line-through opacity-75' 
                                    : 'text-gray-500 line-through opacity-75'
                                  : theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                              }`}>
                                <TruncatedText 
                                  text={subtopic.description} 
                                  maxLength={80} 
                                  className={completedSubtopics.has(index) ? 'line-through' : ''}
                                  expandButtonClass={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}
                                />
                              </div>
                            )}
                              
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent the parent div's onClick from firing
                                handleGetAIExplanation(subtopicTitle, subtopicDescription);
                              }}
                              className="flex items-center gap-1 text-xs text-theme-accent hover:opacity-80 transition-colors duration-300"
                            >
                              <Brain className="w-3 h-3" />
                              <span>Click here to study and get AI explanation</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
                )}
            </div>


          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Time Estimate */}
            <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-6 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-theme-accent" />
                <h3 className="font-semibold text-theme-primary transition-colors duration-300">Time Estimate</h3>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-theme-accent mb-1">
                  {week.estimated_hours}
                </div>
                <div className="text-sm text-theme-secondary transition-colors duration-300">hours this week</div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-6 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                <h3 className="font-semibold text-theme-primary transition-colors duration-300">Quick Tips</h3>
              </div>
              
              <div className="relative">
                <div 
                  key={theme} // Force re-render on theme change
                  className={`rounded-xl px-6 py-5 transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-yellow-900/20 to-amber-900/10 border border-yellow-700/30'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-theme-primary dark:text-theme-secondary leading-relaxed font-medium transition-all duration-500">
                        {studyTips[currentTipIndex]}
                      </p>
                    </div>
                  </div>
                  
                  {/* Subtle animation indicator */}
                  <div className="absolute bottom-3 right-4">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            (currentTipIndex + i) % 3 === 0 
                              ? 'bg-yellow-500/60 scale-110' 
                              : 'bg-yellow-300/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-6 transition-colors duration-300">
              <h3 className="font-semibold text-theme-primary mb-4 transition-colors duration-300">Navigate</h3>
              <div className="space-y-2">
                {week && week.week_number > 1 && (
                  <button
                    onClick={() => handleNavigation(week.week_number - 1)}
                    className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:bg-theme-hover rounded-md transition-colors duration-300 flex items-center gap-2"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Week {week.week_number - 1}
                  </button>
                )}
                <button
                  onClick={() => navigate('/my-roadmap')}
                  className="w-full text-left px-3 py-2 text-sm text-theme-accent hover:bg-theme-accent/10 rounded-md transition-colors duration-300 font-medium"
                >
                  📊 Full Roadmap
                </button>
                
                {/* Next Week Navigation */}
                {week && roadmap && week.week_number < roadmap.weeks.length && (
                  <div className="relative">
                    <button
                      onClick={() => handleNavigation(week.week_number + 1)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-300 flex items-center justify-between group ${
                        isWeekUnlocked(week.week_number + 1, progress)
                          ? 'text-theme-secondary hover:bg-theme-hover cursor-pointer'
                          : 'text-theme-secondary cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isWeekUnlocked(week.week_number + 1, progress) ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                        <span>Week {week.week_number + 1}</span>
                      </div>
                    </button>
                    

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default WeekDetailPage; 