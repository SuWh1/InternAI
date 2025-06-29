import React, { useState, useEffect } from 'react';
import { X, GitBranch, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
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

  const { login, register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const formItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 300
      }
    }
  };

  // Sync internal mode with defaultMode prop and clear errors
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setFormError(null);
      setResetSent(false);
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      clearError(); // Clear auth store errors when modal opens
    } else {
      // Clear errors when modal closes
      setFormError(null);
      clearError();
    }
  }, [defaultMode, isOpen, clearError]);

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

  const handlePostAuthSuccess = (authMode: 'login' | 'register') => {
    // Only redirect for login, not for register (register goes through onboarding)
    if (authMode === 'login') {
      // Check if user was redirected from a protected route
      const redirectPath = location.state?.redirectAfterLogin;
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
        return;
      }
      
      // If user was on /roadmap, redirect to /my-roadmap
      if (location.pathname === '/roadmap') {
        navigate('/my-roadmap', { replace: true });
      }
    }
    // For register, OnboardingWrapper will handle the redirection
  };

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
      
      // Handle post-authentication routing
      handlePostAuthSuccess(mode);
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleGoogleSuccess = () => {
    onClose();
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    
    // Check if user was redirected from a protected route
    const redirectPath = location.state?.redirectAfterLogin;
    if (redirectPath) {
      navigate(redirectPath, { replace: true });
      return;
    }
    
    // For Google auth, we don't know if it's login or register, but we can assume
    // if user was on /roadmap and successfully authenticated, redirect to /my-roadmap
    if (location.pathname === '/roadmap') {
      navigate('/my-roadmap', { replace: true });
    }
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
    clearError(); // Clear auth store errors when switching modes
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop with theme-aware blur effect */}
          <motion.div 
            className="fixed inset-0 bg-theme-primary/90 backdrop-blur-sm transition-opacity duration-300" 
            onClick={onClose}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-6">
            <motion.div 
              className="relative w-[420px] transform overflow-hidden rounded-xl bg-theme-secondary shadow-xl border border-theme transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag
              dragConstraints={{ top: -100, bottom: 100, left: -100, right: 100 }}
              dragElastic={0.1}
              whileTap={{ cursor: "grabbing" }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                animate={{
                  x: [-420, 420],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute left-3 top-3 z-10 rounded-full p-1.5 text-theme-secondary hover:bg-theme-hover hover:text-theme-primary transition-all duration-300"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-5 w-5" />
              </motion.button>

              {/* Header */}
              <motion.div 
                className="px-6 pt-8 pb-4 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div 
                  className="flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <GitBranch className="h-10 w-10 text-theme-accent mr-2" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-theme-primary transition-colors duration-300">InternAI</h1>
                </motion.div>
              </motion.div>

              {/* Form */}
              <motion.form 
                onSubmit={handleSubmit} 
                className="px-6 pb-8"
                variants={formVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Error Messages */}
                <AnimatePresence>
                  {(error || formError) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ErrorMessage
                        error={error || formError || ''}
                        className="mb-4"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {mode === 'forgot' && resetSent ? (
                  <motion.div 
                    className="text-center py-4"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  >
                    <motion.div 
                      className="mb-4 text-green-600 font-medium"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      Password reset link sent!
                    </motion.div>
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
                  </motion.div>
                ) : (
                  <>
                    {/* Name Field (Register only) */}
                    <AnimatePresence mode="wait">
                      {mode === 'register' && (
                        <motion.div 
                          className="mb-4"
                          variants={formItemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <motion.input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent transition-all duration-300 bg-theme-primary text-theme-primary"
                            placeholder="Enter your full name"
                            disabled={loading}
                            whileFocus={{ scale: 1.02 }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Email Field */}
                    <motion.div 
                      className="mb-4"
                      variants={formItemVariants}
                    >
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <motion.input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent transition-all duration-300 bg-theme-primary text-theme-primary"
                        placeholder="Enter your email"
                        disabled={loading}
                        whileFocus={{ scale: 1.02 }}
                      />
                    </motion.div>

                    {/* Password Field */}
                    <AnimatePresence mode="wait">
                      {mode !== 'forgot' && (
                        <motion.div 
                          className="mb-4"
                          variants={formItemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
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
                          <div className="relative w-full">
                            <motion.input
                              type={showPassword ? "text" : "password"}
                              id="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent transition-all duration-300 bg-theme-primary text-theme-primary pr-10"
                              placeholder="Enter your password"
                              disabled={loading}
                              whileFocus={{ scale: 1.02 }}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <motion.button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 z-10"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Confirm Password Field (Register only) */}
                    <AnimatePresence mode="wait">
                      {mode === 'register' && (
                        <motion.div 
                          className="mb-4"
                          variants={formItemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                          </label>
                          <div className="relative w-full">
                            <motion.input
                              type={showConfirmPassword ? "text" : "password"}
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent transition-all duration-300 bg-theme-primary text-theme-primary pr-10"
                              placeholder="Confirm your password"
                              disabled={loading}
                              whileFocus={{ scale: 1.02 }}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <motion.button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 z-10"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-theme-accent text-white py-2.5 px-4 rounded-lg font-medium hover:opacity-90 focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mb-4 relative overflow-hidden"
                      variants={formItemVariants}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Button shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.5 }}
                      />
                      <span className="relative z-10">
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
                      </span>
                    </motion.button>

                    <motion.div 
                      className="text-sm"
                      variants={formItemVariants}
                    >
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
                    </motion.div>

                    
                    {/* OR */}
                    <motion.div 
                      className="relative flex items-center justify-center my-4"
                      variants={formItemVariants}
                    >
                      <div className="border-t border-theme w-full"></div>
                      <div className="bg-theme-secondary px-3 text-xs text-theme-secondary">OR</div>
                      <div className="border-t border-theme w-full"></div>
                    </motion.div>

                    {/* Google Sign In Button */}
                    <motion.div variants={formItemVariants}>
                      <GoogleLoginButton 
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                      />
                    </motion.div>
                  </>
                )}
              </motion.form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal; 