import { useState } from 'react';
import { Target, TrendingUp, Code, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedSection from '../components/common/AnimatedSection';
import AuthModal from '../components/auth/AuthModal';

const TopicsInfoPage = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/my-topics');
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
            Master Any Tech Topic with AI Guidance
          </h1>
          <p className="text-xl text-theme-secondary max-w-2xl mx-auto transition-colors duration-300">
            Create personalized learning roadmaps for any technology, framework, or programming skill you want to master.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={2} className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-8 mb-8 transition-colors duration-300">
          <h2 className="text-2xl font-semibold text-theme-primary mb-6 transition-colors duration-300">How It Works</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Target className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-theme-primary mb-2 transition-colors duration-300">Custom Topic Analysis</h3>
                <p className="text-theme-secondary transition-colors duration-300">
                  Tell us what you want to learn and our AI creates a tailored curriculum just for you, from basics to advanced concepts.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <TrendingUp className="h-6 w-6 text-theme-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-theme-primary mb-2 transition-colors duration-300">Smart Learning Path</h3>
                <p className="text-theme-secondary transition-colors duration-300">
                  Get step-by-step guidance with curated resources, practice exercises, and milestone checkpoints to track your progress.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Code className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-theme-primary mb-2 transition-colors duration-300">Hands-on Projects</h3>
                <p className="text-theme-secondary transition-colors duration-300">
                  Build real-world projects that demonstrate your new skills and create a portfolio that impresses employers.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={4} className="text-center">
          <div className="bg-gradient-to-r from-theme-accent to-purple-600 text-white rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4">Ready to Start Learning?</h3>
            <p className="text-blue-100 mb-6">
              Join thousands of developers mastering new technologies with AI-powered guidance tailored to their learning style.
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
              <span className="relative z-10">Create My First Topic</span>
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

export default TopicsInfoPage; 