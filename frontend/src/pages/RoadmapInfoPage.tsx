import { useState } from 'react';
import { CheckCircle, MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedSection from '../components/common/AnimatedSection';
import AuthModal from '../components/auth/AuthModal';

const RoadmapInfoPage = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/my-roadmap');
    } else {
      setAuthModalMode('register'); 
      setAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-theme-primary transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatedSection className="text-center mb-12">
          <h1 className="text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            Your AI-Powered Roadmap to MANGO
          </h1>
          <p className="text-xl text-theme-secondary max-w-2xl mx-auto transition-colors duration-300">
            Get a personalized, step-by-step plan to land your dream internship at Meta, Apple, Nvidia, Google, or OpenAI.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={2} className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-8 mb-8 transition-colors duration-300">
          <h2 className="text-2xl font-semibold text-theme-primary mb-6 transition-colors duration-300">How It Works</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-theme-primary mb-2 transition-colors duration-300">MANGO-Focused Assessment</h3>
                <p className="text-theme-secondary transition-colors duration-300">
                  Our AI analyzes your profile against the key skills sought by MANGO companies—from large-scale systems to cutting-edge AI.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <TrendingUp className="h-6 w-6 text-theme-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-theme-primary mb-2 transition-colors duration-300">AI-Driven Skill Development</h3>
                <p className="text-theme-secondary transition-colors duration-300">
                  Receive actionable steps focused on high-impact areas like machine learning, hardware acceleration, and product innovation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <MapPin className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-theme-primary mb-2 transition-colors duration-300">Dynamic Roadmap Adjustments</h3>
                <p className="text-theme-secondary transition-colors duration-300">
                  As the industry shifts, so does your plan. Our AI keeps your roadmap aligned with the latest hiring trends at MANGO companies.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={4} className="text-center">
          <div className="bg-gradient-to-r from-theme-accent to-purple-600 text-white rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4">Ready to Target MANGO?</h3>
            <p className="text-blue-100 mb-6">
              Join thousands of students who are building the high-impact skills needed for a top-tier tech internship.
            </p>
            <motion.button 
              onClick={handleGetStarted}
              className="bg-white text-theme-accent px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center group relative overflow-hidden mx-auto"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(255, 255, 255, 0.7)",
                  "0 0 0 10px rgba(255, 255, 255, 0)",
                  "0 0 0 0 rgba(255, 255, 255, 0)",
                ],
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            >
              <span className="relative z-10">Get My MANGO Roadmap</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-all duration-200 relative z-10" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </div>
        </AnimatedSection>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </div>
  );
};

export default RoadmapInfoPage; 