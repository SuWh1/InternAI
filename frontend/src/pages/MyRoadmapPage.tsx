import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const personalizedMessages = [
    "Calibrating roadmap based on your unique skills...",
    "Factoring in your learning style preferences...",
    "Cross-referencing your experience with top internship requirements...",
    "Identifying projects that align with your career goals...",
    "Fine-tuning weekly goals for your schedule..."
  ];

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

    const intervalId = setInterval(() => {
      if (loading && roadmap !== null) {
        setCurrentMessageIndex(prevIndex => (prevIndex + 1) % personalizedMessages.length);
      }
    }, 3300);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      clearInterval(intervalId);
    };
  }, [showRegenerateConfirm, loading, roadmap]);

  // Calculate overall progress
  const overallProgress = progress.length > 0 
    ? Math.round(progress.reduce((sum, week) => sum + week.completion_percentage, 0) / progress.length)
    : 0;

  return (
    <div className="min-h-screen pt-16 bg-theme-primary transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <MapPin className="h-16 w-16 text-theme-accent mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            My Career Roadmap
          </h1>
          <p className="text-xl text-theme-secondary transition-colors duration-300">
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
          <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-8 mb-8 transition-colors duration-300">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <RefreshCw className="absolute inset-0 m-auto w-8 h-8 text-theme-accent" />
                <motion.div
                  className="w-full h-full rounded-full border-t-2 border-b-2 border-theme-accent"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-0 w-full h-full rounded-full border-l-2 border-r-2 border-purple-400"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
              </div>
              <h2 className="text-2xl font-semibold text-theme-primary mb-4 transition-colors duration-300">
                Regenerating Your Roadmap
              </h2>
              <p className="text-theme-secondary mb-6 max-w-2xl mx-auto transition-colors duration-300">
                This may take a few moments...
              </p>
              
              {/* Progress Steps */}
              <div className="max-w-lg mx-auto h-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMessageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center justify-center space-x-2"
                  >
                    <div className="w-2 h-2 bg-theme-accent rounded-full animate-pulse"></div>
                    <span className="text-sm text-theme-secondary">
                      {personalizedMessages[currentMessageIndex]}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Initial Generation Loading State */}
        {!roadmap && loading && (
          <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-8 mb-8 transition-colors duration-300">
            <div className="text-center">
              <div className="relative">
                <Play className="h-16 w-16 text-theme-accent mx-auto mb-6 animate-bounce" />
                {/* <div className="absolute inset-0 bg-theme-accent/10 rounded-full animate-pulse opacity-20"></div> */}
              </div>
              <h2 className="text-2xl font-semibold text-theme-primary mb-4 transition-colors duration-300">
                Creating Your Personalized Roadmap
              </h2>
              <p className="text-theme-secondary mb-6 max-w-2xl mx-auto transition-colors duration-300">
                Our AI agents are analyzing your profile and creating a customized 
                internship preparation roadmap just for you. This will take a few moments...
              </p>
              
              {/* Progress Steps */}
              <div className="max-w-md mx-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-theme-accent rounded-full animate-pulse"></div>
                    <span className="text-sm text-theme-secondary transition-colors duration-300">Processing your background</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-theme-accent rounded-full animate-pulse delay-150"></div>
                    <span className="text-sm text-theme-secondary transition-colors duration-300">Generating personalized roadmap</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-theme-accent rounded-full animate-pulse delay-300"></div>
                    <span className="text-sm text-theme-secondary transition-colors duration-300">Finding matching internships</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap Status & Controls */}
        {!roadmap && !loading ? (
          <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-8 mb-8 transition-colors duration-300">
            <div className="text-center">
              {!canRunPipeline ? (
                <>
                  <Calendar className="h-16 w-16 text-theme-secondary/50 mx-auto mb-6 transition-colors duration-300" />
                  <h2 className="text-2xl font-semibold text-theme-primary mb-4 transition-colors duration-300">
                    Complete Onboarding First
                  </h2>
                  <p className="text-theme-secondary mb-6 max-w-2xl mx-auto transition-colors duration-300">
                    {pipelineStatus?.reason || 'Please complete your onboarding to generate your personalized roadmap.'}
                  </p>
                  {pipelineStatus?.missing_requirements && (
                    <div className="mb-6">
                      <h3 className="font-medium text-theme-primary mb-2 transition-colors duration-300">Missing Requirements:</h3>
                      <ul className="text-sm text-theme-secondary space-y-1 transition-colors duration-300">
                        {pipelineStatus.missing_requirements.map((req: string, index: number) => (
                          <li key={index}>• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={refreshStatus}
                    className="px-6 py-2 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-all duration-300 flex items-center space-x-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Check Status</span>
                  </button>
                </>
              ) : (
                <>
                  <Play className="h-16 w-16 text-theme-accent mx-auto mb-6" />
                  <h2 className="text-2xl font-semibold text-theme-primary mb-4 transition-colors duration-300">
                    Generate Your Roadmap
                  </h2>
                  <p className="text-theme-secondary mb-6 max-w-2xl mx-auto transition-colors duration-300">
                    Ready to create your personalized internship preparation roadmap! 
                    You can optionally upload your resume for more tailored recommendations.
                  </p>
                  
                  {/* Resume Upload Option */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowResumeInput(!showResumeInput)}
                      className="text-theme-accent hover:opacity-80 flex items-center space-x-2 mx-auto mb-4 transition-all duration-300"
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
                          className="w-full h-32 p-3 border border-theme rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent bg-theme-primary text-theme-primary transition-colors duration-300"
                        />
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleGenerateRoadmap}
                    disabled={loading}
                    className="px-8 py-3 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-all duration-300 flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-6 mb-8 transition-colors duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-theme-primary transition-colors duration-300">Progress Overview</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-theme-accent" />
                    <span className="text-2xl font-bold text-theme-accent">{overallProgress}%</span>
                    <span className="text-theme-secondary transition-colors duration-300">Complete</span>
                  </div>
                  <button
                    onClick={handleRegenerateClick}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 hover:scale-105 transition-all duration-300 flex items-center space-x-2 shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
              
              {/* Progress Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-theme-accent/10 rounded-lg border border-theme transition-colors duration-300">
                  <CheckCircle className="h-8 w-8 text-theme-accent mx-auto mb-2" />
                  <div className="text-2xl font-bold text-theme-accent">
                    {progress.filter(w => w.completion_percentage === 100).length}
                  </div>
                  <div className="text-sm text-theme-secondary transition-colors duration-300">Weeks Completed</div>
                </div>
                
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-theme transition-colors duration-300">
                  <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {roadmap.weeks.length}
                  </div>
                  <div className="text-sm text-theme-secondary transition-colors duration-300">Total Weeks</div>
                </div>
                
                <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-theme transition-colors duration-300">
                  <MapPin className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {roadmap.personalization_factors.focus_areas.length}
                  </div>
                  <div className="text-sm text-theme-secondary transition-colors duration-300">Focus Areas</div>
                </div>
              </div>
            </div>

            {/* Interactive Roadmap */}
            <div className="bg-theme-secondary rounded-xl shadow-sm border border-theme overflow-hidden transition-colors duration-300">
              <div className="p-6 border-b border-theme">
                <h2 className="text-xl font-semibold text-theme-primary mb-2 transition-colors duration-300">Interactive Roadmap</h2>
                <p className="text-theme-secondary text-sm transition-colors duration-300">
                  Drag nodes to rearrange, click to expand details, and track your progress through your personalized journey.
                </p>
              </div>
              
              <div className="w-full">
                <InteractiveRoadmap
                  roadmap={roadmap}
                  progress={progress}
                  onNodeClick={handleNodeClick}
                  onProgressUpdate={handleProgressUpdate}
                />
              </div>
            </div>
          </>
        ) : null}

        {/* Regenerate Confirmation Modal */}
        {showRegenerateConfirm && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto">
            {/* Backdrop with theme-aware blur */}
            <div 
              className="fixed inset-0 bg-theme-primary/90 backdrop-blur-sm transition-opacity duration-300"
              onClick={handleCancelRegenerate}
            />
            
            {/* Modal - Fixed in center of viewport */}
            <div className="flex min-h-full items-center justify-center p-6">
              <div 
                className="relative bg-theme-secondary rounded-lg shadow-xl max-w-md w-full p-6 transition-all duration-300 animate-in zoom-in-95 border border-theme"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                  <h3 className="text-lg font-semibold text-theme-primary transition-colors duration-300">
                    Regenerate Roadmap?
                  </h3>
                </div>
                
                <div className="mb-6">
                  <p className="text-theme-secondary mb-4 transition-colors duration-300">
                    Are you sure you want to regenerate your roadmap? This action will:
                  </p>
                  <ul className="text-sm text-theme-secondary space-y-2 mb-4 transition-colors duration-300">
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
                    <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">
                          You have {overallProgress}% progress that will be lost!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={handleCancelRegenerate}
                    className="px-4 py-2 text-theme-secondary bg-theme-hover rounded-lg hover:bg-theme-accent hover:text-white transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRegenerate}
                    disabled={loading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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