import React, { useState, useRef } from 'react';
import { Camera, Save, Loader2, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import type { UserUpdate } from '../../types/api';

const ProfileSection: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (error) setError(null);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      await userService.uploadAvatar(file);
      // Server already stores avatar and returns new URL – just refresh user data.
      await refreshUserData();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updateData: UserUpdate = {};
      
      if (formData.name !== user?.name) updateData.name = formData.name;
      if (formData.phone !== user?.phone) updateData.phone = formData.phone;

      if (Object.keys(updateData).length === 0) {
        setError('No changes to save');
        setTimeout(() => setError(null), 3000);
        return;
      }

      await userService.updateProfile(updateData);
      await refreshUserData();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-theme-primary mb-2">Profile</h2>
        <p className="text-theme-secondary">Manage your personal information and profile picture.</p>
      </div>

      <div className="space-y-6">
        {/* Avatar Section */}
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-3">
            Profile Picture
          </label>
          <div className="flex items-center space-x-4">
            <div className="relative">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={`${user.name}'s avatar`}
                  className="w-20 h-20 rounded-full object-cover border-2 border-purple-200 dark:border-purple-700 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-purple-500 text-white font-semibold border-4 border-purple-200 dark:border-purple-700 shadow-lg flex items-center justify-center text-lg">
                  {user.name ? getInitials(user.name) : <UserIcon className="w-8 h-8" />}
                </div>
              )}
              
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <div>
              <button
                onClick={handleAvatarClick}
                disabled={uploading}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-400 text-white rounded-lg transition-colors duration-200"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <span>{uploading ? 'Uploading...' : 'Change Avatar'}</span>
              </button>
              
              <p className="text-xs text-theme-secondary mt-1">
                PNG, JPEG, JPG or GIF under 10MB
              </p>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500"
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 cursor-not-allowed"
            placeholder="Email address"
          />
          <p className="text-xs text-theme-secondary mt-1">
            Email address cannot be changed for security reasons.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex flex-col items-end pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-400 text-white rounded-lg transition-colors duration-200"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">Profile updated successfully!</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSection; 