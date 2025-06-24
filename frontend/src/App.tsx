import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-theme-primary overflow-x-hidden w-full animate-in fade-in duration-500 transition-colors">
          <OnboardingWrapper>
            <Navbar />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route 
                path="/onboarding" 
                element={
                  <ProtectedRoute>
                    <OnboardingPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/roadmap" element={<RoadmapInfoPage />} />
              <Route path="/resume-review" element={<ResumeReviewInfoPage />} />
              <Route path="/internships" element={<InternshipsInfoPage />} />
              <Route 
                path="/my-roadmap" 
                element={
                  <ProtectedRoute>
                    <MyRoadmapPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/roadmap/week/:weekNumber" 
                element={
                  <ProtectedRoute>
                    <WeekDetailPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/lesson/:topic/:context/:weekNumber?" 
                element={
                  <ProtectedRoute>
                    <LessonPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-resume" 
                element={
                  <ProtectedRoute>
                    <MyResumePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-internships" 
                element={
                  <ProtectedRoute>
                    <MyInternshipsPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </OnboardingWrapper>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;