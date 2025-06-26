import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import RoadmapInfoPage from './pages/RoadmapInfoPage';
import ResumeReviewInfoPage from './pages/ResumeReviewInfoPage';
import InternshipsInfoPage from './pages/InternshipsInfoPage';
import MyRoadmapPage from './pages/MyRoadmapPage';
import MyResumePage from './pages/MyResumePage';
import MyInternshipsPage from './pages/MyInternshipsPage';
import OnboardingPage from './pages/OnboardingPage';
import WeekDetailPage from './pages/WeekDetailPage';
import LessonPage from './pages/LessonPage';
import Navbar from './components/Navbar';
import OnboardingWrapper from './components/auth/OnboardingWrapper';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './stores/authStore';

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

const pageTransition = {
  type: 'spring' as const,
  damping: 20,
  stiffness: 300,
};

// Component to handle animated routes
function AnimatedRoutes() {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <Routes location={location}>
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
        </Routes>
      </motion.div>
    </AnimatePresence>
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
      <Router>
        <div className="min-h-screen bg-theme-primary overflow-x-hidden w-full animate-in fade-in duration-500 transition-colors">
          <OnboardingWrapper>
            <Navbar />
            <AnimatedRoutes />
          </OnboardingWrapper>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;