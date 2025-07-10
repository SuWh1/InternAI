import React, { useState, useEffect } from 'react';
import { X, User, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { onboardingService } from '../../services/onboardingService';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import type { OnboardingData, OnboardingUpdate, OnboardingOptions } from '../../types/onboarding';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom Select Component (reused from onboarding)
const CustomSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}> = ({ value, onChange, placeholder, options, disabled = false }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm appearance-none cursor-pointer"
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
};

// Custom Multi-Select Component
const MultiSelect: React.FC<{
  selectedItems: string[];
  onChange: (items: string[]) => void;
  options: string[];
  placeholder: string;
}> = ({ selectedItems, onChange, options, placeholder }) => {
  const toggleItem = (item: string) => {
    const newItems = selectedItems.includes(item)
      ? selectedItems.filter(i => i !== item)
      : [...selectedItems, item];
    onChange(newItems);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-theme-secondary">{placeholder}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
          >
            <input
              type="checkbox"
              checked={selectedItems.includes(option)}
              onChange={() => toggleItem(option)}
              className="rounded border-purple-300 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-theme-primary">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [options, setOptions] = useState<OnboardingOptions | null>(null);
  const [formData, setFormData] = useState<OnboardingUpdate>({});

  // Load current onboarding data and options
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [currentData, optionsData] = await Promise.all([
        onboardingService.getOnboarding(),
        onboardingService.getOnboardingOptions()
      ]);
      
      setOnboardingData(currentData);
      setOptions(optionsData);
      
      // Initialize form data with current values
      setFormData({
        current_year: currentData.current_year,
        major: currentData.major,
        programming_languages: currentData.programming_languages,
        frameworks: currentData.frameworks,
        tools: currentData.tools,
        preferred_tech_stack: currentData.preferred_tech_stack,
        experience_level: currentData.experience_level,
        skill_confidence: currentData.skill_confidence,
        has_internship_experience: currentData.has_internship_experience,
        previous_internships: currentData.previous_internships,
        projects: currentData.projects,
        target_roles: currentData.target_roles,
        preferred_company_types: currentData.preferred_company_types,
        preferred_locations: currentData.preferred_locations,
        application_timeline: currentData.application_timeline,
        additional_info: currentData.additional_info,
        source_of_discovery: currentData.source_of_discovery
      });
    } catch (err) {
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Filter out undefined values
      const updateData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined)
      ) as OnboardingUpdate;
      
      await onboardingService.updateOnboarding(updateData);
      setSuccess(true);
      
      // Close modal after short delay
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof OnboardingUpdate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-theme-secondary rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20">
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-theme-primary">Profile Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-purple-100 dark:hover:bg-purple-800 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-theme-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <ErrorMessage error={error} />
            ) : success ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-theme-primary mb-2">Profile Updated!</h3>
                  <p className="text-theme-secondary">Your changes have been saved successfully.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-theme-primary border-b border-purple-200 dark:border-purple-700 pb-2">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-2">
                        Current Academic Year
                      </label>
                      <CustomSelect
                        value={formData.current_year || ''}
                        onChange={(value) => updateFormData('current_year', value)}
                        placeholder="Select your current academic year"
                        options={options?.current_year_options.map(option => ({ value: option, label: option })) || []}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-2">
                        Field of Study
                      </label>
                      <input
                        type="text"
                        value={formData.major || ''}
                        onChange={(e) => updateFormData('major', e.target.value)}
                        className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        placeholder="Enter your field of study"
                      />
                    </div>
                  </div>
                </div>

                {/* Technical Background */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-theme-primary border-b border-purple-200 dark:border-purple-700 pb-2">
                    Technical Background
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-2">
                      Programming Languages
                    </label>
                    <MultiSelect
                      selectedItems={formData.programming_languages || []}
                      onChange={(items) => updateFormData('programming_languages', items)}
                      options={['JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 'Swift', 'Kotlin']}
                      placeholder="Select programming languages you know"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-2">
                        Preferred Tech Stack
                      </label>
                      <CustomSelect
                        value={formData.preferred_tech_stack || ''}
                        onChange={(value) => updateFormData('preferred_tech_stack', value)}
                        placeholder="Select preferred tech stack"
                        options={options?.preferred_tech_stack_options.map(option => ({ value: option, label: option })) || []}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-2">
                        Experience Level
                      </label>
                      <CustomSelect
                        value={formData.experience_level || ''}
                        onChange={(value) => updateFormData('experience_level', value)}
                        placeholder="Select experience level"
                        options={options?.experience_level_options.map(option => ({ value: option, label: option })) || []}
                      />
                    </div>
                  </div>
                </div>

                {/* Career Goals */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-theme-primary border-b border-purple-200 dark:border-purple-700 pb-2">
                    Career Goals
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-2">
                      Target Roles
                    </label>
                    <MultiSelect
                      selectedItems={formData.target_roles || []}
                      onChange={(items) => updateFormData('target_roles', items)}
                      options={options?.target_role_options || []}
                      placeholder="Select target roles for internships"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-2">
                      Preferred Company Types
                    </label>
                    <MultiSelect
                      selectedItems={formData.preferred_company_types || []}
                      onChange={(items) => updateFormData('preferred_company_types', items)}
                      options={options?.company_type_options || []}
                      placeholder="Select preferred company types"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-2">
                      Application Timeline
                    </label>
                    <CustomSelect
                      value={formData.application_timeline || ''}
                      onChange={(value) => updateFormData('application_timeline', value)}
                      placeholder="When are you planning to apply?"
                      options={options?.timeline_options.map(option => ({ value: option, label: option })) || []}
                    />
                  </div>
                </div>

                {/* Experience */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-theme-primary border-b border-purple-200 dark:border-purple-700 pb-2">
                    Experience
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-2">
                      Previous Internships
                    </label>
                    <textarea
                      value={formData.previous_internships || ''}
                      onChange={(e) => updateFormData('previous_internships', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none"
                      placeholder="Describe your previous internship experience..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-2">
                      Projects
                    </label>
                    <textarea
                      value={formData.projects || ''}
                      onChange={(e) => updateFormData('projects', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none"
                      placeholder="Describe your projects..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && !success && (
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-purple-200 dark:border-purple-700 bg-theme-primary">
              <button
                onClick={onClose}
                className="px-6 py-2 text-theme-secondary hover:text-theme-primary transition-colors duration-200"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileSettings; 