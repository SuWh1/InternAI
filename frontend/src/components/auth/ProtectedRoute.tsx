import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallbackMessage = "Please sign in to access this page"
}) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Store the attempted URL for potential redirect after login
      const currentPath = location.pathname;
      
      // Redirect to landing page - the Navbar will handle showing the auth modal
      // We'll pass the intended destination as state
      navigate('/', { 
        replace: true,
        state: { 
          redirectAfterLogin: currentPath,
          showLoginModal: true 
        }
      });
    }
  }, [loading, isAuthenticated, navigate, location.pathname]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // If not authenticated, we've already redirected, so show loading
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 