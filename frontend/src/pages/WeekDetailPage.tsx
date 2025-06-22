import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Target, BookOpen, CheckCircle, Circle, ExternalLink, Brain } from 'lucide-react';
import agentService from '../services/agentService';
import TopicDetailsModal from '../components/roadmap/TopicDetailsModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { useRoadmap } from '../hooks/useRoadmap';
import type { WeekData, GPTTopicResponse } from '../types/roadmap';

const WeekDetailPage: React.FC = () => {
  const { weekNumber } = useParams<{ weekNumber: string }>();
  const navigate = useNavigate();
  const { roadmap, progress, updateProgress, loading: roadmapLoading, error: roadmapError } = useRoadmap();
  
  const [week, setWeek] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  
  // Topic details modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{
    topic: string;
    context: string;
    details?: GPTTopicResponse;
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (roadmap && progress.length > 0) {
      loadWeekData();
    } else if (!roadmapLoading) {
      setLoading(false);
    }
  }, [weekNumber, roadmap, progress, roadmapLoading]);

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
      // Convert task IDs to indices for backward compatibility
      const taskIndices = weekProgress.completed_tasks
        .map((taskId: string) => parseInt(taskId.replace('task-', '')))
        .filter((index: number) => !isNaN(index));
      setCompletedTasks(new Set(taskIndices));
    }
    
    setLoading(false);
    setError(null);
  };

  const handleTaskToggle = async (taskIndex: number) => {
    const newCompletedTasks = new Set(completedTasks);
    const isCompleting = !newCompletedTasks.has(taskIndex);
    
    if (newCompletedTasks.has(taskIndex)) {
      newCompletedTasks.delete(taskIndex);
    } else {
      newCompletedTasks.add(taskIndex);
    }
    
    // Update local state immediately for responsiveness
    setCompletedTasks(newCompletedTasks);
    
    // Use the shared updateProgress function
    const weekNum = parseInt(weekNumber || '1');
    const taskId = `task-${taskIndex}`;
    
    try {
      await updateProgress(weekNum, taskId, isCompleting);
    } catch (error) {
      // Revert local state on error
      setCompletedTasks(completedTasks);
      console.error('Error updating progress:', error);
    }
  };

  const handleGetTopicDetails = async (topic: string, context: string) => {
    setSelectedTopic({ topic, context });
    setDetailsModalOpen(true);
    setLoadingDetails(true);

    try {
      const details = await agentService.getTopicDetails({
        topic,
        context,
        user_level: 'intermediate'
      });
      
      setSelectedTopic(prev => prev ? { ...prev, details } : null);
    } catch (error) {
      console.error('Error fetching topic details:', error);
      setSelectedTopic(prev => prev ? { 
        ...prev, 
        details: {
          success: false,
          explanation: 'Failed to load detailed explanation. Please try again.',
          cached: false
        }
      } : null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setDetailsModalOpen(false);
    setSelectedTopic(null);
  };

  const getCompletionPercentage = () => {
    if (!week?.tasks?.length) return 0;
    
    // Use backend progress data as source of truth
    const weekNum = parseInt(weekNumber || '1');
    const weekProgress = progress.find(p => p.week_number === weekNum);
    
    if (weekProgress) {
      return weekProgress.completion_percentage;
    }
    
    // Fallback to local state calculation
    return Math.round((completedTasks.size / week.tasks.length) * 100);
  };

  if (loading || roadmapLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || roadmapError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage error={error || roadmapError || 'An error occurred'} />
      </div>
    );
  }

  if (!week) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">Week not found</div>
          <button
            onClick={() => navigate('/my-roadmap')}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Return to Roadmap
          </button>
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/my-roadmap')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Roadmap
            </button>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Week {week.week_number}: {week.theme}
              </h1>
              <p className="text-gray-600 mb-4">
                Focus Area: <span className="font-medium text-blue-600">{week.focus_area}</span>
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {completionPercentage}%
              </div>
              <div className="text-sm text-gray-500">Complete</div>
              <div className="w-24 h-2 bg-gray-200 rounded-full mt-2">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Tasks Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Tasks ({completedTasks.size}/{week.tasks?.length || 0})
                </h2>
              </div>
              
              <div className="space-y-4">
                {week.tasks?.map((task, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                      completedTasks.has(index)
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <button
                      onClick={() => handleTaskToggle(index)}
                      className="mt-0.5 transition-colors"
                    >
                      {completedTasks.has(index) ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 hover:text-blue-600" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <p className={`text-sm leading-relaxed ${
                        completedTasks.has(index) 
                          ? 'text-green-800 line-through' 
                          : 'text-gray-700'
                      }`}>
                        {task}
                      </p>
                      
                      <button
                        onClick={() => handleGetTopicDetails(task, `Week ${week.week_number} task`)}
                        className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Brain className="w-3 h-3" />
                        Get AI Explanation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Deliverables</h2>
              </div>
              
              <div className="space-y-3">
                {week.deliverables?.map((deliverable, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <Target className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-purple-800 text-sm">{deliverable}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Time Estimate */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Time Estimate</h3>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {week.estimated_hours}
                </div>
                <div className="text-sm text-gray-600">hours this week</div>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Resources</h3>
              </div>
              
              <div className="space-y-3">
                {week.resources?.map((resource, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <ExternalLink className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <button
                      onClick={() => handleGetTopicDetails(resource, `Resource for Week ${week.week_number}`)}
                      className="text-sm text-orange-700 hover:text-orange-800 text-left transition-colors"
                    >
                      {resource}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Navigate</h3>
              <div className="space-y-2">
                {week.week_number > 1 && (
                  <button
                    onClick={() => navigate(`/roadmap/week/${week.week_number - 1}`)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    ← Week {week.week_number - 1}
                  </button>
                )}
                <button
                  onClick={() => navigate('/my-roadmap')}
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
                >
                  📊 Full Roadmap
                </button>
                <button
                  onClick={() => navigate(`/roadmap/week/${week.week_number + 1}`)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Week {week.week_number + 1} →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Details Modal */}
      {detailsModalOpen && selectedTopic && (
        <TopicDetailsModal
          isOpen={detailsModalOpen}
          onClose={handleCloseModal}
          topic={selectedTopic.topic}
          context={selectedTopic.context}
          details={selectedTopic.details}
          loading={loadingDetails}
        />
      )}
    </div>
  );
};

export default WeekDetailPage; 