import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoadmapInfoPage from './pages/RoadmapInfoPage';
import ResumeReviewInfoPage from './pages/ResumeReviewInfoPage';
import InternshipsInfoPage from './pages/InternshipsInfoPage';
import MyRoadmapPage from './pages/MyRoadmapPage';
import MyResumePage from './pages/MyResumePage';
import MyInternshipsPage from './pages/MyInternshipsPage';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 overflow-x-hidden w-full animate-in fade-in duration-500">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/roadmap" element={<RoadmapInfoPage />} />
          <Route path="/resume-review" element={<ResumeReviewInfoPage />} />
          <Route path="/internships" element={<InternshipsInfoPage />} />
          <Route path="/my-roadmap" element={<MyRoadmapPage />} />
          <Route path="/my-resume" element={<MyResumePage />} />
          <Route path="/my-internships" element={<MyInternshipsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;