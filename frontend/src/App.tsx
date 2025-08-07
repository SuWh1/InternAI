import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import React, { Suspense, useState, useEffect, lazy } from 'react';
import Navbar from './components/Navbar';
import OnboardingWrapper from './components/auth/OnboardingWrapper';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PageLoadingSpinner, RoadmapPageLoadingSpinner } from './components/common/LoadingSpinner';
import CookieBanner from './components/common/CookieBanner';
import AuthModal from './components/auth/AuthModal';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const RoadmapInfoPage = lazy(() => import('./pages/RoadmapInfoPage'));
const TopicsInfoPage = lazy(() => import('./pages/TopicsInfoPage'));
const ResumeReviewInfoPage = lazy(() => import('./pages/ResumeReviewInfoPage'));
const InternshipsInfoPage = lazy(() => import('./pages/InternshipsInfoPage'));
const MyRoadmapPage = lazy(() => import('./pages/MyRoadmapPage'));
const MyTopicsPage = lazy(() => import('./pages/MyTopicsPage'));
const TopicDetailPage = lazy(() => import('./pages/TopicDetailPage'));
const MyResumePage = lazy(() => import('./pages/MyResumePage'));
const MyInternshipsPage = lazy(() => import('./pages/MyInternshipsPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const WeekDetailPage = lazy(() => import('./pages/WeekDetailPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Component to handle routes
function AppRoutes() {
  const location = useLocation();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // Check for password reset token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    
    if (token && location.pathname === '/') {
      setResetToken(token);
      setShowPasswordReset(true);
    } else {
      setShowPasswordReset(false);
      setResetToken('');
    }
  }, [location]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Fire GA pageview on route change
  useEffect(() => {
    // Ensure gtag is available and analytics storage consent is granted before sending pageview
    if (typeof window !== 'undefined' && (window as any).gtag && (window as any).dataLayer) {
      // Only send page_view if analytics_storage consent is granted
      // This relies on Google Analytics Consent Mode to handle the actual data sending based on consent status.
      (window as any).gtag('event', 'page_view', {
        page_path: location.pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/roadmap" element={<RoadmapInfoPage />} />
        <Route path="/topics" element={<TopicsInfoPage />} />
        <Route path="/resume-review" element={<ResumeReviewInfoPage />} />
        <Route path="/internships" element={<InternshipsInfoPage />} />
        <Route path="/my-roadmap" element={<ProtectedRoute><MyRoadmapPage /></ProtectedRoute>} />
        <Route path="/my-topics" element={<ProtectedRoute><MyTopicsPage /></ProtectedRoute>} />
        <Route path="/topics/:topicId" element={<ProtectedRoute><TopicDetailPage /></ProtectedRoute>} />
        <Route path="/roadmap/week/:weekNumber" element={<ProtectedRoute><WeekDetailPage /></ProtectedRoute>} />
        <Route path="/lesson/:slug" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
        <Route path="/lesson/:topic/:context/:weekNumber" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
        <Route path="/my-resume" element={<ProtectedRoute><MyResumePage /></ProtectedRoute>} />
        <Route path="/my-internships" element={<ProtectedRoute><MyInternshipsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      </Routes>
      
      {/* Password Reset Modal */}
      <AuthModal
        isOpen={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
        defaultMode="reset"
        resetToken={resetToken}
      />
    </ErrorBoundary>
  );
}

function App() {
  // Initialize auth globally once when app starts
  const { loading: authLoading } = useAuth();
  const { initialize } = useAuthStore();

  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpinner(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Trigger auth initialization on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  // GA script and consent logic are now handled in index.html and CookieBanner.tsx
  // No need to load GA script or handle consent here.
  // All previous useEffects related to GA loading or consent are removed.

  // Show loading screen only on initial app load
  if (authLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-theme-primary flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent"></div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <CookieBanner />
      <Router>
        <div className="min-h-screen bg-theme-primary overflow-x-hidden w-full transition-colors duration-200" style={{ position: 'relative' }}>
          <OnboardingWrapper>
            <Navbar />
            <main className="pt-16" style={{ position: 'relative' }}>
              <Suspense fallback={showSpinner ? <RoadmapPageLoadingSpinner /> : null}>
                <AppRoutes />
              </Suspense>
            </main>
          </OnboardingWrapper>
        </div>
      </Router>
      {/* Remove the Suspense from here as it's now inside the Router */}
    </ThemeProvider>
  );
}

export default App;