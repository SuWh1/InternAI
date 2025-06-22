import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Loader, 
  AlertCircle, 
  RefreshCw, 
  Upload,
  Play,
  BarChart3,
  X,
  AlertTriangle
} from 'lucide-react';
import InteractiveRoadmap from '../components/roadmap/InteractiveRoadmap';
import { useRoadmap } from '../hooks/useRoadmap';

const MyRoadmapPage = () => {
  const {
    roadmap,
    progress,
    loading,
    error,
    canRunPipeline,
    pipelineStatus,
    generateRoadmap,
    updateProgress,
    refreshStatus,
    clearError
  } = useRoadmap();

  const [resumeText, setResumeText] = useState('');
  const [showResumeInput, setShowResumeInput] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  const handleGenerateRoadmap = async () => {
    const request = resumeText.trim() ? { resume_text: resumeText } : {};
    await generateRoadmap(request);
    setShowResumeInput(false);
    setResumeText('');
  };

  const handleRegenerateClick = () => {
    setShowRegenerateConfirm(true);
  };

  const handleConfirmRegenerate = async () => {
    setShowRegenerateConfirm(false);
    await generateRoadmap();
  };

  const handleCancelRegenerate = () => {
    setShowRegenerateConfirm(false);
  };

  const handleNodeClick = (node: any) => {
    console.log('Node clicked:', node);
  };

  const handleProgressUpdate = async (weekNumber: number, taskId: string, completed: boolean) => {
    await updateProgress(weekNumber, taskId, completed);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showRegenerateConfirm) {
        setShowRegenerateConfirm(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showRegenerateConfirm]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (showRegenerateConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showRegenerateConfirm]);

  // Calculate overall progress
  const overallProgress = progress.length > 0 
    ? Math.round(progress.reduce((sum, week) => sum + week.completion_percentage, 0) / progress.length)
    : 0;

  return (
    <div className="min-h-screen pt-16 bg-slate-50 animate-slide-up-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <MapPin className="h-16 w-16 text-blue-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            My Career Roadmap
          </h1>
          <p className="text-xl text-gray-600">
            Your personalized journey to landing your dream internship
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading State for Regeneration */}
        {loading && roadmap !== null && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center">
              <div className="relative">
                <RefreshCw className="h-16 w-16 text-blue-500 mx-auto mb-6 animate-spin" />
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse opacity-20"></div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Regenerating Your Roadmap
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Our AI agents are creating a fresh, personalized roadmap just for you. 
                This may take a few moments...
              </p>
              
              {/* Progress Steps */}
              <div className="max-w-md mx-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Analyzing your profile</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                    <span className="text-sm text-gray-600">Generating AI roadmap</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
                    <span className="text-sm text-gray-600">Finding internship matches</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Initial Generation Loading State */}
        {!roadmap && loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center">
              <div className="relative">
                <Play className="h-16 w-16 text-blue-500 mx-auto mb-6 animate-bounce" />
                {/* <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse opacity-20"></div> */}
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Creating Your Personalized Roadmap
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Our AI agents are analyzing your profile and creating a customized 
                internship preparation roadmap just for you. This will take a few moments...
              </p>
              
              {/* Progress Steps */}
              <div className="max-w-md mx-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Processing your background</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                    <span className="text-sm text-gray-600">Generating personalized roadmap</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
                    <span className="text-sm text-gray-600">Finding matching internships</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap Status & Controls */}
        {!roadmap && !loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center">
              {!canRunPipeline ? (
                <>
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Complete Onboarding First
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    {pipelineStatus?.reason || 'Please complete your onboarding to generate your personalized roadmap.'}
                  </p>
                  {pipelineStatus?.missing_requirements && (
                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900 mb-2">Missing Requirements:</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {pipelineStatus.missing_requirements.map((req: string, index: number) => (
                          <li key={index}>• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={refreshStatus}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Check Status</span>
                  </button>
                </>
              ) : (
                <>
                  <Play className="h-16 w-16 text-blue-500 mx-auto mb-6" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Generate Your Roadmap
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Ready to create your personalized internship preparation roadmap! 
                    You can optionally upload your resume for more tailored recommendations.
                  </p>
                  
                  {/* Resume Upload Option */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowResumeInput(!showResumeInput)}
                      className="text-blue-500 hover:text-blue-600 flex items-center space-x-2 mx-auto mb-4"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Add Resume (Optional)</span>
                    </button>
                    
                    {showResumeInput && (
                      <div className="max-w-2xl mx-auto">
                        <textarea
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          placeholder="Paste your resume text here for more personalized recommendations..."
                          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleGenerateRoadmap}
                    disabled={loading}
                    className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-5 h-5" />
                    <span>Generate My Roadmap</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : roadmap && !loading ? (
          <>
            {/* Progress Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Progress Overview</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <span className="text-2xl font-bold text-blue-600">{overallProgress}%</span>
                    <span className="text-gray-600">Complete</span>
                  </div>
                  <button
                    onClick={handleRegenerateClick}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
              
              {/* Progress Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {progress.filter(w => w.completion_percentage === 100).length}
                  </div>
                  <div className="text-sm text-gray-600">Weeks Completed</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {roadmap.weeks.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Weeks</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <MapPin className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {roadmap.personalization_factors.focus_areas.length}
                  </div>
                  <div className="text-sm text-gray-600">Focus Areas</div>
                </div>
              </div>
            </div>

            {/* Interactive Roadmap */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Interactive Roadmap</h2>
                <p className="text-gray-600 text-sm">
                  Click on week nodes to expand details, mark tasks as complete, and get AI-powered explanations.
                </p>
              </div>
              
              <div className="h-[800px] w-full">
                <InteractiveRoadmap
                  roadmap={roadmap}
                  progress={progress}
                  onNodeClick={handleNodeClick}
                  onProgressUpdate={handleProgressUpdate}
                  className="border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </>
        ) : null}

        {/* Regenerate Confirmation Modal */}
        {showRegenerateConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop with blurred gradient */}
            <div 
              className="fixed inset-0 bg-gradient-to-br from-blue-100/90 via-white/80 to-indigo-200/90 backdrop-blur-sm transition-opacity duration-200"
              onClick={handleCancelRegenerate}
            />
            
            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-6">
              <div 
                className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all duration-200 animate-in zoom-in-95 slide-in-from-bottom-2"
                onClick={(e) => e.stopPropagation()}
              >
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Regenerate Roadmap?
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to regenerate your roadmap? This action will:
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span><strong>Reset all your progress</strong> - All completed tasks will become unchecked</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span><strong>Create a completely new roadmap</strong> with different tasks and content</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span><strong>Replace your current roadmap</strong> - The old one cannot be recovered</span>
                  </li>
                </ul>
                
                {overallProgress > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">
                        You have {overallProgress}% progress that will be lost!
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={handleCancelRegenerate}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRegenerate}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Yes, Regenerate</span>
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

export default MyRoadmapPage; 