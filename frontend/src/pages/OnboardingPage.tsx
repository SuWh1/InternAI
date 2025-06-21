import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, User, Code, Briefcase, Target, Rocket, Sparkles } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import type { OnboardingFormData, OnboardingOptions } from '../types/onboarding';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { createOnboarding, getOnboardingOptions, loading, error, clearError } = useOnboarding();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [options, setOptions] = useState<OnboardingOptions | null>(null);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [formData, setFormData] = useState<OnboardingFormData>({
    // Step 1: Personal Information
    current_year: '',
    major: '',
    
    // Step 2: Technical Background
    programming_languages: [],
    frameworks_tools: [],
    preferred_tech_stack: [],
    experience_level: '',
    skill_confidence: '',
    
    // Step 3: Experience
    has_internship_experience: false,
    previous_internships: '',
    projects: '',
    
    // Step 4: Career Goals
    target_roles: [],
    preferred_company_types: [],
    preferred_locations: [],
    
    // Step 5: Target Internships & Timeline
    target_internships: [],
    application_timeline: '',
    additional_info: ''
  });

  const totalSteps = 5;

  // Load onboarding options on mount
  useEffect(() => {
    const loadOptions = async () => {
      const optionsData = await getOnboardingOptions();
      if (optionsData) {
        setOptions(optionsData);
      }
    };
    loadOptions();
  }, [getOnboardingOptions]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const updateFormData = (field: keyof OnboardingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleArrayItem = (field: keyof OnboardingFormData, item: string) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    
    updateFormData(field, newArray);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.current_year && formData.major);
      case 2:
        return !!(formData.programming_languages.length > 0 && formData.experience_level && formData.skill_confidence);
      case 3:
        return true; // Optional fields
      case 4:
        return !!(formData.target_roles.length > 0);
      case 5:
        return !!(formData.target_internships.length > 0 && formData.application_timeline);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setStepDirection('forward');
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setStepDirection('backward');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    // Transform form data to API format with default values for AI
    const onboardingData = {
      current_year: formData.current_year,
      major: formData.major,
      programming_languages: formData.programming_languages,
      frameworks_tools: formData.frameworks_tools,
      preferred_tech_stack: formData.preferred_tech_stack,
      experience_level: formData.experience_level,
      skill_confidence: formData.skill_confidence,
      has_internship_experience: formData.has_internship_experience,
      previous_internships: formData.previous_internships.trim() || undefined,
      projects: formData.projects.trim() || undefined,
      target_roles: formData.target_roles,
      preferred_company_types: formData.preferred_company_types,
      preferred_locations: formData.preferred_locations,
      target_internships: formData.target_internships,
      application_timeline: formData.application_timeline,
      additional_info: formData.additional_info.trim() || undefined
    };

    const success = await createOnboarding(onboardingData);
    if (success) {
      // Redirect to dashboard/main app
      navigate('/my-roadmap');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <div className={`
            relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500 ease-out transform
            ${i + 1 <= currentStep 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 text-white shadow-lg scale-110' 
              : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400 hover:scale-105'
            }
          `}>
            {i + 1 < currentStep ? (
              <Check className="w-6 h-6 animate-in zoom-in-50 duration-300" />
            ) : (
              <span className="text-sm font-semibold">{i + 1}</span>
            )}
            {i + 1 === currentStep && (
              <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping"></div>
            )}
          </div>
          {i < totalSteps - 1 && (
            <div className={`
              w-16 h-1 mx-3 rounded-full transition-all duration-500 ease-out
              ${i + 1 < currentStep 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm' 
                : 'bg-gray-200'
              }
            `}>
              {i + 1 < currentStep && (
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-in slide-in-from-left duration-500"></div>
              )}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className={`space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-10">
        <div className="relative inline-block">
          <User className="w-20 h-20 text-blue-500 mx-auto mb-6 animate-in zoom-in duration-700 delay-100" />
          <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 animate-in slide-in-from-bottom duration-500 delay-200">Academic Background</h2>
        <p className="text-lg text-gray-600 animate-in slide-in-from-bottom duration-500 delay-300">Tell us about your current academic status</p>
      </div>

      <div className="space-y-6">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Current Academic Year <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.current_year}
            onChange={(e) => updateFormData('current_year', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm"
          >
            <option value="">Select your current academic year (e.g., 1st year, 2nd year ...)</option>
            {options?.current_year_options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-500">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Major/Field of Study <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.major}
            onChange={(e) => updateFormData('major', e.target.value)}
            placeholder="e.g. Computer Science, Data Science, Information Systems"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={`space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-10">
        <div className="relative inline-block">
          <Code className="w-20 h-20 text-blue-500 mx-auto mb-6 animate-in zoom-in duration-700 delay-100" />
          <Sparkles className="w-6 h-6 text-green-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 animate-in slide-in-from-bottom duration-500 delay-200">Technical Background</h2>
        <p className="text-lg text-gray-600 animate-in slide-in-from-bottom duration-500 delay-300">Share your programming skills and experience</p>
      </div>

      <div className="space-y-8">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Programming Languages <span className="text-red-500">*</span> <span className="text-gray-500 font-normal">(Select all that apply)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['Python', 'JavaScript', 'Java', 'C++', 'C', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript', 'SQL'].map((language, index) => (
              <label key={language} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-blue-50 transition-all duration-200 group animate-in slide-in-from-bottom" style={{ animationDelay: `${400 + index * 50}ms` }}>
                <input
                  type="checkbox"
                  checked={formData.programming_languages.includes(language)}
                  onChange={() => toggleArrayItem('programming_languages', language)}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 scale-110 transition-transform duration-200"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{language}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-600">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Frameworks & Tools <span className="text-gray-500 font-normal">(Select all that apply)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'Spring', 'Express', 'Docker', 'AWS', 'Git', 'MongoDB', 'PostgreSQL', 'Redis'].map((tool, index) => (
              <label key={tool} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-green-50 transition-all duration-200 group animate-in slide-in-from-bottom" style={{ animationDelay: `${600 + index * 50}ms` }}>
                <input
                  type="checkbox"
                  checked={formData.frameworks_tools.includes(tool)}
                  onChange={() => toggleArrayItem('frameworks_tools', tool)}
                  className="rounded border-gray-300 text-green-500 focus:ring-green-500 scale-110 transition-transform duration-200"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{tool}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-800">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Preferred Tech Stack for Internships <span className="text-gray-500 font-normal">(Select all that apply)</span>
          </label>
          <div className="space-y-3">
            {options?.preferred_tech_stack_options.map((stack, index) => (
              <label key={stack} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-purple-50 transition-all duration-200 group animate-in slide-in-from-bottom" style={{ animationDelay: `${800 + index * 100}ms` }}>
                <input
                  type="checkbox"
                  checked={formData.preferred_tech_stack.includes(stack)}
                  onChange={() => toggleArrayItem('preferred_tech_stack', stack)}
                  className="rounded border-gray-300 text-purple-500 focus:ring-purple-500 scale-110 transition-transform duration-200"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{stack}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="animate-in slide-in-from-bottom duration-500 delay-1000">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Overall Experience Level <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.experience_level}
              onChange={(e) => updateFormData('experience_level', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm"
            >
              <option value="">Select your experience level</option>
              {options?.experience_level_options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="animate-in slide-in-from-bottom duration-500 delay-1100">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Skill Confidence <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.skill_confidence}
              onChange={(e) => updateFormData('skill_confidence', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm"
            >
              <option value="">How confident do you feel about your technical skills?</option>
              {options?.skill_confidence_options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={`space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-10">
        <div className="relative inline-block">
          <Briefcase className="w-20 h-20 text-blue-500 mx-auto mb-6 animate-in zoom-in duration-700 delay-100" />
          <Sparkles className="w-6 h-6 text-orange-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 animate-in slide-in-from-bottom duration-500 delay-200">Experience</h2>
        <p className="text-lg text-gray-600 animate-in slide-in-from-bottom duration-500 delay-300">Tell us about your internship and project experience</p>
      </div>

      <div className="space-y-8">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Do you have previous internship experience?
          </label>
          <div className="flex space-x-6">
            <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group">
              <input
                type="radio"
                name="internship_experience"
                checked={formData.has_internship_experience === true}
                onChange={() => updateFormData('has_internship_experience', true)}
                className="text-blue-500 focus:ring-blue-500 scale-110"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors duration-200">Yes</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group">
              <input
                type="radio"
                name="internship_experience"
                checked={formData.has_internship_experience === false}
                onChange={() => updateFormData('has_internship_experience', false)}
                className="text-blue-500 focus:ring-blue-500 scale-110"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors duration-200">No</span>
            </label>
          </div>
        </div>

        {formData.has_internship_experience && (
          <div className="animate-in slide-in-from-bottom duration-500 delay-500">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Previous Internships
            </label>
            <textarea
              value={formData.previous_internships}
              onChange={(e) => updateFormData('previous_internships', e.target.value)}
              placeholder="Tell us about your previous internship experiences..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm placeholder-gray-400 resize-none"
            />
          </div>
        )}

        <div className="animate-in slide-in-from-bottom duration-500 delay-600">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Projects
          </label>
          <textarea
            value={formData.projects}
            onChange={(e) => updateFormData('projects', e.target.value)}
            placeholder="Describe any personal projects, hackathons, or coursework projects..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm placeholder-gray-400 resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className={`space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-10">
        <div className="relative inline-block">
          <Target className="w-20 h-20 text-blue-500 mx-auto mb-6 animate-in zoom-in duration-700 delay-100" />
          <Sparkles className="w-6 h-6 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 animate-in slide-in-from-bottom duration-500 delay-200">Career Goals</h2>
        <p className="text-lg text-gray-600 animate-in slide-in-from-bottom duration-500 delay-300">Help us understand your career aspirations</p>
      </div>

      <div className="space-y-8">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Target Roles <span className="text-red-500">*</span> <span className="text-gray-500 font-normal">(Select all that apply)</span>
          </label>
          <div className="space-y-3">
            {options?.target_role_options.map((role, index) => (
              <label key={role} className="flex items-center space-x-3 cursor-pointer p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group animate-in slide-in-from-bottom" style={{ animationDelay: `${400 + index * 100}ms` }}>
                <input
                  type="checkbox"
                  checked={formData.target_roles.includes(role)}
                  onChange={() => toggleArrayItem('target_roles', role)}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 scale-110 transition-transform duration-200"
                />
                <span className="text-sm text-gray-700 group-hover:text-blue-700 transition-colors duration-200">{role}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-600">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Preferred Company Types <span className="text-gray-500 font-normal">(Select all that apply)</span>
          </label>
          <div className="space-y-3">
            {options?.company_type_options.map((type, index) => (
              <label key={type} className="flex items-center space-x-3 cursor-pointer p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 group animate-in slide-in-from-bottom" style={{ animationDelay: `${600 + index * 100}ms` }}>
                <input
                  type="checkbox"
                  checked={formData.preferred_company_types.includes(type)}
                  onChange={() => toggleArrayItem('preferred_company_types', type)}
                  className="rounded border-gray-300 text-green-500 focus:ring-green-500 scale-110 transition-transform duration-200"
                />
                <span className="text-sm text-gray-700 group-hover:text-green-700 transition-colors duration-200">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-800">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Preferred Locations
          </label>
          <input
            type="text"
            value={formData.preferred_locations.join(', ')}
            onChange={(e) => updateFormData('preferred_locations', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            placeholder="e.g. San Francisco, New York, Remote"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className={`space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-10">
        <div className="relative inline-block">
          <Rocket className="w-20 h-20 text-blue-500 mx-auto mb-6 animate-in zoom-in duration-700 delay-100" />
          <Sparkles className="w-6 h-6 text-pink-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 animate-in slide-in-from-bottom duration-500 delay-200">Target Internships</h2>
        <p className="text-lg text-gray-600 animate-in slide-in-from-bottom duration-500 delay-300">Which internships are you most interested in?</p>
      </div>

      <div className="space-y-8">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Target Internships <span className="text-red-500">*</span> <span className="text-gray-500 font-normal">(Select all that apply)</span>
          </label>
          <div className="grid grid-cols-1 gap-3">
            {options?.default_internships.map((internship, index) => (
              <label key={internship} className="flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group animate-in slide-in-from-bottom" style={{ animationDelay: `${400 + index * 100}ms` }}>
                <input
                  type="checkbox"
                  checked={formData.target_internships.includes(internship)}
                  onChange={() => toggleArrayItem('target_internships', internship)}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 scale-110 transition-transform duration-200"
                />
                <span className="text-sm text-gray-700 group-hover:text-blue-700 transition-colors duration-200 font-medium">{internship}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-600">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Application Timeline <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.application_timeline}
            onChange={(e) => updateFormData('application_timeline', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm"
          >
            <option value="">When are you planning to apply?</option>
            {options?.timeline_options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-700">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Additional Information
          </label>
          <textarea
            value={formData.additional_info}
            onChange={(e) => updateFormData('additional_info', e.target.value)}
            placeholder="Anything else you'd like us to know for your personalized roadmap?"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm placeholder-gray-400 resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  if (!options) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 animate-pulse">Loading your personalized onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 animate-slide-up-lg">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 md:p-12 animate-in zoom-in duration-700">
          {/* Header */}
          <div className="text-center mb-12 animate-in slide-in-from-bottom duration-500">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-6 animate-in zoom-in duration-500 delay-100">
              <Sparkles className="w-4 h-4" />
              <span>Step {currentStep} of {totalSteps}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              Welcome to InternAI!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Let's get you set up with a personalized internship roadmap</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Error Message */}
          {error && (
            <div className="mb-8 animate-in slide-in-from-top duration-300">
              <ErrorMessage error={error} className="rounded-xl" />
            </div>
          )}

          {/* Current Step Content */}
          <div className="min-h-[500px]">
            {renderCurrentStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-gray-100 rounded-xl group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Previous</span>
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
              >
                <span className="font-semibold">Next</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!validateStep(currentStep) || loading}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="font-semibold">Creating Your Roadmap...</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Complete Onboarding</span>
                    <Check className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage; 