import React, { useState, useEffect } from 'react';
import { X, GitBranch, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { GoogleLoginButton } from './GoogleLoginButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'forgot';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultMode = 'register' 
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const { login, register, loading, error } = useAuth();

  // Sync internal mode with defaultMode prop
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setFormError(null);
      setResetSent(false);
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    }
  }, [defaultMode, isOpen]);

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

    if (mode === 'forgot') {
      // Handle password reset request
      if (!formData.email.includes('@')) {
        setFormError('Please enter a valid email address');
        return;
      }
      
      // Mock password reset functionality
      // In a real app, you would call an API endpoint
      setTimeout(() => {
        setResetSent(true);
      }, 1000);
      
      return;
    }

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

  const handleGoogleSuccess = () => {
    onClose();
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const handleGoogleError = (error: string) => {
    setFormError(error);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setFormError(null);
    setResetSent(false);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with white-blue blur effect */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-blue-100/90 via-white/80 to-indigo-200/90 backdrop-blur-sm transition-opacity duration-200" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-6">
        <div 
          className="relative w-[420px] transform overflow-hidden rounded-xl bg-white shadow-xl border border-gray-200 transition-all duration-200 animate-in zoom-in-95 slide-in-from-bottom-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="px-6 pt-8 pb-4 text-center">
            <div className="flex items-center justify-center mb-4">
              <GitBranch className="h-10 w-10 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">InternAI</h1>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-8">
            {/* Error Messages */}
            {(error || formError) && (
              <ErrorMessage
                error={error || formError || ''}
                className="mb-4"
              />
            )}

            {mode === 'forgot' && resetSent ? (
              <div className="text-center py-4">
                <div className="mb-4 text-green-600 font-medium">
                  Password reset link sent!
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Check your email for instructions to reset your password.
                </p>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors duration-200"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                {/* Name Field (Register only) */}
                {mode === 'register' && (
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Email Field */}
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>

                {/* Password Field */}
                {mode !== 'forgot' && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors duration-200"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition-all duration-200"
                        placeholder="Enter your password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Password Field (Register only) */}
                {mode === 'register' && (
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition-all duration-200"
                        placeholder="Confirm your password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-4"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="small" className="mr-2" />
                      {mode === 'register' ? 'Creating Account...' : 
                       mode === 'forgot' ? 'Sending Reset Link...' : 'Signing In...'}
                    </div>
                  ) : (
                    mode === 'register' ? 'Create Account' : 
                    mode === 'forgot' ? 'Send Reset Link' : 'Sign In'
                  )}
                </button>
                <div className="text-sm">
                  {mode === 'login' ? (
                    <div className="text-left">
                      <p className="text-gray-600">
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('register')}
                          className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors duration-200"
                        >
                          Sign up
                        </button>
                      </p>
                    </div>
                  ) : mode === 'register' ? (
                    <div className="text-center">
                      <p className="text-gray-600">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors duration-200"
                        >
                          Sign in
                        </button>
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-600">
                        Remember your password?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors duration-200"
                        >
                          Back to Sign In
                        </button>
                      </p>
                    </div>
                  )}
                </div>

                
                {/* OR */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-gray-300 w-full"></div>
                  <div className="bg-white px-3 text-xs text-gray-500">OR</div>
                  <div className="border-t border-gray-300 w-full"></div>
                </div>

                {/* Google Sign In Button */}
                <GoogleLoginButton 
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 