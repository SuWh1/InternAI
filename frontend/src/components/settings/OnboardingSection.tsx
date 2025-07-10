import React, { useState, useEffect } from 'react';
import { Target, Save, Loader2, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { onboardingService } from '../../services/onboardingService';
import type { OnboardingData, OnboardingUpdate, OnboardingOptions } from '../../types/onboarding';

// Custom Select Component with purple theme
const CustomSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}> = ({ value, onChange, placeholder, options, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        disabled={disabled}
        className="w-full px-4 py-3 pr-12 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm appearance-none cursor-pointer"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <ChevronDown 
          className={`w-5 h-5 text-purple-500 transition-all duration-300 ease-out ${
            isOpen ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
          }`}
        />
      </div>
    </div>
  );
};

// Multi-Select Component with purple theme
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
              className="rounded border-purple-300 text-purple-500 focus:ring-purple-500 accent-purple-500"
            />
            <span className="text-sm font-medium text-theme-primary">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const OnboardingSection: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [options, setOptions] = useState<OnboardingOptions | null>(null);
  const [formData, setFormData] = useState<OnboardingUpdate>({});

  // Load current onboarding data and options
  useEffect(() => {
    loadData();
  }, []);

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

      // Ensure skill confidence value matches options list (case-insensitive)
      const sanitizedSkillConfidence = optionsData.skill_confidence_options.find(opt => opt.toLowerCase() === currentData.skill_confidence.toLowerCase()) || currentData.skill_confidence;
      
      // Initialize form data with current values
      setFormData({
        current_year: currentData.current_year,
        major: currentData.major,
        programming_languages: currentData.programming_languages,
        frameworks: currentData.frameworks,
        tools: currentData.tools,
        preferred_tech_stack: currentData.preferred_tech_stack,
        experience_level: currentData.experience_level,
        skill_confidence: sanitizedSkillConfidence,
        has_internship_experience: currentData.has_internship_experience,
        previous_internships: currentData.previous_internships,
        projects: currentData.projects,
        target_roles: currentData.target_roles,
        preferred_company_types: currentData.preferred_company_types,
        preferred_locations: currentData.preferred_locations,
        application_timeline: currentData.application_timeline,
        additional_info: currentData.additional_info
      });
    } catch (err) {
      setError('Failed to load preferences data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Filter out unchanged values
      const updateData: OnboardingUpdate = {};
      Object.keys(formData).forEach((key) => {
        const formKey = key as keyof OnboardingUpdate;
        if (JSON.stringify(formData[formKey]) !== JSON.stringify(onboardingData?.[formKey as keyof OnboardingData])) {
          updateData[formKey] = formData[formKey];
        }
      });

      if (Object.keys(updateData).length === 0) {
        setError('No changes to save');
        return;
      }

      await onboardingService.updateOnboarding(updateData);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload data to ensure consistency
      await loadData();
    } catch (err) {
      setError('Failed to update preferences');
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-theme-primary mb-2">Learning Preferences</h2>
        <p className="text-theme-secondary">Update your learning preferences and career goals. Changes here will affect your roadmap generation.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <p className="text-green-600 dark:text-green-400 text-sm">Preferences updated successfully!</p>
        </motion.div>
      )}

      <div className="space-y-8">
        {/* Academic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-theme-primary border-b border-purple-200 dark:border-purple-700 pb-2">
            Academic Information
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
                options={(options?.current_year_options ? options.current_year_options.flatMap(option => option === 'Recent GraduateOther' ? ['Recent Graduate', 'Other'] : [option]) : []).map(opt => ({ value: opt, label: opt }))}
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
              options={['JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 'Swift', 'Kotlin', 'Ruby', 'PHP']}
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

          {/* Frameworks */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Frameworks
            </label>
            <MultiSelect
              selectedItems={formData.frameworks || []}
              onChange={(items) => updateFormData('frameworks', items)}
              options={[
                'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Nuxt.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Express', 'NestJS', 'Laravel', 'Ruby on Rails'
              ]}
              placeholder="Select frameworks you know"
            />
          </div>

          {/* Tools */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Tools
            </label>
            <MultiSelect
              selectedItems={formData.tools || []}
              onChange={(items) => updateFormData('tools', items)}
              options={[
                'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Jenkins', 'GitHub Actions', 'VS Code', 'IntelliJ', 'Postman', 'Terraform'
              ]}
              placeholder="Select tools you have experience with"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Skill Confidence
            </label>
            <CustomSelect
              value={formData.skill_confidence || ''}
              onChange={(value) => updateFormData('skill_confidence', value)}
              placeholder="How confident are you in your skills?"
              options={options?.skill_confidence_options.map(option => ({ value: option, label: option })) || []}
            />
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

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-400 text-white rounded-lg transition-colors duration-200"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSection; 