import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

/**
 * OnboardingWrapper ensures all authenticated users complete onboarding.
 * 
 * Handles all user flows:
 * 1. New user signs up → Redirected to onboarding
 * 2. User signs up, logs out, logs back in → Still redirected to onboarding  
 * 3. User signs up with Google → Redirected to onboarding
 * 4. User starts onboarding but doesn't finish → Redirected back to onboarding
 * 5. User completes onboarding → Can access the app normally
 * 6. Completed user logs back in → Goes directly to app (no onboarding)
 */
const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only check if authenticated and not loading
    if (!isAuthenticated || authLoading || !user) {
      return;
    }

    // Don't redirect if already on onboarding page
    if (location.pathname === '/onboarding') {
      return;
    }

    // Check onboarding status from user data (no API call needed)
    // Treat undefined as not completed for safety
    const hasCompleted = user.has_completed_onboarding === true;
    
    if (!hasCompleted) {
      // User needs to complete onboarding
      console.log('Redirecting to onboarding - user.has_completed_onboarding:', user.has_completed_onboarding);
      navigate('/onboarding', { replace: true });
    }
  }, [isAuthenticated, authLoading, user?.id, user?.has_completed_onboarding, location.pathname, navigate]);

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
};

export default OnboardingWrapper; 