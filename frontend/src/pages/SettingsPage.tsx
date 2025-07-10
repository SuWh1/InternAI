import React, { useState } from 'react';
import { ArrowLeft, User, Lock, AlertTriangle, Settings, BookOpen, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProfileSection from '../components/settings/ProfileSection';
import PasswordSection from '../components/settings/PasswordSection';
import DangerZoneSection from '../components/settings/DangerZoneSection';
import OnboardingSection from '../components/settings/OnboardingSection';

type SettingsSection = 'profile' | 'onboarding' | 'password' | 'danger';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  const sections = [
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
      description: 'Manage your personal information and avatar'
    },
    {
      id: 'onboarding' as const,
      label: 'Preferences',
      icon: Target,
      description: 'Update your learning preferences and goals'
    },
    {
      id: 'password' as const,
      label: 'Password',
      icon: Lock,
      description: 'Change your account password'
    },
    {
      id: 'danger' as const,
      label: 'Danger Zone',
      icon: AlertTriangle,
      description: 'Permanently delete your account'
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'onboarding':
        return <OnboardingSection />;
      case 'password':
        return <PasswordSection />;
      case 'danger':
        return <DangerZoneSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="min-h-screen bg-theme-primary transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-theme-secondary hover:text-theme-primary transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-theme-primary">Settings</h1>
              <p className="text-theme-secondary">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-theme-secondary rounded-xl shadow-sm border border-theme overflow-hidden">
              <div className="p-4 border-b border-theme bg-purple-50 dark:bg-purple-900/20">
                <h2 className="font-semibold text-theme-primary">Account Settings</h2>
              </div>
              <nav className="p-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-theme-primary'
                          : 'text-theme-secondary hover:bg-theme-hover hover:text-theme-primary'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${
                          isActive 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-theme-secondary group-hover:text-purple-500'
                        }`} />
                        <div>
                          <div className="font-medium">{section.label}</div>
                          <div className={`text-sm ${
                            isActive 
                              ? 'text-purple-700 dark:text-purple-300' 
                              : 'text-theme-secondary'
                          }`}>
                            {section.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-theme-secondary rounded-xl shadow-sm border border-theme"
            >
              {renderActiveSection()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 