import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoadmapInfoPage from './pages/RoadmapInfoPage';
import ResumeReviewInfoPage from './pages/ResumeReviewInfoPage';
import InternshipsInfoPage from './pages/InternshipsInfoPage';
import MyRoadmapPage from './pages/MyRoadmapPage';
import MyResumePage from './pages/MyResumePage';
import MyInternshipsPage from './pages/MyInternshipsPage';
import OnboardingPage from './pages/OnboardingPage';
import Navbar from './components/Navbar';
import OnboardingWrapper from './components/auth/OnboardingWrapper';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 overflow-x-hidden w-full animate-in fade-in duration-500">
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
  );
}

export default App;