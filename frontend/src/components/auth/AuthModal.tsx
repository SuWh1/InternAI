import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, GitBranch, Eye, EyeOff, Mail, RefreshCw, Lock } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { GoogleLoginButton } from './GoogleLoginButton';
import { authService } from '../../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'forgot' | 'verify' | 'reset';
  resetToken?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultMode = 'register',
  resetToken 
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify' | 'reset'>(defaultMode);
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

  // Email verification states
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const { login, register, verifyPin, resendPin, loading, error, clearError } = useAuth();
  const dragControls = useDragControls();
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
      setVerificationCode(['', '', '', '', '', '']);
      setVerifyLoading(false);
      setResendLoading(false);
      setResendCooldown(0);
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

  const handleVerifyPin = async () => {
    const pin = verificationCode.join('');
    if (pin.length !== 6) {
      setFormError('Please enter all 6 digits');
      return;
    }
    await handleVerifyPinWithCode(pin);
  };

  const handleVerifyPinWithCode = async (pin: string) => {
    if (pin.length !== 6) {
      setFormError('Please enter all 6 digits');
      return;
    }

    setVerifyLoading(true);
    setFormError(null);

    try {
      await verifyPin(verificationEmail, pin);
      
      // Verification successful - complete registration
      onClose();
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setVerificationCode(['', '', '', '', '', '']);
      setVerificationEmail('');
      
      // Handle post-authentication routing for completed registration
      handlePostAuthSuccess('register');
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendPin = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setFormError(null);

    try {
      await resendPin(verificationEmail);
      
      // Start cooldown timer
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (value && !/^\d$/.test(value)) return; // Only allow digits

    // Clear any existing errors when user starts typing
    if (formError || error) {
      setFormError(null);
      clearError?.();
    }

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 5 && newCode.every(digit => digit !== '')) {
      setTimeout(() => {
        // Use the newCode directly instead of state
        const pin = newCode.join('');
        if (pin.length === 6) {
          handleVerifyPinWithCode(pin);
        }
      }, 100);
    }
  };

  const handleVerificationCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (mode === 'forgot') {
      // Handle password reset request
      if (!formData.email.trim()) {
        setFormError('Please enter your email.');
        return;
      }
      if (!validateEmail(formData.email)) {
        setFormError('Please enter a valid email address.');
        return;
      }
      
      console.log('Attempting password reset for:', formData.email);
      
      // Call real password reset API
      try {
        await authService.requestPasswordReset(formData.email);
        console.log('Password reset request successful');
        setResetSent(true);
      } catch (error) {
        console.error('Password reset error:', error);
        // Error is handled by the auth service
      }
      
      return;
    }

    if (mode === 'reset') {
      // Handle password reset with token
      if (!formData.password.trim()) {
        setFormError('Please enter your new password.');
        return;
      }
      if (formData.password.length < 6) {
        setFormError('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
      if (!resetToken) {
        setFormError('Invalid reset token');
        return;
      }

      try {
        await authService.resetPassword(resetToken, formData.password);
        console.log('Password reset successful');
        onClose();
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        // Redirect to login or show success message
        switchMode('login');
      } catch (error) {
        console.error('Password reset error:', error);
        // Error is handled by the auth service
      }
      
      return;
    }

    if (mode === 'verify') {
      await handleVerifyPin();
      return;
    }

    // Validation for both login and register
    if (!formData.email.trim()) {
      setFormError('Please enter your email.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!formData.password.trim()) {
      setFormError('Please enter your password.');
      return;
    }

    // Additional validation for register mode
    if (mode === 'register') {
      if (!formData.name.trim()) {
        setFormError('Please enter your name.');
        return;
      }
      if (formData.password.length < 6) {
        setFormError('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
    }

    try {
      if (mode === 'register') {
        await register(formData.email, formData.password, formData.name);
        // Instead of closing modal, switch to verification mode
        console.log('Registration successful, switching to verify mode');
        setVerificationEmail(formData.email);
        setMode('verify');
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      } else {
        await login(formData.email, formData.password);
        onClose();
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        // Handle post-authentication routing
        handlePostAuthSuccess(mode as 'login');
      }
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
    // Clear errors when user starts typing
    if (formError || error) {
      setFormError(null);
      clearError?.();
    }
    
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot' | 'verify' | 'reset') => {
    console.log('Switching to mode:', newMode);
    setMode(newMode);
    setFormError(null);
    setResetSent(false);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setVerificationCode(['', '', '', '', '', '']);
    setVerifyLoading(false);
    setResendLoading(false);
    setResendCooldown(0);
    clearError(); // Clear auth store errors when switching modes
  };

  return createPortal(
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
              className="relative w-full max-w-[420px] mx-4 transform overflow-hidden rounded-xl bg-theme-secondary shadow-xl border border-theme transition-all duration-300"
              style={{ position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag
              dragControls={dragControls}
              dragConstraints={{ top: -100, bottom: 100, left: -100, right: 100 }}
              dragElastic={0.1}
              dragListener={false}
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

              {/* Header - Drag Handle */}
              {mode !== 'verify' && mode !== 'reset' && (
                <motion.div 
                  className="px-6 pt-8 pb-4 text-center cursor-grab active:cursor-grabbing select-none"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onPointerDown={(e) => dragControls.start(e)}
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                  style={{ borderRadius: "12px 12px 0 0" }}
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
              )}

              {/* Form */}
              <motion.form 
                onSubmit={handleSubmit} 
                className="px-6 pb-8"
                variants={formVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Error Messages (Not for verification or reset mode) */}
                <AnimatePresence>
                  {(error || formError) && mode !== 'verify' && mode !== 'reset' && (
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
                ) : mode === 'verify' ? (
                  <motion.div 
                    className="text-center py-6 px-4 sm:px-6 verification-modal"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <motion.div 
                      className="flex items-center justify-center mb-6"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <motion.div
                        className="p-3 rounded-full bg-theme-accent/10 mr-3"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Mail className="h-8 w-8 text-theme-accent" />
                      </motion.div>
                      <h2 className="text-lg sm:text-xl font-semibold text-theme-primary">Verify Your Email</h2>
                    </motion.div>
                    
                    <motion.div 
                      className="mb-8"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <p className="text-theme-secondary text-sm mb-2">
                        We've sent a 6-digit verification code to
                      </p>
                      <p className="font-semibold text-theme-primary bg-theme-secondary/20 px-2 sm:px-4 py-2 rounded-lg inline-block mb-3 border border-theme-secondary/30 text-xs sm:text-sm break-all">
                        {verificationEmail}
                      </p>
                      <p className="text-theme-secondary text-xs">
                        Enter the code below to verify your email address
                      </p>
                    </motion.div>

                    {/* PIN Input */}
                    <motion.div 
                      className="mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <div className="max-w-xs mx-auto">
                        <div className="flex justify-center gap-2 sm:gap-3 mb-3"
                          style={{
                            gap: 'clamp(2px, 1.2vw, 10px)'
                          }}
                        >
                        {verificationCode.map((digit, index) => (
                          <motion.div
                            key={index}
                            className="relative"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: 0.4 + index * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                            whileFocus={{ scale: 1.05 }}
                          >
                            <input
                              id={`pin-${index}`}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                              onKeyDown={(e) => handleVerificationCodeKeyDown(index, e)}
                              className="modal-pin-input transition-all duration-200 hover:border-theme-accent/60 focus:border-theme-accent focus:shadow-lg focus:shadow-theme-accent/20"
                              placeholder=""
                              disabled={verifyLoading}
                            />
                          </motion.div>
                        ))}
                        </div>
                      
                        {/* Progress indicator */}
                        <div className="flex justify-center">
                          <div className="flex gap-1">
                            {Array.from({ length: 6 }, (_, index) => (
                              <motion.div
                                key={index}
                                className={`w-6 h-1 rounded-full transition-all duration-300 ${
                                  index < verificationCode.filter(Boolean).length 
                                    ? 'bg-theme-accent' 
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                                initial={{ scaleX: 0.3 }}
                                animate={{ scaleX: index < verificationCode.filter(Boolean).length ? 1 : 0.3 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Verification Status */}
                      <div className="flex justify-center mt-4 min-h-[24px]">
                        {verifyLoading ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center text-theme-accent"
                          >
                            <LoadingSpinner size="small" className="mr-2" />
                            <span className="text-sm font-medium">Verifying code...</span>
                          </motion.div>
                        ) : verificationCode.join('').length === 6 ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center text-green-600 dark:text-green-400"
                          >
                            <span className="text-sm font-medium">Code complete ✓</span>
                          </motion.div>
                        ) : null}
                      </div>
                    </motion.div>

                    {/* Resend Option */}
                    <motion.div 
                      className="text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <motion.div 
                        className="bg-theme-secondary/20 border border-theme-secondary/30 rounded-lg p-4 mb-4 transition-all duration-200 hover:bg-theme-secondary/30"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <p className="text-theme-secondary text-sm mb-3">
                          Didn't receive the code?
                        </p>
                        <motion.button
                          type="button"
                          onClick={handleResendPin}
                          disabled={resendLoading || resendCooldown > 0}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-theme-accent hover:bg-theme-accent/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                          whileHover={!(resendLoading || resendCooldown > 0) ? { scale: 1.05 } : {}}
                          whileTap={!(resendLoading || resendCooldown > 0) ? { scale: 0.95 } : {}}
                        >
                          {resendLoading ? (
                            <>
                              <LoadingSpinner size="small" />
                              <span>Sending...</span>
                            </>
                          ) : resendCooldown > 0 ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </motion.div>
                              <span>Resend in {resendCooldown}s</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              <span>Resend Code</span>
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    </motion.div>

                    {/* Back to Register */}
                    <motion.div 
                      className="text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <motion.button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="inline-flex items-center gap-2 text-white hover:text-white font-medium transition-all duration-200 text-sm px-4 py-2 rounded-lg hover:bg-theme-secondary/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>←</span>
                        <span>Back to Sign Up</span>
                      </motion.button>
                    </motion.div>

                    {/* Error Message for Verification */}
                    <AnimatePresence>
                      {(error || formError) && mode === 'verify' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4"
                        >
                          <div className="bg-red-400/15 border border-red-400/25 rounded-xl p-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className="h-5 w-5 text-red-400 mt-0.5">
                                  <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                              <div className="ml-3 flex-1">
                                <h3 className="text-sm font-medium text-red-500 dark:text-red-400 mb-1">
                                  Verification Failed
                                </h3>
                                <p className="text-sm text-red-500 dark:text-red-400 opacity-90">
                                  {(formError === 'Please enter all 6 digits')
                                    ? 'Please enter all 6 digits of the verification code.'
                                    : 'The verification code is incorrect or has expired. Please try again or request a new code.'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : mode === 'reset' ? (
                  <motion.div 
                    className="text-center py-4"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  >
                    <motion.div 
                      className="flex items-center justify-center mb-6"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <motion.div
                        className="p-3 rounded-full bg-theme-accent/10 mr-3"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Lock className="h-8 w-8 text-theme-accent" />
                      </motion.div>
                      <h2 className="text-lg sm:text-xl font-semibold text-theme-primary">Reset Password</h2>
                    </motion.div>

                    {/* Error Messages for Reset Mode */}
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

                    {/* New Password Field */}
                    <motion.div 
                      className="mb-4 text-left"
                      variants={formItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative w-full">
                        <motion.input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent transition-all duration-300 bg-theme-primary text-theme-primary pr-10"
                          placeholder="Enter new password"
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

                    {/* Confirm New Password Field */}
                    <motion.div 
                      className="mb-6 text-left"
                      variants={formItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative w-full">
                        <motion.input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent transition-all duration-300 bg-theme-primary text-theme-primary pr-10"
                          placeholder="Confirm new password"
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

                    {/* Reset Password Button */}
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
                            Resetting Password...
                          </div>
                        ) : (
                          'Reset Password'
                        )}
                      </span>
                    </motion.button>

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
    </AnimatePresence>,
    document.body
  );
};

export default AuthModal;