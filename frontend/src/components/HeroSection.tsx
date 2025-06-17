import { useState } from 'react';
import { ArrowRight, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AuthModal from './auth/AuthModal';

const HeroSection = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // const handleGetStarted = () => {
  //   if (isAuthenticated) {
  //     navigate('/onboarding');
  //   } else {
  //     setAuthModalMode('register');
  //     setAuthModalOpen(true);
  //   }
  // };

  const handleGetRoadmap = () => {
    if (isAuthenticated) {
      navigate('/roadmap');
    } else {
      setAuthModalMode('register');
      setAuthModalOpen(true);
    }
  };

  return (
    <>
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-35 lg:px-35 py-20">
          <div className="text-center">
            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
              Land Your Dream{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                Internship
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Get personalized career roadmaps, skill assessments, and step-by-step guidance 
              powered by AI to secure internships at top companies.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mb-12 mt-10">
              <button
                onClick={handleGetRoadmap}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:scale-105 hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
              >
                Get Your Free Roadmap
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-sm text-gray-500 ml-4 mt-3">
                📊 Join 2,000+ students already using InternAI
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-16">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Personalized Roadmaps</h3>
                <p className="text-gray-600 text-sm">
                  AI-generated career paths tailored to your goals and current skills
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Smart Matching</h3>
                <p className="text-gray-600 text-sm">
                  Connect with internships that match your profile and aspirations
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Track Progress</h3>
                <p className="text-gray-600 text-sm">
                  Monitor your journey with detailed analytics and milestone tracking
                </p>
              </div>
            </div>

            {/* Roadmap Preview */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 cursor-pointer">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl h-64 sm:h-80 flex items-center justify-center">
                <div className="text-center">
                  <Target className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-blue-700 font-medium">Interactive Roadmap Preview</p>
                  <p className="text-sm text-gray-600 mt-2">Personalized learning path visualization</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </>
  );
};

export default HeroSection;