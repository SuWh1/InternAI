import React, { useState, useEffect } from 'react';
import { X, GitBranch, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultMode = 'register' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { login, register, loading, error } = useAuth();

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setFormError('Password must be at least 6 characters');
        return;
      }
      if (!formData.name.trim()) {
        setFormError('Name is required');
        return;
      }
    }

    if (!formData.email.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }

    try {
      if (mode === 'register') {
        await register(formData.email, formData.password, formData.name);
      } else {
        await login(formData.email, formData.password);
      }
      onClose();
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormError(null);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with white-blue blur effect */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-blue-50/80 via-white/70 to-indigo-100/80 modal-backdrop transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-6">
        <div 
          className="relative w-96 transform overflow-hidden rounded-lg bg-white shadow-lg border border-gray-200 transition-all modal-enter"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-2 top-2 z-10 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="px-4 pt-6 pb-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <GitBranch className="h-6 w-6 text-blue-500 mr-2" />
              <h1 className="text-lg font-bold text-gray-900">InternAI</h1>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              {mode === 'register' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 text-xs">
              {mode === 'register' 
                ? 'Join thousands of students' 
                : 'Continue your journey'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-4 pb-6">
            {/* Error Messages */}
            {(error || formError) && (
              <ErrorMessage
                error={error || formError || ''}
                className="mb-3"
              />
            )}

            {/* Name Field (Register only) */}
            {mode === 'register' && (
              <div className="mb-2">
                <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 hover:border-blue-300 transition-all duration-200"
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            {/* Email Field */}
            <div className="mb-2">
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 hover:border-blue-300 transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password Field */}
            <div className="mb-2">
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 hover:border-blue-300 transition-all duration-200"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Register only) */}
            {mode === 'register' && (
              <div className="mb-3">
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 hover:border-blue-300 transition-all duration-200"
                  placeholder="Confirm password"
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 text-sm rounded-md font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  {mode === 'register' ? 'Creating...' : 'Signing In...'}
                </>
              ) : (
                mode === 'register' ? 'Create Account' : 'Sign In'
              )}
            </button>

            {/* Switch Mode */}
            <div className="mt-3 text-center">
              <p className="text-gray-600 text-xs">
                {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-blue-500 hover:text-blue-600 hover:underline font-medium transition-colors"
                >
                  {mode === 'register' ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 