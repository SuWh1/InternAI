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
      <section className="relative min-h-screen flex items-center bg-theme-primary pt-16 transition-colors duration-300">
        <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-theme-primary mb-6 transition-colors duration-300">
              Want to Land Your Dream{' '}
              <span className="text-theme-accent">
                Internship
              </span>
              ?
            </h1>
            
            <p className="text-lg md:text-xl text-theme-secondary mb-8 max-w-3xl mx-auto transition-colors duration-300">
              Stop wondering what to learn next. Get a personalized, AI-generated roadmap 
              that turns your internship dreams into achievable weekly goals.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row justify-center items-center mb-16 mt-10">
              <button
                onClick={handleGetRoadmap}
                className="bg-theme-accent text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
              >
                Get Your Free Roadmap
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-all duration-200" />
              </button>

              <p className="text-sm text-theme-primary mt-3 sm:mt-0 sm:ml-4 transition-colors duration-300">
                📊 Join 2,000+ students already using InternAI
              </p>
            </div>

            {/* Roadmap Preview */}
            <div className="bg-theme-secondary rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto hover:shadow-3xl hover:scale-[1.02] transition-all duration-200 cursor-pointer border border-theme">
              <div className="bg-gradient-to-br from-theme-accent/20 to-theme-accent/10 rounded-xl h-64 sm:h-80 flex items-center justify-center">
                <div className="text-center">
                  <Target className="h-16 w-16 text-theme-accent mx-auto mb-4" />
                  <p className="text-theme-accent font-medium">Interactive Roadmap Preview</p>
                  <p className="text-sm text-theme-secondary mt-2 transition-colors duration-300">Personalized learning path visualization</p>
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