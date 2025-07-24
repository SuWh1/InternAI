import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, ArrowRight, Clock, CheckCircle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AnimatedSection from '../components/common/AnimatedSection';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { topicService } from '../services/topicService';
import type { Topic } from '../services/topicService';

const MyTopicsPage = () => {
  const [topicInput, setTopicInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch topics using React Query
  const { data: topicsData, isLoading, error } = useQuery({
    queryKey: ['topics'],
    queryFn: topicService.getTopics,
  });

  const topics = topicsData?.topics || [];

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: topicService.createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      setTopicInput('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;
    
    createTopicMutation.mutate({ name: topicInput.trim() });
  };

  const handleTopicClick = (topicId: string) => {
    navigate(`/topics/${topicId}`);
  };

  const getCompletionPercentage = (topic: Topic) => {
    if (!topic.subtopics || topic.subtopics.length === 0) return 0;
    return Math.round((topic.completed_subtopics.length / topic.subtopics.length) * 100);
  };

  // Pagination calculations
  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
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
      {/* Creative animated background with multiple layers */}
      {/* Layer 1: Floating orbs */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 15% 25%, #00FF47 0%, transparent 40%), radial-gradient(circle at 85% 75%, #00FF73 0%, transparent 35%)",
            "radial-gradient(circle at 75% 15%, #00FF47 0%, transparent 40%), radial-gradient(circle at 25% 85%, #00FF73 0%, transparent 35%)",
            "radial-gradient(circle at 45% 65%, #00FF47 0%, transparent 40%), radial-gradient(circle at 65% 35%, #00FF73 0%, transparent 35%)",
            "radial-gradient(circle at 15% 25%, #00FF47 0%, transparent 40%), radial-gradient(circle at 85% 75%, #00FF73 0%, transparent 35%)",
          ],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Layer 2: Diagonal waves */}
      <motion.div
        className="absolute inset-0 opacity-15"
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
      
      {/* Layer 3: Pulsing spots */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          background: [
            "radial-gradient(ellipse 200px 100px at 20% 50%, #00FF47 0%, transparent 70%), radial-gradient(ellipse 150px 200px at 80% 30%, #00FF73 0%, transparent 70%), radial-gradient(ellipse 100px 150px at 60% 80%, #00FF47 0%, transparent 70%)",
            "radial-gradient(ellipse 150px 200px at 30% 40%, #00FF47 0%, transparent 70%), radial-gradient(ellipse 200px 100px at 70% 60%, #00FF73 0%, transparent 70%), radial-gradient(ellipse 180px 120px at 50% 20%, #00FF47 0%, transparent 70%)",
            "radial-gradient(ellipse 180px 120px at 40% 70%, #00FF47 0%, transparent 70%), radial-gradient(ellipse 120px 180px at 60% 40%, #00FF73 0%, transparent 70%), radial-gradient(ellipse 160px 100px at 80% 70%, #00FF47 0%, transparent 70%)",
            "radial-gradient(ellipse 200px 100px at 20% 50%, #00FF47 0%, transparent 70%), radial-gradient(ellipse 150px 200px at 80% 30%, #00FF73 0%, transparent 70%), radial-gradient(ellipse 100px 150px at 60% 80%, #00FF47 0%, transparent 70%)",
          ],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Layer 4: Subtle mesh pattern */}
      <motion.div
        className="absolute inset-0 opacity-8"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #00FF47 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, #00FF73 1px, transparent 1px),
            radial-gradient(circle at 25% 75%, #00FF47 1px, transparent 1px),
            radial-gradient(circle at 75% 25%, #00FF73 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px, 120px 120px, 80px 80px, 90px 90px'
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 60,
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
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="What do you want to master? e.g., useEffect, SQL joins, tailwind layout..."
                  className="w-full pl-12 pr-4 py-4 bg-theme-primary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm placeholder-theme-secondary text-base sm:text-lg"
                />
              </div>
              
              <motion.button
                type="submit"
                disabled={!topicInput.trim() || createTopicMutation.isPending}
                className="w-full sm:w-auto bg-purple-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 hover:shadow-lg"
                whileHover={{ scale: topicInput.trim() && !createTopicMutation.isPending ? 1.02 : 1, y: topicInput.trim() && !createTopicMutation.isPending ? -2 : 0 }}
                whileTap={{ scale: topicInput.trim() && !createTopicMutation.isPending ? 0.98 : 1 }}
              >
                {createTopicMutation.isPending ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                    <span>Generate Learning Roadmap</span>
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-all duration-200" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </AnimatedSection>

        {/* Topics List Section */}
        <AnimatedSection delay={0} amount={0.1}>
          <div className="space-y-6">
            {topics.length === 0 ? (
              // Empty State
              <div className="bg-theme-secondary rounded-xl shadow-sm border border-theme p-6 sm:p-8 transition-colors duration-300">
                <h2 className="text-xl sm:text-2xl font-semibold text-theme-primary mb-6 transition-colors duration-300">
                  Your Learning Topics
                </h2>
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
                    No topics created yet
                  </h3>
                  <p className="text-theme-secondary mb-6 max-w-md mx-auto transition-colors duration-300">
                    Start by adding your first learning topic above. Our AI will create a personalized roadmap just for you!
                  </p>
                  
                  <motion.button
                    onClick={() => document.querySelector('input')?.focus()}
                    className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Create your first topic
                  </motion.button>
                </div>
              </div>
            ) : (
              // Topics List
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-theme-primary transition-colors duration-300">
                    Your Learning Topics ({filteredTopics.length}{filteredTopics.length !== topics.length ? ` of ${topics.length}` : ''})
                  </h2>
                  
                  {/* Search Input */}
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
                      onClick={() => handleTopicClick(topic.id)}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
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
                              {topic.subtopics && topic.subtopics.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  {topic.completed_subtopics.length}/{topic.subtopics.length} completed
                                </span>
                              )}
                            </div>
                          </div>
                          
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
      </div>
    </div>
  );
};

export default MyTopicsPage;