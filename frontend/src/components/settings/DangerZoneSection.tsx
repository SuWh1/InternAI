import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import type { AccountDeletion } from '../../types/api';

const DangerZoneSection: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmation: ''
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    // For social login users, password is not required
    if (user?.hashed_password && !formData.password) {
      return 'Password is required';
    }
    if (formData.confirmation !== 'DELETE') {
      return 'You must type "DELETE" to confirm account deletion';
    }
    return null;
  };

  const handleDeleteClick = () => {
    setShowConfirmDialog(true);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const deleteData: AccountDeletion = {
        password: formData.password || '', // Empty for social login users
        confirmation: formData.confirmation
      };

      await userService.deleteAccount(deleteData);
      
      // Logout and redirect to home
      await logout();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setFormData({
      password: '',
      confirmation: ''
    });
    setError(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-theme-primary mb-2">Danger Zone</h2>
        <p className="text-theme-secondary">Permanently delete your account and all associated data.</p>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Delete Account
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">
              Once you delete your account, there is no going back. This action will permanently delete:
            </p>
            <ul className="text-red-700 dark:text-red-300 text-sm space-y-1 mb-6">
              <li>• Your profile and personal information</li>
              <li>• Your learning roadmap and progress</li>
              <li>• Your onboarding preferences</li>
              <li>• All associated data and content</li>
            </ul>

            {!showConfirmDialog ? (
              <button
                onClick={handleDeleteClick}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded-lg">
                    <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <div className="bg-theme-secondary rounded-lg p-4 border border-red-300 dark:border-red-600">
                  <h4 className="font-semibold text-theme-primary mb-4">
                    Confirm Account Deletion
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Password field - only for non-social users */}
                    {user?.hashed_password && (
                      <div>
                        <label className="block text-sm font-medium text-theme-primary mb-2">
                          Enter your password to confirm
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="w-full px-3 py-2 pr-10 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Confirmation field */}
                    <div>
                      <label className="block text-sm font-medium text-theme-primary mb-2">
                        Type <span className="font-mono bg-purple-100 dark:bg-purple-900/30 px-1 py-0.5 rounded text-red-600 dark:text-red-400">DELETE</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={formData.confirmation}
                        onChange={(e) => handleInputChange('confirmation', e.target.value)}
                        className="w-full px-3 py-2 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Type DELETE here"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 mt-6">
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-4 py-2 text-theme-secondary hover:text-theme-primary transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={loading}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors duration-200"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>{loading ? 'Deleting...' : 'Delete Account'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DangerZoneSection; 