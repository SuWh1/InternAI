import { useState } from 'react';
import { ArrowRight, Target } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AuthModal from './auth/AuthModal';

const HeroSection = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetRoadmap = () => {
    if (isAuthenticated) {
      navigate('/my-roadmap');
    } else {
      setAuthModalMode('register'); 
      setAuthModalOpen(true);
    }
  };

  return (
    <>
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-16">
        <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
              Want to Land Your Dream{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                Internship
              </span>
              ?
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Stop wondering what to learn next. Get a personalized, AI-generated roadmap 
              that turns your internship dreams into achievable weekly goals.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row justify-center items-center mb-16 mt-10">
              <button
                onClick={handleGetRoadmap}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
              >
                Get Your Free Roadmap
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-all duration-200" />
              </button>

              <p className="text-sm text-gray-500 mt-3 sm:mt-0 sm:ml-4">
                📊 Join 2,000+ students already using InternAI
              </p>
            </div>

            {/* Roadmap Preview */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto hover:shadow-3xl hover:scale-[1.02] transition-all duration-200 cursor-pointer">
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