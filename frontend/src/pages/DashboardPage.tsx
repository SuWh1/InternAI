import { useState } from 'react';
import { CheckCircle, TrendingUp, Calendar, Send, AlertCircle } from 'lucide-react';
import type { Task, UserStats, Feedback } from '../types/api';
import { useApi, useApiMutation } from '../hooks/useApi';
import apiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const DashboardPage = () => {
  const [feedback, setFeedback] = useState('');

  // Fetch dashboard data from API
  const { 
    data: dashboardData, 
    loading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useApi(() => apiService.getDashboardData());

  // Update task mutation
  const { 
    mutate: updateTask, 
    loading: updatingTask 
  } = useApiMutation(({ taskId, completed }: { taskId: string; completed: boolean }) =>
    apiService.updateTask(taskId, { completed })
  );

  // Submit feedback mutation
  const { 
    mutate: submitFeedback, 
    loading: submittingFeedback,
    error: feedbackError 
  } = useApiMutation(apiService.submitFeedback.bind(apiService));

  const tasks = dashboardData?.tasks || [];
  const stats = dashboardData?.stats || { tasksCompleted: 0, currentStreak: 0, hoursLogged: 0, totalTasks: 0 };
  const upcomingDeadlines = dashboardData?.upcomingDeadlines || [];

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      await updateTask({ taskId, completed });
      refetchDashboard(); // Refresh the dashboard data
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) return;

    try {
      await submitFeedback({ content: feedback });
      setFeedback('');
      alert('Thank you for your feedback! We\'ll review it and get back to you.');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  // Loading state
  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="large" className="mx-auto mb-4" />
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-20">
            <ErrorMessage
              error={dashboardError}
              onRetry={refetchDashboard}
              className="max-w-md mx-auto"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Track your progress and stay on top of your internship preparation</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Weekly Progress</h2>
                <span className="text-sm text-gray-500">Current Week</span>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-600">{completedTasks}/{totalTasks} tasks</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="text-right mt-1">
                  <span className="text-sm font-medium text-blue-600">{progressPercentage}% Complete</span>
                </div>
              </div>

              {progressPercentage >= 70 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Great progress! You're on track to complete this week's goals.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Weekly Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Calendar className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">This Week's Tasks</h2>
              </div>
              
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tasks available. Complete your onboarding to get started!</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <button
                        onClick={() => handleTaskToggle(task.id, !task.completed)}
                        disabled={updatingTask}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-300 hover:border-blue-400'
                        } ${updatingTask ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {task.completed && <CheckCircle className="h-3 w-3" />}
                      </button>
                      
                      <div className="flex-1">
                        <span className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </span>
                      </div>
                      
                      <span className="text-sm text-gray-500">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Feedback Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Send className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Submit for Feedback</h2>
              </div>
              
              <p className="text-gray-600 mb-4">
                Share your progress, ask questions, or request help with any challenges you're facing.
              </p>

              {/* Feedback Error */}
              {feedbackError && (
                <ErrorMessage
                  error={feedbackError}
                  className="mb-4"
                />
              )}
              
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us about your progress, challenges, or questions..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={submittingFeedback}
              />
              
              <button
                onClick={handleFeedbackSubmit}
                disabled={!feedback.trim() || submittingFeedback}
                className={`mt-3 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  feedback.trim() && !submittingFeedback
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submittingFeedback ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Feedback</span>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Your Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tasks Completed</span>
                  <span className="font-semibold text-gray-900">{stats.tasksCompleted}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Streak</span>
                  <span className="font-semibold text-gray-900">{stats.currentStreak} days</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Hours Logged</span>
                  <span className="font-semibold text-gray-900">{stats.hoursLogged}h</span>
                </div>
              </div>
            </div>

            {/* Motivational Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">💡 Daily Tip</h3>
              </div>
              <p className="text-gray-700 text-sm">
                Consistency beats perfection! Even 30 minutes of coding practice daily will compound into significant progress over time.
              </p>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900">Upcoming Deadlines</h3>
              </div>
              
              <div className="space-y-3">
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-sm text-gray-500">No upcoming deadlines</p>
                ) : (
                  upcomingDeadlines.map((deadline, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{deadline.item}</span>
                      <span className={`font-medium ${
                        deadline.daysLeft <= 3 ? 'text-orange-600' : 'text-gray-500'
                      }`}>
                        {deadline.daysLeft <= 0 ? 'Today' : `${deadline.daysLeft} days left`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors">
                  📚 View Learning Resources
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors">
                  💼 Update Resume
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors">
                  🎯 Adjust Goals
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors">
                  📈 View Detailed Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;