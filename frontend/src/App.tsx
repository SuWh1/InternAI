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
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <LandingPage />
            </motion.div>
          } 
        />
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <OnboardingPage />
              </motion.div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/roadmap" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <RoadmapInfoPage />
            </motion.div>
          } 
        />
        <Route 
          path="/resume-review" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <ResumeReviewInfoPage />
            </motion.div>
          } 
        />
        <Route 
          path="/internships" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <InternshipsInfoPage />
            </motion.div>
          } 
        />
        <Route 
          path="/my-roadmap" 
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <MyRoadmapPage />
              </motion.div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/roadmap/week/:weekNumber" 
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <WeekDetailPage />
              </motion.div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lesson/:slug" 
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <LessonPage />
              </motion.div>
            </ProtectedRoute>
          } 
        />
        {/* Legacy route support for backward compatibility */}
        <Route 
          path="/lesson/:topic/:context/:weekNumber" 
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <LessonPage />
              </motion.div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-resume" 
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <MyResumePage />
              </motion.div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-internships" 
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <MyInternshipsPage />
              </motion.div>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
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