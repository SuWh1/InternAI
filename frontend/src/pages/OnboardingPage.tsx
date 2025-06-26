import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, User, Code, Briefcase, Target, Rocket, Sparkles, Search, X } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import type { OnboardingFormData, OnboardingOptions } from '../types/onboarding';

// Comprehensive list of major cities worldwide
const WORLD_CITIES = [
  // North America
  'New York City, United States', 'Los Angeles, United States', 'Chicago, United States', 'Houston, United States',
  'Phoenix, United States', 'Philadelphia, United States', 'San Antonio, United States', 'San Diego, United States',
  'Dallas, United States', 'San Jose, United States', 'Austin, United States', 'Jacksonville, United States',
  'San Francisco, United States', 'Columbus, United States', 'Charlotte, United States', 'Fort Worth, United States',
  'Detroit, United States', 'El Paso, United States', 'Memphis, United States', 'Seattle, United States',
  'Denver, United States', 'Washington, United States', 'Boston, United States', 'Nashville, United States',
  'Baltimore, United States', 'Oklahoma City, United States', 'Louisville, United States', 'Portland, United States',
  'Las Vegas, United States', 'Milwaukee, United States', 'Albuquerque, United States', 'Tucson, United States',
  'Fresno, United States', 'Sacramento, United States', 'Mesa, United States', 'Kansas City, United States',
  'Atlanta, United States', 'Long Beach, United States', 'Colorado Springs, United States', 'Raleigh, United States',
  'Miami, United States', 'Virginia Beach, United States', 'Omaha, United States', 'Oakland, United States',
  'Minneapolis, United States', 'Tulsa, United States', 'Arlington, United States', 'Tampa, United States',
  'Toronto, Canada', 'Montreal, Canada', 'Calgary, Canada', 'Ottawa, Canada', 'Edmonton, Canada', 'Mississauga, Canada',
  'Winnipeg, Canada', 'Vancouver, Canada', 'Brampton, Canada', 'Hamilton, Canada', 'Quebec City, Canada', 'Surrey, Canada',
  'Laval, Canada', 'Halifax, Canada', 'London, Canada', 'Markham, Canada', 'Vaughan, Canada', 'Gatineau, Canada',
  'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico', 'Puebla, Mexico', 'Tijuana, Mexico', 'León, Mexico',
  
  // Europe
  'London, United Kingdom', 'Birmingham, United Kingdom', 'Manchester, United Kingdom', 'Glasgow, United Kingdom',
  'Liverpool, United Kingdom', 'Leeds, United Kingdom', 'Sheffield, United Kingdom', 'Edinburgh, United Kingdom',
  'Bristol, United Kingdom', 'Cardiff, United Kingdom', 'Belfast, United Kingdom', 'Leicester, United Kingdom',
  'Berlin, Germany', 'Hamburg, Germany', 'Munich, Germany', 'Cologne, Germany', 'Frankfurt, Germany', 'Stuttgart, Germany',
  'Düsseldorf, Germany', 'Leipzig, Germany', 'Dortmund, Germany', 'Essen, Germany', 'Bremen, Germany', 'Dresden, Germany',
  'Paris, France', 'Marseille, France', 'Lyon, France', 'Toulouse, France', 'Nice, France', 'Nantes, France',
  'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Seville, Spain', 'Zaragoza, Spain', 'Málaga, Spain',
  'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Turin, Italy', 'Palermo, Italy', 'Genoa, Italy',
  'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands', 'Utrecht, Netherlands',
  'Brussels, Belgium', 'Antwerp, Belgium', 'Ghent, Belgium', 'Charleroi, Belgium',
  'Vienna, Austria', 'Graz, Austria', 'Linz, Austria', 'Salzburg, Austria',
  'Zurich, Switzerland', 'Geneva, Switzerland', 'Basel, Switzerland', 'Bern, Switzerland',
  'Stockholm, Sweden', 'Gothenburg, Sweden', 'Malmö, Sweden', 'Uppsala, Sweden',
  'Oslo, Norway', 'Bergen, Norway', 'Stavanger, Norway', 'Trondheim, Norway',
  'Copenhagen, Denmark', 'Aarhus, Denmark', 'Odense, Denmark', 'Aalborg, Denmark',
  'Helsinki, Finland', 'Espoo, Finland', 'Tampere, Finland', 'Vantaa, Finland',
  'Warsaw, Poland', 'Kraków, Poland', 'Łódź, Poland', 'Wrocław, Poland',
  'Prague, Czech Republic', 'Brno, Czech Republic', 'Ostrava, Czech Republic',
  'Budapest, Hungary', 'Debrecen, Hungary', 'Szeged, Hungary',
  'Bucharest, Romania', 'Cluj-Napoca, Romania', 'Timișoara, Romania',
  'Athens, Greece', 'Thessaloniki, Greece', 'Patras, Greece',
  'Lisbon, Portugal', 'Porto, Portugal', 'Vila Nova de Gaia, Portugal',
  'Dublin, Ireland', 'Cork, Ireland', 'Limerick, Ireland',
  'Moscow, Russia', 'Saint Petersburg, Russia', 'Novosibirsk, Russia',
  
  // Asia
  'Tokyo, Japan', 'Yokohama, Japan', 'Osaka, Japan', 'Nagoya, Japan', 'Sapporo, Japan', 'Fukuoka, Japan',
  'Beijing, China', 'Shanghai, China', 'Guangzhou, China', 'Shenzhen, China', 'Tianjin, China', 'Wuhan, China',
  'Seoul, South Korea', 'Busan, South Korea', 'Incheon, South Korea', 'Daegu, South Korea',
  'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Hyderabad, India', 'Chennai, India', 'Kolkata, India',
  'Singapore, Singapore', 'Kuala Lumpur, Malaysia', 'Bangkok, Thailand', 'Manila, Philippines',
  'Jakarta, Indonesia', 'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam',
  'Hong Kong, Hong Kong', 'Taipei, Taiwan', 'Tel Aviv, Israel',
  
  // Australia & Oceania
  'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia', 'Adelaide, Australia',
  'Auckland, New Zealand', 'Wellington, New Zealand', 'Christchurch, New Zealand',
  
  // South America
  'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Brasília, Brazil', 'Salvador, Brazil', 'Fortaleza, Brazil',
  'Buenos Aires, Argentina', 'Córdoba, Argentina', 'Rosario, Argentina',
  'Lima, Peru', 'Bogotá, Colombia', 'Santiago, Chile', 'Caracas, Venezuela',
  
  // Africa
  'Cairo, Egypt', 'Lagos, Nigeria', 'Kinshasa, Democratic Republic of the Congo', 'Johannesburg, South Africa',
  'Luanda, Angola', 'Dar es Salaam, Tanzania', 'Khartoum, Sudan', 'Algiers, Algeria',
  'Cape Town, South Africa', 'Nairobi, Kenya', 'Casablanca, Morocco',
  
  // Special
  'Remote'
];

// LocationAutocomplete component
const LocationAutocomplete: React.FC<{
  selectedLocations: string[];
  onChange: (locations: string[]) => void;
}> = ({ selectedLocations, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = WORLD_CITIES.filter(city =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10); // Limit to 10 results
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [searchTerm]);

  const handleCitySelect = (city: string) => {
    if (!selectedLocations.includes(city)) {
      onChange([...selectedLocations, city]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCityRemove = (city: string) => {
    onChange(selectedLocations.filter(loc => loc !== city));
  };

  return (
    <div className="space-y-3">
      {/* Selected locations */}
      {selectedLocations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLocations.map((location) => (
            <span
              key={location}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm"
            >
              {location}
              <button
                onClick={() => handleCityRemove(location)}
                className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-secondary w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for cities..."
            className="w-full pl-10 pr-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm placeholder-theme-secondary"
          />
        </div>
        
        {/* Dropdown */}
        {isOpen && filteredCities.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {filteredCities.map((city) => (
              <button
                key={city}
                onClick={() => handleCitySelect(city)}
                className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-theme-primary transition-colors duration-200"
                disabled={selectedLocations.includes(city)}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for custom checkbox/radio
const CustomSelector: React.FC<{
  type: 'checkbox' | 'radio';
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  name?: string;
  color?: 'blue' | 'green' | 'purple';
}> = ({ type, id, label, checked, onChange, name, color = 'blue' }) => {
  return (
    <label htmlFor={id} className="flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 group">
      <input
        type={type}
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className={`w-5 h-5 rounded-md flex-shrink-0 border-2 flex items-center justify-center transition-all duration-200 ${checked ? 'bg-purple-500 border-purple-500' : 'bg-theme-secondary border-purple-300 dark:border-purple-600'}`}>
        {checked && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className="font-medium text-theme-primary group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">{label}</span>
    </label>
  );
};

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { createOnboarding, getOnboardingOptions, loading, error } = useOnboarding();
  
  const topOfPageRef = React.useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [options, setOptions] = useState<OnboardingOptions | null>(null);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [otherMajor, setOtherMajor] = useState('');
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
    
    // Initialize otherMajor state if major contains "Other - " format
    if (formData.major.startsWith('Other - ')) {
      setOtherMajor(formData.major.substring(8));
    }
  }, [getOnboardingOptions]);

  // Scroll to top on step change
  useEffect(() => {
    topOfPageRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentStep]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleMajorChange = (value: string) => {
    if (value === 'Other') {
      setOtherMajor('');
      updateFormData('major', 'Other');
    } else {
      setOtherMajor('');
      updateFormData('major', value);
    }
  };

  const handleOtherMajorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherMajor(value);
    // Store in format "Other - <user_input>" or just "Other" if empty
    updateFormData('major', value ? `Other - ${value}` : 'Other');
  };

  // Helper function to get display value for major select
  const getMajorDisplayValue = () => {
    if (!formData.major) return '';
    if (formData.major.startsWith('Other - ')) return 'Other';
    return formData.major;
  };

  // Helper function to check if Other input should be shown
  const shouldShowOtherMajorInput = () => {
    return getMajorDisplayValue() === 'Other';
  };

  // Helper function to get other major input value
  const getOtherMajorValue = () => {
    if (formData.major.startsWith('Other - ')) {
      return formData.major.substring(8); // Remove "Other - " prefix
    }
    return otherMajor;
  };

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
              ? 'bg-purple-500 border-purple-500 text-white shadow-lg scale-110' 
              : 'bg-theme-secondary border-purple-300 dark:border-purple-600 text-theme-primary hover:border-purple-500 hover:scale-105'
            }
          `}>
            {i + 1 < currentStep ? (
              <Check className="w-6 h-6 animate-in zoom-in-50 duration-300" />
            ) : (
              <span className="text-sm font-semibold">{i + 1}</span>
            )}
            {i + 1 === currentStep && (
              <div className="absolute inset-0 rounded-full bg-purple-500 opacity-20 animate-ping"></div>
            )}
          </div>
          {i < totalSteps - 1 && (
            <div className={`
              w-16 h-1 mx-3 rounded-full transition-all duration-500 ease-out
              ${i + 1 < currentStep 
                ? 'bg-purple-500 shadow-sm' 
                : 'bg-theme-hover'
              }
            `}>
              {i + 1 < currentStep && (
                <div className="h-full bg-purple-500 rounded-full animate-in slide-in-from-left duration-500"></div>
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
          <User className="w-20 h-20 text-purple-500 mx-auto mb-6 animate-in zoom-in duration-700 delay-100" />
        </div>
        <h2 className="text-3xl font-bold text-theme-primary mb-3 animate-in slide-in-from-bottom duration-500 delay-200">Academic Background</h2>
        <p className="text-lg text-theme-secondary animate-in slide-in-from-bottom duration-500 delay-300">Tell us about your current academic status</p>
      </div>

      <div className="space-y-6">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-theme-primary mb-3">
            Current Academic Year <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.current_year}
            onChange={(e) => updateFormData('current_year', e.target.value)}
            className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm"
          >
            <option value="" disabled>Select your current academic year</option>
            {options?.current_year_options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-500">
          <label className="block text-sm font-semibold text-theme-primary mb-3">
            Field of Study <span className="text-red-500">*</span>
          </label>
          <select
            value={getMajorDisplayValue()}
            onChange={(e) => handleMajorChange(e.target.value)}
            className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm"
          >
            <option value="" disabled>Select your field of study</option>
            {['Computer Science', 'Software Engineering', 'Data Science', 'Information Technology', 'Electrical and Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Administration', 'Economics', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Psychology', 'Other'].map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {shouldShowOtherMajorInput() && (
            <input
              type="text"
              value={getOtherMajorValue()}
              onChange={handleOtherMajorChange}
              placeholder="Please specify your field of study"
              className="mt-3 w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm placeholder-theme-secondary"
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={`space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-10">
        <div className="relative inline-block">
          <Code className="w-20 h-20 text-purple-500 mx-auto mb-6 animate-in zoom-in duration-700 delay-100" />
        </div>
        <h2 className="text-3xl font-bold text-theme-primary mb-3 animate-in slide-in-from-bottom duration-500 delay-200">Technical Background</h2>
        <p className="text-lg text-theme-secondary animate-in slide-in-from-bottom duration-500 delay-300">Share your programming skills and experience</p>
      </div>

      <div className="space-y-8">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-theme-primary mb-4">
            Programming Languages <span className="text-red-500">*</span> <span className="text-theme-secondary font-normal">(Select all that apply)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['Python', 'JavaScript', 'Java', 'C++', 'C', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript', 'SQL'].map((language, index) => (
              <CustomSelector
                key={language}
                type="checkbox"
                id={`lang-${language}`}
                label={language}
                checked={formData.programming_languages.includes(language)}
                onChange={() => toggleArrayItem('programming_languages', language)}
              />
            ))}
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-600">
          <label className="block text-sm font-semibold text-theme-primary mb-4">
            Frameworks & Tools <span className="text-theme-secondary font-normal">(Select all that apply)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'Spring', 'Express', 'Docker', 'AWS', 'Git', 'MongoDB', 'PostgreSQL', 'Redis'].map((tool, index) => (
              <CustomSelector
                key={tool}
                type="checkbox"
                id={`tool-${tool}`}
                label={tool}
                checked={formData.frameworks_tools.includes(tool)}
                onChange={() => toggleArrayItem('frameworks_tools', tool)}
              />
            ))}
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-800">
          <label className="block text-sm font-semibold text-theme-primary mb-4">
            Preferred Tech Stack for Internships <span className="text-theme-secondary font-normal">(Select all that apply)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options?.preferred_tech_stack_options.map((stack, index) => (
              <CustomSelector
                key={stack}
                type="checkbox"
                id={`stack-${stack}`}
                label={stack}
                checked={formData.preferred_tech_stack.includes(stack)}
                onChange={() => toggleArrayItem('preferred_tech_stack', stack)}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="animate-in slide-in-from-bottom duration-500 delay-1000">
            <label className="block text-sm font-semibold text-theme-primary mb-3">
              Overall Experience Level <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.experience_level}
              onChange={(e) => updateFormData('experience_level', e.target.value)}
              className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm"
            >
              <option value="" disabled>Select your experience level</option>
              {['Beginner', 'Intermediate', 'Advanced'].map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="animate-in slide-in-from-bottom duration-500 delay-1100">
            <label className="block text-sm font-semibold text-theme-primary mb-3">
              Skill Confidence <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.skill_confidence}
              onChange={(e) => updateFormData('skill_confidence', e.target.value)}
              className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm"
            >
              <option value="" disabled>How confident do you feel about your technical skills?</option>
              {[
                'Not confident at all',
                'Somewhat confident',
                'Moderately confident',
                'Very confident',
                'Extremely confident'
              ].map(option => (
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
          <Briefcase className="w-20 h-20 text-purple-500 mx-auto mb-6 animate-in zoom-in duration-700 delay-100" />
        </div>
        <h2 className="text-3xl font-bold text-theme-primary mb-3 animate-in slide-in-from-bottom duration-500 delay-200">Experience</h2>
        <p className="text-lg text-theme-secondary animate-in slide-in-from-bottom duration-500 delay-300">Tell us about your internship and project experience</p>
      </div>

      <div className="space-y-8">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-theme-primary mb-4">
            Do you have previous internship experience?
          </label>
          <div className="flex space-x-6">
            <CustomSelector
              type="radio"
              id="exp-yes"
              name="internship_experience"
              label="Yes"
              checked={formData.has_internship_experience === true}
              onChange={() => updateFormData('has_internship_experience', true)}
            />
            <CustomSelector
              type="radio"
              id="exp-no"
              name="internship_experience"
              label="No"
              checked={formData.has_internship_experience === false}
              onChange={() => updateFormData('has_internship_experience', false)}
            />
          </div>
        </div>

        {formData.has_internship_experience && (
          <div className="animate-in slide-in-from-bottom duration-500 delay-500">
            <label className="block text-sm font-semibold text-theme-primary mb-3">
              Previous Internships
            </label>
            <textarea
              value={formData.previous_internships}
              onChange={(e) => updateFormData('previous_internships', e.target.value)}
              placeholder="Tell us about your previous internship experiences..."
              rows={4}
              className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm placeholder-theme-secondary resize-none"
            />
          </div>
        )}

        <div className="animate-in slide-in-from-bottom duration-500 delay-600">
          <label className="block text-sm font-semibold text-theme-primary mb-3">
            Projects
          </label>
          <textarea
            value={formData.projects}
            onChange={(e) => updateFormData('projects', e.target.value)}
            placeholder="Describe any personal projects, hackathons, or coursework projects..."
            rows={4}
            className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm placeholder-theme-secondary resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className={`space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-10">
        <div className="relative inline-block">
          <Target className="w-20 h-20 text-purple-500 mx-auto mb-6 animate-in zoom-in duration-700 delay-100" />
        </div>
        <h2 className="text-3xl font-bold text-theme-primary mb-3 animate-in slide-in-from-bottom duration-500 delay-200">Career Goals</h2>
        <p className="text-lg text-theme-secondary animate-in slide-in-from-bottom duration-500 delay-300">Help us understand your career aspirations</p>
      </div>

      <div className="space-y-8">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-theme-primary mb-4">
            Target Roles <span className="text-red-500">*</span> <span className="text-theme-secondary font-normal">(Select all that apply)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options?.target_role_options.map((role, index) => (
              <CustomSelector
                key={role}
                type="checkbox"
                id={`role-${role}`}
                label={role}
                checked={formData.target_roles.includes(role)}
                onChange={() => toggleArrayItem('target_roles', role)}
              />
            ))}
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-600">
          <label className="block text-sm font-semibold text-theme-primary mb-4">
            Preferred Company Types <span className="text-theme-secondary font-normal">(Select all that apply)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options?.company_type_options.map((type, index) => (
              <CustomSelector
                key={type}
                type="checkbox"
                id={`company-${type}`}
                label={type}
                checked={formData.preferred_company_types.includes(type)}
                onChange={() => toggleArrayItem('preferred_company_types', type)}
              />
            ))}
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-800">
          <label className="block text-sm font-semibold text-theme-primary mb-4">
            Preferred Locations <span className="text-theme-secondary font-normal">(Select multiple cities)</span>
          </label>
          <LocationAutocomplete
            selectedLocations={formData.preferred_locations}
            onChange={(locations) => updateFormData('preferred_locations', locations)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className={`space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-10">
        <div className="relative inline-block">
          <Rocket className="w-20 h-20 text-purple-500 mx-auto mb-6 animate-in zoom-in duration-700 delay-100" />
        </div>
        <h2 className="text-3xl font-bold text-theme-primary mb-3 animate-in slide-in-from-bottom duration-500 delay-200">Target Internships</h2>
        <p className="text-lg text-theme-secondary animate-in slide-in-from-bottom duration-500 delay-300">Which internships are you most interested in?</p>
      </div>

      <div className="space-y-8">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-theme-primary mb-4">
            Target Internships <span className="text-red-500">*</span> <span className="text-theme-secondary font-normal">(Select all that apply)</span>
          </label>
          <div className="grid grid-cols-1 gap-3">
            {options?.default_internships.map((internship, index) => (
              <CustomSelector
                key={internship}
                type="checkbox"
                id={`internship-${internship}`}
                label={internship}
                checked={formData.target_internships.includes(internship)}
                onChange={() => toggleArrayItem('target_internships', internship)}
              />
            ))}
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-600">
          <label className="block text-sm font-semibold text-theme-primary mb-3">
            Application Timeline <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.application_timeline}
            onChange={(e) => updateFormData('application_timeline', e.target.value)}
            className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm"
          >
            <option value="">When are you planning to apply?</option>
            {options?.timeline_options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-700">
          <label className="block text-sm font-semibold text-theme-primary mb-3">
            Additional Information
          </label>
          <textarea
            value={formData.additional_info}
            onChange={(e) => updateFormData('additional_info', e.target.value)}
            placeholder="Anything else you'd like us to know for your personalized roadmap?"
            rows={4}
            className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm placeholder-theme-secondary resize-none"
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
      <div className="min-h-screen bg-theme-primary flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-theme-secondary animate-pulse transition-colors duration-300">Loading your personalized onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary py-8 px-4 transition-colors duration-300" ref={topOfPageRef}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-theme-secondary/95 backdrop-blur-sm rounded-2xl shadow-xl border border-theme p-8 md:p-12 animate-in zoom-in duration-700 transition-colors duration-300">
          {/* Header */}
          <div className="text-center mb-12 animate-in slide-in-from-bottom duration-500">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-semibold mb-6 mt-4 animate-in zoom-in duration-500 delay-100">
              <Sparkles className="w-4 h-4" />
              <span>Step {currentStep} of {totalSteps}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-theme-primary mb-4 transition-colors duration-300">
              Welcome to InternAI!
            </h1>
            <p className="text-xl text-theme-secondary max-w-2xl mx-auto transition-colors duration-300">Let's get you set up with a personalized internship roadmap</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-theme-secondary mb-2 transition-colors duration-300">
              <span>Progress</span>
              <span>{Math.round(((currentStep - 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-theme-hover rounded-full h-2.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
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
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-theme">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 text-theme-secondary font-medium rounded-xl hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
              <span>Previous</span>
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="flex items-center space-x-2 px-8 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!validateStep(currentStep) || loading}
                className="flex items-center space-x-2 px-8 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Creating Your Roadmap...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Onboarding</span>
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