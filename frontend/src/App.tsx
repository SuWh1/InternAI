import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import OnboardingWrapper from './components/auth/OnboardingWrapper';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PageLoadingSpinner } from './components/common/LoadingSpinner';
import CookieBanner from './components/common/CookieBanner';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const RoadmapInfoPage = lazy(() => import('./pages/RoadmapInfoPage'));
const ResumeReviewInfoPage = lazy(() => import('./pages/ResumeReviewInfoPage'));
const InternshipsInfoPage = lazy(() => import('./pages/InternshipsInfoPage'));
const MyRoadmapPage = lazy(() => import('./pages/MyRoadmapPage'));
const MyResumePage = lazy(() => import('./pages/MyResumePage'));
const MyInternshipsPage = lazy(() => import('./pages/MyInternshipsPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const WeekDetailPage = lazy(() => import('./pages/WeekDetailPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Component to handle routes
function AppRoutes() {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          <Route path="/roadmap" element={<RoadmapInfoPage />} />
          <Route path="/resume-review" element={<ResumeReviewInfoPage />} />
          <Route path="/internships" element={<InternshipsInfoPage />} />
          <Route path="/my-roadmap" element={<ProtectedRoute><MyRoadmapPage /></ProtectedRoute>} />
          <Route path="/roadmap/week/:weekNumber" element={<ProtectedRoute><WeekDetailPage /></ProtectedRoute>} />
          <Route path="/lesson/:slug" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
          <Route path="/lesson/:topic/:context/:weekNumber" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
          <Route path="/my-resume" element={<ProtectedRoute><MyResumePage /></ProtectedRoute>} />
          <Route path="/my-internships" element={<ProtectedRoute><MyInternshipsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  // Initialize auth globally once when app starts
  const { loading: authLoading } = useAuth();
  const { initialize } = useAuthStore();

  // Trigger auth initialization on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

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
            <main className="pt-16">
              <AppRoutes />
            </main>
          </OnboardingWrapper>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;