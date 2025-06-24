import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Target, BookOpen, CheckCircle, Circle, ExternalLink, Brain, Loader, Lightbulb, RotateCcw } from 'lucide-react';
import agentService from '../services/agentService';

import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { useRoadmap } from '../hooks/useRoadmap';
import { useTheme } from '../contexts/ThemeContext';
import type { WeekData } from '../types/roadmap';

const WeekDetailPage: React.FC = () => {
  const { weekNumber } = useParams<{ weekNumber: string }>();
  const navigate = useNavigate();
  const { roadmap, progress, updateProgress, loading: roadmapLoading, error: roadmapError } = useRoadmap();
  const { theme } = useTheme();
  
  const [week, setWeek] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedSubtopics, setCompletedSubtopics] = useState<Set<number>>(new Set());
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);

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
  


  useEffect(() => {
    if (roadmap && progress.length > 0) {
      loadWeekData();
    } else if (!roadmapLoading) {
      setLoading(false);
    }
  }, [weekNumber, roadmap, progress, roadmapLoading]);

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
      setLoading(false);
      return;
    }

    const weekNum = parseInt(weekNumber || '1');
    const weekData = roadmap.weeks?.find((w: WeekData) => w.week_number === weekNum);
    
    if (!weekData) {
      setError(`Week ${weekNumber} not found in roadmap.`);
      setLoading(false);
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
    
    // Only generate subtopics if they don't already exist
    if (subtopics.length === 0) {
      generateSubtopics(weekData.theme, weekData.focus_area);
    }
    
    setLoading(false);
    setError(null);
  };

  const generateSubtopics = async (theme: string, focusArea: string) => {
    setLoadingSubtopics(true);
    
    try {
      const weekNum = parseInt(weekNumber || '1');
      const response = await agentService.generateSubtopics({
        topic: theme,
        context: `Week ${weekNum} - Focus area: ${focusArea}`,
        user_level: 'intermediate',
        force_regenerate: false
      });
      
      if (response.success && response.subtopics && response.subtopics.length > 0) {
        setSubtopics(response.subtopics);
        
        // If it's cached, hide loading immediately since the data is already available
        if (response.cached) {
          setLoadingSubtopics(false);
          return;
        }
      } else {
        // Fallback to default subtopics if AI generation fails
        setSubtopics([
          `Introduction to ${theme}`,
          `Core Concepts and Principles`,
          `Practical Applications`,
          `Best Practices and Guidelines`,
          `Common Challenges and Solutions`,
          `Advanced Techniques`
        ]);
      }
    } catch (error) {
      console.error('Error generating subtopics:', error);
      // Fallback subtopics
      setSubtopics([
        `Introduction to ${theme}`,
        `Core Concepts and Principles`,
        `Practical Applications`,
        `Best Practices and Guidelines`,
        `Common Challenges and Solutions`,
        `Advanced Techniques`
      ]);
    } finally {
      setLoadingSubtopics(false);
    }
  };

  const handleSubtopicToggle = (subtopicIndex: number) => {
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
  };

  const handleGetAIExplanation = (subtopic: string) => {
    const weekNum = parseInt(weekNumber || '1');
    const encodedTopic = encodeURIComponent(subtopic);
    const encodedContext = encodeURIComponent(`Week ${weekNum}: ${week?.theme} - ${subtopic}`);
    navigate(`/lesson/${encodedTopic}/${encodedContext}/${weekNum}`);
  };



  const getCompletionPercentage = () => {
    if (!subtopics.length) return 0;
    
    // Calculate based on actual subtopics completed
    return Math.round((completedSubtopics.size / subtopics.length) * 100);
  };

  if (loading || roadmapLoading) {
    return (
      <div className="min-h-screen pt-16 bg-theme-primary flex items-center justify-center transition-colors duration-300">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || roadmapError) {
    return (
      <div className="min-h-screen pt-16 bg-theme-primary flex items-center justify-center transition-colors duration-300">
        <ErrorMessage error={error || roadmapError || 'An error occurred'} />
      </div>
    );
  }

  if (!week) {
    return (
      <div className="min-h-screen pt-16 bg-theme-primary flex items-center justify-center transition-colors duration-300">
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

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen pt-16 bg-theme-primary transition-colors duration-300">
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
              
              {loadingSubtopics ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3">
                    <Loader className="w-6 h-6 text-purple-600 animate-spin" />
                    <span className="text-theme-secondary">AI is generating learning subtopics...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {subtopics.map((subtopic, index) => (
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
                      <p className={`text-sm leading-relaxed ${
                        completedSubtopics.has(index) 
                          ? 'text-theme-secondary dark:text-green-300 line-through opacity-75' 
                          : 'text-theme-secondary'
                      }`}>
                        {subtopic}
                      </p>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent the parent div's onClick from firing
                            handleGetAIExplanation(subtopic);
                          }}
                          className="mt-2 flex items-center gap-1 text-xs text-theme-accent hover:opacity-80 transition-colors duration-300"
                        >
                          <Brain className="w-3 h-3" />
                          <span>Click here to study and get AI explanation</span>
                        </button>
                      </div>
                    </div>
                  ))}
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
                {week.week_number > 1 && (
                  <button
                    onClick={() => navigate(`/roadmap/week/${week.week_number - 1}`)}
                    className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:bg-theme-hover rounded-md transition-colors duration-300"
                  >
                    ← Week {week.week_number - 1}
                  </button>
                )}
                <button
                  onClick={() => navigate('/my-roadmap')}
                  className="w-full text-left px-3 py-2 text-sm text-theme-accent hover:bg-theme-accent/10 rounded-md transition-colors duration-300 font-medium"
                >
                  📊 Full Roadmap
                </button>
                <button
                  onClick={() => navigate(`/roadmap/week/${week.week_number + 1}`)}
                  className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:bg-theme-hover rounded-md transition-colors duration-300"
                >
                  Week {week.week_number + 1} →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default WeekDetailPage; 