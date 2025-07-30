import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, ArrowRight, Clock, CheckCircle, Calendar, ChevronLeft, ChevronRight, Trash2, AlertTriangle, Loader, Eye, EyeOff, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AnimatedSection from '../components/common/AnimatedSection';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import ToggleSwitch from '../components/common/ToggleSwitch';
import { topicService } from '../services/topicService';
import type { Topic } from '../services/topicService';
import { calculatePublicTopicCompletion } from '../utils/publicTopicProgress';

const MyTopicsPage = () => {
  const [topicInput, setTopicInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'private' | 'public'>('private');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [publishingTopicId, setPublishingTopicId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const itemsPerPage = 5;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch user's own topics
  const { data: userTopicsData, isLoading: isLoadingUserTopics, error: userTopicsError } = useQuery({
    queryKey: ['topics'],
    queryFn: topicService.getTopics,
  });

  // Fetch all public topics from all users
  const { data: publicTopicsData, isLoading: isLoadingPublicTopics, error: publicTopicsError } = useQuery({
    queryKey: ['publicTopics'],
    queryFn: topicService.getPublicTopics,
    enabled: viewMode === 'public', // Only fetch when viewing public topics
  });

  // Determine which topics to show based on view mode
  const topics = viewMode === 'private' 
    ? (userTopicsData?.topics || [])
    : (publicTopicsData?.topics || []);

  const isLoading = viewMode === 'private' ? isLoadingUserTopics : isLoadingPublicTopics;
  const error = viewMode === 'private' ? userTopicsError : publicTopicsError;

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: topicService.createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      setTopicInput('');
      setValidationError(''); // Clear any validation errors on success
    },
  });

  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: topicService.deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      setShowDeleteConfirm(false);
      setTopicToDelete(null);
    },
  });

  // Toggle topic visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ topicId, isPublic }: { topicId: string; isPublic: boolean }) =>
      topicService.toggleTopicVisibility(topicId, isPublic),
    onSuccess: () => {
      // Invalidate both queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['publicTopics'] });
      setPublishingTopicId(null);
    },
    onError: () => {
      setPublishingTopicId(null);
    },
  });

  // Validate topic input
  const validateTopicInput = async (input: string): Promise<boolean> => {
    if (!input.trim()) {
      setValidationError('Please enter a topic to learn.');
      return false;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      const response = await fetch('/api/agents/validate-topic-input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ input: input.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setValidationError(data.detail || 'Validation failed. Please try again.');
        return false;
      }

      if (!data.is_valid) {
        setValidationError(data.message || 'Please enter a technology-related topic.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationError('Unable to validate input. Please try again.');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;
    
    // Validate input before creating topic
    const isValid = await validateTopicInput(topicInput);
    if (!isValid) return;
    
    createTopicMutation.mutate({ name: topicInput.trim() });
  };

  // Clear validation error when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopicInput(e.target.value);
    if (validationError) {
      setValidationError('');
    }
  };

  const handleTopicClick = (topicId: string) => {
    navigate(`/topics/${topicId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation(); // Prevent triggering topic navigation
    setTopicToDelete(topic);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (topicToDelete) {
      deleteTopicMutation.mutate(topicToDelete.id);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setTopicToDelete(null);
  };

  const handleToggleVisibility = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation(); // Prevent triggering topic navigation
    setPublishingTopicId(topic.id);
    toggleVisibilityMutation.mutate({
      topicId: topic.id,
      isPublic: !topic.is_public,
    });
  };

  const getCompletionPercentage = (topic: Topic) => {
    if (!topic.subtopics || topic.subtopics.length === 0) return 0;
    
    // For public topics, use localStorage-based progress
    if (viewMode === 'public') {
      return calculatePublicTopicCompletion(topic.id, topic.subtopics.length);
    }
    
    // For private topics, use the original logic
    return Math.round((topic.completed_subtopics.length / topic.subtopics.length) * 100);
  };

  // Pagination calculations
  const filteredTopics = topics
    .filter(topic => topic.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filteredTopics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTopics = filteredTopics.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to page 1 when topics change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [topics.length, currentPage, totalPages]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center">
        <ErrorMessage error="Failed to load topics. Please try again." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary transition-colors duration-300 relative overflow-hidden">
      {/* Diagonal waves background */}
      <motion.div
        className="absolute inset-0 opacity-22"
        animate={{
          background: [
            "linear-gradient(45deg, transparent 0%, #00FF47 20%, transparent 40%, #00FF73 60%, transparent 80%)",
            "linear-gradient(135deg, transparent 0%, #00FF73 20%, transparent 40%, #00FF47 60%, transparent 80%)",
            "linear-gradient(225deg, transparent 0%, #00FF47 20%, transparent 40%, #00FF73 60%, transparent 80%)",
            "linear-gradient(315deg, transparent 0%, #00FF73 20%, transparent 40%, #00FF47 60%, transparent 80%)",
            "linear-gradient(45deg, transparent 0%, #00FF47 20%, transparent 40%, #00FF73 60%, transparent 80%)",
          ],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <AnimatedSection className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-theme-primary mb-4 mt-6 transition-colors duration-300">
            My Learning Topics
          </h1>
          <p className="text-lg sm:text-xl text-theme-secondary max-w-2xl mx-auto transition-colors duration-300">
            Create personalized roadmaps for any technology you want to master
          </p>
        </AnimatedSection>

        {/* Topic Creation Section */}
        <AnimatedSection delay={0.3} className="mb-12">
          <div className="bg-theme-secondary rounded-xl shadow-sm border border-theme p-6 sm:p-8 transition-colors duration-300">
            <h2 className="text-xl sm:text-2xl font-semibold text-theme-primary mb-6 transition-colors duration-300">
              What do you want to learn?
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-theme-secondary h-5 w-5" />
                <input
                  type="text"
                  value={topicInput}
                  onChange={handleInputChange}
                  placeholder="What do you want to master? e.g., useEffect, SQL joins, tailwind layout..."
                  className={`w-full pl-12 pr-4 py-4 bg-theme-primary border-2 ${
                    validationError 
                      ? 'border-red-400 dark:border-red-500' 
                      : 'border-purple-300 dark:border-purple-600'
                  } text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm placeholder-theme-secondary text-base sm:text-lg`}
                />
              </div>
              
              <motion.button
                type="submit"
                disabled={!topicInput.trim() || createTopicMutation.isPending || isValidating}
                className="w-full sm:w-auto bg-purple-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 hover:shadow-lg"
                whileHover={{ scale: topicInput.trim() && !createTopicMutation.isPending && !isValidating ? 1.02 : 1, y: topicInput.trim() && !createTopicMutation.isPending && !isValidating ? -2 : 0 }}
                whileTap={{ scale: topicInput.trim() && !createTopicMutation.isPending && !isValidating ? 0.98 : 1 }}
              >
                {createTopicMutation.isPending || isValidating ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                    <span>Generate Learning Roadmap</span>
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-all duration-200" />
                  </>
                )}
              </motion.button>

              {/* Validation Error Display */}
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-error text-sm font-medium">
                    {validationError}
                  </p>
                </motion.div>
              )}
            </form>
          </div>
        </AnimatedSection>

        {/* Topics List Section */}
        <AnimatedSection delay={0} amount={0.1}>
          <div className="space-y-6">
            {/* Toggle switch on its own line - full width */}
            <div className="w-full flex justify-center mb-4 px-4">
              <ToggleSwitch
                value={viewMode}
                onChange={(value) => setViewMode(value as 'private' | 'public')}
                options={[
                  { value: 'private', label: 'Private' },
                  { value: 'public', label: 'Public' }
                ]}
                fullWidth={true}
                className="w-full max-w-md"
              />
            </div>
            
            {/* Title and search on separate line */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              {/* Left: Title with count */}
              <h2 className="text-xl sm:text-2xl font-semibold text-theme-primary transition-colors duration-300 text-center sm:text-left">
                {viewMode === 'private' ? 'Your Learning Topics' : 'Public Topics'} 
                {topics.length > 0 && ` (${topics.length})`}
              </h2>
              
              {/* Search Input - Only show when there are topics */}
              {topics.length > 0 && (
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-secondary h-4 w-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topics..."
                    className="w-full pl-10 pr-4 py-2 bg-theme-secondary border border-theme rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-theme-primary placeholder-theme-secondary text-sm"
                  />
                </div>
              )}
            </div>

            {topics.length === 0 ? (
              // Empty State
              <div className="bg-theme-secondary rounded-xl shadow-sm border border-theme p-6 sm:p-8 transition-colors duration-300">
                <div className="text-center py-12">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                  >
                    <div className="mx-auto w-24 h-24 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="h-12 w-12 text-purple-500" />
                    </div>
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold text-theme-primary mb-3 transition-colors duration-300">
                    {viewMode === 'private' ? 'No topics created yet' : 'No public topics available'}
                  </h3>
                  <p className="text-theme-secondary mb-6 max-w-md mx-auto transition-colors duration-300">
                    {viewMode === 'private' 
                      ? 'Start by adding your first learning topic above. Our AI will create a personalized roadmap just for you!'
                      : 'No public topics have been shared yet. Check back later or create your own topics to share!'
                    }
                  </p>
                  
                  {viewMode === 'private' && (
                    <motion.button
                      onClick={() => document.querySelector('input')?.focus()}
                      className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Create your first topic
                    </motion.button>
                  )}
                </div>
              </div>
            ) : (
              // Topics List
              <div className="space-y-4">
                <motion.div 
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                >
                  {currentTopics.length === 0 ? (
                    // No search results
                    <div className="text-center py-12">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6"
                      >
                        <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                          <Search className="h-8 w-8 text-purple-500" />
                        </div>
                      </motion.div>
                      
                      <h3 className="text-lg font-semibold text-theme-primary mb-2 transition-colors duration-300">
                        No topics found
                      </h3>
                      <p className="text-theme-secondary transition-colors duration-300">
                        {searchQuery ? `No topics match "${searchQuery}"` : 'No topics to display'}
                      </p>
                      {searchQuery && (
                        <motion.button
                          onClick={() => setSearchQuery('')}
                          className="mt-4 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Clear search
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    currentTopics.map((topic) => (
                    <motion.div
                      key={topic.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      className="bg-theme-secondary rounded-xl shadow-sm border border-theme transition-colors duration-300 cursor-pointer hover:shadow-lg"
                      onClick={() => {
                        if (viewMode === 'public') {
                          // For public topics, navigate to detail page but with read-only mode
                          handleTopicClick(topic.id);
                        } else {
                          handleTopicClick(topic.id);
                        }
                      }}
                      whileHover={{ scale: 1.005, y: -1 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-theme-primary mb-2 transition-colors duration-300">
                              {topic.name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-theme-secondary">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(topic.created_at).toLocaleDateString()}
                              </span>
                              {/* Show author for public topics */}
                              {viewMode === 'public' && topic.user_name && (
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  by {topic.user_name}
                                </span>
                              )}
                              {topic.subtopics && topic.subtopics.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  {topic.completed_subtopics.length}/{topic.subtopics.length} completed
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="text-right">
                              {topic.subtopics && topic.subtopics.length > 0 && (
                                <div className="text-2xl font-bold text-theme-accent mb-1">
                                  {getCompletionPercentage(topic)}%
                                </div>
                              )}
                              <div className="text-xs text-theme-secondary">
                                {topic.subtopics && topic.subtopics.length > 0 ? 'Progress' : 'Click to start'}
                              </div>
                            </div>
                            
                            {/* Publish/Unpublish Button - Only show for user's own topics */}
                            {viewMode === 'private' && (
                              <motion.button
                                onClick={(e) => handleToggleVisibility(e, topic)}
                                disabled={publishingTopicId === topic.id}
                                className={`p-2 rounded-lg transition-all duration-200 ${
                                  topic.is_public
                                    ? 'text-green-600 hover:text-green-700 hover:bg-green-500/10'
                                    : 'text-theme-secondary hover:text-green-600 hover:bg-green-500/10'
                                }`}
                                whileHover={{ scale: publishingTopicId === topic.id ? 1 : 1.1 }}
                                whileTap={{ scale: publishingTopicId === topic.id ? 1 : 0.9 }}
                                title={topic.is_public ? 'Make private' : 'Make public'}
                              >
                                {publishingTopicId === topic.id ? (
                                  <Loader className="w-4 h-4 animate-spin" />
                                ) : topic.is_public ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <EyeOff className="w-4 h-4" />
                                )}
                              </motion.button>
                            )}
                            
                            {/* Delete Button - Only show for user's own topics */}
                            {viewMode === 'private' && (
                              <motion.button
                                onClick={(e) => handleDeleteClick(e, topic)}
                                className="p-2 text-theme-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Delete topic"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <div className="w-full h-2 bg-theme-hover rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-theme-accent rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${getCompletionPercentage(topic)}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        )}

                        {/* Time Estimate */}
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <div className="mt-4 flex items-center justify-between text-sm text-theme-secondary">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {Math.ceil(topic.subtopics.length * 1.5)}-{Math.ceil(topic.subtopics.length * 2.5)} hours
                            </span>
                            <span>{topic.subtopics.length} subtopics</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                  )}
                </motion.div>

                {/* Pagination */}
                {filteredTopics.length > 0 && totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex justify-center items-center space-x-2 mt-8"
                  >
                    {/* Previous Button */}
                    <motion.button
                      onClick={handlePrevious}
                      disabled={currentPage === 1}
                      whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                      whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                      className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                        currentPage === 1
                          ? 'bg-theme-secondary/30 text-theme-secondary cursor-not-allowed'
                          : 'bg-theme-secondary/20 text-theme-primary hover:bg-theme-secondary/40'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </motion.button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <motion.button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-theme-secondary/20 text-theme-primary hover:bg-theme-secondary/40'
                        }`}
                      >
                        {page}
                      </motion.button>
                    ))}

                    {/* Next Button */}
                    <motion.button
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                      whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                      whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                      className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                        currentPage === totalPages
                          ? 'bg-theme-secondary/30 text-theme-secondary cursor-not-allowed'
                          : 'bg-theme-secondary/20 text-theme-primary hover:bg-theme-secondary/40'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && topicToDelete && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto">
            {/* Backdrop with theme-aware blur */}
            <div 
              className="fixed inset-0 bg-theme-primary/90 backdrop-blur-sm transition-opacity duration-300"
              onClick={handleCancelDelete}
            />
            
            {/* Modal - Fixed in center of viewport */}
            <div className="flex min-h-full items-center justify-center p-6">
              <div 
                className="relative bg-theme-secondary rounded-lg shadow-xl max-w-md w-full p-6 transition-all duration-300 animate-in zoom-in-95 border border-theme"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <h3 className="text-lg font-semibold text-theme-primary transition-colors duration-300">
                    Delete Topic?
                  </h3>
                </div>
                
                <div className="mb-6">
                  <p className="text-theme-secondary mb-4 transition-colors duration-300">
                    Are you sure you want to delete "<strong>{topicToDelete.name}</strong>"? This action will:
                  </p>
                  <ul className="text-sm text-theme-secondary space-y-2 mb-4 transition-colors duration-300">
                    <li className="flex items-start space-x-2">
                      <span className="text-red-500 font-bold mt-0.5">•</span>
                      <span><strong>Permanently delete the topic</strong> and all its content</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-500 font-bold mt-0.5">•</span>
                      <span><strong>Remove all subtopics and progress</strong> associated with this topic</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-500 font-bold mt-0.5">•</span>
                      <span><strong>Cannot be undone</strong> - The topic cannot be recovered</span>
                    </li>
                  </ul>
                  
                  {topicToDelete.subtopics && topicToDelete.subtopics.length > 0 && getCompletionPercentage(topicToDelete) > 0 && (
                    <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">
                          You have {getCompletionPercentage(topicToDelete)}% progress that will be lost!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 text-theme-secondary bg-theme-hover rounded-lg hover:bg-theme-accent hover:text-white transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleteTopicMutation.isPending}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {deleteTopicMutation.isPending ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Yes, Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTopicsPage;