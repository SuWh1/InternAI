import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle, Circle, Brain, Lightbulb, ChevronRight, LoaderCircle, Loader, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import agentService from '../services/agentService';
import { topicService } from '../services/topicService';
import type { Topic } from '../services/topicService';
import ErrorMessage from '../components/common/ErrorMessage';
import TruncatedText from '../components/common/TruncatedText';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';

// Simple in-memory cache: topicId -> subtopics array
const subtopicCache: Map<string, Array<{ title: string; description: string; type?: string } | string>> = new Map();

const TopicDetailPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  
  const [isGeneratingSubtopics, setIsGeneratingSubtopics] = useState(false);

  // Study tips rotation state (same as WeekDetailPage)
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  const studyTips = [
    "Start with understanding concepts before diving into implementation.",
    "Take breaks every 25 minutes to maintain focus and retention.",
    "Practice explaining concepts out loud - teaching yourself helps learning.",
    "Build small projects to apply what you've learned immediately.",
    "Don't just copy code - understand why each approach works.",
    "Review yesterday's learning for 5 minutes before starting new topics.",
    "Connect new concepts to things you already know from experience.",
    "Ask 'why' and 'how often' questions about everything you learn.",
    "Use spaced repetition - review concepts at increasing intervals.",
    "Sleep well - your brain consolidates learning during rest."
  ];

  // Rotate study tips every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % studyTips.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [studyTips.length]);

  // Fetch topic data
  const { data: topic, isLoading, error } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: () => topicService.getTopic(topicId!),
    enabled: !!topicId,
  });

  // Update topic mutation
  const updateTopicMutation = useMutation({
    mutationFn: ({ subtopics, completed_subtopics }: { subtopics?: any[], completed_subtopics?: number[] }) => 
      topicService.updateTopic(topicId!, { subtopics, completed_subtopics }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic', topicId] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });

  // Generate subtopics if needed
  useEffect(() => {
    if (topic && (!topic.subtopics || topic.subtopics.length === 0)) {
      // Try to read subtopics from cache first
      const cached = subtopicCache.get(topicId!);
      if (cached && cached.length > 0) {
        updateTopicMutation.mutate({ subtopics: cached });
      } else {
        generateSubtopics(topic);
      }
    }
  }, [topic?.id]);

  const generateSubtopics = async (topicData: Topic) => {
    // Set loading timeout to show generating state only if request takes longer than 300ms
    const loadingTimeout = setTimeout(() => {
      setIsGeneratingSubtopics(true);
    }, 300);
    
    try {
      const response = await agentService.generateSubtopics({
        topic: topicData.name,
        context: `Learning roadmap for ${topicData.name}`,
        user_level: 'intermediate',
        force_regenerate: false
      });
      
      clearTimeout(loadingTimeout);
      
      if (response.success && response.subtopics && response.subtopics.length > 0) {
        // Cache and update topic with subtopics
        subtopicCache.set(topicData.id, response.subtopics);
        updateTopicMutation.mutate({ subtopics: response.subtopics });
        
        if (response.cached) {
          setIsGeneratingSubtopics(false);
        }
      } else {
        // Fallback subtopics
        const fallbackSubtopics = [
          { title: `Introduction to ${topicData.name}`, description: `Learn the fundamental concepts and principles of ${topicData.name}` },
          { title: `Core Concepts`, description: `Master the essential concepts and building blocks of ${topicData.name}` },
          { title: `Practical Applications`, description: `Apply ${topicData.name} skills through real-world projects and implementations` },
          { title: `Best Practices`, description: `Understand industry standards, coding conventions, and optimization techniques` },
          { title: `Common Challenges`, description: `Learn to troubleshoot and solve typical problems when working with ${topicData.name}` },
          { title: `Advanced Techniques`, description: `Explore advanced patterns and professional-level ${topicData.name} development` }
        ];
        
        subtopicCache.set(topicData.id, fallbackSubtopics);
        updateTopicMutation.mutate({ subtopics: fallbackSubtopics });
      }
    } catch (error) {
      clearTimeout(loadingTimeout);
      console.error('Error generating subtopics:', error);
      
      // Fallback subtopics on error
      const fallbackSubtopics = [
        { title: `Introduction to ${topicData.name}`, description: `Learn the fundamental concepts and principles of ${topicData.name}` },
        { title: `Core Concepts`, description: `Master the essential concepts and building blocks of ${topicData.name}` },
        { title: `Practical Applications`, description: `Apply ${topicData.name} skills through real-world projects and implementations` },
        { title: `Best Practices`, description: `Understand industry standards, coding conventions, and optimization techniques` },
        { title: `Common Challenges`, description: `Learn to troubleshoot and solve typical problems when working with ${topicData.name}` },
        { title: `Advanced Techniques`, description: `Explore advanced patterns and professional-level ${topicData.name} development` }
      ];
      
      subtopicCache.set(topicData.id, fallbackSubtopics);
      updateTopicMutation.mutate({ subtopics: fallbackSubtopics });
    } finally {
      setIsGeneratingSubtopics(false);
    }
  };

  const handleSubtopicToggle = (subtopicIndex: number) => {
    if (!topic) return;
    
    const newCompletedSubtopics = new Set(topic.completed_subtopics);
    if (newCompletedSubtopics.has(subtopicIndex)) {
      newCompletedSubtopics.delete(subtopicIndex);
    } else {
      newCompletedSubtopics.add(subtopicIndex);
    }
    
    const updatedCompletedSubtopics = Array.from(newCompletedSubtopics);
    
    // Update via API
    updateTopicMutation.mutate({ completed_subtopics: updatedCompletedSubtopics });
  };

  const handleGetAIExplanation = (subtopicTitle: string) => {
    if (!topic) return;
    
    // Create lesson URL for topic-based lesson
    // We'll use a simple format: topic-{topicId}-{subtopicIndex}
    const subtopicIndex = topic.subtopics?.findIndex(s => 
      (typeof s === 'string' ? s : s.title) === subtopicTitle
    ) || 0;
    
    // Create a slug-like identifier for the lesson
    const lessonSlug = `topic-${topic.id}-${subtopicIndex}`;
    navigate(`/lesson/${lessonSlug}`);
  };

  const getCompletionPercentage = () => {
    if (!topic?.subtopics || topic.subtopics.length === 0) return 0;
    return Math.round((topic.completed_subtopics.length / topic.subtopics.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen bg-theme-primary p-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/my-topics')}
            className="mb-6 inline-flex items-center text-theme-secondary hover:text-theme-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Topics
          </button>
          <ErrorMessage error={error ? "Failed to load topic. Please try again." : "Topic not found. It may have been deleted."} />
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <motion.div 
      className="min-h-[calc(100vh-4rem)] bg-theme-primary transition-colors duration-300 w-screen overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div 
        className="bg-theme-secondary shadow-sm border-b border-theme transition-colors duration-300"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            className="flex items-center gap-4 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.button
              onClick={() => navigate('/my-topics')}
              className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary transition-colors duration-300"
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Topics
            </motion.button>
          </motion.div>
          
          <div className="flex items-start justify-between">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-theme-primary mb-2 transition-colors duration-300">
                {topic.name}
              </h1>
              <p className="text-theme-secondary transition-colors duration-300">
                Created on {topic.created_at ? new Date(topic.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </motion.div>
            
            <motion.div 
              className="text-right min-w-[100px]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.div 
                className="text-2xl font-bold text-theme-accent mb-1 font-mono"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 200 }}
              >
                {completionPercentage}%
              </motion.div>
              <div className="text-sm text-theme-secondary transition-colors duration-300">Complete</div>
              <motion.div 
                className="w-24 h-2 bg-theme-hover rounded-full mt-2 overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: 96 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <motion.div 
                  className="h-full bg-theme-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div 
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="grid gap-8 lg:grid-cols-3 overflow-hidden">
          
          {/* Main Content */}
          <motion.div 
            className="lg:col-span-2 space-y-8 overflow-hidden"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            
            {/* Learning Path Section */}
            <motion.div 
              className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-6 transition-colors duration-300"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-theme-primary transition-colors duration-300">
                  Learning Path ({topic.completed_subtopics.length}/{topic.subtopics?.length || 0})
                </h2>
              </div>
              
              {isGeneratingSubtopics && (!topic.subtopics || topic.subtopics.length === 0) ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-theme-accent animate-spin spin-animation" />
                    <span className="text-theme-secondary">Generating personalized subtopics...</span>
                  </div>
                </div>
              ) : (
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
                        delayChildren: 0.3
                      }
                    }
                  }}
                >
                  {topic.subtopics?.map((subtopic, index) => {
                    const subtopicTitle = typeof subtopic === 'string' ? subtopic : subtopic.title;
                    const subtopicDescription = typeof subtopic === 'string' ? subtopic : subtopic.description;
                    const isAISuggestion = typeof subtopic === 'object' && subtopic.type === 'ai_suggestion';
                    const isCompleted = topic.completed_subtopics.includes(index);
                    
                    return (
                      <motion.div
                        key={index}
                        onClick={() => handleSubtopicToggle(index)}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-colors duration-200 cursor-pointer ${
                          isCompleted
                            ? 'bg-green-500/10 border-green-500/30 dark:bg-green-400/10 dark:border-green-400/30'
                            : isAISuggestion 
                              ? 'border-yellow-400 bg-yellow-400/10 dark:bg-yellow-500/10 hover:border-yellow-300 shadow-sm shadow-yellow-400/20'
                              : 'bg-theme-hover border-theme hover:border-theme-accent'
                        }`}
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
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                          ) : (
                            <Circle className="w-6 h-6 text-theme-secondary/50" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <p className={`text-sm font-medium leading-relaxed mb-1 ${
                            isCompleted 
                              ? 'text-theme-secondary dark:text-green-300 line-through opacity-75' 
                              : 'text-theme-primary'
                          }`}>
                            {subtopicTitle}
                          </p>
                          {typeof subtopic === 'object' && (
                            <div className={`text-xs leading-relaxed mb-2 transition-colors duration-300 ${
                              isCompleted 
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
                                className={isCompleted ? 'line-through' : ''}
                                expandButtonClass={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}
                              />
                            </div>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetAIExplanation(subtopicTitle);
                            }}
                            className="flex items-center gap-2 text-sm font-medium text-theme-accent hover:opacity-80 transition-colors duration-300 mt-2 px-3 py-1.5 bg-theme-accent/10 rounded-md hover:bg-theme-accent/20"
                          >
                            <Brain className="w-4 h-4" />
                            <span>Click here to study and get AI explanation</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Sidebar */}
          <motion.div 
            className="space-y-6 overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            
            {/* Time Estimate */}
            <motion.div 
              className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-6 transition-colors duration-300"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              whileHover={{ y: -2, scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-theme-accent" />
                <h3 className="font-semibold text-theme-primary transition-colors duration-300">Time Estimate</h3>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-theme-accent mb-1">
                  {topic.subtopics ? Math.ceil(topic.subtopics.length * 1.5) : 0}-{topic.subtopics ? Math.ceil(topic.subtopics.length * 2.5) : 0}
                </div>
                <div className="text-sm text-theme-secondary transition-colors duration-300">hours to complete</div>
              </div>
            </motion.div>

            {/* Quick Tips */}
            <motion.div 
              className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-6 transition-colors duration-300"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              whileHover={{ y: -2, scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                <h3 className="font-semibold text-theme-primary transition-colors duration-300">Quick Tips</h3>
              </div>
              
              <div className="relative">
                <div 
                  key={theme}
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
            </motion.div>

            {/* Navigation */}
            <motion.div 
              className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-6 transition-colors duration-300"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              whileHover={{ y: -2, scale: 1.02 }}
            >
              <h3 className="font-semibold text-theme-primary mb-4 transition-colors duration-300">Navigate</h3>
              <div className="space-y-2">
                <motion.button
                  onClick={() => navigate('/my-topics')}
                  className="w-full text-left px-3 py-2 text-sm text-theme-accent hover:bg-theme-accent/10 rounded-md transition-colors duration-300 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📚 All Topics
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TopicDetailPage;