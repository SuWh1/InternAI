import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from './UserAvatar';

const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const handleProfileSettings = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <UserAvatar
        user={user}
        size="md"
        onClick={() => setIsOpen(!isOpen)}
        className="ring-2 ring-transparent hover:ring-purple-400 dark:hover:ring-purple-500"
      />

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-64 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-purple-200 dark:border-purple-700 bg-theme-secondary">
              <div className="flex items-center space-x-3">
                <UserAvatar user={user} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-theme-primary truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-theme-secondary truncate py-1">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Options */}
            <div className="py-2">
              <button
                onClick={handleProfileSettings}
                className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200 text-theme-primary"
              >
                <Settings className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Profile Settings</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 text-theme-primary hover:text-red-600 dark:hover:text-red-400"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDropdown; 