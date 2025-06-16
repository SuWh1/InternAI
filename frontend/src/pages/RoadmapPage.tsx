import { Link } from 'react-router-dom';
import { Calendar, Code, CheckCircle, Clock, ArrowRight, Star, Download } from 'lucide-react';
import type { Roadmap, ChecklistItem } from '../types/api';
import { useApi, useApiMutation } from '../hooks/useApi';
import apiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const RoadmapPage = () => {
  // Fetch roadmap from API
  const { 
    data: roadmap, 
    loading: roadmapLoading, 
    error: roadmapError,
    refetch: refetchRoadmap 
  } = useApi(() => apiService.getRoadmap());

  // Update checklist item mutation
  const { 
    mutate: updateChecklistItem, 
    loading: updatingChecklist 
  } = useApiMutation(({ itemId, completed }: { itemId: string; completed: boolean }) =>
    apiService.updateChecklistItem(itemId, { completed })
  );

  // Export PDF mutation
  const { 
    mutate: exportPDF, 
    loading: exporting 
  } = useApiMutation(apiService.exportRoadmapPDF.bind(apiService));

  const handleChecklistToggle = async (itemId: string, completed: boolean) => {
    try {
      await updateChecklistItem({ itemId, completed });
      refetchRoadmap(); // Refresh the roadmap data
    } catch (error) {
      console.error('Failed to update checklist item:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await exportPDF(undefined);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'roadmap.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  // Loading state
  if (roadmapLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="large" className="mx-auto mb-4" />
              <p className="text-gray-600">Loading your roadmap...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (roadmapError || !roadmap) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-20">
            <ErrorMessage
              error={roadmapError || 'Failed to load roadmap'}
              onRetry={refetchRoadmap}
              className="max-w-md mx-auto"
            />
            <div className="text-center mt-6">
              <Link to="/onboarding" className="text-blue-600 hover:text-blue-700">
                Start onboarding →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Your Personalized Roadmap
              </h1>
              <div className="bg-blue-50 rounded-lg p-4 max-w-2xl">
                <p className="text-blue-800">
                  You're a <strong>{roadmap.year}</strong> aiming for <strong>{roadmap.target}</strong>. 
                  Based on your <strong>{roadmap.experience}</strong> level and <strong>{roadmap.timeCommitment}</strong> 
                  weekly commitment, here's your path to success.
                </p>
              </div>
            </div>
            <button 
              onClick={handleExportPDF}
              disabled={exporting}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {exporting ? (
                <LoadingSpinner size="small" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Learning Plan */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <Calendar className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Learning Plan</h2>
              </div>
              
              <div className="space-y-4">
                {roadmap.learningPlan.map((week, index) => (
                  <div key={week.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{week.week}: {week.topic}</h3>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {week.hours}h
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {week.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className="flex items-center text-gray-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Plan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Code className="h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">Project Plan</h2>
              </div>
              
              <div className="grid gap-6">
                {roadmap.projects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{project.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        project.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                        project.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {project.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{project.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {project.skills.map((skill, skillIndex) => (
                          <span key={skillIndex} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{project.estimatedHours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Final Checklist */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Final Checklist</h2>
              </div>
              
              <div className="space-y-3">
                {roadmap.checklist.map((item) => (
                  <label key={item.id} className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={item.completed}
                      onChange={(e) => handleChecklistToggle(item.id, e.target.checked)}
                      disabled={updatingChecklist}
                    />
                    <span className="text-gray-700 text-sm">{item.item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Upsell Card */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Star className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Get Expert Help</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Want personalized feedback on your resume and projects? Our experts can help you stand out.
              </p>
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                Get Resume Review - $29
              </button>
            </div>

            {/* Dashboard CTA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Ready to Start?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Track your progress and get weekly updates in your personal dashboard.
              </p>
              <Link 
                to="/dashboard"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;