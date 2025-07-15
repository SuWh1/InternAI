import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children
}) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    // Mark initial load as complete after auth has had time to initialize
    if (initialLoad && !loading) {
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 1500); // Give 1.5 seconds for auth to complete
      return () => clearTimeout(timer);
    }
  });

  useEffect(() => {
    // Only redirect if we're not in initial load phase, not loading, not authenticated, and haven't redirected yet
    if (!initialLoad && !loading && !isAuthenticated && !hasRedirected) {
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
      setHasRedirected(true);
    }
  }, [initialLoad, loading, isAuthenticated, navigate, location.pathname, hasRedirected]);

  // If still loading auth state or in initial load phase, show skeleton
  if (loading || initialLoad) {
    return (
      <div className="min-h-screen bg-theme-primary">
        <div className="animate-pulse">
          <div className="h-16 bg-theme-secondary"></div>
          <div className="container mx-auto px-4 py-8">
            <div className="h-8 bg-theme-secondary rounded mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-theme-secondary rounded w-3/4"></div>
              <div className="h-4 bg-theme-secondary rounded w-1/2"></div>
              <div className="h-4 bg-theme-secondary rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated after loading, redirect will happen via useEffect
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 