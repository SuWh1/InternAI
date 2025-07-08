import { useState, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import AuthModal from './auth/AuthModal';
import AnimatedSection from './common/AnimatedSection';
import FAANGIcons from './FAANGicons';

const floatingIcons = [
  {
    darkSrc: '/icons/appleWhite.svg',
    lightSrc: '/icons/appleBlack.svg',
    className: 'w-8 h-8 sm:w-10 sm:h-10',
    x: '10%',
    y: '20%',
  },
  {
    darkSrc: '/icons/openaiWhite.svg',
    lightSrc: '/icons/openaiBlack.svg',
    className: 'w-8 h-8 sm:w-10 sm:h-10',
    x: '80%',
    y: '20%',
  },
  {
    darkSrc: '/icons/metaOriginal.svg',
    lightSrc: '/icons/metaOriginal.svg',
    className: 'w-8 h-8 sm:w-10 sm:h-10',
    x: '14%',
    y: '70%',
  },
  {
    darkSrc: '/icons/googleOriginal.svg',
    lightSrc: '/icons/googleOriginal.svg',
    className: 'w-8 h-8 sm:w-10 sm:h-10',
    x: '60%',
    y: '45%',
  },
  {
    darkSrc: '/icons/nvidiaOriginal.svg',
    lightSrc: '/icons/nvidiaOriginal.svg',
    className: 'w-8 h-8 sm:w-10 sm:h-10',
    x: '90%',
    y: '60%',
  },
];

const HeroSection = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const animationProps = useMemo(() => {
    return floatingIcons.map(() => ({
      duration: 15 + Math.random() * 10,
      x: [0, (Math.random() - 0.5) * 200, 0],
      y: [0, (Math.random() - 0.5) * 200, 0],
      rotate: [0, Math.random() * 360, 0],
    }));
  }, []);

  const handleGetRoadmap = () => {
    if (isAuthenticated) {
      navigate('/my-roadmap');
    } else {
      setAuthModalMode('register'); 
      setAuthModalOpen(true);
    }
  };

  // Floating animation for the preview card
  const floatAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  return (
    <>
      <section className="relative min-h-screen flex items-center bg-theme-primary transition-colors duration-300 overflow-hidden">
        {/* Floating Background Icons */}
        <div className="absolute inset-0 z-0">
          {floatingIcons.map((icon, index) => {
            const props = animationProps[index];
            return (
              <motion.div
                key={index}
                className={`absolute ${icon.className}`}
                style={{
                  top: icon.y,
                  left: icon.x,
                }}
                animate={{
                  x: props.x,
                  y: props.y,
                  rotate: props.rotate,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: props.duration,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                }}
              >
                <img
                  src={theme === 'dark' ? icon.darkSrc : icon.lightSrc}
                  alt=""
                  className="w-full h-full opacity-50"
                />
              </motion.div>
            );
          })}
        </div>

        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 20% 80%, #C700FF 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, #C700FF 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, #C700FF 0%, transparent 50%)",
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Main heading with stagger animation */}
            <AnimatedSection animation="fade-in-up" delay={0}>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 transition-colors duration-300">
                <motion.span
                  className={`${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-white via-purple-400 to-pink-300 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-gray-800 via-purple-700 to-gray-800 bg-clip-text text-transparent'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Ready to Crack Your{' '}
                </motion.span>
                {/* <FAANGIcons /> */}
                <motion.span 
                  className="inline-block"
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.1,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    rotate: 2,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                >
                  <span className="text-[#C700FF] animate-pulse">MANGO</span>
                </motion.span>
                <motion.span
                  className={`${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-pink-300 via-purple-400 to-white bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-gray-800 via-purple-700 to-gray-800 bg-clip-text text-transparent'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  Internship?
                </motion.span>
              </h1>
            </AnimatedSection>
            <AnimatedSection animation="fade-in-up" delay={1.5}>
              <p className="text-lg md:text-xl text-theme-secondary mb-6 max-w-3xl mx-auto transition-colors duration-300">
                Get a personalized roadmap to prepare for internships at <span className="inline-flex items-center align-middle translate-y-[-2px]"><FAANGIcons /></span> — curated for your background, skills & timeline.
              </p>
            </AnimatedSection>

            {/* CTA Button with bounce animation */}
            <AnimatedSection animation="bounce" delay={3}>
              <div className="flex flex-col sm:flex-row justify-center items-center mb-16 mt-10">
                <motion.button
                  onClick={handleGetRoadmap}
                  className="bg-theme-accent text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center group button glow-hover relative overflow-hidden"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(199, 0, 255, 0.7)",
                      "0 0 0 10px rgba(199, 0, 255, 0)",
                      "0 0 0 0 rgba(199, 0, 255, 0)",
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

                <motion.p 
                  className="text-sm text-theme-primary mt-3 sm:mt-0 sm:ml-4 transition-colors duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  📊 Join 2,000+ students already using InternAI
                </motion.p>
              </div>
            </AnimatedSection>

            {/* Roadmap Preview with floating animation */}
            <AnimatedSection animation="scale" delay={4}>
              <motion.div 
                className="rounded-2xl shadow-2xl max-w-4xl mx-auto transition-all duration-200 cursor-pointer border border-theme card-hover relative overflow-hidden group h-64 sm:h-80"
                animate={floatAnimation}
                whileHover={{ scale: 1.02 }}
              >
                {/* Shimmer effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent z-20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.8 }}
                />
                
                <motion.img
                  src={theme === 'dark' ? "/homeRoadmap.webp" : "/homeRoadmapWhite.webp"}
                  alt="Interactive Roadmap Preview"
                  className="w-full h-full object-cover rounded-2xl"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  whileHover={{ scale: 1.05 }}
                />
                
                {/* Overlay gradient for better text readability */}
                <div className={`absolute inset-0 rounded-2xl z-10 ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-t from-black/50 via-transparent to-transparent' 
                    : 'bg-gradient-to-t from-white/50 via-transparent to-transparent'
                }`} />
                
                {/* Bottom overlay text */}
                <motion.div 
                  className="absolute bottom-6 left-6 right-6 text-center z-10"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <p className={`font-semibold text-lg drop-shadow-lg ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    AI-Guided Roadmap Designed for You
                  </p>
                  <p className={`text-sm mt-1 drop-shadow-md ${
                    theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                  }`}>
                   No guesswork. Just your perfect path to a MANGO internship.
                  </p>
                </motion.div>
                
                {/* Animated particles */}
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: '20%',
                    }}
                  >
                    <motion.div
                      className={`w-2 h-2 rounded-full z-10 ${
                        theme === 'dark' ? 'bg-white/70' : 'bg-gray-800/70'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                        x: [0, (i - 2) * 50],
                        y: [0, -60],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                ))}
              </motion.div>
            </AnimatedSection>
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