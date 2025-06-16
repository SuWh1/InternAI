import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import type { OnboardingAnswers } from '../types/api';
import { useApi, useApiMutation } from '../hooks/useApi';
import apiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const navigate = useNavigate();

  // Fetch questions from API
  const { 
    data: questions, 
    loading: questionsLoading, 
    error: questionsError,
    refetch: refetchQuestions 
  } = useApi(() => apiService.getOnboardingQuestions());

  // Submit onboarding mutation
  const { 
    mutate: submitOnboarding, 
    loading: submitting, 
    error: submitError 
  } = useApiMutation(apiService.submitOnboarding.bind(apiService));

  const currentQuestion = questions?.[currentStep];
  const progress = questions ? ((currentStep + 1) / questions.length) * 100 : 0;

  const handleAnswer = (value: string | string[]) => {
    if (!currentQuestion) return;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const nextStep = async () => {
    if (!questions) return;

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit answers to backend
      try {
        await submitOnboarding(answers as OnboardingAnswers);
        navigate('/roadmap');
      } catch (error) {
        console.error('Failed to submit onboarding:', error);
        // Error is handled by the mutation hook
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isAnswered = () => {
    if (!currentQuestion) return false;
    
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === 'checkbox') {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer && answer.length > 0;
  };

  // Loading state
  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="large" className="mx-auto mb-4" />
              <p className="text-gray-600">Loading questions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (questionsError || !questions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-20">
            <ErrorMessage
              error={questionsError || 'Failed to load questions'}
              onRetry={refetchQuestions}
              className="max-w-md mx-auto"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentStep + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* AI Assistant */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-700 leading-relaxed">
                Great! I'm here to create your personalized roadmap. This will only take a few minutes, 
                and I'll use your answers to build a plan that's perfect for your situation.
              </p>
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentQuestion.title}
            </h2>

            {/* Submit Error */}
            {submitError && (
              <ErrorMessage
                error={submitError}
                className="mb-6"
              />
            )}

            <div className="space-y-3">
              {currentQuestion.type === 'select' ? (
                currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={submitting}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      answers[currentQuestion.id] === option
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {option}
                  </button>
                ))
              ) : (
                currentQuestion.options.map((option, index) => {
                  const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
                  const isSelected = currentAnswers.includes(option);
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (submitting) return;
                      
                      if (isSelected) {
                        handleAnswer(currentAnswers.filter(a => a !== option));
                      } else {
                        handleAnswer([...currentAnswers, option]);
                      }
                    }}
                    disabled={submitting}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 border-2 rounded mr-3 ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded mx-auto mt-0.5" />
                        )}
                      </div>
                      {option}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 0 || submitting}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0 || submitting
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={nextStep}
              disabled={!isAnswered() || submitting}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isAnswered() && !submitting
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>Creating Roadmap...</span>
                </>
              ) : (
                <>
                  <span>{currentStep === questions.length - 1 ? 'Create My Roadmap' : 'Next'}</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;